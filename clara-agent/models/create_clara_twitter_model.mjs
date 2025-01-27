import ollama from 'ollama'
import {CLARA_TWITTER_SYSTEM} from "../systems/clara_systems.mjs";
import {CLARA_TWITTER_MODEL} from "../constatns.mjs";

await ollama.create(
  {
    model: CLARA_TWITTER_MODEL,
    from: 'llama3.2',
    system: CLARA_TWITTER_SYSTEM
  });