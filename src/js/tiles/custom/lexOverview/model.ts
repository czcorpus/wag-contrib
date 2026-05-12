/*
 * Copyright 2026 Martin Zimandl <martin.zimandl@gmail.com>
 * Copyright 2026 Institute of the Czech National Corpus,
 *                Faculty of Arts, Charles University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { IActionQueue, SEDispatcher, StatelessModel } from 'kombo';
import { IAppServices } from '../../../appServices.js';
import { Backlink } from '../../../page/tile.js';
import { QueryMatch, RecognizedQueries } from '../../../query/index.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions as CommonActions } from '../lexCommon/actions.js';
import { Actions } from './actions.js';

import { IDataStreaming } from '../../../page/streaming.js';
import { List } from 'cnc-tskit';
import { HTMLBlock } from '../lexCommon/types/assc.js';
import { Source } from '../lexCommon/types/enums.js';
import { LexItem } from '../lexCommon/types/dictionary.js';
import {
    isAsscData,
    isDoneData,
    isIjpData,
    LexResponse,
} from '../lexCommon/api.js';
import { IJPData } from '../lexCommon/types/ijp.js';
import { reduce } from 'rxjs';

interface Data {
    assc: HTMLBlock;
    ijp: IJPData;
}

export interface LexOverviewModelState {
    isBusy: boolean;
    queryMatch: QueryMatch;
    referenceCorpus: string;
    mainSource: Source;
    variants: Array<LexItem>;
    selectedVariantIdent: string;
    data: Data;
    error: string;
    backlink: Backlink;
}

export interface LexOverviewModelArgs {
    dispatcher: IActionQueue;
    initState: LexOverviewModelState;
    tileId: number;
    appServices: IAppServices;
    readDataFromTile: number | null;
}

export class LexOverviewModel extends StatelessModel<LexOverviewModelState> {
    private readonly tileId: number;

    private readonly appServices: IAppServices;

    private readonly readDataFromTile: number | null;

    constructor({
        dispatcher,
        initState,
        tileId,
        appServices,
        readDataFromTile,
    }: LexOverviewModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.readDataFromTile = readDataFromTile;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                state.error = undefined;
                state.backlink = undefined;
                state.isBusy = true;
            },
            (state, action, dispatch) => {
                dispatch<typeof CommonActions.SelectItemVariant>({
                    name: CommonActions.SelectItemVariant.name,
                    payload: {
                        tileId: this.tileId,
                        variantIdent: state.selectedVariantIdent,
                        initial: true,
                    },
                });
                this.loadData(this.appServices.dataStreaming(), dispatch);
            }
        );

        this.addActionSubtypeHandler(
            Actions.TilePartialDataLoaded,
            (action) => action.payload.tileId === this.tileId,
            (state, action) => {
                // get only first assc data
                if (isAsscData(action.payload)) {
                    // get only block containig word with the correct id
                    const block = List.find(
                        (block) =>
                            List.some(
                                (variant) =>
                                    'hid-' + action.payload.id === variant.id,
                                block.variants
                            ),
                        action.payload.data
                    );
                    if (block) {
                        state.data.assc = block;
                    }
                }

                // get only first ijp data
                if (isIjpData(action.payload)) {
                    state.data.ijp = action.payload.data;
                }
            }
        );

        this.addActionSubtypeHandler(
            Actions.TileDataLoaded,
            (action) => action.payload.tileId === this.tileId,
            (state, action) => {
                state.isBusy = false;
                if (action.error) {
                    state.error = action.error.message;
                }
            }
        );

        this.addActionSubtypeHandler(
            GlobalActions.FollowBacklink,
            (action) => action.payload.tileId === this.tileId,
            null,
            (state, action, dispatch) => {
                const backlinkUrl = new URL('https://prirucka.ujc.cas.cz/');
                /* --- TODO ---
                if (state.data.isDirect) {
                    backlinkUrl.searchParams.set('id', state.data.rawQuery);
                } else {
                    backlinkUrl.searchParams.set('slovo', state.data.rawQuery);
                }
                */
                window.open(backlinkUrl.toString(), '_blank');
            }
        );

        this.addActionSubtypeHandler(
            CommonActions.SelectItemVariant,
            (action) => action.payload.tileId === this.tileId,
            (state, action) => {
                state.selectedVariantIdent = action.payload.variantIdent;
                if (!action.payload.initial) {
                    state.data = {
                        assc: null,
                        ijp: null,
                    };
                    state.isBusy = true;
                }
            },
            (state, action, dispatch) => {
                if (!action.payload.initial) {
                    this.waitForAction({}, (action, data) => {
                        if (
                            GlobalActions.isTileSubgroupReady(action) &&
                            action.payload.mainTileId === this.readDataFromTile
                        ) {
                            return null;
                        }
                        return data;
                    }).subscribe({
                        next: (action) => {
                            if (GlobalActions.isTileSubgroupReady(action)) {
                                this.loadData(
                                    this.appServices
                                        .dataStreaming()
                                        .getSubgroup(action.payload.subgroupId),
                                    dispatch
                                );
                            }
                        },
                    });
                }
            }
        );
    }

    private loadData(streaming: IDataStreaming, dispatch: SEDispatcher) {
        streaming
            .registerTileRequest<LexResponse>({
                tileId: this.tileId,
                queryIdx: 0, // TODO
                otherTileId: this.readDataFromTile,
                otherTileQueryIdx: 0, // TODO
                contentType: 'application/json',
            })
            .pipe(
                reduce(
                    (data, resp) => {
                        if (data.done.assc && data.done.ijp) {
                            return data;
                        } else if (isDoneData(resp)) {
                            if (resp.source === Source.ASSC) {
                                data.done.assc = true;
                            } else if (resp.source === Source.IJP) {
                                data.done.ijp = true;
                            }
                        } else if (isAsscData(resp) && !data.done.assc) {
                            dispatch<typeof Actions.TilePartialDataLoaded>({
                                name: Actions.TilePartialDataLoaded.name,
                                payload: {
                                    tileId: this.tileId,
                                    ...resp,
                                },
                            });
                            data.hasData = true;
                            data.done.assc = true;
                        } else if (isIjpData(resp) && !data.done.ijp) {
                            dispatch<typeof Actions.TilePartialDataLoaded>({
                                name: Actions.TilePartialDataLoaded.name,
                                payload: {
                                    tileId: this.tileId,
                                    ...resp,
                                },
                            });
                            data.hasData = true;
                            data.done.ijp = true;
                        }

                        if (data.done.assc && data.done.ijp) {
                            dispatch<typeof Actions.TileDataLoaded>({
                                name: Actions.TileDataLoaded.name,
                                payload: {
                                    tileId: this.tileId,
                                    isEmpty: false, // this tile is never empty
                                },
                            });
                        }

                        return data;
                    },
                    { hasData: false, done: { assc: false, ijp: false } }
                )
            )
            .subscribe({
                next: (data) => {
                    dispatch<typeof Actions.TileDataLoaded>({
                        name: Actions.TileDataLoaded.name,
                        payload: {
                            tileId: this.tileId,
                            isEmpty: !data.hasData,
                        },
                    });
                },
                error: (error) => {
                    console.error(error);
                    dispatch<typeof Actions.TileDataLoaded>({
                        name: Actions.TileDataLoaded.name,
                        error,
                        payload: {
                            tileId: this.tileId,
                            isEmpty: false,
                        },
                    });
                },
            });
    }
}
