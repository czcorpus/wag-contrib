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

import { Dict, List } from 'cnc-tskit';
import { IActionDispatcher, BoundWithProps, ViewUtils } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../page/theme';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile';
import { GlobalComponents } from '../../../views/common';
import { DataItem } from './common';
import { UjcDictionaryModel, UjcDictionaryModelState } from './model';
import * as S from './style';


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme, model:UjcDictionaryModel
):TileComponent {

    const globalComponents = ut.getComponents();

    // -------------------- <UjcDictionaryTileView /> -----------------------------------------------

    const UjcDictionaryTileView: React.FC<UjcDictionaryModelState & CoreTileComponentProps> = (props) => {

        const renderDataItem = (item: DataItem) => {
            return <>
                <dl className='info'>
                    <dt>{ut.translate('ujc_dict__key')}, {ut.translate('ujc_dict__pronunciation')}:</dt>
                    <dd>{item.key} {item.pronunciation}</dd>
                    <dt>{ut.translate('ujc_dict__meaning')}:</dt>
                    <dd>{List.map((v, i) =>
                        <S.MeaningItem>
                            {List.size(item.meaning) > 1 ? <div>{i+1}.</div> : null}
                            <S.Tooltip>
                                <div>{v.explanation}</div>
                                <div>{v.metaExplanation}</div>
                                <S.TooltipContent className='examples'>
                                    <div className='examples-heading'>{ut.translate('ujc_dict__examples')}:</div>
                                    <div>{List.map(e => <span className='example'>{e}<br/></span>, v.examples)}</div>
                                </S.TooltipContent>
                            </S.Tooltip>
                        </S.MeaningItem>
                    , item.meaning)}</dd>
                    {/*
                    <dt>{ut.translate('ujc_dict__pos')}:</dt>
                    <dd>{item.pos}</dd>
                    {item.quality ? <>
                        <dt>{ut.translate('ujc_dict__quality')}:</dt>
                        <dd>{item.quality}</dd>
                    </> : null}
                    {item.forms ? <>
                        <dt>{ut.translate('ujc_dict__forms')}:</dt>
                        <dd>{List.map(([k, v], i) => `${i > 0 ? '; ' : ''} ${k}: ${v}`, Dict.toEntries(item.forms))}</dd>
                    </> : null}
                    */}
                    {item.note ? <>
                        <dt>{ut.translate('ujc_dict__note')}:</dt>
                        <dd>{item.note}</dd>
                    </> : null}
                </dl>
                <hr/>
            </>
        }

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={props.data !== null}
                backlink={props.backlinks}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{corp: 'UJC'}}>
                <S.UjcDictionaryTileView>
                    <S.Overview>
                        {List.map(item => renderDataItem(item), props.data)}
                    </S.Overview>
                </S.UjcDictionaryTileView>
            </globalComponents.TileWrapper>
        );
    }

    return BoundWithProps(UjcDictionaryTileView, model);
}
