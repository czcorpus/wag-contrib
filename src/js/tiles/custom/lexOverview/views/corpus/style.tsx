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

// ------------- <Stars /> -----------------------------

export const Stars = styled.span<{ theme: Theme }>`
    display: block;
    white-space: nowrap;

    .star {
        vertical-align: sub;
        margin-right: 0.1em;
        display: inline-block;
        width: 1em;
        height: 1em;
    }

    .star.empty {
        background-color: ${(props) => props.theme.colorLightText};
    }

    .star.full {
        background-color: ${(props) => props.theme.colorDefaultText};
    }
`;

// ------------ <SVGMask /> ----------------------------

export const SVGMask = styled.div<{ theme: Theme; src: string }>`
    mask-image: url(${(props) => props.src});
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
`;
