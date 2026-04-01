/*
 * Copyright 2021 Tomas Machalek <tomas.machalek@gmail.com>
 * Copyright 2021 Institute of the Czech National Corpus,
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
import { Theme } from '../../../page/theme.js';

// ----------- <GunstickTileView /> -------------------------

export const GunstickTileView = styled.div`
    // here comes the style
`;

// ----------- <DataListTable /> -------------------------

export const DataListTable = styled.table`
    th.word {
        text-align: left;
        color: #e2007a;
    }
`;

export const Controls = styled.form`
    margin-bottom: 0.7em;

    fieldset {
        border: none;
    }

    label {
        margin-right: 0.7em;
        display: inline-block;
    }
`;

// ------------------------ <Examples /> --------------------------

export const Examples = styled.div<{ theme: Theme }>`
    background-color: ${(props) => props.theme.tileBackgroundColor};
    border: ${(props) => props.theme.defaultBorderStyle};
    border-radius: ${(props) => props.theme.tileBorderRadius};
    box-shadow: 0.05em 0.05em 0.15em 0.05em rgba(0, 0, 0, 0.2);
    padding: 0.5em;

    > div.texts {
        display: flex;
        flex-direction: column;
        max-height: 30em;
        overflow-y: scroll;

        > p {
            margin: 0;
            padding: 0.5em 1em 0.5em 1em;

            strong {
                color: ${(props) => props.theme.colorLogoPink};
            }
        }

        > p:not(:first-child) {
            border-top: 1px solid #cfcfcf;
            border-top: 1px solid ${(props) => props.theme.colorWhitelikeBlue};
        }

        .separator {
            margin: 0 0.5em;
        }
    }

    h3 {
        text-align: center;
        margin: 0 0 1em 0;
        font-size: 1.6em;

        span.words {
            color: ${(props) => props.theme.colorLogoPink};
            font-weight: normal;

            span.plus {
                color: ${(props) => props.theme.colorDefaultText};
            }
        }
    }
`;
