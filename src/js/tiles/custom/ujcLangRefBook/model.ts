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
import { Data, mkEmptyData } from './common';
import { Actions as GlobalActions } from '../../../models/actions';
import { Actions } from './actions';
import { List, HTTP } from 'cnc-tskit';
import { isWebDelegateApi } from '../../../types';
import { findCurrQueryMatch } from '../../../models/query';
import { UjcLGuideApi } from './api';


export interface UjcLGuideModelState {
    isBusy:boolean;
    data:Data;
    error:string;
    backlinks:Array<BacklinkWithArgs<{}>>;
}

export interface UjcLGuideModelArgs {
    dispatcher:IActionQueue;
    initState:UjcLGuideModelState;
    tileId:number;
    api:UjcLGuideApi,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
    backlink:Backlink;
}

export class UjcLGuideModel extends StatelessModel<UjcLGuideModelState> {

    private readonly tileId:number;

    private readonly api:UjcLGuideApi;

    private readonly appServices:IAppServices;

    private readonly backlink:Backlink;


    constructor({dispatcher, initState, api, tileId, appServices, queryMatches, backlink}:UjcLGuideModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.api = api;
        this.backlink = !backlink?.isAppUrl && isWebDelegateApi(this.api) ? this.api.getBackLink(backlink) : backlink;


        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                state.isBusy = true;
                state.error = null;
                state.data = {...mkEmptyData(), rawQuery: match.lemma};
                state.backlinks = []
            },
            (state, action, dispatch) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                this.loadData(dispatch, state, match.lemma, false);
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

        this.addActionHandler(
            Actions.TileDataLoaded,
            (state, action) => {
                if (action.payload.tileId === this.tileId) {
                    state.isBusy = false;
                    if (action.error) {
                        state.error = action.error.message;

                    } else {
                        state.data = action.payload.data;
                        state.backlinks = [this.generateBacklink(state.data.rawQuery, state.data.isDirect)];
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
                ).subscribe(
                    (data) => {
                        dispatch({
                            name: GlobalActions.GetSourceInfoDone.name,
                            payload: {
                                data: data
                            }
                        });
                    },
                    (err) => {
                        console.error(err);
                        dispatch({
                            name: GlobalActions.GetSourceInfoDone.name,
                            error: err

                        });
                    }
                );
            }
        );
    }

    private generateBacklink(ident:string, direct:boolean):BacklinkWithArgs<{id:string}|{slovo:string}> {
        return {
            url: 'https://prirucka.ujc.cas.cz/',
            label: 'heslo v Internetové jazykové příručce',
            method: HTTP.Method.GET,
            args: direct ? {id: ident} : {slovo: ident}
        };
    }

    private loadData(dispatch:SEDispatcher, state:UjcLGuideModelState, q:string, direct:boolean) {
        const args:{q:string; direct?:0|1} = {
            q,
            direct: direct ? 1 : 0
        };
        this.api.call(args).subscribe({
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