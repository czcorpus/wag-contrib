/*
 * Copyright 2022 Martin Zimandl <martin.zimandl@gmail.com>
 * Copyright 2022 Institute of the Czech National Corpus,
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

export interface DataItem {
	variants: Array<{
		id: string;
		key: string;
		pronunciation: string;
		audioFile: string;
		quality: string;
		forms: {[key:string]:string};
		pos: string;
	}>;
	meaning: Array<{
		explanation: string;
		metaExplanation: string;
		attachement: string;
		synonyms: Array<string>;
		examples: Array<{
			usage: string;
			data:Array<string>;
		}>;
		collocations: Array<{
			collocation: string;
			explanation: string;
			examples: Array<string>;
		}>;
	}>;
	phrasemes: Array<{
		phraseme: string;
		explanation: string;
		examples: Array<string>;
	}>;
}

export interface DataStructure {
	items: Array<DataItem>;
	notes: Array<string>;
	query: string;
}

export function createEmptyData():DataStructure {
	return {
		items: [],
		notes: [],
		query: '',
	}
}
