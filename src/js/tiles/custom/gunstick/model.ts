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

import { List } from 'cnc-tskit';
import { IActionQueue, StatelessModel } from 'kombo';

import { IAppServices } from '../../../appServices.js';
import { RecognizedQueries, findCurrQueryMatch, testIsDictMatch } from '../../../query/index.js';
import { KSPRequestArgs } from './api.js';
import { Data, mkEmptyData } from './common.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';
import { DataApi } from '../../../types.js';

export interface GunstickModelState {
    isBusy:boolean;
    error:string;
    data:Data;
    isAltViewMode: boolean;
    isTweakMode:boolean;
    serviceInfoUrl:string;
    page:number;
    pageSize:number;
    y1:number;
    y2:number;
}

export interface GunstickModelArgs {
    dispatcher:IActionQueue;
    initState:GunstickModelState;
    tileId:number;
    api:DataApi<KSPRequestArgs, Data>,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
    queryDomain:string;
}

export class GunstickModel extends StatelessModel<GunstickModelState> {

    private readonly tileId:number;

    private readonly api:DataApi<KSPRequestArgs, Data>;

    constructor({
        dispatcher,
        initState,
        api,
        tileId,
        appServices,
        queryMatches,
        queryDomain}:GunstickModelArgs
    ) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.api = api;


        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                state.isBusy = true;
                state.error = null;
                state.data = mkEmptyData();
            },
            (state, action, dispatch) => {
                const currMatch = findCurrQueryMatch(List.head(queryMatches));
                this.api.call(
                    this.tileId,
                    true,
                    testIsDictMatch(currMatch) ?
                        {
                            q: currMatch.lemma,
                            unit: 'lemma',
                            src: 'all',
                            lang: 'cz',
                            y1: state.y1,
                            y2: state.y2
                        } :
                        null
                ).subscribe({
                    next: (data) => {
                        dispatch<typeof Actions.TileDataLoaded>({
                            name: Actions.TileDataLoaded.name,
                            payload: {
                                tileId: this.tileId,
                                isEmpty: false,
                                data: data
                            }
                        });
                    },
                    error: (error) => {
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
                });
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

        this.addActionHandler<typeof GlobalActions.EnableTileTweakMode>(
            GlobalActions.EnableTileTweakMode.name,
            (state, action) => {
                if (action.payload.ident === this.tileId) {
                    state.isTweakMode = true;
                }
            }
        );
        this.addActionHandler<typeof GlobalActions.DisableTileTweakMode>(
            GlobalActions.DisableTileTweakMode.name,
            (state, action) => {
                if (action.payload.ident === this.tileId) {
                    state.isTweakMode = false;
                }
            }
        );

        this.addActionHandler<typeof Actions.NextPage>(
            Actions.NextPage.name,
            (state, action) => {
                if (action.payload.tileId === this.tileId) {
                    state.page++;
                }
            }
        );
        this.addActionHandler<typeof Actions.PrevPage>(
            Actions.PrevPage.name,
            (state, action) => {
                if (action.payload.tileId === this.tileId) {
                    state.page--;
                }
            }
        );
    }

}