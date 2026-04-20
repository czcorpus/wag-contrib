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

import { IActionDispatcher,  ViewUtils, useModel } from 'kombo';
import * as React from 'react';
import {
    ScatterChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Legend,
    Scatter,
    Tooltip,
} from 'recharts';
import { Dict, List, pipe, tuple } from 'cnc-tskit';

import { Theme } from '../../../../page/theme.js';
import {
    CoreTileComponentProps,
    TileComponent,
} from '../../../../page/tile.js';
import { GlobalComponents } from '../../../../views/common/index.js';
import { GunstickModel } from '../model.js';
import {
    ChartData,
    Data,
    SummedSizes,
    transformDataForCharts,
} from '../common.js';
import { Actions } from '../actions.js';
import * as S from '../style.js';
import { Examples } from './examples.js';
import {
    Formatter,
    NameType,
    ValueType,
} from 'recharts/types/component/DefaultTooltipContent.js';

function getYearIdxMapping(data: SummedSizes): Array<string> {
    return pipe(
        data,
        Dict.values(),
        List.flatMap((v) => Dict.keys(v)),
        List.unique((v) => v),
        List.sortedAlphaBy((v) => v)
    );
}

function transformDataForTableView(
    data: SummedSizes,
    dataSize: { [year: string]: number },
    freqType: 'abs' | 'rel'
): [Array<string>, Array<[string, Array<number | undefined>]>] {
    const years = getYearIdxMapping(data);
    return tuple(
        years,
        pipe(
            data,
            Dict.toEntries(),
            List.map(([keyword, freqs]) =>
                tuple(
                    keyword,
                    pipe(
                        years,
                        List.map((year) => freqType === 'abs' ? freqs[year] : freqs[year] / dataSize[year] * 1e6)
                    )
                )
            ),
            List.sortedBy(([keyword, freqs]) =>
                List.foldl((acc, curr) => acc + (curr ? curr : 0), 0, freqs)
            ),
            List.reverse()
        )
    );
}

export function init(
    dispatcher: IActionDispatcher,
    ut: ViewUtils<GlobalComponents>,
    theme: Theme,
    model: GunstickModel
): TileComponent {
    const globalComponents = ut.getComponents();

    const createColorMapping = (
        data: ChartData
    ): ((v: number | string) => string) => {
        return theme.categoryPalette(
            pipe(
                data,
                Dict.toEntries(),
                List.map(([verse]) => verse)
            )
        );
    };

    const rangeOf = (data: ChartData): [number, number] => {
        const item = List.head(data[List.head(Dict.keys(data))]);
        return pipe(
            data,
            Dict.toEntries(),
            List.flatMap(([, counts]) => counts),
            List.foldl(
                ([min, max], curr) => {
                    return tuple(
                        Math.min(min, curr.year),
                        Math.max(max, curr.year)
                    );
                },
                tuple(item.year, item.year)
            )
        );
    };

    const Chart: React.FC<{
        data: ChartData;
        freqType: 'abs' | 'rel';
        isMobile: boolean;
        widthFract: number;
        handleScatterClick: (verse: string, year: number) => void;
    }> = (props) => {
        const mapping = createColorMapping(props.data);
        const tooltipFormatter: Formatter<ValueType, NameType> = (
            value,
            name,
            item
        ) => {
            if (typeof value === 'number') {
                if (item.dataKey === 'year') {
                    return [value.toString(), name];
                }
                return [ut.formatNumber(value), name];
            }
            return [value, name];
        };

        return (
            <globalComponents.ResponsiveWrapper
                minWidth={props.isMobile ? undefined : 250}
                widthFract={props.widthFract}
                render={(width: number, height: number) => (
                    <ScatterChart
                        width={Math.max(100, width * 0.9)}
                        height={Math.max(350, height)}
                        margin={{ top: 20, right: 20, bottom: 10, left: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="year"
                            name={ut.translate('gunstick__year')}
                            type="number"
                            unit=""
                            domain={rangeOf(props.data)}
                            tick={{ fill: theme.chartTextColor }}
                        />
                        <YAxis
                            dataKey="count"
                            name={props.freqType === 'abs' ? ut.translate('gunstick__abs_freq') : ut.translate('gunstick__rel_freq')}
                            unit=""
                            type="number"
                            label={{
                                value: props.freqType === 'abs' ? ut.translate('gunstick__abs_freq') : ut.translate('gunstick__rel_freq'),
                                angle: -90,
                                position: 'insideLeft',
                            }}
                            tick={{ fill: theme.chartTextColor }}
                        />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            isAnimationActive={false}
                            formatter={tooltipFormatter}
                            content={
                                <globalComponents.AlignedRechartsTooltip
                                    labelFormatter={(label, payload) =>
                                        payload.length > 0
                                            ? payload[0].payload.verse
                                            : null
                                    }
                                />
                            }
                        />
                        <Legend
                            formatter={(value) => (
                                <span style={{ color: theme.chartTextColor }}>
                                    {value}
                                </span>
                            )}
                        />
                        {pipe(
                            props.data,
                            Dict.toEntries(),
                            List.map(([verse, counts]) => (
                                <Scatter
                                    style={{ cursor: 'pointer' }}
                                    key={`item:${verse}`}
                                    name={verse}
                                    data={counts}
                                    fill={mapping(verse)}
                                    onClick={(v) =>
                                        props.handleScatterClick(
                                            verse,
                                            v.payload['year']
                                        )
                                    }
                                />
                            ))
                        )}
                    </ScatterChart>
                )}
            />
        );
    };

    const Table: React.FC<{
        data: Data;
        page: number;
        pageSize: number;
        freqType: 'abs' | 'rel';
        handleCellClick: (verse: string, year: number) => void;
    }> = ({ data, page, pageSize, freqType, handleCellClick }) => {
        const [years, tableData] = transformDataForTableView(data.countRY, data.dataSize, freqType);

        return (
            <div style={{ maxHeight: '20em', overflowY: 'auto' }}>
                <p>
                    {ut.translate('gunstick__total_occurrences')}:{' '}
                    <strong>{data.count}</strong>
                    <br />
                    {ut.translate('gunstick__only_most_freq_displayed')}
                </p>
                <S.DataListTable className="data">
                    <thead>
                        <tr>
                            <th />
                            {List.map(
                                (v) => (
                                    <th key={`h:${v}`}>{v}</th>
                                ),
                                years
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {pipe(
                            tableData,
                            List.slice((page - 1) * pageSize, page * pageSize),
                            List.map(([word, freqs]) => (
                                <tr key={`w:${word}`}>
                                    <th className="word">{word}</th>
                                    {List.map(
                                        (f, i) => (
                                            <td key={`f:${word}:${i}:${f}`}>
                                                <a
                                                    style={{
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() =>
                                                        handleCellClick(
                                                            word,
                                                            parseInt(years[i])
                                                        )
                                                    }
                                                >
                                                    {f}
                                                </a>
                                            </td>
                                        ),
                                        freqs
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </S.DataListTable>
            </div>
        );
    };

    // -------------------- <FreqTypeSelector /> --------------------------------------

    const FreqTypeSelector:React.FC<{
        tileId: number;
        value: 'abs' | 'rel';
    }> = (props) => {

        const handleChange = (evt:React.ChangeEvent<HTMLSelectElement>) => {
            dispatcher.dispatch(
                Actions.SetFreqType,
                {
                    tileId: props.tileId,
                    ftype: evt.currentTarget.value
                }
            )
        };

        return (
            <div>
                <select name="freq-type-selector" onChange={handleChange}>
                    <option value="rel">{ut.translate('gunstick__rel_freq')}</option>
                    <option value="abs">{ut.translate('gunstick__abs_freq')}</option>
                </select>
            </div>
        )
    };

    // -------------------- <GunstickTileView /> -----------------------------------------------

    const GunstickTileView: React.FC<CoreTileComponentProps> = (props) => {

        const state = useModel(model);


        const numPages = Math.ceil(
            Dict.size(state.data.countRY) / state.pageSize
        );

        const handlePrevPage = () => {
            if (state.page > 1) {
                dispatcher.dispatch<typeof Actions.PrevPage>({
                    name: Actions.PrevPage.name,
                    payload: {
                        tileId: props.tileId,
                    },
                });
            }
        };

        const handleNextPage = () => {
            if (state.page < numPages) {
                dispatcher.dispatch<typeof Actions.NextPage>({
                    name: Actions.NextPage.name,
                    payload: {
                        tileId: props.tileId,
                    },
                });
            }
        };

        const handleShowExamplesClick = (word: string, year: number) => {
            dispatcher.dispatch<typeof Actions.ShowExampleWindow>({
                name: Actions.ShowExampleWindow.name,
                payload: {
                    tileId: props.tileId,
                    verse: word,
                    year,
                },
            });
        };

        const handleCloseExamplesClick = () => {
            dispatcher.dispatch<typeof Actions.HideExampleWindow>({
                name: Actions.HideExampleWindow.name,
                payload: {
                    tileId: props.tileId,
                },
            });
        };

        return (
            <globalComponents.TileWrapper
                tileId={props.tileId}
                isBusy={state.isBusy}
                error={state.error}
                hasData={state.data.count > 0}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{ corp: 'Gunstick', url: state.serviceInfoUrl }}
            >
                <S.GunstickTileView>
                    {state.exampleWindowData ? (
                        <globalComponents.ModalBox
                            onCloseClick={handleCloseExamplesClick}
                            scrollableContents={true}
                            title={`${props.tileLabel} - ${ut.translate('gunstick__conc_examples')} `}
                            tileClass="text"
                        >
                            <Examples
                                word={state.currMatch.lemma}
                                verse={state.exampleWindowData.verse}
                                year={state.exampleWindowData.year}
                                data={
                                    state.data.table[
                                        state.exampleWindowData.verse
                                    ]
                                }
                            />
                        </globalComponents.ModalBox>
                    ) : null}

                    {state.isTweakMode ? (
                        <div className="tweak-box">
                            <globalComponents.Paginator
                                page={state.page}
                                numPages={numPages}
                                onNext={handleNextPage}
                                onPrev={handlePrevPage}
                            />
                            <FreqTypeSelector value={state.freqType} tileId={props.tileId} />

                        </div>
                    ) : null}
                    {state.isAltViewMode ? (
                        <Table
                            data={state.data}
                            page={state.page}
                            pageSize={state.pageSize}
                            freqType={state.freqType}
                            handleCellClick={handleShowExamplesClick}
                        />
                    ) : (
                        <Chart
                            data={transformDataForCharts(
                                state.data,
                                state.page,
                                state.pageSize,
                                state.freqType
                            )}
                            isMobile={props.isMobile}
                            widthFract={props.widthFract}
                            freqType={state.freqType}
                            handleScatterClick={handleShowExamplesClick}
                        />
                    )}
                </S.GunstickTileView>
            </globalComponents.TileWrapper>
        );
    };

    return GunstickTileView;
}
