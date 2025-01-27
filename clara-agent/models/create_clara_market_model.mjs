import ollama from 'ollama'
import {CLARA_MARKET_SYSTEM} from "../systems/clara_systems.mjs";
import {CLARA_MARKET_MODEL} from "../constatns.mjs";

await ollama.create(
  {
    model: CLARA_MARKET_MODEL,
    from: 'llama3.2',
    system: CLARA_MARKET_SYSTEM
  });