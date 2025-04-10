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
import { Backlink, BacklinkConf } from '../../../page/tile.js';
import { createEmptyData, DataStructure } from './common.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';
import { List } from 'cnc-tskit';
import { UjcCJAArgs, UjcCJAApi } from './api.js';
import { findCurrQueryMatch, RecognizedQueries } from '../../../query/index.js';


export interface UjcCJAModelState {
    isBusy:boolean;
    ident:string;
    data:DataStructure;
    error:string;
    backlink:Backlink;
}

export interface UjcCJAModelArgs {
    dispatcher:IActionQueue;
    initState:UjcCJAModelState;
    tileId:number;
    api:UjcCJAApi,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
}

export class UjcCJAModel extends StatelessModel<UjcCJAModelState> {

    private readonly tileId:number;

    private readonly api:UjcCJAApi;

    private readonly appServices:IAppServices;

    constructor({dispatcher, initState, api, tileId, appServices, queryMatches}:UjcCJAModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.api = api;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                state.ident = match.lemma || match.word;
                state.isBusy = true;
                state.error = null;
                state.data = createEmptyData();
                state.backlink = null;
            },
            (state, action, dispatch) => {
                this.loadData(dispatch, true, state, state.ident);
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
                    '',
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
                const backlinkUrl = URL.parse(state.data.backlink);
                if (backlinkUrl.searchParams.has('hw')) {
                    backlinkUrl.searchParams.set('hw', state.ident);
                }
                if (backlinkUrl.searchParams.has('doklad')) {
                    backlinkUrl.searchParams.set('doklad', state.ident);
                }
                window.open(backlinkUrl.toString(), '_blank');
            }
        );
    }

    private loadData(dispatch:SEDispatcher, multicastRequest:boolean, state:UjcCJAModelState, q:string) {
        const args:UjcCJAArgs = {
            q
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