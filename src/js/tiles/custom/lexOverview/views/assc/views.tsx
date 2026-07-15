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
import { HTMLBlock, VariantData } from '../../../lexCommon/types/assc.js';

export function init(
    dispatcher: IActionDispatcher,
    ut: ViewUtils<GlobalComponents>
): {
    Subtile: React.FC<{
        tileId: number;
        variant: VariantData;
    }>;
} {
    const lexComponents = initLexComponents(dispatcher, ut);

    // -------------------- <FormsTable /> -----------------------------------------------

    const FormsTable: React.FC<{
        basicForm: string;
        forms: { [key: string]: string };
    }> = (props) => {
        return (
            <LS.DataTable>
                <tbody>
                    <tr>
                        <td className="tableKey">
                            {ut.translate('lex_overview__basic_form')}
                        </td>
                        <td className="tableValue">{props.basicForm}</td>
                    </tr>
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
        variant: VariantData;
    }> = (props) => {
        return (
            <lexComponents.Subtile tileId={props.tileId} source={Source.ASSC}>
                {!Dict.empty(props.variant.forms) ? (
                    <SubtileRow>
                        <span className="key">
                            {ut.translate('lex_overview__forms')}:
                        </span>
                        <FormsTable
                            basicForm={props.variant.key}
                            forms={props.variant.forms}
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
