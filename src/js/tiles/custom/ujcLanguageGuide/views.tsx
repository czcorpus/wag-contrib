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

import { IActionDispatcher, BoundWithProps, ViewUtils } from 'kombo';
import * as React from 'react';
import { Theme } from '../../../page/theme';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile';
import { GlobalComponents } from '../../../views/common';
import { UjcLGuideModel, UjcLGuideModelState } from './model';
import * as S from './style';


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme, model:UjcLGuideModel
):TileComponent {

    const globalComponents = ut.getComponents();

    // -------------------- <UjcLanguageGuideTileView /> -----------------------------------------------

    const UjcLanguageGuideTileView: React.FC<UjcLGuideModelState & CoreTileComponentProps> = (props) => {

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={props.data !== null && !!props.data.heading}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{ corp: 'UJC', url: props.serviceInfoUrl }}>
                <S.UjcLanguageGuideTileView>
                    {JSON.stringify(props.data)}
                </S.UjcLanguageGuideTileView>
            </globalComponents.TileWrapper>
        );
    }

    return BoundWithProps(UjcLanguageGuideTileView, model);
}
