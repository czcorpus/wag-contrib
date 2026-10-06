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
import { GlobalComponents } from '../../../../../views/common/index.js';
import { initLexComponents } from '../../../lexCommon/views.js';
import { Source } from '../../../lexCommon/types/enums.js';
import { SubtileRow } from '../../../lexCommon/style.js';
import * as S from './style.js';

export function init(
    dispatcher: IActionDispatcher,
    ut: ViewUtils<GlobalComponents>
): {
    Subtile: React.FC<{
        tileId: number;
        corpname: string;
        data?: {
            abs: number;
            ipm: number;
        };
    }>;
} {
    const lexComponents = initLexComponents(dispatcher, ut);

    const calcFreqBand = (ipm: number): number => {
        if (!ipm) return 0;
        if (ipm < 0.01) return 1;
        if (ipm < 0.1) return 2;
        if (ipm < 1) return 3;
        if (ipm < 10) return 4;
        if (ipm < 100) return 5;
        if (ipm < 1000) return 6;
        return 7;
    };

    // -------------------- <FreqBand /> -----------------------------------------------

    const FreqBand: React.FC<{
        ipm: number;
    }> = (props) => {
        const freqBand = calcFreqBand(props.ipm);
        return (
            <S.FreqBand>
                {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                    <S.FreqBlock
                        key={v}
                        className={`block ${v <= freqBand ? 'full' : 'empty'}`}
                        $height={v / 7}
                    />
                ))}
            </S.FreqBand>
        );
    };

    // -------------------- <SrchWordInfo /> ---------------------------------------------------

    const SrchWordInfo: React.FC<{
        tileId: number;
        corpname: string;
        data?: {
            abs: number;
            ipm: number;
        };
    }> = (props) => (
        <lexComponents.Subtile
            tileId={props.tileId}
            source={Source.Corpus}
            corpname={props.corpname}
        >
            {props.data ? (
                props.data.abs > 0 ? (
                    <>
                        <SubtileRow>
                            <span className="key">
                                {ut.translate('wordfreq__freq_bands')}:
                            </span>
                            <span
                                className="value"
                                style={{ display: 'inline-block' }}
                            >
                                <FreqBand ipm={props.data.ipm} />
                            </span>
                        </SubtileRow>
                        <SubtileRow>
                            <span className="key">
                                {ut.translate('wordfreq__ipm')}:
                            </span>
                            <span className="value">
                                {ut.formatNumber(props.data.ipm, 2)}
                            </span>
                        </SubtileRow>
                    </>
                ) : (
                    <SubtileRow>
                        <span className="key">
                            {ut.translate('wordfreq__note')}:
                        </span>
                        <span className="value">
                            {ut.translate(
                                'wordfreq__word_known_but_nothing_more'
                            )}
                        </span>
                    </SubtileRow>
                )
            ) : (
                <SubtileRow>
                    <span className="value">
                        {ut.translate('lex_overview__no_freq')}
                    </span>
                </SubtileRow>
            )}
        </lexComponents.Subtile>
    );

    return {
        Subtile: SrchWordInfo,
    };
}
