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


export interface UjcNeomatArgs {
    q:string;
    maxItems:number;
}


export class UjcNeomatApi implements ResourceApi<UjcNeomatArgs, DataStructure> {

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;

    private readonly apiServices:IApiServices;


    constructor(apiURL:string, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
        this.apiServices = apiServices;
    }

    call(args:UjcNeomatArgs):Observable<DataStructure> {
        return ajax$<DataStructure>(
            HTTP.Method.GET,
            this.apiURL,
            args,
        );
    }

    getSourceDescription(tileId:number, lang:string, corpname:string):Observable<SourceDetails> {
        return rxOf({
            tileId,
            title: this.apiServices.importExternalMessage({
                'cs-CZ': 'Neomat',
                'en-US': 'Neomat'
            }),
            description: this.apiServices.importExternalMessage({
                'cs-CZ': 'Databáze Neomat je budována průběžně od začátku 90. let 20. století, původně jako neologický excerpční materiál pro lexikografické účely. Dala vzniknout dvěma slovníkům – Nová slova v češtině. Slovník neologizmů 1 (1998) a Nová slova v češtině. Slovník neologizmů 2 (2004) a rovněž sborníku statí Neologizmy v dnešní češtině (2005).',
                'en-US': 'Databáze Neomat je budována průběžně od začátku 90. let 20. století, původně jako neologický excerpční materiál pro lexikografické účely. Dala vzniknout dvěma slovníkům – Nová slova v češtině. Slovník neologizmů 1 (1998) a Nová slova v češtině. Slovník neologizmů 2 (2004) a rovněž sborníku statí Neologizmy v dnešní češtině (2005).'
            }),
            author: 'Ústav pro jazyk český AV ČR',
            href: 'http://www.neologismy.cz/'
        })
    }
}