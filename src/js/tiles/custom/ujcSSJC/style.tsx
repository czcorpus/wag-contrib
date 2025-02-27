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

export const Entry = styled.p`
    /* OdstavcovĂ© elementy */
    div {font-family: 'Times New Roman', serif; margin-bottom: 0pt; text-align: justify; margin-top: 0px; }
    /* .entry {margin-top: 24px; margin-bottom: 12px; width: 325px;} */
    .entry {margin-top: 24px; margin-bottom: 12px; }


    /* ÄŤĂˇsti heslovĂ© stati */
    /* zĂˇkladnĂ­ formĂˇtovĂˇnĂ­ jednotlivĂ˝ch ÄŤĂˇstĂ­ (tlouĹˇĹĄka, velikost a kurzĂ­va) */
    .bo { font-weight: bold; }
    .it { font-style: italic; }
    .np { font-size: 80%; }

    .hw, .phrasem, .xref, .colloc, .hom, .construction { font-weight: bold; }
    .hw, .delim, .hom {font-family: 'Arial', sans-serif; font-size: 80%;}
    .snserif {font-weight: normal !important; }
    .source, .val, .lang, .qual { font-size: 80%; }
    .def { font-style: italic; }
    .restored { color: #C0C0C0; }

    /* odliĹˇenĂ­ dĂ­lÄŤĂ­ch ÄŤĂˇstĂ­ heslovĂ© stati */
    .xref {color: #333333; }
`;

// ---------------- <UjcSSJCTileView /> --------------------------------------

export const UjcSSJCTileView = styled.div`
`;
