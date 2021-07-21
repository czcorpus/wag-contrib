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

import { Dict, List, pipe } from 'cnc-tskit';

export interface DataTableItem {
    af:number;
    author:string;
    bookId:string;
    bookName:string;
    phi:number;
    poemId:number;
    poemName:string;
    rf:number;
    year:number;
}

export interface Data {
        count:number;
        size:{
            lemma:{[k:string]:number};
            line:{[k:string]:number};
            poem:{[k:string]:number};
        };
        countY:{[y:string]:number};
        table:Array<DataTableItem>;
        sorting:{
            author:{[name:string]:number};
            bookName:{[name:string]:number};
            poemName:{[name:string]:number};
        };
    }

export type ChartData = Array<{x: number; y: number; z: number}>;


export function transformDataForCharts(data:Data):ChartData {
    return pipe(
        data.countY,
        Dict.toEntries(),
        List.sortedBy(([year,]) => parseInt(year)),
        List.map(
            ([year, count]) => ({
                x: parseInt(year),
                y: count,
                z: 2
            })
        )
    );
}

export function mkEmptyData():Data {
    return {
        count: 0,
        size: {
            lemma: {},
            line: {},
            poem: {}
        },
        countY: {},
        table: [],
        sorting: {
            author: {},
            bookName: {},
            poemName: {}
        }
    };
}