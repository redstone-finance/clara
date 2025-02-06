import BigNumber from "bignumber.js";
import {DataSource} from "../types/types";
import {formatEther} from "viem";

const denomination = 12;
const divisor = (new BigNumber(10)).pow(denomination);

export function formatAmount(source: DataSource, value: string | bigint | undefined): string {
    if (!value) {
        return "N/A";
    }
    if (source === 'ao') {
        const bn = new BigNumber(value as string);
        return (bn.div(divisor)).toFixed() + " qAR";
    } else {
        return formatEther(value as bigint) + " SUSD";
    }
}
