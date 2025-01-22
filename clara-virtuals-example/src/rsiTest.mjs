import {loadRedStoneFeeds} from "./commons.mjs";
import {EMA, MACD, RSI} from "trading-signals";

const prices = await loadRedStoneFeeds("ETH");

const values = prices.map((price) => price.value);

console.log(values);

const rsi1 = new RSI(prices.length - 1);
rsi1.updates(values, false);
console.log("RSI:", rsi1.getResult());

const rsi2 = new RSI(prices.length - 1);
values.forEach((value) => rsi2.add(value));
console.log("RSI:", rsi2.getResult());


const macd = new MACD({
  indicator: EMA,
  longInterval: 26,
  shortInterval: 12,
  signalInterval: 9,
});

macd.updates(values, false);


console.log(macd.getResultOrThrow().histogram.toFixed(2))
