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
import { findCurrQueryMatch, QueryMatch, RecognizedQueries } from '../../../query/index.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';
import { List, pipe } from 'cnc-tskit';
import { LexApi, LexArgs } from './api.js';
import { AggregateData, createEmptyData, Variant } from './common.js';


export interface LexOverviewModelState {
    isBusy:boolean;
    queryMatch:QueryMatch;
    selectedVariantIdx:number;
    data:AggregateData;
    error:string;
    backlink:Backlink;
}

export interface LexOverviewModelArgs {
    dispatcher:IActionQueue;
    initState:LexOverviewModelState;
    tileId:number;
    api: LexApi;
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
}

export class LexOverviewModel extends StatelessModel<LexOverviewModelState> {

    private readonly tileId:number;

    private readonly api:LexApi;

    private readonly appServices:IAppServices;

    constructor({dispatcher, initState, api, tileId, appServices, queryMatches}:LexOverviewModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.api = api;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                
                state.isBusy = true;
                state.error = null;
                state.data = createEmptyData();
                state.backlink = null;
            },
            (state, action, dispatch) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                this.loadData(dispatch, match.lemma || match.word);
            }
        );

        this.addActionSubtypeHandler(
            Actions.TileDataLoaded,
            action => action.payload.tileId === this.tileId,
            (state, action) => {
                state.isBusy = false;
                if (action.error) {
                    state.error = action.error.message;

                } else {
                    state.data = action.payload.aggregate;
                    if (state.data.variants !== null) {
                        state.selectedVariantIdx = 0;
                    }
                }
            }
        );

        this.addActionSubtypeHandler(
            GlobalActions.GetSourceInfo,
            action => action.payload.tileId === this.tileId,
            null,
            (state, action, dispatch) => {
                this.api.getSourceDescription(
                    this.appServices.dataStreaming(),
                    this.tileId,
                    this.appServices.getISO639UILang(),
                    ''
                ).subscribe({
                    next: (data) => {
                        dispatch({
                            name: GlobalActions.GetSourceInfoDone.name,
                            payload: {
                                data: data
                            }
                        });
                    },
                    error: (err) => {
                        console.error(err);
                        dispatch({
                            name: GlobalActions.GetSourceInfoDone.name,
                            error: err

                        });
                    }
                });
            }
        );

        this.addActionSubtypeHandler(
            GlobalActions.FollowBacklink,
            action => action.payload.tileId === this.tileId,
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
            Actions.SelectVariant,
            action => action.payload.tileId === this.tileId,
            (state, action) => {
                const selectedVariant = state.data.variants.items[action.payload.idx];
                if (selectedVariant.itemIdx >= 0) {
                    state.selectedVariantIdx = action.payload.idx;
                } else {
                    state.isBusy = true;
                }
            },
            (state, action, dispatch) => {
                const selectedVariant = state.data.variants.items[action.payload.idx];
                if (selectedVariant.itemIdx >= 0 && state.data.variants.source === 'assc') {
                    dispatch<typeof Actions.SendActiveMeaningData>({
                        name: Actions.SendActiveMeaningData.name,
                        payload: {
                            tileId: this.tileId,
                            type: state.data.variants.source,
                            data: selectedVariant.itemIdx >= 0 ? state.data.asscData.items[selectedVariant.itemIdx] : null,
                        }
                    });

                } else if (state.data.variants.source === 'assc') {
                    this.loadASSCData(dispatch, state, action.payload.idx);

                } else if (state.data.variants.source === 'lguide') {
                    this.loadLGuideData(dispatch, state, action.payload.idx);

                }
            }
        );

        this.addActionSubtypeHandler(
            Actions.ASSCDataLoaded,
            action => action.payload.tileId === this.tileId,
            (state, action) => {
                state.isBusy = false;
                if (action.error) {
                    state.error = action.error.message;
                } else {
                    state.data.asscData.items = action.payload.items;
                    state.data.variants.items = action.payload.variants;
                    state.selectedVariantIdx = action.payload.selectedVariantIdx;
                }
            }
        );

        this.addActionSubtypeHandler(
            Actions.LGuideDataLoaded,
            action => action.payload.tileId === this.tileId,
            (state, action) => {
                state.isBusy = false;
                if (action.error) {
                    state.error = action.error.message;
                } else {
                    state.data.lguideData = action.payload.data;
                    state.selectedVariantIdx = action.payload.selectedVariantIdx;
                }
            }
        );
    }

    private loadData(dispatch:SEDispatcher, term:string) {
        const args:LexArgs = {
            term,
        };
        this.api.call(
            this.appServices.dataStreaming(),
            this.tileId,
            0,
            args,
        ).subscribe({
            next: data => {
                dispatch<typeof Actions.TileDataLoaded>({
                    name: Actions.TileDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        isEmpty: false,
                        aggregate: data
                    }
                });
            },
            error: error => {
                console.error(error);
                dispatch<typeof Actions.TileDataLoaded>({
                    name: Actions.TileDataLoaded.name,
                    error,
                    payload: {
                        tileId: this.tileId,
                        isEmpty: true,
                        aggregate: createEmptyData(),
                    }
                });
            }
        });
    }

    private loadASSCData(dispatch:SEDispatcher, state:LexOverviewModelState, selectedVariantIdx:number): void {
        const selectedVariant = state.data.variants.items[selectedVariantIdx];
        this.api.loadASSC(
            this.appServices.dataStreaming().startNewSubgroup(this.tileId),
            this.tileId,
            0,
            selectedVariant.link,
        ).subscribe({
            next: data => {
                const newItems = [...state.data.asscData.items];
                List.forEach(item => {
                    if (!List.some(existingItem => existingItem.id === item.id && existingItem.key === item.key, newItems)) {
                        newItems.push(item);
                    }
                }, data.items);
                const newVariants = List.map(item => {
                    const newItem = {...item}
                    if (item.itemIdx === -1) {
                        let count = 0;
                        for (let i = 0; i < newItems.length; i++) {
                            if (item.id === newItems[i].id) {
                                newItem.itemIdx = i;
                                return newItem;
                            } else if (item.id.startsWith(newItems[i].id)) {
                                count++;
                                if (item.id === newItems[i].id + '-' + count) {
                                    newItem.itemIdx = i;
                                    return newItem;
                                }
                            }
                        }
                    }
                    return newItem;
                }, state.data.variants.items);                

                dispatch<typeof Actions.ASSCDataLoaded>({
                    name: Actions.ASSCDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        selectedVariantIdx,
                        items: newItems,
                        variants: newVariants,
                    }
                });
                dispatch<typeof Actions.SendActiveMeaningData>({
                    name: Actions.SendActiveMeaningData.name,
                    payload: {
                        tileId: this.tileId,
                        type: state.data.variants.source,
                        data: newItems[newVariants[selectedVariantIdx].itemIdx],
                    }
                });
            },
            error: error => {
                console.error(error);
                dispatch<typeof Actions.ASSCDataLoaded>({
                    name: Actions.ASSCDataLoaded.name,
                    error,
                    payload: {
                        tileId: this.tileId,
                        selectedVariantIdx: null,
                        items: null,
                        variants: null,
                    }
                });
            }
        });
    }

    private loadLGuideData(dispatch:SEDispatcher, state:LexOverviewModelState, selectedVariantIdx:number): void {
        const selectedVariant = state.data.variants.items[selectedVariantIdx];
        this.api.loadLGuide(
            this.appServices.dataStreaming().startNewSubgroup(this.tileId),
            this.tileId,
            0,
            selectedVariant.id,
        ).subscribe({
            next: data => {          
                dispatch<typeof Actions.LGuideDataLoaded>({
                    name: Actions.LGuideDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        selectedVariantIdx,
                        data: data,
                    }
                });
            },
            error: error => {
                console.error(error);
                dispatch<typeof Actions.LGuideDataLoaded>({
                    name: Actions.LGuideDataLoaded.name,
                    error,
                    payload: {
                        tileId: this.tileId,
                        selectedVariantIdx: null,
                        data: null,
                    }
                });
            }
        });
    }
}