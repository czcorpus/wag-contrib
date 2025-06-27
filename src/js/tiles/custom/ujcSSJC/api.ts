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

import { HTTP } from 'cnc-tskit';
import { Observable, of as rxOf } from 'rxjs';
import { IApiServices } from '../../../appServices.js';
import { ajax$ } from '../../../page/ajax.js';
import { ResourceApi, SourceDetails, HTTPHeaders } from '../../../types.js';
import { DataStructure } from './common.js';
import { Backlink } from '../../../page/tile.js';
import { IDataStreaming } from '../../../page/streaming.js';


export interface UjcSSJCArgs {
    q:string|Array<string>;
}


export class UjcSSJCApi implements ResourceApi<UjcSSJCArgs, DataStructure> {

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;

    private readonly apiServices:IApiServices;


    constructor(apiURL:string, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
        this.apiServices = apiServices;
    }

    call(streaming:IDataStreaming, tileId:number, queryIdx:number, queryArgs:UjcSSJCArgs):Observable<DataStructure> {
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
                'cs-CZ': 'Slovník spisovného jazyka českého (1960–1971)',
                'en-US': 'Slovník spisovného jazyka českého (1960–1971) UNTRANSLATED'
            }),
            description: this.apiServices.importExternalMessage({
                'cs-CZ': 'Slovník spisovného jazyka českého vycházel knižně v letech 1960–1971 a obsahuje 197 200 hesel české slovní zásoby s jejich výklady a typickými příklady užití. Ústav pro jazyk český AV ČR v roce 2011 zveřejnil jeho digitalizovanou podobu.',
                'en-US': 'Slovník spisovného jazyka českého vycházel knižně v letech 1960–1971 a obsahuje 197 200 hesel české slovní zásoby s jejich výklady a typickými příklady užití. Ústav pro jazyk český AV ČR v roce 2011 zveřejnil jeho digitalizovanou podobu. UNTRANSLATED'
            }),
            author: 'Ústav pro jazyk český AV ČR',
            href: 'https://ujc.avcr.cz/elektronicke-slovniky-a-zdroje/Slovnik_spisovneho_jazyka_ceskeho.html'
        })
    }

    getBacklink(queryId:number, subqueryId?:number):Backlink|null {
        return {
            queryId,
            label: 'heslo ve Slovníku spisovného jazyka českého',
        };
    }
}