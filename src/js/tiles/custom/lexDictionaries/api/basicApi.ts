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

import { Dict, HTTP, List, pipe } from 'cnc-tskit';
import { map, Observable, of as rxOf } from 'rxjs';
import { IApiServices } from '../../../../appServices.js';
import { ajax$ } from '../../../../page/ajax.js';
import { SourceDetails, HTTPHeaders } from '../../../../types.js';
import { Backlink } from '../../../../page/tile.js';
import { IDataStreaming } from '../../../../page/streaming.js';
import { LexDictApi, ApiType } from './types.js';


export interface PSJCDataStructure {
	entries: Array<string>;
	query: string;
}

export interface SSJCDataStructure {
	entries: Array<{
		sti: number,
		payload: string;
	}>;
	query:string;
}

export interface UjcBasicArgs {
    q:string|Array<string>;
}


class UjcBasicApi<T> implements LexDictApi<UjcBasicArgs, T> {

    protected readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;

    protected readonly apiServices:IApiServices;

    constructor(apiURL:string, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
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

    call(streaming:IDataStreaming|null, tileId:number, queryIdx:number, queryArgs:UjcBasicArgs):Observable<T> {
        return streaming ?
            streaming.registerTileRequest<T>(
                {
                    tileId,
                    queryIdx,
                    method: HTTP.Method.GET,
                    url: this.apiURL + '?' + this.prepareArgs(queryArgs),
                    body: {},
                    contentType: 'application/json',
                }
            ) :
            ajax$<T>(
                HTTP.Method.GET,
                this.apiURL,
                queryArgs,
            );
    }

    getBacklink(queryId:number, subqueryId?:number):Backlink|null {
        return {
            queryId,
            label: this.apiServices.importExternalMessage({
                'cs-CZ': 'slovo ve slovníku',
                'en-US': 'word in dictionary',
            }),
        };
    }

    getSourceDescription(streaming:IDataStreaming, tileId:number, lang:string, corpname:string):Observable<SourceDetails> {
        throw new Error('Method not implemented.');
    }

    getBacklinkURL(term:string):URL {
        throw new Error('Method not implemented.');
    }
}

export class UjcPSJCApi extends UjcBasicApi<PSJCDataStructure> {

    getSourceDescription(streaming:IDataStreaming, tileId:number, lang:string, corpname:string):Observable<SourceDetails> {
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

    getBacklinkURL(term:string):URL {
        const backlinkUrl = new URL('https://psjc.ujc.cas.cz/search.php');
        backlinkUrl.searchParams.set('hledej', 'Hledej');
        backlinkUrl.searchParams.set('heslo', term);
        backlinkUrl.searchParams.set('where', 'hesla');
        backlinkUrl.searchParams.set('zobraz_ps', 'ps');
        backlinkUrl.searchParams.set('not_initial', '1');
        return backlinkUrl;
    }
}

export class UjcSSJCApi extends UjcBasicApi<SSJCDataStructure> {

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

    getBacklinkURL(term:string):URL {
        const backlinkUrl = new URL('https://ssjc.ujc.cas.cz/search.php');
        backlinkUrl.searchParams.set('hledej', 'Hledat');
        backlinkUrl.searchParams.set('heslo', term);
        backlinkUrl.searchParams.set('where', 'hesla');
        backlinkUrl.searchParams.set('hsubstr', 'no');
        return backlinkUrl;
    }
}