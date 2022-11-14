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

export const UjcDictionaryTileView = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

export const Overview = styled.div`

    // style same as info in wordFreq tile
    dl.info {

        dt {
            margin-bottom: 0.4em;
            color: ${theme.colorLightText};
            font-family: ${theme.condensedFontFamily};
        }

        dd {
            font-size: 1.5em;
            margin-left: 1em;

            span.squareb {
                color: ${theme.colorLightText};
            }
        }

        dd.example, dd.alternative {
            font-size: 1.2em;
        }

        dd:not(:last-child) {
            margin-bottom: 0.7em;
        }

        dd.word-list {
            font-size: 1.3em;
            a {
                color: ${theme.colorDefaultText};
                cursor: pointer;
                text-decoration: none;
            }

            a:hover {
                color: ${theme.colorLogoBlue};
                text-decoration: underline;
            }
        }
    }
`;

export const MeaningItem = styled.div`
    display: flex;
    gap: 5px;

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
    left: 20%;
    margin: 0 auto;

    opacity: 0;
    transition: opacity 0.3s;
`;

// ---------------- <Tooltip /> --------------------------------------

export const Tooltip = styled.div<{}>`
    position: relative;
    display: inline-block;
    border-bottom: 1px dotted black;
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
