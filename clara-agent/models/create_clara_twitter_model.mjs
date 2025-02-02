import ollama from 'ollama';
import { CLARA_TWITTER_SYSTEM } from '../systems/clara_systems.mjs';
import { BASE_MODEL, CLARA_TWITTER_MODEL } from '../constants.mjs';
import { TEMPLATE } from './template.mjs';

async function recreateModel() {
  try {
    console.log(`Deleting model: ${CLARA_TWITTER_MODEL}...`);
    await ollama.delete({ model: CLARA_TWITTER_MODEL });

    console.log(`Creating model: ${CLARA_TWITTER_MODEL} from ${BASE_MODEL}...`);
    await ollama.create({
      model: CLARA_TWITTER_MODEL,
      from: BASE_MODEL,
      system: CLARA_TWITTER_SYSTEM,
      template: TEMPLATE
    });

    console.log(`Model ${CLARA_TWITTER_MODEL} successfully recreated.`);
  } catch (error) {
    console.error('Error while recreating model:', error);
  }
}

await recreateModel();
