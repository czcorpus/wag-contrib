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

import { List, pipe } from 'cnc-tskit';
import { IActionDispatcher, ViewUtils, useModel } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../page/theme.js';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile.js';
import { LexNotesModel } from './model.js';
import * as S from './style.js';
import { GlobalComponents } from '../../../views/common/index.js';
import { SubtileRow } from '../lexCommon/style.js';
import { Source } from '../lexCommon/types/enums.js';
import { initLexComponents } from '../lexCommon/views.js';
import {
    getErrorMessage,
    isAsscData,
    isAsscError,
    isAsscHtml,
    isIjpData,
    isIjpError,
} from '../lexCommon/api.js';
import { SystemMessageType } from '../../../types.js';

export function init(
    dispatcher: IActionDispatcher,
    ut: ViewUtils<GlobalComponents>,
    theme: Theme,
    model: LexNotesModel
): TileComponent {
    const globalComponents = ut.getComponents();
    const lexComponents = initLexComponents(dispatcher, ut);

    // -------------------- <LexNotesTileView /> -----------------------------------------------

    const LexNotesTileView: React.FC<CoreTileComponentProps> = (props) => {
        const state = useModel(model);

        const ijpNotes = pipe(
            state.data.ijp,
            List.filter((v) => isIjpData(v)),
            List.flatMap((v) => v.data.notes)
        );

        const asscNotes = pipe(
            state.data.assc,
            List.filter((v) => isAsscHtml(v)),
            List.flatMap((v) => List.map((d) => d.notes, v.data))
        );

        return (
            <globalComponents.TileWrapper
                tileId={props.tileId}
                isBusy={state.isBusy}
                error={state.error}
                hasData={
                    !List.empty(state.data.assc) || !List.empty(state.data.ijp)
                }
                supportsTileReload={props.supportsReloadOnError}
                isSubtileContainer={props.isSubtileContainer}
                issueReportingUrl={props.issueReportingUrl}
            >
                <S.NotesTileView>
                    {pipe(
                        [...state.data.ijp, ...state.data.assc],
                        List.filter((v) => isIjpError(v) || isAsscError(v)),
                        List.map((v) => (
                            <lexComponents.MessageSubtile
                                systemMessageType={SystemMessageType.ERROR}
                            >
                                {List.map(
                                    (msg) => ut.translate(msg),
                                    getErrorMessage(v)
                                )}
                            </lexComponents.MessageSubtile>
                        ))
                    )}

                    {!List.empty(ijpNotes) ? (
                        <lexComponents.Subtile
                            tileId={props.tileId}
                            source={
                                List.some(
                                    (data) => data.includes('</a>'),
                                    ijpNotes
                                )
                                    ? [Source.IJP, Source.DJD]
                                    : Source.IJP
                            }
                        >
                            {List.map(
                                (note, i) => (
                                    <SubtileRow
                                        dangerouslySetInnerHTML={{
                                            __html: note,
                                        }}
                                    />
                                ),
                                ijpNotes
                            )}
                        </lexComponents.Subtile>
                    ) : null}

                    {!List.empty(asscNotes) ? (
                        <lexComponents.Subtile
                            tileId={props.tileId}
                            source={Source.ASSC}
                        >
                            {List.map(
                                (note, i) => (
                                    <SubtileRow
                                        dangerouslySetInnerHTML={{
                                            __html: note,
                                        }}
                                    />
                                ),
                                asscNotes
                            )}
                        </lexComponents.Subtile>
                    ) : null}
                </S.NotesTileView>
            </globalComponents.TileWrapper>
        );
    };

    return LexNotesTileView;
}
