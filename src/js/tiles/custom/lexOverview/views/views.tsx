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

import { IActionDispatcher, BoundWithProps, ViewUtils } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../../page/theme.js';
import { CoreTileComponentProps, TileComponent } from '../../../../page/tile.js';
import { GlobalComponents } from '../../../../views/common/index.js';
import { Actions } from '../actions.js';
import { LexOverviewModel, LexOverviewModelState } from '../model.js';
import { init as initLangGuideViews } from './langGuide/views.js';
import { init as initCorpusViews } from './corpus/views.js';
import * as S from './style.js';
import { List } from 'cnc-tskit';
import { Variant } from '../common.js';


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme,
    model:LexOverviewModel,
):TileComponent {

    const globalComponents = ut.getComponents();
    const langGuideViews = initLangGuideViews(dispatcher, ut);
    const corpusViews = initCorpusViews(dispatcher, ut);

    // -------------------- <LexOverviewHeader /> -----------------------------------------------

    const LexOverviewHeader: React.FC<{
        tileId: number;
        title: string;
        selectedVariantIdx: number;
        variants: Array<Variant>;
    }> = (props) => {
        const handleVariantClick = (idx: number) => {
            dispatcher.dispatch(
                Actions.SelectVariant,
                {tileId: props.tileId, idx},
            );
        }

        return (
            <S.Header>
                <h2>{props.title}</h2>
                {List.map((variant, i) => i === props.selectedVariantIdx ? null :
                    <h4 className="variant"><a onClick={() => handleVariantClick(i)}>{variant.value}</a></h4>, props.variants)
                }
            </S.Header>
        );
    }

    // -------------------- <LexOverviewBasics /> -----------------------------------------------

    const LexOverviewBasics: React.FC<{
        pronunciation: string;
        partOfSpeach: string;
        source: string;

    }> = (props) => {
        return (
            <S.Subtile color='#d4e2f4'>
                <S.SubtileRow>
                    <span className='key'>výslovnost:</span><span className='value'>{props.pronunciation}</span>
                </S.SubtileRow>
                <S.SubtileRow>
                    <span className='key'>slovní druh:</span><span className='value'>{props.partOfSpeach}</span>
                </S.SubtileRow>
                <S.SubtileRow className='footer'>
                    <span className='key'>Zdroj:</span><span className='value'>{props.source}</span>
                </S.SubtileRow>
            </S.Subtile>
        );
    }

    // -------------------- <LexOverviewTileView /> -----------------------------------------------

    const LexOverviewTileView: React.FC<LexOverviewModelState & CoreTileComponentProps> = (props) => {

        let overview: {
            pronunciation: string;
            partOfSpeach: string;
            source: string;
        } = null;
        const selectedVariant = props.selectedVariantIdx !== null ? props.data.variants.items[props.selectedVariantIdx] : null;
        if (selectedVariant !== null ) {
            switch (props.data.variants.source) {
                case 'assc':
                    overview = selectedVariant.itemIdx >= 0 ?
                        {
                            pronunciation: props.data.asscData.items[selectedVariant.itemIdx]?.pronunciation,
                            partOfSpeach: props.data.asscData.items[selectedVariant.itemIdx]?.pos,
                            source: 'Akademický slovník češtiny',
                        } :
                        null;
                    break;
                case 'lguide':
                    overview = {
                        pronunciation: props.data.lguideData.pronunciation,
                        source: 'Internetová jazyková příručka',
                        partOfSpeach: null,
                    };
                    break;
                default:
                    overview = null;
            }
        }
        
        const overviewHasData =
            overview !== null &&
            (!!overview.pronunciation ||
             !!overview.partOfSpeach);

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={true}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
            >
                <S.LexOverviewTileView>
                    <LexOverviewHeader
                        tileId={props.tileId}
                        title={selectedVariant?.value || props.queryMatch.lemma}
                        selectedVariantIdx={props.selectedVariantIdx}
                        variants={props.data.variants.items}
                    />
                    {overviewHasData ?
                        <LexOverviewBasics
                            pronunciation={overview.pronunciation}
                            partOfSpeach={overview.partOfSpeach}
                            source={overview.source}
                        /> :
                        null
                    }
                    
                    {props.data.lguideData ?
                        <langGuideViews.Subtile data={props.data.lguideData} /> :
                        null
                    }
                    <corpusViews.Subtile data={props.queryMatch} />
                </S.LexOverviewTileView>
            </globalComponents.TileWrapper>
        );
    }

    return BoundWithProps(LexOverviewTileView, model);
}
