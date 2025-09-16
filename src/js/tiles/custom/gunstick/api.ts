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

import { Dict, HTTP, List, pipe, tuple } from 'cnc-tskit';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IApiServices } from '../../../appServices.js';
import { ajax$, ResponseType } from '../../../page/ajax.js';
import { DataApi, HTTPHeaders } from '../../../types.js';
import { Data, DataTableItem } from './common.js';
import { IDataStreaming } from '../../../page/streaming.js';

export interface RequestArgs {
    q:string;
    unit:'word'|'lemma';
    author?:string;
    y1?:number;
    y2?:number;
    end?:string;
    detail?:'true'|'false';
}

export interface KSPRequestArgs {
    q:string;
    unit:'word'|'lemma';
    src:'all';
    lang:'cz';
    y1:number;
    y2:number;
}

export interface RawDataTableItem {
    author:string;
    poemName:string;
    bookId:string;
    bookName:string;
    year:string;
    line1:string;
    line2:string;
    ending:string;
}

export interface HTTPResponse {
    count:number;
    countRY:{
        [k:string]:{[year:string]:string};
    };
    dataSize:{[year:string]:string};
    table:{
        [k:string]:Array<RawDataTableItem>
    };
}


export class GunstickApi implements DataApi<RequestArgs, Data> {

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;

    private readonly apiServices:IApiServices;


    constructor(apiURL:string, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
        this.apiServices = apiServices;
    }

    call(dataStreaming:IDataStreaming|null, tileId:number, queryIdx:number, args:RequestArgs|null):Observable<Data> {
        return (
            dataStreaming ?
            dataStreaming.registerTileRequest<HTTPResponse>(
                {
                    tileId,
                    queryIdx,
                    method: HTTP.Method.GET,
                    url: args ? this.apiURL : '',
                    body: {...args, y1: undefined, y2: undefined},
                    contentType: 'application/json',
                    base64EncodeResult: false
                }
            ).pipe(
                map(
                    resp => resp ?
                        resp :
                        {
                            count: 0,
                            countRY: {},
                            dataSize: {},
                            table:{}
                        }
                )
            )
            : ajax$<HTTPResponse>(
                HTTP.Method.GET,
                this.apiURL,
                // TODO: Gunstick API currently cannot deal with y1, y2
                {...args, y1: undefined, y2: undefined}
            )
        ).pipe(
            map(
                resp => ({
                    count: resp.count,
                    countRY: Dict.map(
                        wordFreqs => pipe(
                            wordFreqs,
                            Dict.toEntries(),
                            List.map(
                                ([year, count]) => tuple(parseInt(year), parseInt(count))
                            ),
                            List.filter(
                                ([year, count]) => {
                                    if (args.y1 && year < args.y1) {
                                        return false;
                                    }
                                    if (args.y2 && year > args.y2) {
                                        return false;
                                    }
                                    return true;
                                }
                            ),
                            List.map(
                                ([year, count]) => tuple(year + '', count)
                            ),
                            Dict.fromEntries()
                        ),
                        resp.countRY
                    ),
                    dataSize: Dict.map(
                        size => parseInt(size),
                        resp.dataSize
                    ),
                    table: Dict.map(
                        items => List.map<RawDataTableItem, DataTableItem>(
                            v => ({...v, year: parseInt(v.year)}),
                            items
                        ),
                        resp.table
                    )
                })
            )
        )

    }
}


/**
 * Currently, this is a raw and dirty adapter which extracts JSON data out of an HTML page.
 */
export class GunstickKspApi implements DataApi<KSPRequestArgs, Data> {

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;


    constructor(apiURL:string, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
    }

    call(dataStreaming:IDataStreaming, tileId:number, queryIdx:number, args:KSPRequestArgs):Observable<Data> {
        return ajax$<string>(
            HTTP.Method.GET,
            this.apiURL,
            args,
            {
                responseType: ResponseType.TEXT
            }
        ).pipe(
            map(
                resp => {
                    const srch = /var gunstick = (\{.+\});/.exec(resp);
                    if (srch) {
                        return JSON.parse(srch[1]) as HTTPResponse;
                    }
                    return {
                        count: 0,
                        countRY: {},
                        dataSize: {},
                        table: {}
                    };
                }
            ),
            map(
                resp => ({
                    count: resp.count,
                    countRY: Dict.map(
                        item => Dict.map(
                            count => parseInt(count),
                            item
                        ),
                        resp.countRY
                    ),
                    dataSize: Dict.map(
                        size => parseInt(size),
                        resp.dataSize
                    ),
                    table: Dict.map(
                        items => List.map<RawDataTableItem, DataTableItem>(
                            v => ({...v, year: parseInt(v.year)}),
                            items
                        ),
                        resp.table
                    )
                })
            )
        )

    }
}