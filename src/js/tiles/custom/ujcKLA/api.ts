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


export interface UjcKLAArgs {
    q:string|Array<string>;
    maxImages:number;
}


export class UjcKLAApi implements ResourceApi<UjcKLAArgs, DataStructure> {

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;

    private readonly apiServices:IApiServices;


    constructor(apiURL:string, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
        this.apiServices = apiServices;
    }

    call(tileId:number, multicastRequest:boolean, queryArgs:UjcKLAArgs):Observable<DataStructure> {
        return ajax$<DataStructure>(
            HTTP.Method.GET,
            this.apiURL,
            queryArgs,
        );
    }

    getSourceDescription(tileId:number, multicastRequest:boolean, lang:string, corpname:string):Observable<SourceDetails> {
        return rxOf({
            tileId,
            title: this.apiServices.importExternalMessage({
                'cs-CZ': 'Kartotéka lexikálního archivu (1911–1991)',
                'en-US': 'Kartotéka lexikálního archivu (1911–1991) UNTRANSLATED'
            }),
            description: this.apiServices.importExternalMessage({
                'cs-CZ': 'Kartotéka novočeského lexikálního archivu obsahuje excerpční materiál, na jehož základě vznikly všechny reprezentativní výkladové slovníky češtiny. Základní, tzv. 1. materiál archivu, sloužil jako východisko pro zpracování Příručního slovníku jazyka českého. Sběr jazykových dat probíhal na základě promyšlených excerpčních pravidel (z roku 1911, 1917). Lístkové výpisky byly pořizovány zejména z umělecké literatury, ale i z literatury odborné, výběrově byly excerpovány noviny, časopisy a překladová literatura. Jako dolní hranice pro excerpci byl stanoven rok 1770, díky čemuž se podařilo zdokumentovat též češtinu z obrozeneckého období. V průběhu let byly sbírky lexikálního materiálu postupně doplňovány v souladu s aktuálními úkoly pracoviště.',
                'en-US': 'Kartotéka novočeského lexikálního archivu obsahuje excerpční materiál, na jehož základě vznikly všechny reprezentativní výkladové slovníky češtiny. Základní, tzv. 1. materiál archivu, sloužil jako východisko pro zpracování Příručního slovníku jazyka českého. Sběr jazykových dat probíhal na základě promyšlených excerpčních pravidel (z roku 1911, 1917). Lístkové výpisky byly pořizovány zejména z umělecké literatury, ale i z literatury odborné, výběrově byly excerpovány noviny, časopisy a překladová literatura. Jako dolní hranice pro excerpci byl stanoven rok 1770, díky čemuž se podařilo zdokumentovat též češtinu z obrozeneckého období. V průběhu let byly sbírky lexikálního materiálu postupně doplňovány v souladu s aktuálními úkoly pracoviště. UNTRANSLATED'
            }),
            author: 'Ústav pro jazyk český AV ČR',
            href: 'https://ujc.avcr.cz/elektronicke-slovniky-a-zdroje/kartoteka_lexikalniho_archivu.html'
        })
    }

    getBacklink(queryId:number):Backlink|null {
        return {
            queryId,
            label: 'heslo v Kartotéce lexikálního archivu',
        };
    }
}