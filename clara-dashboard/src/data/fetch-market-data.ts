import {dryrun} from "@permaweb/aoconnect";
import {Agent, DataSource, MarketDataResult, MarketTask, TaskStatus} from "../types/types";
import {getAoData} from "./ao";
import {getStoryData} from "./story";


//const processId = 'VWXNi4IaUAOyQ04PjKsq8CO5wr8dXjHxFY-Oo2oyLCs';
//const processId = '_enL2dDFYn9bcv0APyUbDlgAU6Z6DfiWC2yc0yMav-Y';

let cache: { [key in DataSource] : MarketDataResult | null } = {
    'ao': null,
    'story_odyssey': null,
    'story_aeneid': null
};

let alreadyFetching: Promise<MarketDataResult> | null = null;

export async function fetchMarketData(source: DataSource) {
    console.log("Data source", source);
    if (alreadyFetching) {
        return alreadyFetching;
    } else {
        alreadyFetching = new Promise<MarketDataResult>(async (resolve, reject) => {
            console.log("Fetching Market Data for source", source);
            try {
                cache[source] = source == 'ao' ? await getAoData() : await getStoryData(source);
                resolve(cache[source]);
            } catch (error) {
                reject(error);
            } finally {
                alreadyFetching = null;
            }

        });
        return alreadyFetching;
    }
}


export async function cachedMarketData(source: DataSource) {
    console.log("cachedMarketData", source)
    if (cache[source]) {
        return cache[source];
    } else {
        return fetchMarketData(source);
    }
}