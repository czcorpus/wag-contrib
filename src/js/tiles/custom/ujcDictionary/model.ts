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
import { createEmptyData, DataStructure } from './common.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';
import { List } from 'cnc-tskit';
import { UjcDictionaryArgs, UjcDictionaryApi } from './api.js';
import { findCurrQueryMatch, RecognizedQueries } from '../../../query/index.js';


export interface UjcDictionaryModelState {
    isBusy:boolean;
    queries:Array<string>;
    data:DataStructure;
    maxItems:number;
    error:string;
    backlink:Backlink;
}

export interface UjcDictionaryModelArgs {
    dispatcher:IActionQueue;
    initState:UjcDictionaryModelState;
    tileId:number;
    api:UjcDictionaryApi,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
}

export class UjcDictionaryModel extends StatelessModel<UjcDictionaryModelState> {

    private readonly tileId:number;

    private readonly api:UjcDictionaryApi;

    private readonly appServices:IAppServices;

    constructor({dispatcher, initState, api, tileId, appServices, queryMatches}:UjcDictionaryModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.api = api;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                state.queries = [match.lemma||match.word];
                state.isBusy = true;
                state.error = null;
                state.data = createEmptyData();
                state.backlink = null;
            },
            (state, action, dispatch) => {
                this.loadData(dispatch, true, state);
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
                    state.data = action.payload.data;
                    state.backlink = this.api.getBacklink(0);
                }
            }
        );

        this.addActionSubtypeHandler(
            GlobalActions.GetSourceInfo,
            action => action.payload.tileId === this.tileId,
            null,
            (state, action, dispatch) => {
                this.api.getSourceDescription(
                    this.tileId,
                    false,
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
                window.open(`https://slovnikcestiny.cz/heslo/${state.data.query}/`, '_blank');
            }
        );
    }

    private loadData(dispatch:SEDispatcher, multicastRequest:boolean, state:UjcDictionaryModelState) {
        const args:UjcDictionaryArgs = {
            q: state.queries
        };
        this.api.call(this.tileId, multicastRequest, args).subscribe({
            next: data => {
                dispatch<typeof Actions.TileDataLoaded>({
                    name: Actions.TileDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        isEmpty: false,
                        data
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
                        data: createEmptyData(),
                    }
                });
            }
        });
    }

}