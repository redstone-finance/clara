import ollama from 'ollama'
import { CLARA_TWITTER_SYSTEM } from '../systems/clara_systems.mjs';
import { BASE_MODEL, CLARA_TWITTER_MODEL } from '../constants.mjs';

try {
  await ollama.delete({
    model: CLARA_TWITTER_MODEL
  });
} catch (err) {
  // console.error(err);
}


const response = await ollama.create(
  {
    model: CLARA_TWITTER_MODEL,
    from: BASE_MODEL,
    system: CLARA_TWITTER_SYSTEM,
    stream: true
  });

for await (const part of response) {
  console.log(part);
}
  