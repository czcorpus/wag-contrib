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
import { styled } from 'styled-components';
import { Source } from './common.js';

function getSourceColor(source: string): string {
    switch (source) {
        case Source.ASSC:
            return '#d4e2f4';
        case Source.IJP:
            return '#e5eef8';
        case Source.Corpus:
            return '#fae9da';
        default:
            return null;
    }
}

export const LexTileBase = styled.div<{ theme: Theme }>``;

export const Subtile = styled.div<{
    theme: Theme;
    source?: string;
    color?: string;
}>`
    margin-top: 1em;
    padding: 0.5em;
    background-color: ${(props) => getSourceColor(props.source) || props.color};
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .content {
        margin: 0;
        padding: 0;
        line-height: 2em;

        .key {
            color: ${(props) => props.theme.colorLightText};
            font-family: ${(props) => props.theme.condensedFontFamily};
        }

        .value {
            margin-left: 0.5em;
        }
    }

    .footer {
        font-size: 0.9em;
        text-align: right;
    }
`;

export const SubtileRow = styled.div<{ theme: Theme }>`
    margin-bottom: 0.5em;

    .key {
        color: ${(props) => props.theme.colorLightText};
        font-family: ${(props) => props.theme.condensedFontFamily};
    }

    .value {
        margin-left: 0.5em;
    }

    &.footer {
        margin-top: 0em;
        font-size: 0.9em;
        text-align: right;
    }
`;
