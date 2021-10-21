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
import { Data, mkEmptyData } from './common';
import { Actions as GlobalActions } from '../../../models/actions';
import { Actions } from './actions';
import { List, tuple } from 'cnc-tskit';
import { findCurrQueryMatch } from '../../../models/query';
import { HexKspApi, posToIndex } from './api';
import { PoSValues } from '../../../postag';


export interface HexModelState {
    isBusy:boolean;
    error:string;
    data:Data;
    isAltViewMode:boolean;
    isTweakMode:boolean;
    word:string;
    serviceInfoUrl:string;
}

export interface HexModelArgs {
    dispatcher:IActionQueue;
    initState:HexModelState;
    tileId:number;
    api:HexKspApi,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
    backlink:Backlink;
    queryDomain:string;
}

export class HexModel extends StatelessModel<HexModelState> {

    private readonly tileId:number;

    private readonly api:HexKspApi;

    constructor({dispatcher, initState, api, tileId, appServices, queryMatches, backlink, queryDomain}:HexModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.api = api;


        this.addActionHandler<typeof GlobalActions.RequestQueryResponse>(
            GlobalActions.RequestQueryResponse.name,
            (state, action) => {
                state.isBusy = true;
                state.error = null;
                state.word = '';
                state.data = mkEmptyData();
            },
            (state, action, dispatch) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                this.api.call({
                    q: match.lemma,
                    sort: 'a',
                    src: 'all',
                    'pos[1]': 'on',
                    'pos[2]': 'on',
                    'pos[5]': 'on',
                    met: 'kw',
                    min: 3, // TODO user configurable
                    alpha: 100, // TODO user configurable
                    lang: 'cz'
                }).subscribe({
                    next: data => {
                        dispatch<typeof Actions.TileDataLoaded>({
                            name: Actions.TileDataLoaded.name,
                            payload: {
                                tileId: this.tileId,
                                isEmpty: false,
                                data: data
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
                    state.word = findCurrQueryMatch(List.head(queryMatches)).word;
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
    }

}