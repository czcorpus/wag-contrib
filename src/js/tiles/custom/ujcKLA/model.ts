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

import { IActionQueue, SEDispatcher } from 'kombo';
import { IAppServices } from '../../../appServices.js';
import { Backlink } from '../../../page/tile.js';
import { createEmptyData, DataStructure } from './common.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions as CommonActions } from '../lexCommon/actions.js';
import { Actions } from './actions.js';
import { List } from 'cnc-tskit';
import { UjcKLAArgs, UjcKLAApi } from './api.js';
import { findCurrQueryMatch, LemmatizationLevel, RecognizedQueries } from '../../../query/index.js';
import { getCurrentVariant } from '../lexCommon/types/dictionary.js';
import { IDataStreaming } from '../../../page/streaming.js';
import { TileStatelessModel } from '../../../models/tiles/base.js';

export interface UjcKLAModelState {
    isBusy: boolean;
    selectedVariantIdx: number;
    queries: Array<string>;
    maxImages: number;
    data: DataStructure;
    error: string;
    backlink: Backlink;
}

export interface UjcKLAModelArgs {
    dispatcher: IActionQueue;
    initState: UjcKLAModelState;
    tileId: number;
    api: UjcKLAApi;
    appServices: IAppServices;
    queryMatches: RecognizedQueries;
    lemLevelSupport: Array<LemmatizationLevel>;
    dependentTiles: Array<number>;
}

export class UjcKLAModel extends TileStatelessModel<UjcKLAModelState> {
    private readonly api: UjcKLAApi;

    constructor({
        dispatcher,
        initState,
        api,
        tileId,
        appServices,
        queryMatches,
        dependentTiles,
        lemLevelSupport,
    }: UjcKLAModelArgs) {
        super({dispatcher, initState, tileId, appServices, dependentTiles, lemLevelSupport});
        this.api = api;

        this.addSearchActionHandler(
            (state, action) => {
                const variant = getCurrentVariant(
                    queryMatches,
                    state.selectedVariantIdx
                );
                if (variant) {
                    state.queries = [variant.lemma];
                } else {
                    const match = findCurrQueryMatch(List.head(queryMatches));
                    state.queries = [match.lemma || match.word];
                }

                state.isBusy = true;
                state.error = null;
                state.data = createEmptyData();
                state.backlink = null;
            },
            (state, action, dispatch, ds) => {
                this.loadData(
                    ds,
                    dispatch,
                    state
                );
            }
        );

        this.addActionSubtypeHandler(
            Actions.TileDataLoaded,
            (action) => action.payload.tileId === this.tileId,
            (state, action) => {
                state.isBusy = false;
                if (action.error) {
                    state.error = action.error.message;
                } else {
                    state.data = action.payload.data;
                    state.backlink = this.api.getBacklink(0);
                }
            }
        );

        this.addActionSubtypeHandler(
            GlobalActions.GetSourceInfo,
            (action) => action.payload.tileId === this.tileId,
            null,
            (state, action, dispatch) => {
                this.api
                    .getSourceDescription(
                        appServices.dataStreaming(),
                        this.tileId,
                        appServices.getISO639UILang(),
                        ''
                    )
                    .subscribe({
                        next: (data) => {
                            dispatch({
                                name: GlobalActions.GetSourceInfoDone.name,
                                payload: {
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

        this.addActionSubtypeHandler(
            GlobalActions.FollowBacklink,
            (action) => action.payload.tileId === this.tileId,
            null,
            (state, action, dispatch) => {
                const backlinkUrl = new URL(
                    'https://psjc.ujc.cas.cz/search.php'
                );
                backlinkUrl.searchParams.set('hledej', 'Hledej');
                backlinkUrl.searchParams.set('heslo', state.data.query);
                backlinkUrl.searchParams.set('where', 'hesla');
                backlinkUrl.searchParams.set('zobraz_cards', 'cards');
                backlinkUrl.searchParams.set('not_initial', '1');
                window.open(backlinkUrl.toString(), '_blank');
            }
        );

        this.addActionHandler(
            CommonActions.SelectItemVariant,
            (state, action) => {
                state.selectedVariantIdx = action.payload.variantIdx;
                const variant = getCurrentVariant(
                    queryMatches,
                    state.selectedVariantIdx
                );
                if (variant) {
                    state.queries = [variant.lemma];
                } else {
                    const match = findCurrQueryMatch(List.head(queryMatches));
                    state.queries = [match.lemma || match.word];
                }
                state.isBusy = true;
                state.error = null;
                state.data = createEmptyData();
                state.backlink = null;
            },
            (state, action, dispatch) => {
                this.loadData(
                    appServices
                        .dataStreaming()
                        .startNewSubgroup(this.tileId),
                    dispatch,
                    state
                );
            }
        );
    }

    private loadData(
        streaming: IDataStreaming,
        dispatch: SEDispatcher,
        state: UjcKLAModelState
    ) {
        const args: UjcKLAArgs = {
            q: state.queries,
            maxImages: state.maxImages,
        };
        this.api.call(streaming, this.tileId, 0, args).subscribe({
            next: (data) => {
                dispatch<typeof Actions.TileDataLoaded>({
                    name: Actions.TileDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        isEmpty: false,
                        data,
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
                        isEmpty: true,
                        data: createEmptyData(),
                    },
                });
            },
        });
    }
}
