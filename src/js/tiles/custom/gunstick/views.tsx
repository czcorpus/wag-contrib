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

import { IActionDispatcher, BoundWithProps, ViewUtils } from 'kombo';
import * as React from 'react';
import { Dict, List, pipe, tuple } from 'cnc-tskit';
import { Theme } from '../../../page/theme';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile';
import { GlobalComponents } from '../../../views/common';
import { GunstickModel, GunstickModelState } from './model';
import { ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Legend, Scatter, Tooltip,
    ResponsiveContainer } from 'recharts';
import { ChartData, Data, transformDataForCharts } from './common';


export function init(dispatcher:IActionDispatcher, ut:ViewUtils<GlobalComponents>, theme:Theme, model:GunstickModel):TileComponent {

    const globalComponents = ut.getComponents();


    const createColorMapping = (data:ChartData):(v:number|string)=>string => {
        return theme.categoryPalette(pipe(
            data,
            Dict.toEntries(),
            List.map(([verse,]) => verse)
        ));
    }

    const rangeOf = (data:ChartData):[number, number] => {
        const item = List.head(data[List.head(Dict.keys(data))]);
        return pipe(
            data,
            Dict.toEntries(),
            List.flatMap(([,counts]) => counts),
            List.foldl(
                ([min, max], curr) => {
                    return tuple(
                        Math.min(min, curr.x),
                        Math.max(max, curr.x)
                    )
                },
                tuple(item.x, item.x)
            )
        );
    }


    const Chart:React.FC<{
        data:ChartData;
        isMobile:boolean;
        widthFract:number;

    }> = (props) => {

        const mapping = createColorMapping(props.data);
        return (
            <globalComponents.ResponsiveWrapper minWidth={props.isMobile ? undefined : 250}
                                        widthFract={props.widthFract} render={(width:number, height:number) => (
                <ScatterChart width={Math.max(100, width)} height={Math.max(350, height)} margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name="year" type="number" unit="" domain ={rangeOf(props.data)} />
                    <YAxis dataKey="y" name="count" unit="" type="number" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    {pipe(
                        props.data,
                        Dict.toEntries(),
                        List.map(
                            ([verse, counts]) => (
                                <Scatter key={`item:${verse}`} name={verse} data={counts} fill={mapping(verse)} />
                            ),
                        )
                    )}
                </ScatterChart>)} />
        );
    };


    const Table:React.FC<{
        data:Data;
    }> = (props) => (
        <div style={{maxHeight: '20em', overflowY: 'auto'}}>
            <h2>nalezeno: {props.data.count}</h2>
            <p>zobrazují se pouze nejfrekventovanější položky</p>
            <dl>
                {pipe(
                    props.data.countRY,
                    Dict.toEntries(),
                    List.map(([rhyme, counts]) => (
                        <React.Fragment key={`item:${rhyme}`}>
                            <dt>{rhyme}</dt>
                            <dd>
                                <span>
                                    {pipe(
                                        counts,
                                        Dict.toEntries(),
                                        List.sortedBy(([year,]) => parseInt(year)),
                                        List.map(([year, count]) => (
                                            <React.Fragment key={`y:${year}`}>
                                                <strong>{year}</strong>: {count}
                                            </React.Fragment>
                                        )),
                                        List.join(i => <span key={`i:${i}`}>, </span>)
                                    )}
                                </span>
                            </dd>
                        </React.Fragment>
                    ))
                )}
            </dl>
        </div>
    );


    // -------------------- <GunstickTileView /> -----------------------------------------------

    const GunstickTileView:React.FC<GunstickModelState & CoreTileComponentProps> = (props) => (
        <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={props.data.count > 0}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{corp: 'Gunstick', url: props.serviceInfoUrl}}>
            <div className="GunstickTileView">
                {props.isAltViewMode ?
                    <Table data={props.data} /> :
                    <Chart data={transformDataForCharts(props.data)}
                            isMobile={props.isMobile}
                            widthFract={props.widthFract} />
                }
            </div>
        </globalComponents.TileWrapper>
    );

    return BoundWithProps(GunstickTileView, model);
}
