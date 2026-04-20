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
import { IActionDispatcher, BoundWithProps, ViewUtils, useModel } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../page/theme.js';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile.js';
import { DataItem } from './common.js';
import { UjcDictionaryModel, UjcDictionaryModelState } from './model.js';
import * as S from './style.js';
import { GlobalComponents } from '../../../views/common/index.js';


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme,
    model:UjcDictionaryModel
):TileComponent {

    const globalComponents = ut.getComponents();

    // -------------------- <UjcDictionaryTileView /> -----------------------------------------------

    const UjcDictionaryTileView: React.FC<CoreTileComponentProps> = (props) => {

        const state = useModel(model);

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
                                                    {List.map((v, i) => <span key={i} className='example'>{v}<br/></span>, e.data)}
                                                </div>, v.examples)
                                            }
                                        </S.TooltipContent>
                                    </S.Tooltip>
                                </td>
                            </S.MeaningRow>
                        , item.meaning.slice(0, state.maxItems))}
                        {item.meaning.length > state.maxItems ?
                            <S.MeaningRow key={"..."} className="hidden-items">
                                <td className='meaning-count'>...</td>
                                <td>{ut.translate(
                                    'ujc_dict__more_data_{num_hidden}',
                                    {num_hidden: item.meaning.length-state.maxItems}
                                )}</td>
                            </S.MeaningRow> :
                            null
                        }
                    </tbody>
                </S.MeaningTable>
            </S.Keyword>
        }

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={state.isBusy} error={state.error}
                hasData={state.data.items.length > 0}
                backlink={state.backlink}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{corp: 'UJC'}}>
                <S.UjcDictionaryTileView>
                    {List.map(item => renderDataItem(item), state.data.items.slice(0, state.maxItems))}
                    {state.data.items.length > state.maxItems ?
                        <S.Keyword className='hidden-items'>
                            <p className = 'dict-heading'>
                                <span className='dict-key'>...{ut.translate(
                                    'ujc_dict__more_data_{num_hidden}',
                                    {num_hidden: state.data.items.length-state.maxItems}
                                )}</span>
                            </p>
                        </S.Keyword> : null
                    }
                    {state.data.notes ?
                        List.map((note, i) =>
                            <S.Note key={i}>
                                <span className='dict-note-label'>{ut.translate('ujc_dict__note')}</span>
                                <span dangerouslySetInnerHTML={{__html: note}}/>
                            </S.Note>
                        , state.data.notes) :
                        null
                    }
                </S.UjcDictionaryTileView>
            </globalComponents.TileWrapper>
        );
    }

    return UjcDictionaryTileView;
}
