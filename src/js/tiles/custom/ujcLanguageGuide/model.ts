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

import { IActionQueue, StatelessModel } from 'kombo';
import { IAppServices } from '../../../appServices';
import { Backlink } from '../../../page/tile';
import { RecognizedQueries } from '../../../query';
import { Data, mkEmptyData } from './common';
import { Actions as GlobalActions } from '../../../models/actions';
import { Actions } from './actions';
import { List } from 'cnc-tskit';
import { findCurrQueryMatch } from '../../../models/query';
import { UjcLGuideApi } from './api';


export interface UjcLGuideModelState {
    isBusy:boolean;
    data:Data;
    serviceInfoUrl:string;
    error:string;
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

    constructor({dispatcher, initState, api, tileId, appServices, queryMatches, backlink}:UjcLGuideModelArgs) {
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
                const match = findCurrQueryMatch(List.head(queryMatches));
                this.api.call({
                    q: match.lemma
                }).subscribe({
                    next: data => {
                        dispatch<typeof Actions.TileDataLoaded>({
                            name: Actions.TileDataLoaded.name,
                            payload: {
                                tileId: this.tileId,
                                isEmpty: false,
                                data: data,
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
                                data: mkEmptyData(),
                            }
                        });
                    }
                });
            }
        );

        this.addActionHandler(
            Actions.RequestAlternative,
            (state, action) => {
                state.isBusy = true;
                state.error = null;
                const empty_data = mkEmptyData();
                empty_data.alternatives = state.data.alternatives;
                state.data = empty_data;
            },
            (state, action, dispatch) => {
                this.api.call({
                    q: action.payload.id,
                    direct: 1
                }).subscribe({
                    next: data => {
                        dispatch<typeof Actions.TileDataLoaded>({
                            name: Actions.TileDataLoaded.name,
                            payload: {
                                tileId: this.tileId,
                                isEmpty: false,
                                data: {
                                    ...data,
                                    alternatives: state.data.alternatives,
                                }
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
                                data: mkEmptyData(),
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

    }

}