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

import { Dict, HTTP, List, pipe } from 'cnc-tskit';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { IApiServices } from '../../../appServices.js';
import { ajax$, ResponseType } from '../../../page/ajax.js';
import { PoSValues } from '../../../postag.js';
import { DataApi, HTTPHeaders } from '../../../types.js';
import { Data } from './common.js';
import { IDataStreaming } from '../../../page/streaming.js';


export function posToIndex(pos:PoSValues):number|undefined {
    return {
        [PoSValues.NOUN]: 0,
        [PoSValues.ADJECTIVE]: 1,
        [PoSValues.PRONOUN]: 2,
        [PoSValues.NUMERAL]: 3,
        [PoSValues.VERB]: 4,
        [PoSValues.ADVERB]: 5,
        [PoSValues.PREPOSITION]: 6,
        [PoSValues.CONJUNCTION]: 7,
        [PoSValues.PARTICLE]: 8,
        [PoSValues.INTERJECTION]: 9
    }[pos];
}

export interface KSPRequestArgs {
    q:string;
    y1?:unknown;
    y2?:unknown;
    a?:unknown;
    b?:unknown;
    p?:unknown;
    sort:'a';
    src:'all';
    'pos[1]'?:'on';
    'pos[2]'?:'on';
    'pos[3]'?:'on';
    'pos[4]'?:'on';
    'pos[5]'?:'on';
    'pos[6]'?:'on';
    'pos[7]'?:'on';
    'pos[8]'?:'on';
    'pos[9]'?:'on';
    'pos[10]'?:'on';
    met:'kw';
    min:number;
    alpha:10|100;
    lang:'cz';
}

export interface RawDataTableItem {
    af:string; // numeric
    author:string;
    bookId:string;
    bookName:string;
    phi:string; // float
    poemId:string; // int?
    poemName:string;
    rf:string; // int?
    year:string; // int
}

export interface HTTPResponse {
    count:number;
    size:{
        lemma:{[k:number]:string};
        line:{[k:number]:string};
        poem:{[k:number]:string};
    };
    countY:{[y:number]:number};
    table:Array<RawDataTableItem>;
    sorting:{
        author:{[name:string]:number};
        bookName:{[name:string]:number};
        poemName:{[name:string]:number};
    };
}

function transformDictKeys<T>(data:{[k:number]:T}):{[k:string]:T} {
    const ans:{[k:string]:T} = {};
    for (let k in data) {
        ans[k + ''] = data[k];
    }
    return ans;
}

/**
 * Currently, this is a raw and dirty adapter which extracts JSON data out of an HTML page.
 */
export class HexKspApi implements DataApi<KSPRequestArgs, Data> {

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;

    protected readonly useDataStream:boolean;

    protected apiServices:IApiServices;


    constructor(apiURL:string, useDataStream:boolean, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.useDataStream = useDataStream;
        this.apiServices = apiServices;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
    }

    call(dataStreaming:IDataStreaming, tileId:number, queryIdx:number, args:KSPRequestArgs|null):Observable<Data> {

        return (
            this.useDataStream ?
                dataStreaming.registerTileRequest<string>(
                    {
                        tileId,
                        queryIdx,
                        method: HTTP.Method.GET,
                        url: args ? this.apiURL : '',
                        body: args,
                        contentType: 'text/plain',
                        base64EncodeResult: true
                    }
                ).pipe(
                    map(
                        resp => resp ?
                            resp :
                            // here we fake an empty response from the server
                            'var hex = { "size": 0, "line": {}, "poem": {}, "table": [], "sorting": {} };'
                    )
                ) :
                ajax$<string>(
                    HTTP.Method.GET,
                    this.apiURL,
                    args,
                    {
                        responseType: ResponseType.TEXT
                    }
                )
        ).pipe(
            map<string, HTTPResponse>(
                (resp:string) => {
                    const srch = /var hex = (\{.+\});/.exec(resp);
                    if (srch) {
                        return JSON.parse(srch[1]);
                    }
                    return JSON.parse(resp);
                }
            ),
            map(
                (resp:HTTPResponse) => ({
                    count: resp.count,
                    size: {
                        lemma: pipe(
                            transformDictKeys(resp.size.lemma),
                            Dict.map(v => parseInt(v))
                        ),
                        line: pipe(
                            transformDictKeys(resp.size.line),
                            Dict.map(v => parseInt(v))
                        ),
                        poem: pipe(
                            transformDictKeys(resp.size.poem),
                            Dict.map(v => parseInt(v))
                        )
                    },
                    countY: transformDictKeys(resp.countY),
                    table: pipe(
                        resp.table,
                        List.map(item => ({
                            af: parseInt(item.af),
                            author: item.author,
                            bookId: item.bookId,
                            bookName: item.bookName,
                            phi: parseFloat(item.phi),
                            poemId: parseInt(item.poemName),
                            poemName: item.poemName,
                            rf: parseInt(item.rf),
                            year: parseInt(item.year)
                        }))
                    ),
                    sorting:{
                        author: transformDictKeys(resp.sorting.author),
                        bookName: transformDictKeys(resp.sorting.bookName),
                        poemName: transformDictKeys(resp.sorting.poemName)
                    }
                })
            )
        )

    }
}