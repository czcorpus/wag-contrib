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
import { IActionDispatcher } from 'kombo';

import { IAppServices } from '../../../appServices.js';
import {
    findCurrQueryMatch,
    LemmatizationLevel,
    QueryType,
} from '../../../query/index.js';
import { init as viewInit } from './views/views.js';
import {
    TileConf,
    ITileProvider,
    TileComponent,
    TileFactory,
    TileFactoryArgs,
    DEFAULT_ALT_VIEW_ICON,
    ITileReloader,
    AltViewIconProps,
    lemLevelSupport,
} from '../../../page/tile.js';
import { LexOverviewModel } from './model.js';
import { List } from 'cnc-tskit';
import { Source } from '../lexCommon/types/enums.js';
import { isLexQueryMatch, LexItem } from '../lexCommon/types/dictionary.js';

export interface LexOverviewTileConf extends TileConf {}

export class LexOverviewTile implements ITileProvider {
    private readonly tileId: number;

    private readonly dispatcher: IActionDispatcher;

    private readonly appServices: IAppServices;

    private readonly model: LexOverviewModel;

    private readonly widthFract: number;

    private view: TileComponent;

    private readonly readDataFromTile: number;

    private readonly configuredLemLevels: Array<LemmatizationLevel>;

    constructor({
        tileId,
        dispatcher,
        appServices,
        ut,
        theme,
        widthFract,
        conf,
        isBusy,
        queryMatches,
        readDataFromTile,
        dependentTiles,
    }: TileFactoryArgs<LexOverviewTileConf>) {
        this.tileId = tileId;
        this.dispatcher = dispatcher;
        this.appServices = appServices;
        this.widthFract = widthFract;
        this.configuredLemLevels = conf.lemmatizationLevels || [];
        this.readDataFromTile = readDataFromTile;

        const currQueryMatch = findCurrQueryMatch(queryMatches[0]);
        var variants: Array<LexItem> = [];
        var mainSource: Source = undefined;
        var usedCorpus: string = undefined;
        if (isLexQueryMatch(currQueryMatch)) {
            variants = currQueryMatch.extraData.variants;
            mainSource = currQueryMatch.extraData.mainSource;
            usedCorpus = currQueryMatch.extraData.corpusId;
            // in case no variants available, use corpus data
            if (List.empty(variants)) {
                variants = [
                    {
                        lemma: currQueryMatch.lemma,
                        pos: currQueryMatch.pos[0].value,
                        corpusEntry: {
                            count: currQueryMatch.abs,
                            ipm: currQueryMatch.ipm,
                        },
                    } as LexItem,
                ];
                mainSource = Source.Corpus;
            }
        } else {
            // empty data
            variants = [
                {
                    lemma: currQueryMatch.lemma || currQueryMatch.word,
                } as LexItem,
            ];
        }

        this.model = new LexOverviewModel({
            dispatcher,
            appServices,
            tileId,
            readDataFromTile:
                typeof readDataFromTile === 'number' ? readDataFromTile : null,
            dependentTiles,
            lemLevelSupport: this.configuredLemLevels,
            initState: {
                isBusy: isBusy,
                queryMatch: currQueryMatch,
                referenceCorpus: usedCorpus,
                mainSource,
                variants,
                selectedVariantIdx: 0,
                sourceData: {
                    assc: null,
                    ijp: null,
                },
                error: undefined,
                backlink: undefined,
                playingAudio: false,
            },
        });
        this.view = viewInit(this.dispatcher, ut, theme, this.model);
    }

    getIdent(): number {
        return this.tileId;
    }

    getLabel(): string {
        return null;
    }

    getView(): TileComponent {
        return this.view;
    }

    getSourceInfoComponent(): null {
        return null;
    }

    supportsQueryType(
        qt: QueryType,
        domain1: string,
        domain2?: string
    ): boolean {
        return qt === 'single';
    }

    disable(): void {
        this.model.waitForAction({}, (_, syncData) => syncData);
    }

    getWidthFract(): number {
        return this.widthFract;
    }

    supportsTweakMode(): boolean {
        return false;
    }

    supportsAltView(): boolean {
        return false;
    }

    supportsSVGFigureSave(): boolean {
        return false;
    }

    registerReloadModel(model: ITileReloader): boolean {
        model.registerModel(this, this.model);
        return true;
    }

    getBlockingTiles(): Array<number> {
        return [];
    }

    supportsMultiWordQueries(): boolean {
        return false;
    }

    getIssueReportingUrl(): null {
        return null;
    }

    getAltViewIcon(): AltViewIconProps {
        return DEFAULT_ALT_VIEW_ICON;
    }

    getReadDataFrom(): number | null {
        return this.readDataFromTile;
    }

    hideOnNoData(): boolean {
        return false;
    }

    supportsLemmatizationLevel(ll: LemmatizationLevel): boolean {
        return lemLevelSupport(this.configuredLemLevels, ll);
    }
}

export const init: TileFactory<LexOverviewTileConf> = {
    sanityCheck: (args) => [],

    create: (args) => new LexOverviewTile(args),
};
