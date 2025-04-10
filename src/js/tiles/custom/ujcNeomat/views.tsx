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

import { List } from 'cnc-tskit';
import { IActionDispatcher, BoundWithProps, ViewUtils } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../page/theme.js';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile.js';
import { UjcNeomatModel, UjcNeomatModelState } from './model.js';
import * as S from './style.js';
import { GlobalComponents } from '../../../views/common/index.js';


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme, model:UjcNeomatModel
):TileComponent {

    const globalComponents = ut.getComponents();

    // -------------------- <UjcNeomatTileView /> -----------------------------------------------

    const UjcNeomatTileView: React.FC<UjcNeomatModelState & CoreTileComponentProps> = (props) => {

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={props.data.entries.length > 0}
                backlink={props.backlink}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{corp: 'UJC'}}>
                <S.UjcNeomatTileView>
                    {List.map((entry, i) => <S.Entry key={i} dangerouslySetInnerHTML={{__html: entry}} />, props.data.entries)}
                </S.UjcNeomatTileView>
            </globalComponents.TileWrapper>
        );
    }

    return BoundWithProps(UjcNeomatTileView, model);
}
