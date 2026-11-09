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

import { Theme } from '../../../page/theme.js';
import { Source } from './types/enums.js';

interface LexTheme {
    subtileBorderRadius: string;
    overlayBorderRadius: string;
    overlayColor: string;
    lemmaColor: string;
    variantButtonColor: string;
    subtileColors: {
        [Source.Corpus]: string;
        dicts: string;
    };
    sourceColors: {
        [Source.Corpus]: string;
        dicts: string;
    };
}

function isLexTheme(theme: Theme): theme is Theme<LexTheme> {
    return (
        !!theme &&
        typeof theme.extraTheme === 'object' &&
        ('overlayColor' in theme.extraTheme ||
            'subtileBorderRadius' in theme.extraTheme ||
            'overlayBorderRadius' in theme.extraTheme ||
            'lemmaColor' in theme.extraTheme ||
            'variantButtonColor' in theme.extraTheme ||
            ('subtileColors' in theme.extraTheme &&
                typeof theme.extraTheme.subtileColors === 'object') ||
            ('sourceColors' in theme.extraTheme &&
                typeof theme.extraTheme.sourceColors === 'object'))
    );
}

export function getLexTheme(theme: Theme): LexTheme {
    const defaultTheme: LexTheme = {
        subtileBorderRadius: '0.5em',
        overlayBorderRadius: '0.25em',
        overlayColor: '#0000000e',
        lemmaColor: '#6c74f0',
        variantButtonColor: '#d4e2f4',
        subtileColors: {
            dicts: '#ebeff4',
            [Source.Corpus]: '#feecef',
        },
        sourceColors: {
            dicts: '#CED8E4',
            [Source.Corpus]: '#FECFD7',
        },
    };

    if (isLexTheme(theme)) {
        return {
            ...defaultTheme,
            ...theme.extraTheme,
            subtileColors: {
                ...defaultTheme.subtileColors,
                ...theme.extraTheme.subtileColors,
            },
            sourceColors: {
                ...defaultTheme.sourceColors,
                ...theme.extraTheme.sourceColors,
            },
        };
    }
    return defaultTheme;
}
