/*
 * Copyright 2026 Martin Zimandl <martin.zimandl@gmail.com>
 * Copyright 2026 Tomas Machalek <tomas.machalek@gmail.com>
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
import * as S from '../style.js';
import { DataTableItem } from '../common.js';
import * as React from 'react';

// ------------------- <Examples /> ------------------------

export const Examples: React.FC<{
    word: string;
    verse: string;
    year: number;
    data: Array<DataTableItem>;
}> = (props) => {
    return (
        <S.Examples>
            <h3>
                <span className="words">
                    {props.word} <span className="plus">+</span> {props.verse}
                    <span className="year"> ({props.year})</span>
                </span>
            </h3>
            <div className="texts">
                {pipe(
                    props.data,
                    List.filter((item) => item.year === props.year),
                    List.map((entry, i) => (
                        <p key={`${i}:${entry.author}:${entry.poemName}`}>
                            <span className="line1">{entry.line1}</span>
                            <span className="separator"> --- </span>
                            <span className="line2">{entry.line2}</span>
                        </p>
                    ))
                )}
            </div>
        </S.Examples>
    );
};
