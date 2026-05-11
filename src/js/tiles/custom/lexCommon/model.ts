/*
 * Copyright 2026 Martin Zimandl <martin.zimandl@gmail.com>
 * Copyright 2026 Institute of the Czech National Corpus,
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
import { IAppServices } from '../../../appServices.js';
import { RecognizedQueries } from '../../../query/index.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import { Actions } from './actions.js';

export interface LexCommonModelState {}

export interface LexCommonModelArgs {
    dispatcher: IActionQueue;
    initState: LexCommonModelState;
    tileId: number;
    appServices: IAppServices;
    queryMatches: RecognizedQueries;
    dependentTiles: Array<number>;
}

export class LexCommonModel extends StatelessModel<LexCommonModelState> {
    private readonly tileId: number;

    private readonly appServices: IAppServices;

    constructor({
        dispatcher,
        initState,
        tileId,
        appServices,
        queryMatches,
        dependentTiles,
    }: LexCommonModelArgs) {
        super(dispatcher, initState);
        this.tileId = tileId;
        this.appServices = appServices;

        this.addActionHandler(
            GlobalActions.RequestQueryResponse,
            (state, action) => {},
            (state, action, dispatch) => {}
        );

        this.addActionSubtypeHandler(
            Actions.TilePartialDataLoaded,
            (action) => action.payload.tileId === this.tileId,
            (state, action) => {}
        );

        this.addActionSubtypeHandler(
            Actions.TileDataLoaded,
            (action) => action.payload.tileId === this.tileId,
            (state, action) => {}
        );
    }
}
