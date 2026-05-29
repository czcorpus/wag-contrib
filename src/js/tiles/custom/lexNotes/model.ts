/*
 * Copyright 2022 Martin Zimandl <martin.zimandl@gmail.com>
 * Copyright 2022 Institute of the Czech National Corpus,
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
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';
import { Actions as CommonActions } from '../lexCommon/actions.js';
import { List, pipe } from 'cnc-tskit';
import { IDataStreaming } from '../../../page/streaming.js';
import { HTMLBlock } from '../lexCommon/types/assc.js';
import {
    isAsscData,
    isDoneData,
    isIjpData,
    LexResponse,
} from '../lexCommon/api.js';
import { scan } from 'rxjs';
import { Source } from '../lexCommon/types/enums.js';

export interface LexNotesModelState {
    isBusy: boolean;
    selectedVariantIdx: number;
    notes: {
        ijp: Array<string>;
        assc: Array<string>;
    };
    error: string;
    backlink: Backlink;
}

export interface LexNotesModelArgs {
    dispatcher: IActionQueue;
    initState: LexNotesModelState;
    tileId: number;
    appServices: IAppServices;
    readDataFromTile: number | null;
}

export class LexNotesModel extends StatelessModel<LexNotesModelState> {
    private readonly tileId: number;

    private readonly appServices: IAppServices;

    private readonly readDataFromTile: number | null;

    constructor({
        dispatcher,
        initState,
        tileId,
        appServices,
        readDataFromTile,
    }: LexNotesModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.readDataFromTile = readDataFromTile;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                state.error = null;
                state.backlink = null;
                state.notes = {
                    ijp: [],
                    assc: [],
                };
                state.isBusy = true;
            },
            (state, action, dispatch) => {
                this.loadData(this.appServices.dataStreaming(), dispatch);
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
            Actions.TilePartialDataLoaded,
            (action) => action.payload.tileId === this.tileId,
            (state, action) => {
                switch (action.payload.source) {
                    case Source.IJP:
                        state.notes.ijp.push(...action.payload.notes);
                        break;
                    case Source.ASSC:
                        state.notes.assc.push(...action.payload.notes);
                        break;
                }
            }
        );

        this.addActionSubtypeHandler(
            GlobalActions.FollowBacklink,
            (action) => action.payload.tileId === this.tileId,
            null,
            (state, action, dispatch) => {
                window.open(
                    `https://slovnikcestiny.cz/heslo/state.data.query/`,
                    '_blank'
                );
            }
        );

        this.addActionHandler(
            CommonActions.SelectItemVariant,
            (state, action) => {
                state.selectedVariantIdx = action.payload.variantIdx;
                state.isBusy = true;
                state.notes = {
                    ijp: [],
                    assc: [],
                };
            },
            (state, action, dispatch) => {
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
        );
    }

    private loadData(streaming: IDataStreaming, dispatch: SEDispatcher): void {
        streaming
            .registerTileRequest<LexResponse>({
                tileId: this.tileId,
                queryIdx: 0, // TODO
                otherTileId: this.readDataFromTile,
                otherTileQueryIdx: 0, // TODO
                contentType: 'application/json',
            })
            .pipe(
                scan(
                    (data, resp) => {
                        if (data.done.assc && data.done.ijp) {
                            data.dispatched = true;
                            return data;
                        }

                        if (isAsscData(resp)) {
                            const filteredData = this.filterASSCResultsByIDs(
                                resp.id,
                                resp.data
                            );
                            const notes = pipe(
                                filteredData,
                                List.flatMap((v) => v.notes),
                                List.filter((v) => !!v)
                            );
                            if (List.size(notes) > 0) {
                                dispatch<typeof Actions.TilePartialDataLoaded>({
                                    name: Actions.TilePartialDataLoaded.name,
                                    payload: {
                                        tileId: this.tileId,
                                        source: Source.ASSC,
                                        notes,
                                    },
                                });
                                data.hasData = true;
                            }
                        } else if (isIjpData(resp) && resp.data.notes) {
                            dispatch<typeof Actions.TilePartialDataLoaded>({
                                name: Actions.TilePartialDataLoaded.name,
                                payload: {
                                    tileId: this.tileId,
                                    source: Source.IJP,
                                    notes: resp.data.notes,
                                },
                            });
                            data.hasData = true;
                        } else if (isDoneData(resp)) {
                            if (resp.source === Source.ASSC) {
                                data.done.assc = true;
                            } else if (resp.source === Source.IJP) {
                                data.done.ijp = true;
                            }
                        } else if (resp === null) {
                            data.done.assc = true;
                            data.done.ijp = true;
                        }
                        return data;
                    },
                    {
                        hasData: false,
                        done: { assc: false, ijp: false },
                        dispatched: false,
                    }
                )
            )
            .subscribe({
                next: (data) => {
                    if (data.done && !data.dispatched) {
                        dispatch<typeof Actions.TileDataLoaded>({
                            name: Actions.TileDataLoaded.name,
                            payload: {
                                tileId: this.tileId,
                                isEmpty: !data.hasData,
                            },
                        });
                    }
                },
                error: (error) => {
                    console.error(error);
                    dispatch<typeof Actions.TileDataLoaded>({
                        name: Actions.TileDataLoaded.name,
                        error,
                        payload: {
                            tileId: this.tileId,
                            isEmpty: true,
                        },
                    });
                },
            });
    }

    private filterASSCResultsByIDs(id: string, data: HTMLBlock[]): HTMLBlock[] {
        const blockIdx = List.findIndex(
            (d) => List.some((x) => x.id === 'hid-' + id, d.parsedVariants),
            data
        );
        if (blockIdx > -1) {
            const mainItem = data[blockIdx];
            if (blockIdx > 0) {
                const parentItem = data[0];
                return [mainItem, parentItem];
            }
            return [mainItem];
        } else {
            return [];
        }
    }
}
