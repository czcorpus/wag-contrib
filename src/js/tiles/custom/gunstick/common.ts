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

import { Dict, List, pipe, tuple } from "cnc-tskit";

export interface DataTableItem {
    author:string;
    poemName:string;
    bookId:string;
    bookName:string;
    year:number;
    line1:string;
    line2:string;
    ending:string;
}

export interface Data {
    count:number;
    countRY:{
        [k:string]:{[year:string]:number};
    };
    dataSize:{[year:string]:number};
    table:{
        [k:string]:Array<DataTableItem>
    };
}

export type ChartData = {[verse:string]:Array<{x: number; y: number; z: number}>};


export function transformDataForCharts(data:Data):ChartData {
    return pipe(
        data.countRY,
        Dict.toEntries(),
        List.map(([verse, counts]) => tuple(
            verse,
            pipe(
                counts,
                Dict.toEntries(),
                List.sortedBy(([year,]) => parseInt(year)),
                List.map(
                    ([year, count]) => ({
                        x: parseInt(year),
                        y: count,
                        z: 3
                    })
                )
            )
        )),
        List.sortedBy(
            ([verse, counts]) => List.foldl((acc, curr) => acc + curr.y, 0, counts),
        ),
        List.reverse(),
        List.slice(0, 5),
        Dict.fromEntries()
    );
}

export function mkEmptyData():Data {
    return {
        count: 0,
        countRY: {},
        dataSize: {},
        table: {}
    };
}

export interface DataLoadedPayload {
    data:Data;
}