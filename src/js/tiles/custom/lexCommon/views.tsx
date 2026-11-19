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

import { IActionDispatcher, ViewUtils } from 'kombo';
import * as React from 'react';
import { GlobalComponents } from '../../../views/common/index.js';
import { Actions as GlobalActions } from '../../../models/actions.js';
import * as S from './style.js';
import { List } from 'cnc-tskit';
import { SystemMessageType } from '../../../types.js';
import { useShrinkToText } from '../../../page/hooks.js';

export function initLexComponents(
    dispatcher: IActionDispatcher,
    ut: ViewUtils<GlobalComponents>
): {
    Subtile: React.FC<
        React.PropsWithChildren<{
            tileId: number;
            source: string | Array<string>;
            more?: { label: string; url?: string; onclick?: (e) => void };
            corpname?: string;
            className?: string;
        }>
    >;
    MessageSubtile: React.FC<
        React.PropsWithChildren<{
            systemMessageType: SystemMessageType;
            className?: string;
        }>
    >;
    Scroller: React.FC<
        React.PropsWithChildren<{
            resetKey?: unknown;
            className?: string;
        }>
    >;
} {
    const components = ut.getComponents();

    // -------------------- <SourceFooter /> ---------------------------------------------------

    const SourceFooter: React.FC<{
        tileId: number;
        source: string | Array<string>;
        corpname?: string;
    }> = (props) => {
        const handleSourceInfo = (source: string) => () => {
            dispatcher.dispatch(GlobalActions.GetSourceInfo, {
                tileId: props.tileId,
                corpusId: source,
            });
        };

        return props.source || props.corpname ? (
            <>
                <span className="key">
                    {ut.translate('lex_common__source')}:
                </span>
                <span className="value">
                    {props.corpname ? (
                        <a onClick={handleSourceInfo(props.corpname)}>
                            {props.corpname}
                        </a>
                    ) : Array.isArray(props.source) ? (
                        List.map(
                            (v, i) => (
                                <React.Fragment key={`${v}:${i}`}>
                                    {i > 0 ? ', ' : null}
                                    <a onClick={handleSourceInfo(v)}>
                                        {ut.translate(
                                            `lex_common__source_${v}`
                                        )}
                                    </a>
                                </React.Fragment>
                            ),
                            props.source
                        )
                    ) : (
                        <a onClick={handleSourceInfo(props.source)}>
                            {ut.translate(`lex_common__source_${props.source}`)}
                        </a>
                    )}
                </span>
            </>
        ) : null;
    };

    // -------------------- <MoreFooter /> ---------------------------------------------------

    const MoreFooter: React.FC<{
        more?: { label: string; url?: string; onclick?: (e) => void };
    }> = (props) => {
        return props.more ? (
            <div>
                <span className="key">{ut.translate('lex_common__more')}:</span>
                <span className="value">
                    <a onClick={props.more.onclick} href={props.more.url}>
                        {props.more.label}
                    </a>
                </span>
            </div>
        ) : null;
    };

    // -------------------- <Subtile /> ---------------------------------------------------

    const Subtile: React.FC<
        React.PropsWithChildren<{
            tileId: number;
            source: string | Array<string>;
            more?: { label: string; url?: string; onclick?: (e) => void };
            corpname?: string;
            className?: string;
        }>
    > = (props) => {
        const footerBoxRef = React.useRef<HTMLDivElement>(null);
        useShrinkToText(footerBoxRef);

        const usedSource = Array.isArray(props.source)
            ? props.source[0]
            : props.source;
        return (
            <S.SubtileWrapper className={props.className} $source={usedSource}>
                {props.children}
                <S.SubtileRow className="footer" $source={usedSource}>
                    <div className="footer-box" ref={footerBoxRef}>
                        <SourceFooter
                            tileId={props.tileId}
                            source={props.source}
                            corpname={props.corpname}
                        />
                        <MoreFooter more={props.more} />
                    </div>
                </S.SubtileRow>
            </S.SubtileWrapper>
        );
    };

    // -------------------- <Scroller /> -----------------------------------------------

    /**
     * A vertical scroll container with an always visible custom scrollbar
     * and top/bottom faders. It should be placed in a flex column container
     * with a limited height.
     *
     * @param resetKey when changed, the content is scrolled back to the top
     */
    const Scroller: React.FC<
        React.PropsWithChildren<{
            resetKey?: unknown;
            className?: string;
        }>
    > = (props) => {
        const MIN_THUMB_PX = 20;
        const scrollerRef = React.useRef<HTMLDivElement>(null);
        const contentRef = React.useRef<HTMLDivElement>(null);
        const trackRef = React.useRef<HTMLDivElement>(null);
        const dragRef = React.useRef<{
            startY: number;
            startScrollTop: number;
        } | null>(null);
        const [thumb, setThumb] = React.useState<{
            top: number;
            height: number;
        } | null>(null);
        const [dragging, setDragging] = React.useState(false);
        const [fadeTop, setFadeTop] = React.useState(false);
        const [fadeBottom, setFadeBottom] = React.useState(false);

        const update = React.useCallback(() => {
            const scroller = scrollerRef.current;
            if (!scroller) {
                setThumb(null);
                setFadeTop(false);
                setFadeBottom(false);
                return;
            }
            const { scrollHeight, clientHeight, scrollTop } = scroller;
            if (scrollHeight <= clientHeight + 1) {
                setThumb(null);
                setFadeTop(false);
                setFadeBottom(false);
                return;
            }
            setFadeTop(scrollTop > 1);
            setFadeBottom(scrollTop + clientHeight < scrollHeight - 1);
            const trackHeight = trackRef.current
                ? trackRef.current.clientHeight
                : clientHeight;
            const height = Math.max(
                MIN_THUMB_PX,
                (trackHeight * clientHeight) / scrollHeight
            );
            const top =
                (scrollTop / (scrollHeight - clientHeight)) *
                (trackHeight - height);
            setThumb((prev) =>
                prev && prev.top === top && prev.height === height
                    ? prev
                    : { top, height }
            );
        }, []);

        // observe both the viewport and the content so that the scrollbar
        // reacts to tile resizing and to expanding/collapsing items
        React.useEffect(() => {
            if (typeof ResizeObserver === 'undefined') {
                return;
            }
            const observer = new ResizeObserver(() => update());
            if (scrollerRef.current) {
                observer.observe(scrollerRef.current);
            }
            if (contentRef.current) {
                observer.observe(contentRef.current);
            }
            return () => observer.disconnect();
        }, [update]);

        // new content - start from the top
        React.useEffect(() => {
            if (scrollerRef.current) {
                scrollerRef.current.scrollTop = 0;
            }
            update();
        }, [props.resetKey, update]);

        // the track is mounted only once content is known to be scrollable,
        // so recompute with its real height
        const isScrollable = thumb !== null;
        React.useEffect(() => {
            if (isScrollable) {
                update();
            }
        }, [isScrollable, update]);

        const handleThumbPointerDown = (e: React.PointerEvent) => {
            if (!scrollerRef.current) {
                return;
            }
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = {
                startY: e.clientY,
                startScrollTop: scrollerRef.current.scrollTop,
            };
            setDragging(true);
        };

        const handleThumbPointerMove = (e: React.PointerEvent) => {
            const scroller = scrollerRef.current;
            const track = trackRef.current;
            if (!dragRef.current || !scroller || !track || !thumb) {
                return;
            }
            const scrollRange = scroller.scrollHeight - scroller.clientHeight;
            const thumbRange = track.clientHeight - thumb.height;
            if (thumbRange > 0) {
                scroller.scrollTop =
                    dragRef.current.startScrollTop +
                    ((e.clientY - dragRef.current.startY) * scrollRange) /
                        thumbRange;
            }
        };

        const handleThumbPointerUp = (e: React.PointerEvent) => {
            dragRef.current = null;
            setDragging(false);
            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
            }
        };

        const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
            const scroller = scrollerRef.current;
            if (!scroller || !thumb || e.target !== e.currentTarget) {
                return;
            }
            const offsetY =
                e.clientY - e.currentTarget.getBoundingClientRect().top;
            scroller.scrollBy({
                top:
                    (offsetY < thumb.top ? -1 : 1) *
                    scroller.clientHeight *
                    0.9,
                behavior: 'smooth',
            });
        };

        return (
            <S.ScrollerWrapper className={props.className}>
                <S.Scroller
                    ref={scrollerRef}
                    onScroll={update}
                    className={
                        [
                            isScrollable ? 'scrollable' : '',
                            fadeTop ? 'fade-top' : '',
                            fadeBottom ? 'fade-bottom' : '',
                        ]
                            .filter(Boolean)
                            .join(' ') || undefined
                    }
                >
                    <div ref={contentRef}>{props.children}</div>
                </S.Scroller>
                {isScrollable ? (
                    <div
                        className="scrollbar-track"
                        ref={trackRef}
                        onClick={handleTrackClick}
                    >
                        <div
                            className={
                                'scrollbar-thumb' +
                                (dragging ? ' dragging' : '')
                            }
                            style={{
                                top: `${thumb.top}px`,
                                height: `${thumb.height}px`,
                            }}
                            onPointerDown={handleThumbPointerDown}
                            onPointerMove={handleThumbPointerMove}
                            onPointerUp={handleThumbPointerUp}
                            onPointerCancel={handleThumbPointerUp}
                        />
                    </div>
                ) : null}
            </S.ScrollerWrapper>
        );
    };

    // -------------------- <MessageSubtile /> ---------------------------------------------------

    const MessageSubtile: React.FC<
        React.PropsWithChildren<{
            systemMessageType: SystemMessageType;
            className?: string;
        }>
    > = (props) => {
        return (
            <S.SubtileWrapper
                $systemMessageType={props.systemMessageType}
                className={props.className}
            >
                <S.SubtileRow style={{ display: 'flex', alignItems: 'center' }}>
                    <components.MessageStatusIcon
                        statusType={props.systemMessageType}
                    />
                    {props.children}
                </S.SubtileRow>
            </S.SubtileWrapper>
        );
    };

    return { Subtile, MessageSubtile, Scroller };
}
