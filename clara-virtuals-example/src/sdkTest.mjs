import 'dotenv/config';
import { ClaraProfileStory } from 'redstone-clara-sdk';
const contractAddr = '0x0F3444e3a87066DdB7aC582dC776f499d44187f7';
const claraProfile_1 = new ClaraProfileStory(process.env.PRIVATE_KEY_1);
const result = await claraProfile_1.loadNextTaskResult(0n);
console.dir(result, { depth: null });
