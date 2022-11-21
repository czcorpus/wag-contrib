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
import { Actions } from './actions';
import { CaseData, ComparisonData, ConjugationData } from './common';
import { UjcLGuideModel, UjcLGuideModelState } from './model';
import * as S from './style';


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme, model:UjcLGuideModel
):TileComponent {

    const globalComponents = ut.getComponents();

    // -------------------- <ComparisonTable /> -----------------------------------------------

    const ComparisonTable: React.FC<{
        positive: string;
        comparisonData: ComparisonData;
    }> = (props) => {

        return (
            <S.DataTable>
                <caption>{ut.translate('lguide__comparison')}</caption>
                <thead>
                    <tr>
                        <th>{ut.translate('lguide__comparison_positive')}</th>
                        <th>{ut.translate('lguide__comparison_comparative')}</th>
                        <th>{ut.translate('lguide__comparison_superlative')}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{props.positive}</td>
                        <td className='word'>{props.comparisonData.comparative}</td>
                        <td className='word'>{props.comparisonData.superlative}</td>
                    </tr>
                </tbody>
            </S.DataTable>
        );
    }

    // -------------------- <CaseTable /> -----------------------------------------------

    const CaseTable: React.FC<{
        caseData: CaseData;
    }> = (props) => {

        return (
            <S.DataTable>
                <caption>{ut.translate('lguide__case')}:</caption>
                <thead>
                    <tr>
                        <th></th>
                        <th>{ut.translate('lguide__number_singular')}</th>
                        <th>{ut.translate('lguide__number_plural')}</th>
                    </tr>
                </thead>
                <tbody>{pipe(
                    props.caseData,
                    Dict.toEntries(),
                    List.map((data, i) =>
                        <tr key={`${i}:${data[0]}`}>
                            <td>{ut.translate(`lguide__case_${data[0]}`)}</td>
                            <td className='word'>{data[1].singular}</td>
                            <td className='word'>{data[1].plural}</td>
                        </tr>
                    )
                )}</tbody>
            </S.DataTable>
        );
    }

    // -------------------- <ConjugationTable /> -----------------------------------------------

    const ConjugationTable: React.FC<{
        conjugationData: ConjugationData;
    }> = (props) => {

        return (
            <S.DataTable>
                <caption>{ut.translate('lguide__conjugation')}</caption>
                <thead>
                    <tr>
                        <th></th>
                        <th>{ut.translate('lguide__number_singular')}</th>
                        <th>{ut.translate('lguide__number_plural')}</th>
                    </tr>
                </thead>
                <tbody>
                    {pipe(
                        props.conjugationData.person,
                        Dict.toEntries(),
                        List.map(data =>
                            <tr>
                                <td>{ut.translate(`lguide__conjugation_person_${data[0]}`)}</td>
                                <td className='word'>{data[1].singular}</td>
                                <td className='word'>{data[1].plural}</td>
                            </tr>
                        )
                    )}
                    {!!props.conjugationData.imperative.singular || !!props.conjugationData.imperative.singular ?
                        <tr>
                            <td>{ut.translate('lguide__conjugation_imperative')}</td>
                            <td className='word'>{props.conjugationData.imperative.singular}</td>
                            <td className='word'>{props.conjugationData.imperative.plural}</td>
                        </tr> : null}
                    {!!props.conjugationData.participle.active ?
                        <tr>
                            <td>{ut.translate('lguide__conjugation_participle_active')}</td>
                            <td className='word' colSpan={2}>{props.conjugationData.participle.active}</td>
                        </tr> : null}
                    {!!props.conjugationData.participle.passive ?
                        <tr>
                            <td>{ut.translate('lguide__conjugation_participle_passive')}</td>
                            <td className='word' colSpan={2}>{props.conjugationData.participle.passive}</td>
                        </tr> : null}
                    {!!props.conjugationData.transgressive.past.m.singular || !!props.conjugationData.transgressive.past.m.plural ?
                        <tr>
                            <td>{ut.translate('lguide__conjugation_transgressive_past_m')}</td>
                            <td className='word'>{props.conjugationData.transgressive.past.m.singular}</td>
                            <td className='word'>{props.conjugationData.transgressive.past.m.plural}</td>
                        </tr> : null}
                    {!!props.conjugationData.transgressive.past.zs.singular || !!props.conjugationData.transgressive.past.zs.plural ?
                        <tr>
                            <td>{ut.translate('lguide__conjugation_transgressive_past_zs')}</td>
                            <td className='word'>{props.conjugationData.transgressive.past.zs.singular}</td>
                            <td className='word'>{props.conjugationData.transgressive.past.zs.plural}</td>
                        </tr> : null}
                    {!!props.conjugationData.transgressive.present.m.singular || !!props.conjugationData.transgressive.present.m.plural ?
                        <tr>
                            <td>{ut.translate('lguide__conjugation_transgressive_present_m')}</td>
                            <td className='word'>{props.conjugationData.transgressive.present.m.singular}</td>
                            <td className='word'>{props.conjugationData.transgressive.present.m.plural}</td>
                        </tr> : null}
                    {!!props.conjugationData.transgressive.present.zs.singular || !!props.conjugationData.transgressive.present.zs.plural ?
                        <tr>
                            <td>{ut.translate('lguide__conjugation_transgressive_present_zs')}</td>
                            <td className='word'>{props.conjugationData.transgressive.present.zs.singular}</td>
                            <td className='word'>{props.conjugationData.transgressive.present.zs.plural}</td>
                        </tr> : null}
                    {!!props.conjugationData.verbalNoun ?
                        <tr>
                            <td>{ut.translate('lguide__conjugation_verbal_noun')}</td>
                            <td className='word' colSpan={2}>{props.conjugationData.verbalNoun}</td>
                        </tr> : null}
                </tbody>
            </S.DataTable>
        );
    }

    // -------------------- <UjcLangRefBookTileView /> -----------------------------------------------

    const UjcLangRefBookTileView: React.FC<UjcLGuideModelState & CoreTileComponentProps> = (props) => {

        const handleAlternative = (id:string) => {
            dispatcher.dispatch<typeof Actions.RequestAlternative>({
                name: Actions.RequestAlternative.name,
                payload: {id: id},
            })
        }

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={props.data !== null && !!props.data.heading}
                backlink={props.backlinks}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{corp: 'UJC'}}>
                <S.UjcLangRefBookTileView>
                    <S.Overview>
                        <p className="langbook-heading">
                            <span className="langbook-key">{props.data.heading}</span>
                            <span className="langbook-pronunciation">{props.data.pronunciation}</span><br/>
                            <span className="langbook-meaning">{props.data.meaning}</span>
                        </p>
                        <dl className='info'>
                            <dt>{ut.translate('lguide__overview_syllabification')}:</dt>
                            <dd>{props.data.syllabification}</dd>
                            {props.data.gender ?
                                <>
                                    <dt>{ut.translate('lguide__overview_gender')}:</dt>
                                    <dd>{props.data.gender}</dd>
                                </> :
                                null
                            }
                            {props.data.examples ?
                                <>
                                    <dt>{ut.translate('lguide__overview_examples')}:</dt>
                                    {List.map((e, i) => <dd key={`dd:${i}:${e}`} className="example">{e}</dd>, props.data.examples)}
                                </> :null
                            }
                            {props.data.notes ?
                                <>
                                    <dt>{ut.translate('lguide__overview_notes')}:</dt>
                                    <dd>{props.data.notes}</dd>
                                </> :null
                            }
                            {props.data.alternatives ?
                                <>
                                    <dt>{ut.translate('lguide__overview_alternatives')}:</dt>
                                    {
                                        List.map(
                                            (alt, i) => (
                                                <dd key={`alt:${i}:${alt.id}`} className="alternative">
                                                    {props.data.rawQuery === alt.id && props.data.isDirect ? '\u2713' : ''}
                                                    <a onClick={e => handleAlternative(alt.id)}>{props.data.heading}{alt.info}</a>
                                                </dd>
                                            ),
                                            props.data.alternatives
                                        )
                                    }
                                </> :
                                null
                            }
                        </dl>
                    </S.Overview>

                    {!!props.data.comparison.comparative || !!props.data.comparison.superlative ?
                        <ComparisonTable positive={props.data.heading} comparisonData={props.data.comparison} /> : null}

                    {Dict.some(item => !!item.singular || !!item.plural , props.data.grammarCase) ?
                        <CaseTable caseData={props.data.grammarCase} /> : null}

                    {Dict.some(item => !!item.singular || !!item.plural , props.data.conjugation.person) ?
                        <ConjugationTable conjugationData={props.data.conjugation} /> : null}

                </S.UjcLangRefBookTileView>
            </globalComponents.TileWrapper>
        );
    }

    return BoundWithProps(UjcLangRefBookTileView, model);
}
