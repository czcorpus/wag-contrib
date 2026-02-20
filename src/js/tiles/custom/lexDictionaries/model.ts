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
import { List } from 'cnc-tskit';
import { findCurrQueryMatch, RecognizedQueries } from '../../../query/index.js';
import { ApiType, LexDictApi } from './api/types.js';
import { PSJCDataStructure, SSJCDataStructure, UjcBasicArgs } from './api/basicApi.js';
import { map, merge } from 'rxjs';


export interface LexDictionariesModelState {
    isBusy:boolean;
    queries:Array<string>;
    data:Array<{
        type:ApiType;
        loaded:boolean;
        data:SSJCDataStructure|PSJCDataStructure;
        backlink:Backlink;
    }>;
    selectedDataIndex:number;
    error:string;
    backlink:Backlink;
}

export interface LexDictionariesModelArgs {
    dispatcher:IActionQueue;
    initState:LexDictionariesModelState;
    tileId:number;
    apis:Array<LexDictApi>,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
}

export class LexDictionariesModel extends StatelessModel<LexDictionariesModelState> {

    private readonly tileId:number;

    private readonly apis:Array<LexDictApi>;

    private readonly appServices:IAppServices;


    constructor({dispatcher, initState, apis, tileId, appServices, queryMatches}:LexDictionariesModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.apis = apis;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                state.queries = [match.word];
                /* TODO
                if (!match.isNonDict) {
                    state.queries.push(match.lemma)
                };
                */
                state.isBusy = true;
                state.error = null;
                state.data = List.map(d => ({...d, data: null, loaded: false}), state.data);
                state.backlink = null;
            },
            (state, action, dispatch) => {
                this.loadData(dispatch, state);
            }
        );

        this.addActionSubtypeHandler(
            Actions.TileDataLoaded,
            action => action.payload.tileId === this.tileId,
            (state, action) => {
                state.isBusy = false;
                if (action.error) {
                    state.error = action.error.message;
                }
            }
        );

        this.addActionSubtypeHandler(
            Actions.PartialTileDataLoaded,
            action => action.payload.tileId === this.tileId,
            (state, action) => {
                state.data[action.payload.queryId].loaded = true;
                state.data[action.payload.queryId].data = action.payload.data;
            }
        );

        this.addActionSubtypeHandler(
            Actions.SelectTab,
            action => action.payload.tileId === this.tileId,
            (state, action) => {
                state.selectedDataIndex = action.payload.dataIdx;
            }
        );

        this.addActionSubtypeHandler(
            GlobalActions.GetSourceInfo,
            action => action.payload.tileId === this.tileId,
            null,
            (state, action, dispatch) => {
            }
        );

        this.addActionSubtypeHandler(
            GlobalActions.FollowBacklink,
            action => action.payload.tileId === this.tileId,
            null,
            (state, action, dispatch) => {
            }
        );
    }

    private loadData(dispatch:SEDispatcher, state:LexDictionariesModelState) {
        const args:UjcBasicArgs = {
            q: state.queries
        };
        merge(
            ...List.map(
                (api, i) => api.call(this.appServices.dataStreaming(), this.tileId, i, args).pipe(
                    map(data => ({
                        queryId: i,
                        data: data,
                    }))
                ),
                this.apis
            )
        ).subscribe({
            next: response => {
                dispatch<typeof Actions.PartialTileDataLoaded>({
                    name: Actions.PartialTileDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        queryId: response.queryId,
                        data: response.data,
                    }
                });
            },
            complete: () => {
                dispatch<typeof Actions.TileDataLoaded>({
                    name: Actions.TileDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        isEmpty: false,
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
                    }
                });
            }
        });
    }
}