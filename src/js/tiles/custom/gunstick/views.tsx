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

import { IActionDispatcher, BoundWithProps, ViewUtils } from 'kombo';
import * as React from 'react';
import { Dict, List, pipe } from 'cnc-tskit';
import { Theme } from '../../../page/theme';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile';
import { GlobalComponents } from '../../../views/global';
import { GunstickModel, GunstickModelState } from './model';


export function init(dispatcher:IActionDispatcher, ut:ViewUtils<GlobalComponents>, theme:Theme, model:GunstickModel):TileComponent {

    const globalComponents = ut.getComponents();


    // -------------------- <GunstickTileView /> -----------------------------------------------

    const GunstickTileView:React.FC<GunstickModelState & CoreTileComponentProps> = (props) => (
        <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={props.data.count > 0}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}>
            <div className="GunstickTileView">
                <dl>
                    <dt>nalezeno</dt>
                    <dt>{props.data.count}</dt>
                    <dt>počty dokladů v jednotlivých letech</dt>
                    <dd>
                        {pipe(
                            props.data.countRY,
                            Dict.toEntries(),
                            List.map(([rhyme, counts]) => <span>{rhyme}: {Dict.toEntries(counts).join(', ')}</span>)
                        )}
                    </dd>
                </dl>
            </div>
        </globalComponents.TileWrapper>
    );

    return BoundWithProps(GunstickTileView, model);
}
