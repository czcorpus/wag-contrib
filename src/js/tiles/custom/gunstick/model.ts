/*
 * Copyright 2021 Tomas Machalek <tomas.machalek@gmail.com>
 * Copyright 2021 Institute of the Czech National Corpus,
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

import { IActionQueue, StatelessModel } from 'kombo';
import { IAppServices } from '../../../appServices';
import { Backlink } from '../../../page/tile';
import { RecognizedQueries } from '../../../query';
import { GunstickKspApi } from './api';
import { Data, mkEmptyData } from './common';
import { Actions as GlobalActions } from '../../../models/actions';
import { Actions } from './actions';
import { List } from 'cnc-tskit';
import { findCurrQueryMatch } from '../../../models/query';
import { AjaxError } from 'rxjs/ajax';

export interface GunstickModelState {
    isBusy:boolean;
    error:string;
    data:Data;
    isAltViewMode:boolean;
    serviceInfoUrl:string;
}

export interface GunstickModelArgs {
    dispatcher:IActionQueue;
    initState:GunstickModelState;
    tileId:number;
    api:GunstickKspApi,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
    backlink:Backlink;
    queryDomain:string;
}

export class GunstickModel extends StatelessModel<GunstickModelState> {

    private readonly tileId:number;

    private readonly api:GunstickKspApi;

    constructor({dispatcher, initState, api, tileId, appServices, queryMatches, backlink, queryDomain}:GunstickModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.api = api;


        this.addActionHandler<typeof GlobalActions.RequestQueryResponse>(
            GlobalActions.RequestQueryResponse.name,
            (state, action) => {
                state.isBusy = true;
                state.error = null;
                state.data = mkEmptyData();
            },
            (state, action, dispatch) => {
                this.api.call({
                    q: findCurrQueryMatch(List.head(queryMatches)).lemma,
                    unit: 'lemma',
                    src: 'all',
                    lang: 'cz'
                }).subscribe(
                    (data) => {
                        dispatch<typeof Actions.TileDataLoaded>({
                            name: Actions.TileDataLoaded.name,
                            payload: {
                                tileId: this.tileId,
                                isEmpty: false,
                                data: data
                            }
                        });
                    },
                    (error) => {
                        if (error instanceof AjaxError && error.status === 404) {
                            console.error("Gunstick api url not found!");
                            dispatch<typeof Actions.TileDataLoaded>({
                                name: Actions.TileDataLoaded.name,
                                payload: {
                                    tileId: this.tileId,
                                    isEmpty: true,
                                    data: mkEmptyData()
                                }
                            });

                        } else {
                            console.error(error);
                            dispatch<typeof Actions.TileDataLoaded>({
                                name: Actions.TileDataLoaded.name,
                                error,
                                payload: {
                                    tileId: this.tileId,
                                    isEmpty: true,
                                    data: mkEmptyData()
                                }
                            });
                        }
                    }
                );
            }
        );
        this.addActionHandler<typeof Actions.TileDataLoaded>(
            Actions.TileDataLoaded.name,
            (state, action) => {
                if (action.payload.tileId === this.tileId) {
                    state.isBusy = false;
                    if (action.error) {
                        state.error = action.error.message;

                    } else {
                        state.data = action.payload.data;
                    }
                }
            }
        );

        this.addActionHandler<typeof GlobalActions.EnableAltViewMode>(
            GlobalActions.EnableAltViewMode.name,
            (state, action) => {
                if (action.payload.ident === this.tileId) {
                    state.isAltViewMode = true;
                }
            }
        );
        this.addActionHandler<typeof GlobalActions.DisableAltViewMode>(
            GlobalActions.DisableAltViewMode.name,
            (state, action) => {
                if (action.payload.ident === this.tileId) {
                    state.isAltViewMode = false;
                }
            }
        );
    }

}