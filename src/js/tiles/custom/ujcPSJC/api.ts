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


export interface UjcPSJCArgs {
    q:string|Array<string>;
}


export class UjcPSJCApi implements ResourceApi<UjcPSJCArgs, DataStructure> {

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;

    private readonly apiServices:IApiServices;


    constructor(apiURL:string, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
        this.apiServices = apiServices;
    }

    call(args:UjcPSJCArgs):Observable<DataStructure> {
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
                'cs-CZ': 'Příruční slovník jazyka českého (1935–1957)',
                'en-US': 'Příruční slovník jazyka českého (1935–1957) UNTRANSLATED'
            }),
            description: this.apiServices.importExternalMessage({
                'cs-CZ': 'Příruční slovník jazyka českého je výkladovým slovníkem velkého rozsahu, čítá 8 dílů v 9 svazcích a dodatky, které nakonec nikdy nevyšly. Vznikal v letech 1935–1957. Nejedná se o slovník kodifikační, ale o vědecký deskriptivní (popisný) slovník, který se zaměřoval na upevnění spisovné slovní zásoby. Slovník přinášel oproti svým předchůdcům dokonalejší lexikografický popis slovní zásoby; zachycoval polysémii hesla, obsahoval propracovanější definici významu, další podstatnou částí hesla byly doklady uváděné formou citátů (proto bývá někdy PSJČ nazýván slovníkem citátovým). Snaha o ujasnění hranic mezi spisovností a nespisovností přispěla také k tomu, že přinesl i první významný pokus o stylistické hodnocení lexikálních jednotek. Digitalizovaná podoba Příručního slovníku jazyka českého byla zpřístupněna v roce 2007.',
                'en-US': 'Příruční slovník jazyka českého je výkladovým slovníkem velkého rozsahu, čítá 8 dílů v 9 svazcích a dodatky, které nakonec nikdy nevyšly. Vznikal v letech 1935–1957. Nejedná se o slovník kodifikační, ale o vědecký deskriptivní (popisný) slovník, který se zaměřoval na upevnění spisovné slovní zásoby. Slovník přinášel oproti svým předchůdcům dokonalejší lexikografický popis slovní zásoby; zachycoval polysémii hesla, obsahoval propracovanější definici významu, další podstatnou částí hesla byly doklady uváděné formou citátů (proto bývá někdy PSJČ nazýván slovníkem citátovým). Snaha o ujasnění hranic mezi spisovností a nespisovností přispěla také k tomu, že přinesl i první významný pokus o stylistické hodnocení lexikálních jednotek. Digitalizovaná podoba Příručního slovníku jazyka českého byla zpřístupněna v roce 2007. UNTRANSLATED'
            }),
            author: 'Ústav pro jazyk český AV ČR',
            href: 'https://ujc.avcr.cz/elektronicke-slovniky-a-zdroje/Prirucni_slovik_jazyka_ceskeho.html'
        })
    }
}