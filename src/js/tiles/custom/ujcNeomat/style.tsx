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

// ---------------- <Entry /> --------------------------------------

// TODO import source css with fonts and all
export const Entry = styled.table`
    width: 100%;
    border-collapse: collapse;

    .sz_0{width:30px;padding-top:18px;}
    .sz_1{background-color:#4767de;padding:20px;width:400px; color:#fff;font-family:my-roboto-bold;font-size:12pt;}
    .sz_2{background-color:#4767de;padding:20px;font-family:my-roboto-lightitalic;font-size:12pt;color:#fff;width:300px;}
    .sz_3{background-color:#0f2a9d;width:150px;}
    .sz_4{background-color:#fff;padding:20px;width:700px;}
    .sz_5{background-color:#d9d9d9;padding:20px;width:150px;font-family:my-roboto-bolditalic;color:#0f2a9d;}
    .sz_6{background-color:#d9d9d9;padding:20px;width:150px;font-family:my-roboto-italic;color:#0f2a9d;}
`;

// ---------------- <UjcNeomatTileView /> --------------------------------------

export const UjcNeomatTileView = styled.div`
    width: 100%;

    ${Entry}:not(:first-child) {
        margin-top: 20px;
    }
`
