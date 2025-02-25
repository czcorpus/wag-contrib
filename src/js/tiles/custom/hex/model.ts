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
import { Dict, List } from 'cnc-tskit';
import { of as rxOf } from 'rxjs';

import { IAppServices } from '../../../appServices.js';
import { Backlink } from '../../../page/tile.js';
import { RecognizedQueries, QueryMatch } from '../../../query/index.js';
import { Data, mkEmptyData } from './common.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';
import { findCurrQueryMatch } from '../../../models/query.js';
import { PoSValues } from '../../../postag.js';
import { HexKspApi, KSPRequestArgs } from './api.js';


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

const posArgMapping = {
    [PoSValues.NOUN]: 'pos[1]',
    [PoSValues.ADJECTIVE]: 'pos[2]',
    [PoSValues.PRONOUN]: 'pos[3]',
    [PoSValues.NUMERAL]: 'pos[4]',
    [PoSValues.VERB]: 'pos[5]',
    [PoSValues.ADVERB]: 'pos[6]',
    [PoSValues.PREPOSITION]: 'pos[7]',
    [PoSValues.CONJUNCTION]: 'pos[8]',
    [PoSValues.PARTICLE]: 'pos[9]',
    [PoSValues.INTERJECTION]: 'pos[10]'
};

function exportPosArgs(args:KSPRequestArgs, match:QueryMatch):void {
    const wordPos = match.pos[0];
    if (wordPos === undefined) {
        Dict.forEach(
            (v, _) => {
                args[v] = 'on';
            },
            posArgMapping
        );

    } else {
        args[posArgMapping[wordPos.value]] = 'on';
    }
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
                const args:KSPRequestArgs = {
                    q: match.lemma,
                    sort: 'a',
                    src: 'all',
                    met: 'kw',
                    min: 3, // TODO user configurable
                    alpha: 100, // TODO user configurable
                    lang: 'cz'
                };
                exportPosArgs(args, match);
                (
                    match && match.abs > 0 ?
                        this.api.call(args) :
                        rxOf({
                            count: 0,
                            size:{
                                lemma: {},
                                line: {},
                                poem:{}
                            },
                            countY: {},
                            table: [],
                            sorting: {
                                author: {},
                                bookName: {},
                                poemName:{}
                            }
                        })

                ).subscribe({
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
        this.addActionSubtypeHandler<typeof Actions.TileDataLoaded>(
            Actions.TileDataLoaded.name,
            action => action.payload.tileId === this.tileId,
            (state, action) => {
                state.isBusy = false;
                state.word = findCurrQueryMatch(List.head(queryMatches)).word;
                if (action.error) {
                    state.error = action.error.message;

                } else {
                    state.data = action.payload.data;
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