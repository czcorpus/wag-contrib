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

import { List, pipe } from 'cnc-tskit';
import { IActionDispatcher, ViewUtils, useModel } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../page/theme.js';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile.js';
import { LexMeaningModel } from './model.js';
import * as S from './style.js';
import { GlobalComponents } from '../../../views/common/index.js';
import { HTMLBlock } from '../lexCommon/types/assc.js';
import { SubtileRow } from '../lexCommon/style.js';
import { Source } from '../lexCommon/types/enums.js';
import { initLexComponents } from '../lexCommon/views.js';

export function init(
    dispatcher: IActionDispatcher,
    ut: ViewUtils<GlobalComponents>,
    theme: Theme,
    model: LexMeaningModel
): TileComponent {
    const globalComponents = ut.getComponents();
    const lexComponents = initLexComponents(dispatcher, ut);

    // -------------------- <Header /> -----------------------------------------------

    const Header: React.FC<{ i: number; line: string }> = (props) => {
        const [collapsed, setCollapsed] = React.useState(true);

        const onClick = (ev: React.MouseEvent<HTMLDivElement>) => {
            const target = ev.target;
            if (
                target instanceof HTMLElement &&
                (target.closest('.vyslovnost') ||
                    target.closest('.tvCh') ||
                    target.closest('.expand'))
            ) {
                setCollapsed((prev) => !prev);
            }
        };

        return (
            <S.ASSCStyle
                key={props.i}
                className={'header-line' + (collapsed ? ' collapsed' : '')}
                onClick={onClick}
                dangerouslySetInnerHTML={{ __html: props.line }}
            />
        );
    };

    // -------------------- <LexMeaningTileView /> -----------------------------------------------

    const LexMeaningTileView: React.FC<CoreTileComponentProps> = (props) => {
        const state = useModel(model);

        const renderDataItem = (
            key: string,
            data: HTMLBlock,
            isParent: boolean
        ) => {
            return (
                <S.MeaningItem key={key} className={isParent ? 'parent' : ''}>
                    <S.MeaningHead>
                        {List.map(
                            (line, i) => (
                                <Header i={i} line={line} />
                            ),
                            data.formattedVariants
                        )}
                    </S.MeaningHead>
                    <S.MeaningBody>
                        {List.map(
                            (block, i) => (
                                <S.ASSCStyle
                                    key={i}
                                    className={
                                        block.includes('□')
                                            ? 'style_souslovi'
                                            : ''
                                    }
                                    dangerouslySetInnerHTML={{ __html: block }}
                                />
                            ),
                            data.meanings
                        )}
                    </S.MeaningBody>
                </S.MeaningItem>
            );
        };

        return (
            <globalComponents.TileWrapper
                tileId={props.tileId}
                isBusy={state.isBusy}
                error={state.error}
                hasData={!List.empty(state.data)}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
            >
                <S.MeaningTileView>
                    <lexComponents.Subtile
                        tileId={props.tileId}
                        source={Source.ASSC}
                        className="stretch"
                    >
                        <SubtileRow className="scroller">
                            {List.flatMap(
                                (d, i) =>
                                    List.map((block, j) => {
                                        const isParent = j > 0;
                                        return (
                                            <>
                                                {i > 0 && j === 0 ? (
                                                    <hr />
                                                ) : null}
                                                {renderDataItem(
                                                    `item-${i}-${j}`,
                                                    block,
                                                    isParent
                                                )}
                                            </>
                                        );
                                    }, d.blocks),
                                state.data
                            )}
                        </SubtileRow>
                    </lexComponents.Subtile>
                </S.MeaningTileView>
            </globalComponents.TileWrapper>
        );
    };

    return LexMeaningTileView;
}
