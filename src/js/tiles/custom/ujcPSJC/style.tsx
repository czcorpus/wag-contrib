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

// ---------------- <UjcPSJCTileView /> --------------------------------------

export const UjcPSJCTileView = styled.div`

    max-height: 40em;
    overflow-y: scroll;

    ul li {
        .e {
            font-size: 12pt;
            width:320px;
            text-align:justify;
            font-family: 'Times New Roman' , Times, serif;
        }
        .hw {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 90%;
            font-weight: bold;
        }
        .n {
            font-family: 'Times New Roman' , Times, serif;
            font-size: 100%;
        }
        .i, .see {
            font-style: italic;
        }
        .submitlink {
            font-style: italic;
            text-decoration: underline;
            background-color: transparent;
            border: 0;
            cursor: pointer;
            margin: 0;
            padding: 0;
        }
        .npi {
            font-size: 80%;
            font-style: italic;
        }
        .np {
            font-size: 80%;
        }
        .sep, .delim {
            font-size: 90%;
            background-color: #808080;
            color: #FFFFFF;
            font-weight: bold;
        }
        .b {
            font-weight: bold;
        }
        .pron {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 90%;
        }
        .isup {
            font-style: italic;
            vertical-align: super;
            font-size: 70%;
        }
        .isub {
            font-style: italic;
            vertical-align: sub;
            font-size: 70%;
        }
        .sup {
            vertical-align: super;
            font-size: 70%;
        }
        .sub {
            vertical-align: sub;
            font-size: 70%;
        }
        .none {
            font-style: inherit;
        }
        .autor {
            font-size: 100%;
            font-style: italic;
            font-family: 'Times New Roman', serif;
        }
        .nazev {
            font-size: 150%;
            font-weight: bold;
        }
    }
`;
