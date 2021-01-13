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
import { GunstickApi } from './api';
import { Data, DataLoadedPayload, mkEmptyData, ChartData } from './common';
import { ActionName as GlobalActionName, Actions as GlobalActions } from '../../../models/actions';
import { Dict, List, pipe, tuple } from 'cnc-tskit';
import { findCurrQueryMatch } from '../../../models/query';

export interface GunstickModelState {
    isBusy:boolean;
    error:string;
    data:Data;
    isAltViewMode:boolean;
}

export interface GunstickModelArgs {
    dispatcher:IActionQueue;
    initState:GunstickModelState;
    tileId:number;
    api:GunstickApi,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
    backlink:Backlink;
    queryDomain:string;
}

export class GunstickModel extends StatelessModel<GunstickModelState> {

    private readonly tileId:number;

    private readonly api:GunstickApi;

    constructor({dispatcher, initState, api, tileId, appServices, queryMatches, backlink, queryDomain}:GunstickModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.api = api;


        this.addActionHandler<GlobalActions.RequestQueryResponse>(
            GlobalActionName.RequestQueryResponse,
            (state, action) => {
                state.isBusy = true;
                state.error = null;
                state.data = mkEmptyData();
            },
            (state, action, dispatch) => {
                this.api.call({
                    q: findCurrQueryMatch(List.head(queryMatches)).lemma,
                    unit: 'lemma'
                }).subscribe(
                    (data) => {
                        dispatch<GlobalActions.TileDataLoaded<DataLoadedPayload>>({
                            name: GlobalActionName.TileDataLoaded,
                            payload: {
                                tileId: this.tileId,
                                isEmpty: false,
                                data: data
                            }
                        });
                    },
                    (err) => {
                        console.error(err);
                        dispatch<GlobalActions.TileDataLoaded<DataLoadedPayload>>({
                            name: GlobalActionName.TileDataLoaded,
                            error: err,
                            payload: {
                                tileId: this.tileId,
                                isEmpty: true,
                                data: mkEmptyData()
                            }
                        });
                    }
                );
            }
        );
        this.addActionHandler<GlobalActions.TileDataLoaded<DataLoadedPayload>>(
            GlobalActionName.TileDataLoaded,
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

        this.addActionHandler<GlobalActions.EnableAltViewMode>(
            GlobalActionName.EnableAltViewMode,
            (state, action) => {
                if (action.payload.ident === this.tileId) {
                    state.isAltViewMode = true;
                }
            }
        );
        this.addActionHandler<GlobalActions.DisableAltViewMode>(
            GlobalActionName.DisableAltViewMode,
            (state, action) => {
                if (action.payload.ident === this.tileId) {
                    state.isAltViewMode = false;
                }
            }
        );
    }

}