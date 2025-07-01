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
import { findCurrQueryMatch, RecognizedQueries } from '../../../query/index.js';
import { DataStructure, mkEmptyData } from './common.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';
import { List } from 'cnc-tskit';
import { UjcLGuideApi, UjcLGuideRequestArgs } from './api.js';


export interface UjcLGuideModelState {
    isBusy:boolean;
    data:DataStructure;
    error:string;
    backlink:Backlink;
}

export interface UjcLGuideModelArgs {
    dispatcher:IActionQueue;
    initState:UjcLGuideModelState;
    tileId:number;
    api:UjcLGuideApi,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
}

export class UjcLGuideModel extends StatelessModel<UjcLGuideModelState> {

    private readonly tileId:number;

    private readonly api:UjcLGuideApi;

    private readonly appServices:IAppServices;

    constructor({dispatcher, initState, api, tileId, appServices, queryMatches}:UjcLGuideModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.api = api;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                state.isBusy = true;
                state.error = null;
                state.data = {...mkEmptyData(), rawQuery: match.lemma || match.word};
                state.backlink = null;
            },
            (state, action, dispatch) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                this.loadData(dispatch, state, match.lemma || match.word, false);
            }
        );

        this.addActionHandler(
            Actions.RequestAlternative,
            (state, action) => {
                state.isBusy = true;
                state.error = null;
                state.data = {
                    ...mkEmptyData(),
                    rawQuery: action.payload.id,
                    alternatives: state.data.alternatives
                };
            },
            (state, action, dispatch) => {
                this.loadData(dispatch, state, action.payload.id, true);
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
                if (state.data.isDirect) {
                    backlinkUrl.searchParams.set('id', state.data.rawQuery);
                } else {
                    backlinkUrl.searchParams.set('slovo', state.data.rawQuery);
                }
                window.open(backlinkUrl.toString(), '_blank');
            }
        );
    }

    private loadData(dispatch:SEDispatcher, state:UjcLGuideModelState, q:string, direct:boolean) {
        const args:UjcLGuideRequestArgs = {
            q,
            direct: direct ? 1 : 0
        };
        this.api.call(this.appServices.dataStreaming(), this.tileId, 0, args).subscribe({
            next: data => {
                if (direct) {
                    data.alternatives = state.data.alternatives;
                }
                data.isDirect = direct;
                data.rawQuery = q;

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
                            ...mkEmptyData(),
                            isDirect: true,
                            rawQuery: q
                        },
                    }
                });
            }
        });
    }

}