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

import { IActionDispatcher, ViewUtils, useModel } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../page/theme.js';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile.js';
import { UjcCJAModel } from './model.js';
import * as S from './style.js';
import { GlobalComponents } from '../../../views/common/index.js';


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme, model:UjcCJAModel
):TileComponent {

    const globalComponents = ut.getComponents();

    // -------------------- <UjcCJATileView /> -----------------------------------------------

    const UjcCJATileView: React.FC<CoreTileComponentProps> = (props) => {
        const MAX_HEIGHT = 400;
        let [overflows, setOverflows] =  React.useState(false);
        const state = useModel(model);

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={state.isBusy} error={state.error}
                hasData={!!state.data.content}
                backlink={state.backlink}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{corp: 'UJC'}}>
                <S.UjcCJATileView>
                    <S.Preview maxHeight={MAX_HEIGHT}>
                        <div className='container' dangerouslySetInnerHTML={{__html: state.data.content}}
                            ref={el => {
                                if (!el) return;
                                if (el.getBoundingClientRect().height > MAX_HEIGHT) {
                                    setOverflows(true);
                                } else {
                                    setOverflows(false);
                                }
                            }}
                        />
                        <S.Rollover style={{visibility: overflows ? 'visible' : 'hidden'}}>
                            <div id='hidden-data-label'>...{ut.translate("ujc_cja__hidden_data_label")}</div>
                        </S.Rollover>
                    </S.Preview>
                    {state.data.image ? <img src={state.data.image} /> : null}
                </S.UjcCJATileView>
            </globalComponents.TileWrapper>
        );
    }

    return UjcCJATileView;
}
