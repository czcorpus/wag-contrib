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
import { map, Observable, of as rxOf } from 'rxjs';
import { IApiServices } from '../../../appServices';
import { cachedAjax$ } from '../../../page/ajax';
import { ResourceApi, SourceDetails, HTTPHeaders, IAsyncKeyValueStore } from '../../../types';
import { Data } from './common';


export interface UjcDictionaryArgs {
    q:string;
}


export class UjcDictionaryApi implements ResourceApi<UjcDictionaryArgs, Data> {

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

    call(args:UjcDictionaryArgs):Observable<Data> {
        return cachedAjax$<string>(this.cache)(
            HTTP.Method.GET,
            this.apiURL,
            args,
        ).pipe(
            map(v => ({rawData: v}))
        );
    }

    getSourceDescription(tileId:number, lang:string, corpname:string):Observable<SourceDetails> {
        return rxOf({
            tileId,
            title: this.apiServices.importExternalMessage({
                'cs-CZ': 'Akademický slovník současné češtiny',
                'en-US': 'Academic dictionary of contemporary Czech'
            }),
            description: this.apiServices.importExternalMessage({
                'cs-CZ': 'Původní webová aplikace vznikla v rámci grantového projektu Programu aplikovaného výzkumu a vývoje národní a kulturní identity (NAKI) Ministerstva kultury ČR – Nová cesta k modernímu jednojazyčnému výkladovému slovníku současné češtiny (DF13P01OVV011). Její nová verze je rozvíjena a financována z institucionálních prostředků Ústavu pro jazyk český AV ČR, v. v. i.',
                'en-US': 'Původní webová aplikace vznikla v rámci grantového projektu Programu aplikovaného výzkumu a vývoje národní a kulturní identity (NAKI) Ministerstva kultury ČR – Nová cesta k modernímu jednojazyčnému výkladovému slovníku současné češtiny (DF13P01OVV011). Její nová verze je rozvíjena a financována z institucionálních prostředků Ústavu pro jazyk český AV ČR, v. v. i.'
            }),
            author: 'Ústav pro jazyk český AV ČR',
            href: 'https://slovnikcestiny.cz/o_slovniku.php'
        })
    }
}