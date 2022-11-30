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
import { IAppServices } from '../../../appServices';
import { Backlink, BacklinkWithArgs } from '../../../page/tile';
import { RecognizedQueries } from '../../../query';
import { createEmptyData, DataStructure } from './common';
import { Actions as GlobalActions } from '../../../models/actions';
import { Actions } from './actions';
import { List, HTTP } from 'cnc-tskit';
import { isWebDelegateApi } from '../../../types';
import { findCurrQueryMatch } from '../../../models/query';
import { UjcDictionaryArgs, UjcDictionaryApi } from './api';


export interface UjcDictionaryModelState {
    isBusy:boolean;
    queries:Array<string>;
    data:DataStructure;
    maxItems:number;
    error:string;
    backlinks:Array<BacklinkWithArgs<{}>>;
}

export interface UjcDictionaryModelArgs {
    dispatcher:IActionQueue;
    initState:UjcDictionaryModelState;
    tileId:number;
    api:UjcDictionaryApi,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
    backlink:Backlink;
}

export class UjcDictionaryModel extends StatelessModel<UjcDictionaryModelState> {

    private readonly tileId:number;

    private readonly api:UjcDictionaryApi;

    private readonly appServices:IAppServices;

    private readonly backlink:Backlink;


    constructor({dispatcher, initState, api, tileId, appServices, queryMatches, backlink}:UjcDictionaryModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.api = api;
        this.backlink = !backlink?.isAppUrl && isWebDelegateApi(this.api) ? this.api.getBackLink(backlink) : backlink;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                state.queries = [match.lemma||match.word];
                state.isBusy = true;
                state.error = null;
                state.data = createEmptyData();
                state.backlinks = [];
            },
            (state, action, dispatch) => {
                this.loadData(dispatch, state);
            }
        );

        this.addActionHandler(
            Actions.TileDataLoaded,
            (state, action) => {
                if (action.payload.tileId === this.tileId) {
                    state.isBusy = false;
                    if (action.error) {
                        state.error = action.error.message;

                    } else {
                        state.data = action.payload.data;
                        state.backlinks = [this.generateBacklink(state.data.query)];
                    }
                }
            }
        );

        this.addActionHandler(
            GlobalActions.GetSourceInfo,
            (state, action) => {
            },
            (state, action, dispatch) => {
                this.api.getSourceDescription(
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
    }

    private generateBacklink(ident:string):BacklinkWithArgs<{}> {
        return {
            url: `https://slovnikcestiny.cz/heslo/${ident}/`,
            label: 'heslo v Akademickém slovníku současné češtiny',
            method: HTTP.Method.GET,
            args: {}
        };
    }

    private loadData(dispatch:SEDispatcher, state:UjcDictionaryModelState) {
        const args:UjcDictionaryArgs = {
            q: state.queries
        };
        this.api.call(args).subscribe({
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