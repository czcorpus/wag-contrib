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

import { Dict, List, pipe } from 'cnc-tskit';
import { IActionDispatcher, ViewUtils, useModel } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../page/theme.js';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile.js';
import { LexMeaningModel } from './model.js';
import * as S from './style.js';
import { GlobalComponents } from '../../../views/common/index.js';
import { SubtileRow } from '../lexCommon/style.js';
import { Source } from '../lexCommon/types/enums.js';
import { initLexComponents } from '../lexCommon/views.js';
import { getErrorMessage, LexResponse } from '../lexCommon/api.js';
import { SystemMessageType } from '../../../types.js';
import { useIsomorphicLayoutEffect } from '../../../page/hooks.js';

export function init(
    dispatcher: IActionDispatcher,
    ut: ViewUtils<GlobalComponents>,
    theme: Theme,
    model: LexMeaningModel
): TileComponent {
    const globalComponents = ut.getComponents();
    const lexComponents = initLexComponents(dispatcher, ut);

    /**
     * If the content overflows the tile by at most this fraction
     * of the tile height, the tile is stretched instead of scrolling.
     */
    const MAX_STRETCH_RATIO = 0.15;

    type SubtileProps = {
        tileId: number;
        onOverflowChange: (overflowPx: number) => void;
    };

    // -------------------- <ASSCHeader /> -----------------------------------------------

    const ASSCHeader: React.FC<{ line: string }> = (props) => {
        const [collapsed, setCollapsed] = React.useState(true);
        const ref = React.useRef<HTMLDivElement>(null);
        // stable object identity - otherwise React resets innerHTML on every
        // re-render (e.g. collapse toggle) and drops the inserted [+]
        const html = React.useMemo(
            () => ({ __html: props.line }),
            [props.line]
        );

        // insert [+] toggle right after the top-level element holding mainVarSign,
        // but only if there is some collapsible content (see MeaningHead style);
        // runs after every render, the guard below keeps it idempotent
        React.useLayoutEffect(() => {
            const container = ref.current;
            if (
                !container ||
                container.querySelector(':scope > .expand') ||
                !container.querySelector(
                    '.vyslovnost, .druhyRadek .tvCh, .druhyRadek .tvChSl, .puvod'
                )
            ) {
                return;
            }
            let anchor = container.querySelector('.mainVarSign');
            while (anchor && anchor.parentElement !== container) {
                anchor = anchor.parentElement;
            }
            if (anchor) {
                const expand = document.createElement('span');
                expand.className = 'expand';
                expand.textContent = '[+]';
                anchor.after(expand);
            }
        });

        const onClick = (ev: React.MouseEvent<HTMLDivElement>) => {
            const target = ev.target;
            if (
                target instanceof HTMLElement &&
                (target.closest('.vyslovnost') ||
                    target.closest('.puvod') ||
                    target.closest('.tvCh') ||
                    target.closest('.tvChSl') ||
                    target.closest('.expand'))
            ) {
                setCollapsed((prev) => !prev);
            }
        };

        return (
            <S.ASSCStyle
                ref={ref}
                className={'header-line' + (collapsed ? ' collapsed' : '')}
                onClick={onClick}
                dangerouslySetInnerHTML={html}
            />
        );
    };

    // -------------------- <ASSCLexSubtile /> -----------------------------------

    const ASSCLexSubtile: React.FC<SubtileProps> = (props) => {
        const state = useModel(model);

        return (
            <lexComponents.Subtile
                tileId={props.tileId}
                source={Source.ASSC}
                className="data-box"
            >
                <globalComponents.Scroller
                    resetKey={state.data.assc}
                    onOverflowChange={props.onOverflowChange}
                >
                    {List.flatMap(
                        (blocks, i) =>
                            List.map(
                                (block, j) => (
                                    <React.Fragment
                                        key={`assc-block-${i}-${j}`}
                                    >
                                        {i > 0 && j === 0 ? (
                                            <hr
                                                key={`assc-divider-${i}-${j}`}
                                                className="itemDivider"
                                            />
                                        ) : null}
                                        {j > 0 ? (
                                            <span className="ke-slovu">
                                                ke slovu
                                            </span>
                                        ) : null}
                                        <S.MeaningItem
                                            key={`assc-item-${i}-${j}`}
                                            className={j > 0 ? 'parent' : ''}
                                        >
                                            <S.MeaningHead>
                                                {List.map(
                                                    (line, i) => (
                                                        <ASSCHeader
                                                            key={i}
                                                            line={line}
                                                        />
                                                    ),
                                                    block.formattedVariants ||
                                                        []
                                                )}
                                            </S.MeaningHead>
                                            <S.MeaningBody>
                                                {List.map(
                                                    (item, i) => (
                                                        <S.ASSCStyle
                                                            key={`block${i}`}
                                                            className={
                                                                'meaning-block' +
                                                                (item.includes(
                                                                    '□'
                                                                )
                                                                    ? ' style_souslovi'
                                                                    : '')
                                                            }
                                                            dangerouslySetInnerHTML={{
                                                                __html: item,
                                                            }}
                                                        />
                                                    ),
                                                    block.meanings || []
                                                )}
                                                {List.map(
                                                    (nest, i) => (
                                                        <S.ASSCStyle
                                                            key={`nest${i}`}
                                                            className="nest-line"
                                                            dangerouslySetInnerHTML={{
                                                                __html: nest,
                                                            }}
                                                        />
                                                    ),
                                                    block.nestedVariants || []
                                                )}
                                                {List.map(
                                                    (links, i) => (
                                                        <S.ASSCStyle
                                                            key={`links${i}`}
                                                            className="links"
                                                            dangerouslySetInnerHTML={{
                                                                __html: links,
                                                            }}
                                                        />
                                                    ),
                                                    block.links || []
                                                )}
                                            </S.MeaningBody>
                                        </S.MeaningItem>
                                    </React.Fragment>
                                ),
                                blocks.data || []
                            ),
                        state.data.assc
                    )}
                </globalComponents.Scroller>
            </lexComponents.Subtile>
        );
    };

    // -------------------- <IJPLexSubtile /> -----------------------------------

    const IJPLexSubtile: React.FC<SubtileProps> = (props) => {
        const state = useModel(model);

        return (
            <lexComponents.Subtile
                tileId={props.tileId}
                source={Source.IJP}
                className="data-box"
            >
                <globalComponents.Scroller
                    resetKey={state.data.ijp}
                    onOverflowChange={props.onOverflowChange}
                >
                    {List.map(
                        (item, i) => (
                            <React.Fragment key={`ijp-${i}`}>
                                {i > 0 ? (
                                    <hr
                                        key={`ijp-divider-${i}`}
                                        className="itemDivider"
                                    />
                                ) : null}
                                {
                                    <S.MeaningItem key={`ijp-item-${i}`}>
                                        <S.MeaningHead>
                                            <S.ASSCStyle
                                                className={'header-line'}
                                            >
                                                <span className="lineNoSpace">
                                                    <span className="heslo">
                                                        <span className="mainVar">
                                                            {item.data.heading}
                                                            &nbsp;
                                                        </span>
                                                    </span>
                                                </span>
                                                <span className="sl_druh">
                                                    {item.data.gender}
                                                </span>
                                            </S.ASSCStyle>
                                        </S.MeaningHead>
                                        <S.MeaningBody>
                                            <S.ASSCStyle className="meaning-block">
                                                {!List.empty(
                                                    item.data.examples
                                                ) ? (
                                                    <>
                                                        <span className="key">
                                                            {ut.translate(
                                                                'lex_meaning__examples'
                                                            )}
                                                            :
                                                        </span>
                                                        <span className="exeplifikace">
                                                            {List.map(
                                                                (
                                                                    example,
                                                                    exampleIndex
                                                                ) => (
                                                                    <React.Fragment
                                                                        key={`ijp-example-${exampleIndex}`}
                                                                    >
                                                                        <br />
                                                                        <span
                                                                            style={{
                                                                                fontStyle:
                                                                                    'italic',
                                                                            }}
                                                                        >
                                                                            <span className="normalni">
                                                                                {
                                                                                    example
                                                                                }
                                                                            </span>
                                                                        </span>
                                                                    </React.Fragment>
                                                                ),
                                                                item.data
                                                                    .examples
                                                            )}
                                                        </span>
                                                    </>
                                                ) : null}
                                            </S.ASSCStyle>
                                        </S.MeaningBody>
                                    </S.MeaningItem>
                                }
                            </React.Fragment>
                        ),
                        state.data.ijp
                    )}
                </globalComponents.Scroller>
            </lexComponents.Subtile>
        );
    };

    // -------------------- <SSCLexSubtile /> -----------------------------------

    const SSCLexSubtile: React.FC<SubtileProps> = (props) => {
        const state = useModel(model);

        return (
            <lexComponents.Subtile
                tileId={props.tileId}
                source={Source.SSC}
                className="data-box"
            >
                <globalComponents.Scroller
                    resetKey={state.data.ssc}
                    onOverflowChange={props.onOverflowChange}
                >
                    {List.map(
                        (item, i) => (
                            <React.Fragment key={`ssc-${i}`}>
                                {i > 0 ? (
                                    <hr
                                        key={`ssc-hr-${i}`}
                                        className="itemDivider"
                                    />
                                ) : null}
                                <S.MeaningItem key={`ssc-item-${i}`}>
                                    <S.SSCStyle
                                        dangerouslySetInnerHTML={{
                                            __html: item.data.html_content,
                                        }}
                                    />
                                </S.MeaningItem>
                            </React.Fragment>
                        ),
                        state.data.ssc
                    )}
                </globalComponents.Scroller>
            </lexComponents.Subtile>
        );
    };

    // -------------------- <UsageNotesSubileView /> -----------------------------------

    const UsageNotesSubtileView: React.FC<{ tileId: number }> = (props) => {
        const state = useModel(model);

        const ijpNotes = pipe(
            state.data.ijp,
            List.filter((v) => !List.empty(v.data.notes)),
            List.flatMap((v) => v.data.notes)
        );

        const asscNotes = pipe(
            state.data.assc,
            List.flatMap((v) => v.data),
            List.flatMap((v) => v.notes)
        );

        return !List.empty(asscNotes) || !List.empty(ijpNotes) ? (
            <globalComponents.Subtile
                tileId={props.tileId}
                heading={ut.translate('lex_meaning__usage_notes')}
                isBusy={state.isBusy}
                hasData={true}
            >
                <S.UsageNotesTileView>
                    {!List.empty(ijpNotes) ? (
                        <lexComponents.Subtile
                            tileId={props.tileId}
                            source={
                                List.some(
                                    (data) => data.includes('</a>'),
                                    ijpNotes
                                )
                                    ? [Source.IJP, Source.DJD]
                                    : Source.IJP
                            }
                        >
                            {List.map(
                                (note, i) => (
                                    <SubtileRow
                                        key={`ijp-note-${i}`}
                                        dangerouslySetInnerHTML={{
                                            __html: note,
                                        }}
                                    />
                                ),
                                ijpNotes
                            )}
                        </lexComponents.Subtile>
                    ) : null}

                    {!List.empty(asscNotes) ? (
                        <lexComponents.Subtile
                            tileId={props.tileId}
                            source={Source.ASSC}
                        >
                            {List.map(
                                (note, i) => (
                                    <SubtileRow
                                        key={`assc-note-${i}`}
                                        dangerouslySetInnerHTML={{
                                            __html: note,
                                        }}
                                    />
                                ),
                                asscNotes
                            )}
                        </lexComponents.Subtile>
                    ) : null}
                </S.UsageNotesTileView>
            </globalComponents.Subtile>
        ) : null;
    };

    // -------------------- <LexMeaningTileView /> -----------------------------------------------

    const LexMeaningTileView: React.FC<CoreTileComponentProps> = (props) => {
        const state = useModel(model);

        // -------- stretching the tile slightly instead of scrolling --------
        const tileViewRef = React.useRef<HTMLDivElement>(null);
        // tile height without stretching (measured when not stretched)
        const naturalHeightRef = React.useRef(0);
        const [stretch, setStretch] = React.useState(0);
        const stretchRef = React.useRef(0);

        // the last reported overflow - on the first render, the Scroller
        // reports it (from its layout effect) before tileViewRef is attached,
        // so it is evaluated again in the layout effect below
        const lastOverflowRef = React.useRef<number | null>(null);

        const handleOverflowChange = React.useCallback((overflow: number) => {
            lastOverflowRef.current = overflow;
            const tileView = tileViewRef.current;
            if (!tileView) {
                return;
            }
            if (stretchRef.current === 0) {
                naturalHeightRef.current = tileView.offsetHeight;
            }
            // overflow as it would be without any stretching
            const baseOverflow = overflow + stretchRef.current;
            const newStretch =
                baseOverflow > 0 &&
                baseOverflow <= naturalHeightRef.current * MAX_STRETCH_RATIO
                    ? baseOverflow
                    : 0;
            if (newStretch !== stretchRef.current) {
                stretchRef.current = newStretch;
                setStretch(newStretch);
            }
        }, []);

        useIsomorphicLayoutEffect(() => {
            if (lastOverflowRef.current !== null) {
                handleOverflowChange(lastOverflowRef.current);
            }
        }, [handleOverflowChange]);

        const tileViewStyle: React.CSSProperties & Record<string, string> =
            stretch > 0
                ? {
                      minHeight: `${naturalHeightRef.current + stretch}px`,
                      '--lex-meaning-stretch': `${stretch}px`,
                  }
                : {};

        const renderErrors = () => {
            return pipe(
                state.sourcePriority,
                // display only IJP, ASSC errors (notes)
                // or errors of sources with higer priority than used source
                List.filter(
                    (source, i) =>
                        source === Source.IJP ||
                        source === Source.ASSC ||
                        i <
                            List.findIndex(
                                (v) => v === state.usedSource,
                                state.sourcePriority
                            )
                ),
                List.flatMap(
                    (source) =>
                        (state.sourceErrors[source] || []) as Array<
                            LexResponse<string>
                        >
                ),
                List.map((errResp, index) => (
                    <lexComponents.MessageSubtile
                        key={`error-${index}`}
                        systemMessageType={SystemMessageType.ERROR}
                        className="error-box"
                    >
                        {List.map(
                            (msg, msgIndex) => (
                                <React.Fragment
                                    key={`error-${index}-msg-${msgIndex}`}
                                >
                                    {ut.translate(msg)}
                                </React.Fragment>
                            ),
                            getErrorMessage(errResp)
                        )}
                    </lexComponents.MessageSubtile>
                ))
            );
        };

        const hasValidData = !List.empty(state.data[state.usedSource]);
        const hasErrors = Dict.some((v) => !List.empty(v), state.sourceErrors);
        const renderData = (usedSource: string) => {
            if (hasValidData) {
                switch (usedSource) {
                    case Source.ASSC:
                        return (
                            <ASSCLexSubtile
                                tileId={props.tileId}
                                onOverflowChange={handleOverflowChange}
                            />
                        );
                    case Source.IJP:
                        return (
                            <IJPLexSubtile
                                tileId={props.tileId}
                                onOverflowChange={handleOverflowChange}
                            />
                        );
                    case Source.SSC:
                        return (
                            <SSCLexSubtile
                                tileId={props.tileId}
                                onOverflowChange={handleOverflowChange}
                            />
                        );
                }
            }
            return null;
        };

        return (
            <globalComponents.TileWrapper
                tileId={props.tileId}
                isBusy={false}
                error={state.error}
                hasData={true}
                supportsTileReload={props.supportsReloadOnError}
                isSubtileContainer={props.isSubtileContainer}
                issueReportingUrl={props.issueReportingUrl}
                errorSubtileContainerLabel={props.tileLabel}
            >
                <globalComponents.Subtile
                    tileId={props.tileId}
                    isBusy={state.isBusy}
                    hasData={hasValidData || hasErrors}
                    setMaxHeight={true}
                >
                    {props.tileHeader}
                    <S.MeaningTileView ref={tileViewRef} style={tileViewStyle}>
                        <S.Stretcher>
                            {renderData(state.usedSource)}
                            {renderErrors()}
                        </S.Stretcher>
                    </S.MeaningTileView>
                </globalComponents.Subtile>

                <UsageNotesSubtileView tileId={props.tileId} />
            </globalComponents.TileWrapper>
        );
    };

    return LexMeaningTileView;
}
