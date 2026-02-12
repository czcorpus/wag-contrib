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
import { SearchVariant } from '../common.js';


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
        selectedItemIdx: number;
        selectedVariantIdx: number;
        items: Array<Array<SearchVariant>>;
        backupTitle: string;
    }> = (props) => {
        const handleVariantClick = (itemIdx: number, variantIdx: number) => {
            dispatcher.dispatch(
                Actions.SelectItemVariant,
                {tileId: props.tileId, itemIdx, variantIdx},
            );
        }

        const renderVariant = (variant: SearchVariant) => <>
            {variant.value || variant.id} {variant.info ? <span className='small'>({variant.info})</span> : null}
        </>

        return (
            <S.Header>
                {props.selectedItemIdx !== -1 ?
                    <h2>{renderVariant(props.items[props.selectedItemIdx][props.selectedVariantIdx])}</h2> :
                    <h2>{props.backupTitle}</h2>
                }
                
                {List.map((item, i) => i === props.selectedItemIdx && item.length === 1 ? null :
                    <h4 className="variant">
                        {List.map((variant, j) =>
                            <>
                                {j > 0 ? ' / ' : null}
                                <a onClick={() => handleVariantClick(i, j)}>{renderVariant(variant)}</a>
                            </>
                        , item)}
                        
                    </h4>,
                    props.items,
                )}
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
        }|undefined;
        const selectedVariant = props.selectedSrchItemIdx !== -1 ? props.data.search.items[props.selectedSrchItemIdx][props.selectedSrchVariantIdx] : null;
        if (selectedVariant !== null ) {
            switch (props.data.search.source) {
                case 'assc':
                    const data = props.data.asscData.items[selectedVariant.itemIdx].variants[selectedVariant.variantIdx];
                    overview = selectedVariant.itemIdx !== -1 ?
                        {
                            pronunciation: data?.pronunciation,
                            partOfSpeach: data?.pos,
                            source: 'Akademický slovník češtiny',
                        } :
                        undefined;
                    break;
                case 'lguide':
                    overview = {
                        pronunciation: props.data.lguideData.pronunciation,
                        source: 'Internetová jazyková příručka',
                        partOfSpeach: '',
                    };
                    break;
                default:
                    overview = undefined;
            }
        }
             
        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={true}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
            >
                <S.LexOverviewTileView>
                    <LexOverviewHeader
                        tileId={props.tileId}
                        selectedItemIdx={props.selectedSrchItemIdx}
                        selectedVariantIdx={props.selectedSrchVariantIdx}
                        items={props.data.search.items}
                        backupTitle={props.queryMatch.lemma}
                    />
                    {overview ?
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
