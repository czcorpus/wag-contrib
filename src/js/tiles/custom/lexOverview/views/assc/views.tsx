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

import { Dict, List, pipe } from 'cnc-tskit';
import { IActionDispatcher, ViewUtils } from 'kombo';
import * as React from 'react';
import { GlobalComponents } from '../../../../../views/common/index.js';
import * as LS from './style.js';
import { initLexComponents } from '../../../lexCommon/views.js';
import { SubtileRow } from '../../../lexCommon/style.js';
import { Source } from '../../../lexCommon/types/enums.js';
import { HTMLBlock } from '../../../lexCommon/types/assc.js';

export function init(
    dispatcher: IActionDispatcher,
    ut: ViewUtils<GlobalComponents>
): {
    Subtile: React.FC<{
        tileId: number;
        block: HTMLBlock;
    }>;
} {
    const lexComponents = initLexComponents(dispatcher, ut);

    // -------------------- <FormsTable /> -----------------------------------------------

    const FormsTable: React.FC<{
        forms: { [key: string]: string };
    }> = (props) => {
        return (
            <LS.DataTable>
                <tbody>
                    {pipe(
                        props.forms,
                        Dict.toEntries(),
                        List.map(([key, value]) => (
                            <tr>
                                <td className="tableKey">{key}</td>
                                <td className="tableValue">{value}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </LS.DataTable>
        );
    };

    // -------------------- <AsscSubtileView /> -----------------------------------------------

    const AsscSubtileView: React.FC<{
        tileId: number;
        block: HTMLBlock;
    }> = (props) => {
        return (
            <lexComponents.Subtile tileId={props.tileId} source={Source.ASSC}>
                {!Dict.empty(props.block.parsedVariants[0].forms) ? (
                    <SubtileRow>
                        <span className="key">
                            {ut.translate('lex_overview__forms')}:
                        </span>
                        <FormsTable
                            forms={props.block.parsedVariants[0].forms}
                        />
                    </SubtileRow>
                ) : null}
            </lexComponents.Subtile>
        );
    };

    return {
        Subtile: AsscSubtileView,
    };
}
