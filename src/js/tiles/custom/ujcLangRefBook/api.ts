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
import { IApiServices } from '../../../appServices';
import { cachedAjax$ } from '../../../page/ajax';
import { ResourceApi, SourceDetails, HTTPHeaders, IAsyncKeyValueStore } from '../../../types';
import { Data } from './common';


export interface UjcLGuideRequestArgs {
    q:string;
    direct?:number;
}


export class UjcLGuideApi implements ResourceApi<UjcLGuideRequestArgs, Data> {

    private readonly cache:IAsyncKeyValueStore;

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;

    private readonly apiServices:IApiServices;


    constructor(cache:IAsyncKeyValueStore, apiURL:string, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
        this.cache = cache;
        this.apiServices = apiServices;
    }

    call(args:UjcLGuideRequestArgs):Observable<Data> {
        return cachedAjax$<Data>(this.cache)(
            HTTP.Method.GET,
            this.apiURL,
            args,
        )
    }

    getSourceDescription(tileId:number, lang:string, corpname:string):Observable<SourceDetails> {
        return rxOf({
            tileId,
            title: this.apiServices.importExternalMessage({
                'cs-CZ': 'Internetová jazyková příručka',
                'en-US': 'Internet Language Reference Book'
            }),
            description: this.apiServices.importExternalMessage({
                'cs-CZ': 'Internetová jazyková příručka (IJP) vznikla a byla rozvíjena s podporou projektu Jazyková poradna na internetu, č. 1ET200610406, řešeného v letech 2004–2008, projektu LINDAT/CLARIN Institut pro analýzu, zpracování a distribuci lingvistických dat, č. LM2010013, řešeného v letech 2013–2015, a projektu LINDAT/CLARIN Jazyková výzkumná infrastruktura v ČR, č. LM2015071, řešeného v letech 2016–2019. Jde o první jazykovou pomůcku svého druhu.',
                'en-US': 'Internetová jazyková příručka (IJP) vznikla a byla rozvíjena s podporou projektu Jazyková poradna na internetu, č. 1ET200610406, řešeného v letech 2004–2008, projektu LINDAT/CLARIN Institut pro analýzu, zpracování a distribuci lingvistických dat, č. LM2010013, řešeného v letech 2013–2015, a projektu LINDAT/CLARIN Jazyková výzkumná infrastruktura v ČR, č. LM2015071, řešeného v letech 2016–2019. Jde o první jazykovou pomůcku svého druhu.'
            }),
            author: 'Ústav pro jazyk český AV ČR',
            href: 'https://prirucka.ujc.cas.cz/?id=_about'
        })
    }
}