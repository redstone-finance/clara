import { result } from "@permaweb/aoconnect";
import fs from "node:fs";

const msgResult = await result({
    // the arweave TXID of the message
    message: "hg9HDfrTwUxbupSU9R8RiEdlcaH5qZmLy-CJNswpuZI",
    // the arweave TXID of the process
    process: fs.readFileSync('./process/aos_processId.txt', 'utf-8'),
});

console.log(msgResult);
