/*
 * Copyright 2026 Martin Zimandl <martin.zimandl@gmail.com>
 * Copyright 2026 Institute of the Czech National Corpus,
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

import { IActionDispatcher, ViewUtils, useModel } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../../page/theme.js';
import {
    CoreTileComponentProps,
    TileComponent,
} from '../../../../page/tile.js';
import { GlobalComponents } from '../../../../views/common/index.js';
import { Actions } from '../actions.js';
import { LexOverviewModel } from '../model.js';
import { init as initIjpViews } from './ijp/views.js';
import { init as initCorpusViews } from './corpus/views.js';
import * as S from './style.js';
import { List } from 'cnc-tskit';
import { initViewSubtile } from '../../lexCommon/views.js';
import { LexItem } from '../../lexCommon/dictionary.js';
import { SubtileRow } from '../../lexCommon/style.js';
import { Source } from '../../lexCommon/enums.js';

interface BasicOverviewData {
    pronunciation?: string;
}

export function init(
    dispatcher: IActionDispatcher,
    ut: ViewUtils<GlobalComponents>,
    theme: Theme,
    model: LexOverviewModel
): TileComponent {
    const globalComponents = ut.getComponents();
    const ijpViews = initIjpViews(dispatcher, ut);
    const corpusViews = initCorpusViews(dispatcher, ut);
    const Subtile = initViewSubtile(dispatcher, ut);

    const translateMorfology = (variant: LexItem) => {
        const parts = [ut.translate(`lex_common__pos_${variant.pos}`)];
        if (variant.gender) {
            parts.push(ut.translate(`lex_common__gender_${variant.gender}`));
        } else if (variant.aspect) {
            parts.push(ut.translate(`lex_common__aspect_${variant.aspect}`));
        }
        return parts.join(' ');
    };

    // -------------------- <LexOverviewHeader /> -----------------------------------------------

    const LexOverviewHeader: React.FC<{
        tileId: number;
        selectedVariantIdx: number;
        selectedVariant: LexItem;
        variants: Array<LexItem>;
    }> = (props) => {
        const handleVariantClick = (variantIdx: number) => {
            dispatcher.dispatch(Actions.SelectItemVariant, {
                tileId: props.tileId,
                variantIdx,
            });
        };

        const renderVariant = (
            variant: LexItem,
            withInfo: boolean,
            clickHandler?: () => void
        ) => {
            return (
                <>
                    {clickHandler ? (
                        <a onClick={clickHandler}>
                            {variant.lemma}{' '}
                            {withInfo && variant.pos ? (
                                <span className="small">
                                    ({translateMorfology(variant)})
                                </span>
                            ) : null}
                        </a>
                    ) : (
                        <span>
                            {variant.lemma}{' '}
                            {withInfo && variant.pos ? (
                                <span className="small">
                                    ({translateMorfology(variant)})
                                </span>
                            ) : null}
                        </span>
                    )}
                </>
            );
        };

        const hasSameLemmaVariant = (variantIdx: number, variant: LexItem) => {
            return (
                List.findIndex(
                    (v, i) => v.lemma === variant.lemma && i !== variantIdx,
                    props.variants
                ) !== -1
            );
        };

        return (
            <S.Header>
                <h2>
                    {renderVariant(
                        props.selectedVariant,
                        hasSameLemmaVariant(
                            props.selectedVariantIdx,
                            props.selectedVariant
                        )
                    )}
                </h2>

                {List.size(props.variants) > 1
                    ? List.map(
                          (variant, i) => (
                              <h4 key={i} className="variant">
                                  {renderVariant(
                                      variant,
                                      hasSameLemmaVariant(i, variant),
                                      () => handleVariantClick(i)
                                  )}
                              </h4>
                          ),
                          props.variants
                      )
                    : null}
            </S.Header>
        );
    };

    // -------------------- <LexOverviewBasics /> -----------------------------------------------

    const LexOverviewBasics: React.FC<{
        source: Source;
        selectedVariant: LexItem;
        basicOverview: BasicOverviewData;
    }> = (props) => {
        return (
            <Subtile source={props.source}>
                {props.basicOverview.pronunciation ? (
                    <SubtileRow>
                        <span className="key">
                            {ut.translate(
                                'lex_overview__overview_pronunciation'
                            )}
                            :
                        </span>
                        <span className="value">
                            {props.basicOverview.pronunciation}
                        </span>
                    </SubtileRow>
                ) : null}
                <SubtileRow>
                    <span className="key">
                        {ut.translate('lex_overview__overview_part_of_speech')}:
                    </span>
                    <span className="value">
                        {translateMorfology(props.selectedVariant)}
                    </span>
                </SubtileRow>
            </Subtile>
        );
    };

    // -------------------- <LexOverviewTileView /> -----------------------------------------------

    const LexOverviewTileView: React.FC<CoreTileComponentProps> = (props) => {
        const state = useModel(model);

        const basicOverview = {} as BasicOverviewData;
        const selectedVariant =
            state.selectedVariantIdx !== undefined
                ? state.variants[state.selectedVariantIdx]
                : ({
                      lemma: state.queryMatch.lemma,
                      pos: state.queryMatch.pos[0].value,
                      corpusEntry: {
                          count: state.queryMatch.abs,
                          ipm: state.queryMatch.ipm,
                      },
                  } as LexItem);

        switch (state.mainSource) {
            case Source.ASSC:
                if (state.data.assc) {
                    const asscVariant = List.find(
                        (v) => v.key.startsWith(selectedVariant.lemma),
                        state.data.assc.variants
                    );
                    basicOverview.pronunciation = asscVariant.pronunciation;
                }
                break;

            case Source.IJP:
                if (state.data.ijp) {
                    basicOverview.pronunciation = state.data.ijp.pronunciation;
                }
                break;
        }

        return (
            <globalComponents.TileWrapper
                tileId={props.tileId}
                isBusy={state.isBusy}
                error={state.error}
                hasData={true} // this tile will always have some data
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
            >
                <S.LexOverviewTileView>
                    <LexOverviewHeader
                        tileId={props.tileId}
                        selectedVariantIdx={state.selectedVariantIdx}
                        selectedVariant={selectedVariant}
                        variants={state.variants}
                    />
                    {state.mainSource !== undefined ? (
                        <LexOverviewBasics
                            source={state.mainSource}
                            selectedVariant={selectedVariant}
                            basicOverview={basicOverview}
                        />
                    ) : null}

                    {state.data.ijp ? (
                        <ijpViews.Subtile data={state.data.ijp} />
                    ) : null}

                    {selectedVariant.corpusEntry ? (
                        <corpusViews.Subtile
                            corpname={state.referenceCorpus}
                            data={{
                                abs: selectedVariant.corpusEntry.count,
                                ipm: selectedVariant.corpusEntry.ipm,
                            }}
                        />
                    ) : (
                        <corpusViews.Subtile corpname={state.referenceCorpus} />
                    )}
                </S.LexOverviewTileView>
            </globalComponents.TileWrapper>
        );
    };

    return LexOverviewTileView;
}
