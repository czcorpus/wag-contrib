/*
 * Copyright 2022 Martin Zimandl <martin.zimandl@gmail.com>
 * Copyright 2022 Institute of the Czech National Corpus,
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

import styled from 'styled-components';
import * as theme from '../../../views/common/theme';

// ---------------- <Keyword /> --------------------------------------

export const Keyword = styled.div`
    font-size: 1.5em;
    color: ${theme.colorDefaultText};

    .dict-key {
        font-size: 1.5em;
        font-weight: bold;
        color: #6f74f0;
    }

    .dict-pronunciation {

    }

    .dict-note {
        margin-top: 0.5em;
        padding: 0.5em;
        font-size: 0.8em;
        background-color: #f4f4fe;
        border-radius: 5px;
    }

    .dict-note-label {
        font-weight: 700;
    }

    .dict-note-label:first-letter {
        text-transform: capitalize;
    }
`;

// ---------------- <Tooltiped /> --------------------------------------

export const Tooltiped = styled.div<{}>`
    & > *{
        width: fit-content;
        border-bottom: 1px dotted black;
    }
`;

// ---------------- <TooltipContent /> --------------------------------------

export const TooltipContent = styled.div<{}>`
    visibility: hidden;
    background-color: #555;
    color: #fff;
    padding: 5px 5px;
    border-radius: 6px;

    position: absolute;
    z-index: 1;
    top: 120%;
    left: 1em;

    opacity: 0;
    transition: opacity 0.3s;
`;

// ---------------- <Tooltip /> --------------------------------------

export const Tooltip = styled.div<{}>`
    position: relative;
    display: inline-block;
    top: 100%;

    &:hover ${TooltipContent} {
        visibility: visible;
        opacity: 1;
    }

    ${TooltipContent}:hover {
        visibility: hidden;
        opacity: 0;
    }
`;

// ---------------- <MeaningRow /> --------------------------------------

export const MeaningRow = styled.tr`
    td {
        vertical-align: top;
    }

    ${Tooltip} {
        width: 100%;
    }

    .meaning-count {
        text-align: right;
    }

    .examples {
        font-size: 0.8em;
    }

    .examples-heading {
        margin-bottom: 0.5em;
    }

    .example {
        font-style: italic;
    }
`;

// ---------------- <UjcDictionaryTileView /> --------------------------------------

export const UjcDictionaryTileView = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;
