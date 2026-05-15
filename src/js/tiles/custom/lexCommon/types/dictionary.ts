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

import { List } from 'cnc-tskit';
import {
    findCurrQueryMatch,
    QueryMatch,
    RecognizedQueries,
} from '../../../../query/index.js';
import { Aspect, Gender, PoS, Source } from './enums.js';

export interface CorpusEntry {
    _id: string;
    _rev: string;
    lemma: string;
    sublemmas: Array<{
        value: string;
        count: number;
    }>;
    pos: string;
    datasetSize: number;
    upos: string;
    count: number;
    arf: number;
    ipm: number;
    is_pname: boolean;
    forms: Array<{
        word: string;
        sublemma?: string;
        count: number;
        ipm: number;
        arf: number;
    }>;
}

interface LexID {
    id: string;
    parentId?: string;
}

export interface LexItem {
    lemma: string;
    pos: PoS;
    gender?: Gender;
    aspect?: Aspect;

    sources: { [source: string]: Array<LexID> };
    corpusEntry?: CorpusEntry;
}

export interface LexExtraData {
    corpusId: string;
    mainSource: Source;
    variants: Array<LexItem>;
}

export function isLexQueryMatch(
    qm: QueryMatch<any>
): qm is QueryMatch<LexExtraData> {
    return (
        qm.extraData !== undefined &&
        typeof qm.extraData['corpusId'] === 'string' &&
        typeof qm.extraData['mainSource'] === 'string' &&
        Array.isArray(qm.extraData['variants']) &&
        List.every(
            (d) => 'lemma' in d && 'pos' in d && 'sources' in d,
            qm.extraData['variants']
        )
    );
}

export function getCurrentVariant(
    queryMatches: RecognizedQueries,
    variantIdx: number
): LexItem {
    const currentQueryMatch = findCurrQueryMatch(List.head(queryMatches));
    return isLexQueryMatch(currentQueryMatch) &&
        !List.empty(currentQueryMatch.extraData.variants)
        ? currentQueryMatch.extraData.variants[variantIdx]
        : null;
}
