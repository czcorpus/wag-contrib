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

import styled from 'styled-components';

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

export const Paginator = styled.span`
    a {
        cursor: pointer;
    }

    a.disabled {
        cursor: default;
    }

    .arrow {
        width: 1em;
        display: inline-block;
        vertical-align: middle;
    }

    input.page {
        width: 3em;
        margin-left: 0.3em;
        margin-right: 0.3em;
    }
`;