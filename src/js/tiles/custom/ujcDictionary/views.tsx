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
import { Theme } from '../../../page/theme';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile';
import { GlobalComponents } from '../../../views/common';
import { DataItem, DataStructure } from './common';
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
            return <S.Keyword key={item.key}>
                <p className = 'dict-heading'>
                    <span className='dict-key'>{item.key}</span>
                    <span className='dict-pronunciation'>{item.pronunciation}</span>
                </p>
                <S.MeaningTable>
                    <tbody>
                        {List.map((v, i) =>
                            <S.MeaningRow key={i}>
                                <td className='meaning-count'>
                                    {List.size(item.meaning) > 1 ? <div>{i+1}.</div> : null}
                                </td>
                                <td>
                                    <S.Tooltip>
                                        <S.Tooltiped>
                                            {v.explanation ? <div>{v.explanation}</div> : null}
                                            {v.metaExplanation ? <div><i>{v.metaExplanation}</i></div> : null}
                                        </S.Tooltiped>
                                        <S.TooltipContent className='examples'>
                                            <div className='examples-heading'>{ut.translate('ujc_dict__examples')}:</div>
                                            {List.map((e, i) =>
                                                <div key={i} className='example-block'>
                                                    {e.usage ? <span className='example-usage'>&#8226; {e.usage}:<br/></span> : null }
                                                    {List.map(v => <span className='example'>{v}<br/></span>, e.data)}
                                                </div>, v.examples)
                                            }
                                        </S.TooltipContent>
                                    </S.Tooltip>
                                </td>
                            </S.MeaningRow>
                        , item.meaning.slice(0, props.maxItems))}
                        {item.meaning.length > props.maxItems ?
                            <S.MeaningRow key={"..."} className="hidden-items">
                                <td className='meaning-count'>...</td>
                                <td>{ut.translate(
                                    'ujc_dict__more_data_{num_hidden}',
                                    {num_hidden: item.meaning.length-props.maxItems}
                                )}</td>
                            </S.MeaningRow> :
                            null
                        }
                    </tbody>
                </S.MeaningTable>
            </S.Keyword>
        }

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={props.data.items.length > 0}
                backlink={props.backlinks}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{corp: 'UJC'}}>
                <S.UjcDictionaryTileView>
                    {List.map(item => renderDataItem(item), props.data.items.slice(0, props.maxItems))}
                    {props.data.items.length > props.maxItems ?
                        <S.Keyword className='hidden-items'>
                            <p className = 'dict-heading'>
                                <span className='dict-key'>...{ut.translate(
                                    'ujc_dict__more_data_{num_hidden}',
                                    {num_hidden: props.data.items.length-props.maxItems}
                                )}</span>
                            </p>
                        </S.Keyword> : null
                    }
                    {props.data.notes ?
                        List.map((note, i) =>
                            <S.Note key={i}>
                                <span className='dict-note-label'>{ut.translate('ujc_dict__note')}</span>
                                <span dangerouslySetInnerHTML={{__html: note}}/>
                            </S.Note>
                        , props.data.notes) :
                        null
                    }
                </S.UjcDictionaryTileView>
            </globalComponents.TileWrapper>
        );
    }

    return BoundWithProps(UjcDictionaryTileView, model);
}
