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

import { Theme } from '../../../../page/theme.js';
import { styled } from 'styled-components';
import { LexTileBase } from '../../lexCommon/style.js';

export const LexOverviewTileView = styled(LexTileBase)`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

export const Header = styled.div<{ theme: Theme }>`
    padding: 0.5em;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    h2 {
        width: 100%;
        margin: 0.1em 0;
    }

    .variant {
        margin: 0.1em 1em;

        a {
            text-decoration: none;
            cursor: pointer;
        }
    }

    .small {
        font-size: 0.8em;
        font-style: italic;
    }
`;

export const PlayerIcon = styled.a<{ theme: Theme }>`
    display: inline-block;
    vertical-align: middle;
    margin-left: 1em;
    margin-bottom: 0.1em;
    cursor: pointer;

    img {
        display: block;
        width: 1.5em;
    }
`;
