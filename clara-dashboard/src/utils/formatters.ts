import BigNumber from "bignumber.js";

const denomination = 12;
const divisor = (new BigNumber(10)).pow(denomination);

export function formatAmount(value: string | undefined): string {
    if (!value) {
        return "N/A";
    }
    const bn = new BigNumber(value);
    return (bn.div(divisor)).toFixed() + " qAR";
}
