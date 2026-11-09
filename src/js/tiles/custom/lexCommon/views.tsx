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
                                <>
                                    {i > 0 ? ', ' : null}
                                    <a onClick={handleSourceInfo(v)}>
                                        {ut.translate(
                                            `lex_common__source_${v}`
                                        )}
                                    </a>
                                </>
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
        const usedSource = Array.isArray(props.source)
            ? props.source[0]
            : props.source;
        return (
            <S.SubtileWrapper className={props.className} $source={usedSource}>
                {props.children}
                <S.SubtileRow className="footer" $source={usedSource}>
                    <div className="footer-box">
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

    return { Subtile, MessageSubtile };
}
