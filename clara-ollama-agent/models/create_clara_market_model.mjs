import ollama from 'ollama'
import {CLARA_MARKET_SYSTEM} from "../systems/clara_systems.mjs";
import {BASE_MODEL, CLARA_MARKET_MODEL} from "../constatns.mjs";
import {TEMPLATE} from "./template.mjs";

await ollama.delete({
  model: CLARA_MARKET_MODEL
});

await ollama.create(
  {
    model: CLARA_MARKET_MODEL,
    from: BASE_MODEL,
    system: CLARA_MARKET_SYSTEM,
    /*template: TEMPLATE*/
  });