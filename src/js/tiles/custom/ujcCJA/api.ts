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

import { Dict, HTTP, List, pipe } from 'cnc-tskit';
import { Observable, of as rxOf } from 'rxjs';
import { IApiServices } from '../../../appServices.js';
import { ajax$ } from '../../../page/ajax.js';
import { ResourceApi, SourceDetails, HTTPHeaders } from '../../../types.js';
import { DataStructure } from './common.js';
import { Backlink } from '../../../page/tile.js';
import { IDataStreaming } from '../../../page/streaming.js';


export interface UjcCJAArgs {
    q:string;
}


export class UjcCJAApi implements ResourceApi<UjcCJAArgs, DataStructure> {

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;

    private readonly useDataStream:boolean;

    private readonly apiServices:IApiServices;


    constructor(apiURL:string, useDataStream:boolean, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
        this.useDataStream = useDataStream;
        this.apiServices = apiServices;
    }

    private prepareArgs(queryArgs:{[k:string]:any}):string {
        return pipe(
            {
                ...queryArgs
            },
            Dict.toEntries(),
            List.filter(
                ([k, v]) => v !== undefined
            ),
            List.map(
                ([k, v]) => `${k}=${encodeURIComponent(v)}`
            ),
            x => x.join('&')
        )
    }

    call(streaming:IDataStreaming, tileId:number, queryIdx:number, queryArgs:UjcCJAArgs):Observable<DataStructure> {
        if (this.useDataStream) {
            return streaming.registerTileRequest<DataStructure>(
                {
                    tileId,
                    queryIdx,
                    method: HTTP.Method.GET,
                    url: this.apiURL + '?' + this.prepareArgs(queryArgs),
                    body: {},
                    contentType: 'application/json',
                }
            );
        }
        
        return ajax$<DataStructure>(
            HTTP.Method.GET,
            this.apiURL,
            queryArgs,
        );
    }

    getSourceDescription(streaming:IDataStreaming, tileId:number, lang:string, corpname:string):Observable<SourceDetails> {
        return rxOf({
            tileId,
            title: this.apiServices.importExternalMessage({
                'cs-CZ': 'Český jazykový atlas',
                'en-US': 'Český jazykový atlas UNTRANSLATED'
            }),
            description: this.apiServices.importExternalMessage({
                'cs-CZ': 'Český jazykový atlas v šesti svazcích zpřístupňuje výsledky rozsáhlého přímého výzkumu českých nářečí a běžné mluvy, provedeného pracovníky dialektologického oddělení Ústavu pro jazyk český AV ČR v Praze a v Brně. Tímto dílem se završuje badatelské úsilí české dialektologie, jež se jako vědní obor začala u nás rozvíjet už od šedesátých let minulého století, a zároveň se jím významně obohacuje naše poznání národního jazyka o dimenzi prostorovou. Atlas totiž dokumentárně znázorňuje vnitřní zeměpisné rozrůznění mluveného nespisovného jazyka na území Čech, Moravy a příslušné části Slezska, a to jak v rovině hláskoslovné a tvaroslovné, tak i slovotvorné, lexikální a syntaktické.\nElektronická podoba Českého jazykového atlasu obsahuje první tři díly ČJA (z plánovaných šesti), které jsou zaměřeny na nářeční slovní zásobu. HTML verze umožňuje pokročilé vyhledávání v hesláři a v rejstříku podle zadané položky nebo jazykového dokladu. K nahlédnutí jsou mapy pravidelných regionálních obměn a výklad o historii dialektologického výzkumu a metodologii zpracování nářečního materiálu v ČJA.',
                'en-US': 'Český jazykový atlas v šesti svazcích zpřístupňuje výsledky rozsáhlého přímého výzkumu českých nářečí a běžné mluvy, provedeného pracovníky dialektologického oddělení Ústavu pro jazyk český AV ČR v Praze a v Brně. Tímto dílem se završuje badatelské úsilí české dialektologie, jež se jako vědní obor začala u nás rozvíjet už od šedesátých let minulého století, a zároveň se jím významně obohacuje naše poznání národního jazyka o dimenzi prostorovou. Atlas totiž dokumentárně znázorňuje vnitřní zeměpisné rozrůznění mluveného nespisovného jazyka na území Čech, Moravy a příslušné části Slezska, a to jak v rovině hláskoslovné a tvaroslovné, tak i slovotvorné, lexikální a syntaktické.\nElektronická podoba Českého jazykového atlasu obsahuje první tři díly ČJA (z plánovaných šesti), které jsou zaměřeny na nářeční slovní zásobu. HTML verze umožňuje pokročilé vyhledávání v hesláři a v rejstříku podle zadané položky nebo jazykového dokladu. K nahlédnutí jsou mapy pravidelných regionálních obměn a výklad o historii dialektologického výzkumu a metodologii zpracování nářečního materiálu v ČJA. UNTRANSLATED'
            }),
            author: 'Ústav pro jazyk český AV ČR',
            href: 'https://ujc.avcr.cz/elektronicke-slovniky-a-zdroje/Cesky_jazykovy_atlas.html'
        });
    }

    getBacklink(queryId:number, subqueryId?:number):Backlink|null {
        return {
            queryId,
            label: 'heslo v Českém jazykovém atlasu',
        };
    }
}