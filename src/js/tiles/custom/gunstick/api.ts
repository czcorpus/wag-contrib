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

import { Dict, HTTP, List } from 'cnc-tskit';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IApiServices } from '../../../appServices';
import { cachedAjax$ } from '../../../page/ajax';
import { DataApi, HTTPHeaders, IAsyncKeyValueStore } from '../../../types';
import { Data, DataTableItem } from './common';

export interface RequestArgs {
    q:string;
    unit:'word'|'lemma';
    author?:string;
    y1?:number;
    y2?:number;
    end?:string;
    detail?:'true'|'false';
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

    private readonly cache:IAsyncKeyValueStore;

    private readonly apiURL:string;

    private readonly customHeaders:HTTPHeaders;


    constructor(cache:IAsyncKeyValueStore, apiURL:string, apiServices:IApiServices) {
        this.apiURL = apiURL;
        this.customHeaders = apiServices.getApiHeaders(apiURL) || {};
        this.cache = cache;
    }

    call(args:RequestArgs):Observable<Data> {
        return cachedAjax$<HTTPResponse>(this.cache)(
            HTTP.Method.GET,
            this.apiURL,
            args
        ).pipe(
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