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
import { SystemMessageType } from '../../../types.js';
import { getLexTheme } from './theme.js';

export function getMessageColor(systemMessageType: string): string {
    switch (systemMessageType) {
        case SystemMessageType.WARNING:
            return '#009ee0';
        case SystemMessageType.ERROR:
            return '#ea670c';
        default:
            return null;
    }
}

export const LexTileBase = styled.div<{ theme: Theme }>``;

export const SubtileWrapper = styled.div<{
    theme: Theme;
    $source?: string;
    $systemMessageType?: SystemMessageType;
}>`
    margin-top: 0.5em;
    &:first-child {
        margin-top: 0;
    }
    padding: 0.8em 1em;
    background-color: ${(props) =>
        props.$source
            ? getLexTheme(props.theme).subtileColors[props.$source] ||
              getLexTheme(props.theme).subtileColors.dicts
            : null};
    border: ${(props) =>
        props.$systemMessageType
            ? `2px solid ${getMessageColor(props.$systemMessageType)}`
            : 'none'};
    border-radius: ${(props) => getLexTheme(props.theme).subtileBorderRadius};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    row-gap: 0.25em;

    a:hover {
        text-decoration: none;
        cursor: pointer;
    }
`;

export const SubtileRow = styled.div<{ theme: Theme; $source?: string }>`
    .key {
        color: ${(props) => props.theme.colorLightText};
        font-family: ${(props) => props.theme.condensedFontFamily};
    }

    .value {
        margin-left: 0.5em;
    }

    .MessageStatusIcon {
        margin: 0 0.5em;
    }

    &.footer {
        font-size: 0.9em;
        text-align: right;
        margin-top: 0.5em;

        .footer-box {
            display: inline-block;
            ${(props) => props.theme.tileFooterStyle};
            background-color: ${(props) =>
                props.$source
                    ? getLexTheme(props.theme).sourceColors[props.$source] ||
                      getLexTheme(props.theme).sourceColors.dicts
                    : null} !important;
        }
    }
`;

// ---------------- <Scroller /> --------------------------------------

export const ScrollerWrapper = styled.div<{ theme: Theme }>`
    position: relative;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .scrollbar-track {
        position: absolute;
        top: 0.25em;
        bottom: 0.25em;
        right: 0.15em;
        width: 0.5em;
        border-radius: 0.2em;
        background-color: ${(props) => getLexTheme(props.theme).overlayColor};
    }

    .scrollbar-thumb {
        position: absolute;
        left: 0;
        right: 0;
        border-radius: 0.25em;
        background-color: ${(props) => props.theme.colorDefaultText};
        opacity: 0.5;
        cursor: grab;
        touch-action: none;

        &:hover,
        &.dragging {
            opacity: 0.8;
        }

        &.dragging {
            cursor: grabbing;
        }
    }
`;

export const Scroller = styled.div<{ theme: Theme }>`
    padding: 0.5em;
    overflow-y: auto;

    /* Native scrollbar is hidden and a custom always-visible one is rendered
       instead - Firefox overlay scrollbars cannot be forced visible via CSS. */
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }

    /* top/bottom faders - a mask keeps them independent of the background */
    --fade-top: 0px;
    --fade-bottom: 0px;
    mask-image: linear-gradient(
        to bottom,
        transparent 0,
        black var(--fade-top),
        black calc(100% - var(--fade-bottom)),
        transparent 100%
    );

    &.fade-top {
        --fade-top: 2.5em;
    }

    &.fade-bottom {
        --fade-bottom: 2.5em;
    }

    &.scrollable {
        padding-right: 1em;
    }
`;
