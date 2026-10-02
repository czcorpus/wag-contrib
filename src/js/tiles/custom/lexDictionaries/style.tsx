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
import { LexTileBase } from '../lexCommon/style.js';
import { getLexTheme } from '../lexCommon/theme.js';

// ---------------- <LexDictionariesTileView /> --------------------------------------

export const LexDictionariesTileView = styled(LexTileBase)`
    position: relative;
    height: 100%;
    width: 100%;
    min-height: 25em;
`;

// ---------------- <Stretcher /> --------------------------------------

export const Stretcher = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;
`;

// ---------------- <Scroller /> --------------------------------------

export const Scroller = styled.div`
    margin-top: 1em;
    padding-right: 0.5em;
    flex-grow: 1;
    overflow-y: auto;
`;

// ---------------- <Tabs /> --------------------------------------

export const Tabs = styled.div<{ theme: Theme }>`
    .separator {
        margin: 0 5px;
        font-size: 1.5em;
        color: ${(props) => props.theme.colorLogoBlue};
    }
`;

// ---------------- <TabButton /> --------------------------------------

export const TabButton = styled.span<{ theme: Theme }>`
    color: ${(props) => props.theme.colorDefaultText};

    span.item {
        margin: 0 5px;
        padding: 0 3px;

        a {
            text-decoration: none;
            color: ${(props) => props.theme.colorDefaultText};
        }
    }

    span.item.current {
        border-bottom: 2px solid ${(props) => props.theme.colorLogoBlue};
    }

    span.item.disabled {
        opacity: 0.5;
        cursor: default;

        a:hover {
            text-decoration: none;
            cursor: default;
        }
    }

    span.item:not(.disabled) a:hover {
        text-decoration: none;
        color: ${(props) => props.theme.colorLogoBlue};
        cursor: pointer;
    }
`;

// ---------------- <SSJCEntry /> --------------------------------------

export const SSJCEntry = styled.li<{ theme: Theme }>`
    .hw {
        color: ${(props) => getLexTheme(props.theme).lemmaColor} !important;
    }

    // --------------- original styles ----------------------------

    /* OdstavcovĂ© elementy */
    div {
        font-family: 'Times New Roman', serif;
        margin-bottom: 0pt;
        text-align: justify;
        margin-top: 0px;
    }
    /* .entry {margin-top: 24px; margin-bottom: 12px; width: 325px;} */
    .entry {
        margin-top: 24px;
        margin-bottom: 12px;
    }

    /* ÄŤĂˇsti heslovĂ© stati */
    /* zĂˇkladnĂ­ formĂˇtovĂˇnĂ­ jednotlivĂ˝ch ÄŤĂˇstĂ­ (tlouĹˇĹĄka, velikost a kurzĂ­va) */
    .bo {
        font-weight: bold;
    }
    .it {
        font-style: italic;
    }
    .np {
        font-size: 80%;
    }

    .hw,
    .phrasem,
    .xref,
    .colloc,
    .hom,
    .construction {
        font-weight: bold;
    }
    .hw,
    .delim,
    .hom {
        font-family: 'Arial', sans-serif;
        font-size: 80%;
    }
    .snserif {
        font-weight: normal !important;
    }
    .source,
    .val,
    .lang,
    .qual {
        font-size: 80%;
    }
    .def {
        font-style: italic;
    }
    .restored {
        color: #c0c0c0;
    }

    /* odliĹˇenĂ­ dĂ­lÄŤĂ­ch ÄŤĂˇstĂ­ heslovĂ© stati */
    .xref {
        color: #333333;
    }
`;

// ---------------- <PSJCEntry /> --------------------------------------

export const PSJCEntry = styled.li<{ theme: Theme }>`
    .hw {
        color: ${(props) => getLexTheme(props.theme).lemmaColor} !important;
    }

    // --------------- original styles ----------------------------

    .e {
        font-size: 12pt;
        width: 320px;
        text-align: justify;
        font-family: 'Times New Roman', Times, serif;
    }
    .hw {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 90%;
        font-weight: bold;
    }
    .n {
        font-family: 'Times New Roman', Times, serif;
        font-size: 100%;
    }
    .i,
    .see {
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
    .sep,
    .delim {
        font-size: 90%;
        background-color: #808080;
        color: #ffffff;
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
`;

// ---------------- <SSCEntry /> --------------------------------------

export const SSCEntry = styled.li<{ theme: Theme }>`
    .lemma {
        color: ${(props) => getLexTheme(props.theme).lemmaColor} !important;
    }

    // --------------- original styles ----------------------------

    .entry,
    .page-number,
    .footnotes-container {
        font-family: 'Times New Roman', Times, serif;
    }

    .bold {
        font-weight: bold;
    }

    .italic {
        font-style: italic;
    }

    .entry {
        display: block;
        padding-left: 0.7cm;
        text-indent: -0.7cm;
    }

    .entry,
    .page-number {
        margin: 16px 0;
        line-height: 1.5;
    }

    .page-number {
        text-align: center;
        width: 5rem; /* originally: 10% */
    }

    .cs-x-transcr {
        font-size: 95%;
        font-style: italic;
    }

    .reader-search-result-match {
        font-weight: bold;
    }

    .itj-pb {
        font-weight: bold;
        text-decoration: none;
    }

    .tooltip {
        display: none;
    }

    span.corr {
        font-style: italic;
        margin-right: 1px;
    }

    .note-ref {
        font-weight: bold;
        text-decoration: none;
    }

    a[id^='footnote-'] {
        text-decoration: none;
    }

    div.footnote {
        display: flex;
    }

    div.footnote p {
        margin: 0;
        text-indent: 0 !important;
        line-height: 1.2 !important;
        break-inside: avoid-column;
        text-align: left;
    }

    div.footnote .note-ref-container {
        display: block;
        min-width: 2.5em;
        text-align: right;
        margin-right: 0.5em;
    }

    .footnotes-container::before {
        content: '';
        border-top: 1px solid black;
        display: block;
        width: 30%;
    }

    .footnotes {
        column-count: 2;
        column-fill: balance;
        margin-top: 10px;
        margin-bottom: 20px;
        gap: 30px;
    }

    .single-note {
        column-count: 1;
    }

    .entries {
        display: flex;
        flex-flow: wrap;
    }

    .entries > :not(.page-number) {
        width: calc(100% - 5rem); /* originally: 90% */
    }
`;
