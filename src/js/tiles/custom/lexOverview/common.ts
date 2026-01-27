/*
 * Copyright 2026 Martin Zimandl <martin.zimandl@gmail.com>
 * Copyright 2026 Institute of the Czech National Corpus,
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

import * as assc from "./commonAssc.js";
import * as lguide from "./commonLguide.js";

export interface Variant {
	id: string;
	value: string;
	info: string;
	link: string;
}

export interface AggregateData {
	variants: {
		source: string;
		items: Array<Variant>;
	};
	asscData: assc.DataStructure;
	lguideData: lguide.DataStructure;
}

export function createEmptyData():AggregateData {
	return {
		variants: {
			source: "",
			items: [],
		},
		asscData: assc.createEmptyData(),
		lguideData: lguide.mkEmptyData(),
	}
}