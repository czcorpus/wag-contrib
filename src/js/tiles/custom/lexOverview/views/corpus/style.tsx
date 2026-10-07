/*
 * Copyright (c) 2021 Charles University in Prague, Faculty of Arts,
 *                    Institute of the Czech National Corpus
 * Copyright (c) 2021 Martin Zimandl <martin.zimandl@gmail.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; version 2
 * dated June, 1991.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { styled } from 'styled-components';
import { Theme } from '../../../../../page/theme.js';
import { getLexTheme } from '../../../lexCommon/theme.js';

// ------------- <FreqBand /> -----------------------------

export const FreqBand = styled.span<{ theme: Theme }>`
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-end;
    font-size: 1.4em;
    margin: 0.5em 0;
`;

export const FreqBlock = styled.span<{
    theme: Theme;
    $height: number;
    $opacity: number;
}>`
    margin-right: 0.2em;
    width: 1.1em;
    height: ${(props) => props.$height}em;
    filter: opacity(${(props) => props.$opacity});

    &.empty-block {
        background-color: ${(props) => getLexTheme(props.theme).overlayColor};
        border: solid 1px ${(props) => props.theme.colorDefaultText}11;
    }

    &.full-block {
        background-color: ${(props) => props.theme.colorDefaultText};
    }
`;
