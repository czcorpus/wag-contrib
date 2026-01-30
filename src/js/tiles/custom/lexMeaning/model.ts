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
import { createEmptyData, DataStructure } from './common.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';
import { Actions as LexActions } from '../lexOverview/actions.js';
import { List } from 'cnc-tskit';
import { UjcDictionaryArgs, UjcDictionaryApi } from './api.js';
import { findCurrQueryMatch, RecognizedQueries } from '../../../query/index.js';
import { IDataStreaming } from 'src/js/page/streaming.js';
import { AggregateData } from '../lexOverview/common.js';
import { map, Observable } from 'rxjs';
import { DataItem } from '../lexOverview/commonAssc.js';


export interface LexMeaningModelState {
    isBusy:boolean;
    queries:Array<string>;
    data:DataItem;
    error:string;
    backlink:Backlink;
}

export interface LexMeaningModelArgs {
    dispatcher:IActionQueue;
    initState:LexMeaningModelState;
    tileId:number;
    api:UjcDictionaryApi,
    appServices:IAppServices;
    queryMatches:RecognizedQueries;
    readDataFromTile: number | null;
}

export class LexMeaningModel extends StatelessModel<LexMeaningModelState> {

    private readonly tileId:number;

    private readonly api:UjcDictionaryApi;

    private readonly appServices:IAppServices;

    private readonly readDataFromTile: number | null;

    constructor({dispatcher, initState, api, tileId, appServices, queryMatches, readDataFromTile}:LexMeaningModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;
        this.api = api;
        this.readDataFromTile = readDataFromTile;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {
                const match = findCurrQueryMatch(List.head(queryMatches));
                state.queries = [match.lemma||match.word];
                state.isBusy = true;
                state.error = null;
                state.data = null;
                state.backlink = null;
            },
            (state, action, dispatch) => {
                this.loadData(dispatch, state, this.appServices.dataStreaming());
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
                window.open(`https://slovnikcestiny.cz/heslo/state.data.query/`, '_blank');
            }
        );

        this.addActionSubtypeHandler(
            LexActions.SelectVariant,
            action => typeof this.readDataFromTile === 'number' && action.payload.tileId === this.readDataFromTile,
            (state, action) => {
                if (action.payload.source === 'assc') {
                    state.isBusy = true;
                }
            },
        );

        this.addActionSubtypeHandler(
            LexActions.SendActiveMeaningData,
            action => typeof this.readDataFromTile === 'number' && action.payload.tileId === this.readDataFromTile,
            (state, action) => {
                state.isBusy = false;
                state.data = action.payload.data;
            },
        );
    }

    private loadData(dispatch:SEDispatcher, state: LexMeaningModelState, streaming: IDataStreaming): void {
        (typeof this.readDataFromTile === 'number'
            ? streaming
                    .registerTileRequest<AggregateData>({
                        tileId: this.tileId,
                        queryIdx: 0, // TODO
                        otherTileId: this.readDataFromTile,
                        otherTileQueryIdx: 0, // TODO
                        contentType: 'application/json',
                    })
                    .pipe(
                        map(resp => resp.variants.source === 'assc' ?
                                resp.asscData.items[resp.variants.items[0]?.itemIdx] : null)
                    )
            : this.api.call(streaming, this.tileId, 0, {q: state.queries})
            .pipe(
                map(resp => resp.items[0])
            )
        ).subscribe({
            next: data => {                
                dispatch<typeof Actions.TileDataLoaded>({
                    name: Actions.TileDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        isEmpty: false,
                        data,
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
                        data: null,
                    }
                });
            }
        });
    }
}