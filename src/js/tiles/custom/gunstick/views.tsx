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
import { ScatterChart, CartesianGrid, XAxis, YAxis, Legend, Scatter, Tooltip } from 'recharts';
import { Dict, List, pipe, tuple } from 'cnc-tskit';

import { Theme } from '../../../page/theme.js';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile.js';
import { GlobalComponents } from '../../../views/common/index.js';
import { GunstickModel, GunstickModelState } from './model.js';
import { ChartData, Data, SummedSizes, transformDataForCharts } from './common.js';
import { Actions } from './actions.js';
import * as S from './style.js';


function getYearIdxMapping(data:SummedSizes):Array<string>{
    return pipe(
        data,
        Dict.values(),
        List.flatMap(v => Dict.keys(v)),
        List.unique(v => v),
        List.sortedAlphaBy(v => v)
    );
}

function transformDataForTableView(data:SummedSizes):[Array<string>, Array<[string, Array<number|undefined>]>] {
    const years = getYearIdxMapping(data);
    return tuple(
        years,
        pipe(
            data,
            Dict.toEntries(),
            List.map(([keyword, freqs]) => tuple(
                keyword,
                pipe(
                    years,
                    List.map(year => freqs[year])
                )
            )),
            List.sortedBy(
                ([keyword, freqs]) => List.foldl((acc, curr) => acc + (curr ? curr : 0), 0, freqs)
            ),
            List.reverse(),
        )
    );
}


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme,
    model:GunstickModel
):TileComponent {

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
                    <YAxis dataKey="y" name={ut.translate('gunstick__abs_freq')} unit="" type="number"
                        label={{ value: ut.translate('gunstick__abs_freq'), angle: -90, position: 'insideLeft' }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} labelStyle={{display: 'none'}} />
                    <Legend formatter={(value) => <span style={{ color: 'black' }}>{value}</span>} />
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
        data: Data;
        page: number;
        pageSize: number;

    }> = ({data, page, pageSize}) => {

        const [years, tableData] = transformDataForTableView(data.countRY);

        return (
            <div style={{maxHeight: '20em', overflowY: 'auto'}}>
                <p>{ut.translate('gunstick__total_occurrences')}: <strong>{data.count}</strong><br />
                    {ut.translate('gunstick__only_most_freq_displayed')}
                </p>
                <S.DataListTable className="data">
                    <thead>
                        <tr>
                            <th />
                            {List.map(v => <th key={`h:${v}`}>{v}</th>, years)}
                        </tr>
                    </thead>
                    <tbody>
                        {pipe(
                            tableData,
                            List.slice((page-1)*pageSize, page*pageSize),
                            List.map(([word, freqs]) => (
                                <tr key={`w:${word}`}>
                                    <th className="word">{word}</th>
                                    {List.map((f, i) => <td key={`f:${word}:${i}:${f}`}>{f}</td>, freqs)}
                                </tr>
                            ))
                        )}
                    </tbody>
                </S.DataListTable>
            </div>
        );
    };

    // -------------------- <GunstickTileView /> -----------------------------------------------

    const GunstickTileView: React.FC<GunstickModelState & CoreTileComponentProps> = (props) => {
        const numPages = Math.ceil(Dict.size(props.data.countRY) / props.pageSize);

        const handlePrevPage = () => {
            if (props.page > 1) {
                dispatcher.dispatch<typeof Actions.PrevPage>({
                    name: Actions.PrevPage.name,
                    payload: {
                        tileId: props.tileId
                    }
                });
            }
        };

        const handleNextPage = () => {
            if (props.page < numPages) {
                dispatcher.dispatch<typeof Actions.NextPage>({
                    name: Actions.NextPage.name,
                    payload: {
                        tileId: props.tileId
                    }
                });
            }
        };

        return (
            <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={props.data.count > 0}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{ corp: 'Gunstick', url: props.serviceInfoUrl }}>
                <S.GunstickTileView>
                    {props.isTweakMode ?
                        <div className="tweak-box">
                            <globalComponents.Paginator page={props.page} numPages={numPages} onNext={handleNextPage} onPrev={handlePrevPage} />
                        </div> :
                        null
                    }
                    {props.isAltViewMode ?
                        <Table data={props.data}
                            page={props.page}
                            pageSize={props.pageSize} /> :
                        <Chart data={transformDataForCharts(props.data, props.page, props.pageSize)}
                            isMobile={props.isMobile}
                            widthFract={props.widthFract} />
                    }
                </S.GunstickTileView>
            </globalComponents.TileWrapper>
        );
    }

    return BoundWithProps(GunstickTileView, model);
}
