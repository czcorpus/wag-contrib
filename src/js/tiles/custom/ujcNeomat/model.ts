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
import { DataStructure } from './common';
import { Actions as GlobalActions } from '../../../models/actions';
import { Actions } from './actions';
import { List, HTTP } from 'cnc-tskit';
import { isWebDelegateApi } from '../../../types';
import { findCurrQueryMatch } from '../../../models/query';
import { UjcNeomatArgs, UjcNeomatApi } from './api';


export interface UjcNeomatModelState {
    isBusy:boolean;
    ident:string;
    maxItems:number;
    data:DataStructure;
    error:string;
    backlinks:Array<BacklinkWithArgs<{}>>;
}

export interface UjcNeomatModelArgs {
    dispatcher:IActionQueue;
    initState:UjcNeomatModelState;
    tileId:number;
    api:UjcNeomatApi,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
    backlink:Backlink;
}

export class UjcNeomatModel extends StatelessModel<UjcNeomatModelState> {

    private readonly tileId:number;

    private readonly api:UjcNeomatApi;

    private readonly appServices:IAppServices;

    private readonly backlink:Backlink;


    constructor({dispatcher, initState, api, tileId, appServices, queryMatches, backlink}:UjcNeomatModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.api = api;
        this.backlink = !backlink?.isAppUrl && isWebDelegateApi(this.api) ? this.api.getBackLink(backlink) : backlink;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                state.ident = match.lemma || match.word;
                state.isBusy = true;
                state.error = null;
                state.data = {
                    entries: [],
                }
                state.backlinks = [];
            },
            (state, action, dispatch) => {
                this.loadData(dispatch, state, state.ident);
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
                        state.backlinks = [this.generateBacklink(state.ident)];
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
            url: 'http://www.neologismy.cz/index.php',
            label: 'heslo v Neomatu',
            method: HTTP.Method.GET,
            args: {
                retezec: ident,
                nove_hledani: 1,
                button: "Hledat",
                prijimam: 1,
            }
        };
    }

    private loadData(dispatch:SEDispatcher, state:UjcNeomatModelState, q:string) {
        const args:UjcNeomatArgs = {
            q,
            maxItems: state.maxItems,
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
                        data: {
                            entries: [],
                        },
                    }
                });
            }
        });
    }

}