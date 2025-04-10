/*
 * Copyright 2021 Tomas Machalek <tomas.machalek@gmail.com>
 * Copyright 2021 Institute of the Czech National Corpus,
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
import { QueryType } from '../../../query/index.js';
import { init as viewInit } from './views.js';
import {
    TileConf, ITileProvider, TileComponent, TileFactoryArgs, TileFactory,
    DEFAULT_ALT_VIEW_ICON, ITileReloader, AltViewIconProps
} from '../../../page/tile.js';
import { GunstickModel } from './model.js';
import { GunstickApi, KSPRequestArgs } from './api.js';
import { mkEmptyData, Data } from './common.js';
import { LocalizedConfMsg, DataApi } from '../../../types.js';


export interface GunstickTileConf extends TileConf {
    apiURL:string;
    serviceInfoUrl:LocalizedConfMsg;
    pageSize:number;
    y1:number;
    y2:number;
}

/**
 * This tile provides general HTML injection from an external
 * service into the tile. Please use only with trusted APIs and
 * services.
 */
export class GunstickTile implements ITileProvider {

    private readonly tileId:number;

    private readonly dispatcher:IActionDispatcher;

    private readonly appServices:IAppServices;

    private readonly model:GunstickModel;

    private readonly widthFract:number;

    private readonly label:string;

    private readonly api:DataApi<KSPRequestArgs, Data>;

    private view:TileComponent;

    constructor({
        tileId, dispatcher, appServices, useDataStream, ut, theme, widthFract, conf, isBusy,
        queryMatches, domain1}:TileFactoryArgs<GunstickTileConf>
    ) {
        this.tileId = tileId;
        this.dispatcher = dispatcher;
        this.appServices = appServices;
        this.widthFract = widthFract;
        this.api = new GunstickApi(conf.apiURL, useDataStream, appServices);
        this.model = new GunstickModel({
            dispatcher,
            appServices,
            api: this.api,
            queryMatches,
            tileId,
            queryDomain: domain1,
            initState: {
                isBusy: isBusy,
                data: mkEmptyData(),
                error: null,
                isAltViewMode: false,
                isTweakMode: false,
                serviceInfoUrl: appServices.importExternalMessage(conf.serviceInfoUrl),
                page: 1,
                pageSize: conf.pageSize || 10,
                y1: conf.y1,
                y2: conf.y2
            }
        });
        this.label = appServices.importExternalMessage(conf.label || 'html__main_label');
        this.view = viewInit(
            this.dispatcher,
            ut,
            theme,
            this.model
        );
    }

    getIdent():number {
        return this.tileId;
    }

    getLabel():string {
        return this.label;
    }

    getView():TileComponent {
        return this.view;
    }

    getSourceInfoComponent():null {
        return null;
    }

    supportsQueryType(qt:QueryType, domain1:string, domain2?:string):boolean {
        return qt === QueryType.SINGLE_QUERY || qt === QueryType.TRANSLAT_QUERY;
    }

    disable():void {
        this.model.waitForAction({}, (_, syncData)=>syncData);
    }

    getWidthFract():number {
        return this.widthFract;
    }

    supportsTweakMode(): boolean {
        return true;
    }

    supportsAltView():boolean {
        return true;
    }

    supportsSVGFigureSave():boolean {
        return false;
    }

    getAltViewIcon():AltViewIconProps {
        return DEFAULT_ALT_VIEW_ICON;
    }

    registerReloadModel(model:ITileReloader):boolean {
        model.registerModel(this, this.model);
        return true;
    }

    getBlockingTiles():Array<number> {
        return [];
    }

    supportsMultiWordQueries():boolean {
        return false;
    }

    getIssueReportingUrl():null {
        return null;
    }
}

export const init:TileFactory<GunstickTileConf> = {

    sanityCheck: (args) => [],

    create: (args) => new GunstickTile(args)
};