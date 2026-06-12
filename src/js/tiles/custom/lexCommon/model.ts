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
import { RecognizedQueries } from '../../../query/index.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';
import { getCurrentVariant } from './types/dictionary.js';
import { LexApi } from './api.js';
import { List } from 'cnc-tskit';
import { IDataStreaming } from '../../../page/streaming.js';

export interface LexCommonModelState {
    selectedVariantIdx: number;
}

export interface LexCommonModelArgs {
    dispatcher: IActionQueue;
    initState: LexCommonModelState;
    tileId: number;
    appServices: IAppServices;
    queryMatches: RecognizedQueries;
    dependentTiles: Array<number>;
    lexApi: LexApi;
}

export class LexCommonModel extends StatelessModel<LexCommonModelState> {
    private readonly tileId: number;

    private readonly appServices: IAppServices;

    private readonly queryMatches: RecognizedQueries;

    private readonly lexApi: LexApi;

    private dataStreaming: IDataStreaming | null;

    constructor({
        dispatcher,
        initState,
        tileId,
        appServices,
        lexApi,
        queryMatches,
        dependentTiles,
    }: LexCommonModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.queryMatches = queryMatches;
        this.lexApi = lexApi;
        this.dataStreaming = null;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {},
            (state, action, dispatch) => {
                // this instantly hides tile from layout
                dispatch<typeof Actions.TileDataLoaded>({
                    name: Actions.TileDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        isEmpty: true,
                    },
                });
                if (this.dataStreaming !== null) {
                    this.dataStreaming.cancel();
                }
                this.dataStreaming = this.appServices.dataStreaming();
                this.loadData(
                    this.dataStreaming,
                    dispatch,
                    state.selectedVariantIdx
                );
            }
        );

        this.addActionHandler(
            Actions.SelectItemVariant,
            (state, action) => {
                state.selectedVariantIdx = action.payload.variantIdx;
            },
            (state, action, dispatch) => {
                dispatch<typeof Actions.TileDataLoaded>({
                    name: Actions.TileDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        isEmpty: true,
                    },
                });

                if (this.dataStreaming !== null) {
                    this.dataStreaming.cancel();
                }
                this.dataStreaming = appServices
                    .dataStreaming()
                    .startNewSubgroup(this.tileId, ...dependentTiles);
                dispatch(GlobalActions.TileSubgroupReady, {
                    mainTileId: this.tileId,
                    subgroupId: this.dataStreaming.getId(),
                });
                this.loadData(
                    this.dataStreaming,
                    dispatch,
                    state.selectedVariantIdx
                );
            }
        );

        this.addActionSubtypeHandler(
            Actions.TileDataLoaded,
            (action) => action.payload.tileId === this.tileId,
            (state, action) => {
                if (action.error) {
                    console.log(action.error);
                }
            }
        );

        this.addActionSubtypeHandler(
            GlobalActions.GetSourceInfo,
            (action) =>
                List.some(
                    (tileId) => tileId === action.payload.tileId,
                    dependentTiles
                ),
            null,
            (state, action, dispatch) => {
                this.lexApi
                    .getSourceDescription(
                        this.appServices
                            .dataStreaming()
                            .startNewSubgroup(this.tileId),
                        this.tileId,
                        this.appServices.getISO639UILang(),
                        action.payload.corpusId
                    )
                    .subscribe({
                        next: (data) => {
                            dispatch({
                                name: GlobalActions.GetSourceInfoDone.name,
                                payload: {
                                    tileId: this.tileId,
                                    data: data,
                                },
                            });
                        },
                        error: (err) => {
                            console.error(err);
                            dispatch({
                                name: GlobalActions.GetSourceInfoDone.name,
                                error: err,
                            });
                        },
                    });
            }
        );
    }

    private loadData(
        streaming: IDataStreaming,
        dispatch: SEDispatcher,
        variantIdx: number
    ) {
        const variant = getCurrentVariant(this.queryMatches, variantIdx);
        const args = {
            asscIds:
                variant && variant.sources['assc']
                    ? List.map((v) => v.id, variant.sources['assc'])
                    : [],
            ijpIds:
                variant && variant.sources['ijp']
                    ? List.map((v) => v.id, variant.sources['ijp'])
                    : [],
        };
        this.lexApi.call(streaming, this.tileId, 0, args).subscribe({
            complete: () => {
                dispatch<typeof Actions.TileDataLoaded>({
                    name: Actions.TileDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        isEmpty: true,
                    },
                });
                this.dataStreaming = null;
            },
            error: (err) => {
                console.error('lex api error:', err);
            },
        });
    }
}
