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
import { List, Maths, pipe, tuple } from 'cnc-tskit';
import { Theme } from '../../../page/theme';
import { CoreTileComponentProps, TileComponent } from '../../../page/tile';
import { GlobalComponents } from '../../../views/common';
import { HexModel, HexModelState } from './model';
import { ScatterChart, CartesianGrid, XAxis, YAxis, Legend, Scatter, Tooltip } from 'recharts';
import { ChartData, Data, transformDataForCharts } from './common';
import { Actions } from './actions';
import * as S from './style';


export function init(
    dispatcher:IActionDispatcher,
    ut:ViewUtils<GlobalComponents>,
    theme:Theme, model:HexModel
):TileComponent {

    const globalComponents = ut.getComponents();

    // ---------------------- <Chart /> ------------------------------------

    const Chart:React.FC<{
        data:ChartData;
        isMobile:boolean;
        widthFract:number;
        word:string;

    }> = (props) => {

        const range = pipe(
            props.data,
            List.foldl(
                ([accMin, accMax], curr) => tuple(Math.min(accMin, curr.x), Math.max(accMax, curr.x)),
                tuple(List.head(props.data).x, List.head(props.data).x)
            )
        );

        return (
            <globalComponents.ResponsiveWrapper minWidth={props.isMobile ? undefined : 250}
                                        widthFract={props.widthFract} render={(width:number, height:number) => (
                <ScatterChart width={Math.max(100, width)} height={Math.max(350, height)} margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name={ut.translate('hex__label_year')} type="number" unit="" domain={range}>
                    </XAxis>
                    <YAxis dataKey="y" name={ut.translate('hex__abs_freq')} unit="" type="number"
                            label={{ value: ut.translate('hex__abs_freq'), angle: -90, position: 'insideLeft' }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} labelStyle={{display: 'none'}} />
                    <Legend />
                    <Scatter name={props.word} data={props.data} fill={theme.categoryColor(0)} />
                </ScatterChart>)} />
        );
    };

    // ---------------------- <Table /> ------------------------------------

    const Table:React.FC<{
        data: Data;
        page: number;
        pageSize: number;
    }> = (props) => (
        <div style={{maxHeight: '20em', overflowY: 'auto'}}>
            <p>{ut.translate('hex__freq_found_occurrences')}: <strong>{props.data.count}</strong></p>
            <table className="data">
                <thead>
                    <tr>
                        <th>{ut.translate('hex__label_author')}</th>
                        <th>{ut.translate('hex__label_title')}</th>
                        <th>{ut.translate('hex__label_year')}</th>
                        <th>{ut.translate('hex__abs_freq')}</th>
                        <th>{ut.translate('hex__rel_freq_poem_related')}</th>
                        <th>{ut.translate('hex__coeff_phi')}</th>
                    </tr>
                </thead>
                <tbody>
                {pipe(
                    props.data.table,
                    List.slice((props.page-1)*props.pageSize, props.page*props.pageSize),
                    List.map((item, i) => (
                        <tr key={`item:${i}:${item.bookId}`}>
                            <td>{item.author}</td>
                            <td>{item.poemName}</td>
                            <td>{item.year}</td>
                            <td>{item.af}</td>
                            <td>{item.rf}</td>
                            <td>{Maths.roundToPos(item.phi, 2)}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );

    // ------------------ <Paginator /> --------------------------------------------

    const Paginator:React.FC<{
        page:number;
        numPages:number;
        tileId:number;

    }> = (props) => {

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
            if (props.page < props.numPages) {
                dispatcher.dispatch<typeof Actions.NextPage>({
                    name: Actions.NextPage.name,
                    payload: {
                        tileId: props.tileId
                    }
                });
            }
        };

        return (
            <S.Paginator>
                <a onClick={handlePrevPage} className={`${props.page === 1 ? 'disabled' : null}`}>
                    <img className="arrow" src={ut.createStaticUrl(props.page === 1 ? 'triangle_left_gr.svg' : 'triangle_left.svg')}
                        alt={ut.translate('global__img_alt_triable_left')} />
                </a>
                <input className="page" type="text" readOnly={true} value={props.page} />
                <a onClick={handleNextPage} className={`${props.page === props.numPages ? 'disabled' : null}`}>
                    <img className="arrow" src={ut.createStaticUrl(props.page === props.numPages ? 'triangle_right_gr.svg' : 'triangle_right.svg')}
                        alt={ut.translate('global__img_alt_triable_right')} />
                </a>
            </S.Paginator>
        );
    };
    
    // ------------------ <Controls /> --------------------------------------------

    const Controls: React.FC<{
        tileId: number;
        page: number;
        numPages: number;
    }> = (props) => {
        return (
            <S.Controls>
                <fieldset>
                        <label>{ut.translate('concordance__page')}:{'\u00a0'}
                        <Paginator page={props.page} numPages={props.numPages} tileId={props.tileId} />
                        </label>
                </fieldset>
            </S.Controls>
        )
    };
    
    // -------------------- <HexTileView /> -----------------------------------------------

    const HexTileView:React.FC<HexModelState & CoreTileComponentProps> = (props) => (
        <globalComponents.TileWrapper tileId={props.tileId} isBusy={props.isBusy} error={props.error}
                hasData={props.data.count > 0}
                supportsTileReload={props.supportsReloadOnError}
                issueReportingUrl={props.issueReportingUrl}
                sourceIdent={{corp: 'HEX', url: props.serviceInfoUrl}}>
            <S.HexTileView>
                {props.isTweakMode ?
                    <div className="tweak-box">
                        <Controls tileId={props.tileId} page={props.page} numPages={Math.ceil(props.data.count/props.pageSize)}/>
                    </div> :
                    null
                }
                {props.isAltViewMode ?
                    <Table data={props.data}
                        page={props.page}
                        pageSize={props.pageSize} /> :
                    <Chart data={transformDataForCharts(props.data)}
                            isMobile={props.isMobile}
                            widthFract={props.widthFract}
                            word={props.word} />
                }
            </S.HexTileView>
        </globalComponents.TileWrapper>
    );

    return BoundWithProps(HexTileView, model);
}
