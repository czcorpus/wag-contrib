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
import { LexDictionariesModel, LexDictionariesModelState } from './model.js';
import * as S from './style.js';
import { GlobalComponents } from '../../../views/common/index.js';
import { PSJCDataStructure, SSJCDataStructure } from './api/basicApi.js';
import { isPSJCDataStructure, isSSJCDataStructure } from './api/types.js';


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme, model:LexDictionariesModel
):TileComponent {

    const globalComponents = ut.getComponents();

    // -------------------- <PSJCDataView /> -----------------------------------------------

    const PSJCDataView: React.FC<{data: PSJCDataStructure}> = (props) => {
        return <ul>
            {List.map((entry, i) => <S.PSJCEntry key={i} dangerouslySetInnerHTML={{__html: entry}}/>, props.data.entries)}
        </ul>;
    }

    // -------------------- <SSJCDataView /> -----------------------------------------------

    const SSJCDataView: React.FC<{data: SSJCDataStructure}> = (props) => {
        return <ul>
            {List.map((entry, i) => <S.SSJCEntry key={i} dangerouslySetInnerHTML={{__html: entry.payload}}/>, props.data.entries)}
        </ul>;
    }

    // -------------------- <LexDictionariesTileView /> -----------------------------------------------

    const LexDictionariesTileView: React.FC<LexDictionariesModelState & CoreTileComponentProps> = (props) => {

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={true}
                backlink={props.backlink}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{corp: 'UJC'}}>
                <S.LexDictionariesTileView>
                    {
                        List.map((serviceData, i) => (
                            <div key={i}>
                                {serviceData.data && isPSJCDataStructure(serviceData.type, serviceData.data) ?
                                    <>
                                        <h3>{ut.translate('lex_dictionaries__psjc_label')}</h3>
                                        <PSJCDataView data={serviceData.data}/>
                                    </> : null}
                                {serviceData.data && isSSJCDataStructure(serviceData.type, serviceData.data) ?
                                    <>
                                        <h3>{ut.translate('lex_dictionaries__ssjc_label')}</h3>
                                        <SSJCDataView data={serviceData.data}/>
                                    </>
                                    : null}
                            </div>
                        ), props.data)
                    }
                </S.LexDictionariesTileView>
            </globalComponents.TileWrapper>
        );
    }

    return BoundWithProps(LexDictionariesTileView, model);
}
