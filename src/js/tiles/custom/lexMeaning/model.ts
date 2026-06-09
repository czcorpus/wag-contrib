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
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';
import { Actions as CommonActions } from '../lexCommon/actions.js';
import { List } from 'cnc-tskit';
import { RecognizedQueries } from '../../../query/index.js';
import { IDataStreaming } from '../../../page/streaming.js';
import { HTMLBlock } from '../lexCommon/types/assc.js';
import {
    isAsscData,
    isAsscDone,
    isAsscError,
    LexResponse,
} from '../lexCommon/api.js';
import { scan } from 'rxjs';

export interface LexMeaningModelState {
    isBusy: boolean;
    selectedVariantIdx: number;
    data: Array<LexResponse<HTMLBlock[] | string>>;
    error: string;
    backlink: Backlink;
}

export interface LexMeaningModelArgs {
    dispatcher: IActionQueue;
    initState: LexMeaningModelState;
    tileId: number;
    appServices: IAppServices;
    queryMatches: RecognizedQueries;
    readDataFromTile: number | null;
}

export class LexMeaningModel extends StatelessModel<LexMeaningModelState> {
    private readonly tileId: number;

    private readonly appServices: IAppServices;

    private readonly queryMatches: RecognizedQueries;

    private readonly readDataFromTile: number | null;

    constructor({
        dispatcher,
        initState,
        tileId,
        appServices,
        queryMatches,
        readDataFromTile,
    }: LexMeaningModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.queryMatches = queryMatches;
        this.readDataFromTile = readDataFromTile;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                state.error = null;
                state.backlink = null;
                state.data = [];
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
                state.data.push(action.payload.response);
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
                state.data = [];
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
                    (data, response) => {
                        if (data.done) {
                            data.dispatched = true;
                            return data;
                        }

                        if (isAsscData(response)) {
                            // response contains whole ASSČ page, we need to filter only
                            // requested id, and its parent if it has one
                            const filteredData = this.filterASSCResultsByIDs(
                                response.id,
                                response.data
                            );

                            if (List.size(response.data) > 0) {
                                dispatch<typeof Actions.TilePartialDataLoaded>({
                                    name: Actions.TilePartialDataLoaded.name,
                                    payload: {
                                        tileId: this.tileId,
                                        response: {
                                            ...response,
                                            data: filteredData,
                                        },
                                    },
                                });
                                data.hasData = true;
                            }
                        } else if (isAsscError(response)) {
                            dispatch<typeof Actions.TilePartialDataLoaded>({
                                name: Actions.TilePartialDataLoaded.name,
                                payload: {
                                    tileId: this.tileId,
                                    response,
                                },
                            });
                            data.hasData = true;
                        } else if (isAsscDone(response) || response === null) {
                            data.done = true;
                        }
                        return data;
                    },
                    { hasData: false, done: false, dispatched: false }
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

        if (blockIdx !== -1) {
            const mainItem = data[blockIdx];
            if (blockIdx > 0) {
                const parentItem = data[0];
                parentItem.nestedVariants = List.filter(
                    (v) =>
                        List.findIndex(
                            (x) => x === v,
                            mainItem.formattedVariants
                        ) === -1,
                    parentItem.nestedVariants
                );
                return [mainItem, parentItem];
            }
            return [mainItem];
        } else {
            return [];
        }
    }
}
