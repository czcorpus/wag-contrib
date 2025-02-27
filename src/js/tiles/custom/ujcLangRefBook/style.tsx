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

import { styled } from 'styled-components';
import * as theme from '../../../views/common/theme.js';

export const UjcLangRefBookTileView = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

export const Overview = styled.div`
    p.langbook-heading {
        font-size: 1.5em;

        .langbook-key {
            font-size: 1.5em;
            font-weight: 500;

            :after {
                content: " ";
            }
        }

        .langbook-pronunciation {
        }

        .langbook-meaning {
        }
    }

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

export const DataTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0em;

    caption {
        font-size: 1em;
        text-align: left;
        color: ${theme.colorLightText};
    }

    td, th {
        padding: 0.2em 0.5em;
        border: 2px solid #dddddd;
    }

    td.word, th {
        text-align: center;
        vertical-align: middle;
    }

`;

