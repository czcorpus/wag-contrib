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

import { IActionQueue, SEDispatcher } from 'kombo';
import { IAppServices } from '../../../appServices.js';
import { Backlink } from '../../../page/tile.js';
import { Actions } from './actions.js';
import { IDataStreaming } from '../../../page/streaming.js';
import { LexResponse } from '../lexCommon/api.js';
import { TileStatelessModel } from '../../../models/tiles/base.js';
import { LemmatizationLevel, QueryMatch } from '../../../query/index.js';

export interface LexEtymologyModelState {
    isBusy: boolean;
    currQueryMatch: QueryMatch;
    data: string;
    error: string;
    backlink: Backlink;
}

export interface LexEtymologyModelArgs {
    dispatcher: IActionQueue;
    initState: LexEtymologyModelState;
    tileId: number;
    appServices: IAppServices;
    readDataFromTile: number | null;
    lemLevelSupport: Array<LemmatizationLevel>;
    dependentTiles: Array<number>;
}

export class LexEtymologyModel extends TileStatelessModel<LexEtymologyModelState> {
    constructor({
        dispatcher,
        initState,
        tileId,
        appServices,
        readDataFromTile,
        dependentTiles,
        lemLevelSupport,
    }: LexEtymologyModelArgs) {
        super({
            dispatcher,
            initState,
            tileId,
            appServices,
            dependentTiles,
            lemLevelSupport,
            readDataFromTile,
        });

        this.addSearchActionHandler(
            (state, action) => {
                state.error = null;
                state.backlink = null;
                if (!!action.payload?.newQueryMatches) {
                    state.currQueryMatch = action.payload.newQueryMatches[0];
                }
                state.data = null;
                state.isBusy = true;
            },
            (state, action, dispatch, ds) => {
                this.loadData(ds, dispatch);
                var data: string = null;
                switch (state.currQueryMatch.lemma) {
                    case 'banka':
                        data = `<span class="headword">banka</span>, <i>bankovní, bank, bankéř, bankéřský</i>. Původ tohoto internacionalismu je v it. <i>banco, banca</i> 'lavice (penězoměnců)', což je staré přejetí z germ. *<i>bankiz</i> 'lavice' (něm. <i>Bank</i>, angl. <i>bench</i> tv.). Srov. <span class="arrow">↓</span><i>bankrot</i>, <span class="arrow">↓</span><i>bankovka</i>, <span class="arrow">↓</span><i>vabank</i>, <span class="arrow">↓</span><i>banket</i> i <span class="arrow">↓</span><i>panchart</i>.`;
                        break;
                }

                dispatch<typeof Actions.TileDataLoaded>({
                    name: Actions.TileDataLoaded.name,
                    payload: {
                        tileId: this.tileId,
                        isEmpty: !data,
                        data,
                    },
                });
            }
        );

        this.addActionSubtypeHandler(
            Actions.TileDataLoaded,
            (action) => action.payload.tileId === this.tileId,
            (state, action) => {
                state.isBusy = false;
                if (action.error) {
                    state.error = action.error.message;
                } else {
                    state.data = action.payload.data;
                }
            }
        );
    }

    private loadData(streaming: IDataStreaming, dispatch: SEDispatcher): void {
        streaming
            .registerTileRequest<LexResponse>({
                tileId: this.tileId,
                queryIdx: 0, // TODO
                otherTileId: this.readDataFromTile,
                otherTileQueryIdx: 0, // TODO
                contentType: 'application/json',
            })
            .subscribe();
    }
}
