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

import { Dict, List, pipe } from 'cnc-tskit';
import { IActionDispatcher, BoundWithProps, ViewUtils } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../page/theme';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile';
import { GlobalComponents } from '../../../views/common';
import { CaseData } from './common';
import { UjcLGuideModel, UjcLGuideModelState } from './model';
import * as S from './style';


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme, model:UjcLGuideModel
):TileComponent {

    const globalComponents = ut.getComponents();

    // -------------------- <CaseTable /> -----------------------------------------------

    const CaseTable: React.FC<{
        caseData: CaseData;
    }> = (props) => {

        // TODO why is data mapping problematic?
        return (
            <div>
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>singular</th>
                            <th>plural</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>nominative</td>
                            <td>{props.caseData.nominative.singular}</td>
                            <td>{props.caseData.nominative.plural}</td>
                        </tr>
                        <tr>
                            <td>genitive</td>
                            <td>{props.caseData.genitive.singular}</td>
                            <td>{props.caseData.genitive.plural}</td>
                        </tr>
                        <tr>
                            <td>dative</td>
                            <td>{props.caseData.dative.singular}</td>
                            <td>{props.caseData.dative.plural}</td>
                        </tr>
                        <tr>
                            <td>accusative</td>
                            <td>{props.caseData.accusative.singular}</td>
                            <td>{props.caseData.accusative.plural}</td>
                        </tr>
                        <tr>
                            <td>vocative</td>
                            <td>{props.caseData.vocative.singular}</td>
                            <td>{props.caseData.vocative.plural}</td>
                        </tr>
                        <tr>
                            <td>locative</td>
                            <td>{props.caseData.locative.singular}</td>
                            <td>{props.caseData.locative.plural}</td>
                        </tr>
                        <tr>
                            <td>instrumental</td>
                            <td>{props.caseData.instrumental.singular}</td>
                            <td>{props.caseData.instrumental.plural}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    // -------------------- <UjcLanguageGuideTileView /> -----------------------------------------------

    const UjcLanguageGuideTileView: React.FC<UjcLGuideModelState & CoreTileComponentProps> = (props) => {

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={props.data !== null && !!props.data.heading}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{ corp: 'UJC', url: props.serviceInfoUrl }}>
                <S.UjcLanguageGuideTileView>
                    <S.Overview>
                        <h2>{props.data.heading}</h2>
                        <h3>{props.data.syllabification}</h3>
                    </S.Overview>
                    {Dict.some(item => !!item.singular || !!item.plural , props.data.grammarCase) ?
                        <CaseTable caseData={props.data.grammarCase} /> : null}
                    {JSON.stringify(props.data)}
                </S.UjcLanguageGuideTileView>
            </globalComponents.TileWrapper>
        );
    }

    return BoundWithProps(UjcLanguageGuideTileView, model);
}
