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
import { SubtileWrapper, SubtileRow } from './commonStyle.js';

export function initViewSubtile(
    dispatcher: IActionDispatcher,
    ut: ViewUtils<GlobalComponents>
) {
    // -------------------- <Subtile /> ---------------------------------------------------

    const Subtile: React.FC<
        React.PropsWithChildren<{
            source?: string;
            corpname?: string;
            className?: string;
        }>
    > = (props) => (
        <SubtileWrapper className={props.className} source={props.source}>
            {props.children}
            {props.source || props.corpname ? (
                <SubtileRow className="footer">
                    <span className="key">
                        {ut.translate('lex_common__source')}:
                    </span>
                    <span className="value">
                        {props.corpname
                            ? props.corpname
                            : ut.translate(
                                  `lex_common__source_${props.source}`
                              )}
                    </span>
                </SubtileRow>
            ) : null}
        </SubtileWrapper>
    );

    return Subtile;
}
