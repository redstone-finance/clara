import ollama from "ollama";
import llama3Tokenizer from "llama3-tokenizer-js";
import {embeddingModel, getChromaCollection, KAIKO_RAG_COLLECTION} from "./chroma.mjs";

const prompt = "Generate an engaging tweet about crypto";
const ollamaContextWindow = 2048;
const llmModel = "llama3.2";

const promptEmbedding = await ollama.embed({
    model: embeddingModel,
    input: prompt
  }
);
console.log("PromptEmbedding generated");
//console.log(promptEmbedding);

console.log('querying Chroma');
const collection = await getChromaCollection(KAIKO_RAG_COLLECTION);
const results = await collection.query({
  queryEmbeddings: promptEmbedding.embeddings[0],
  nResults: 20
});
// console.log('Chroma results');
// console.log(results);

const contextDocs = results.documents;
let context = "No relevant documents found.";
if (contextDocs && contextDocs.length > 0 && contextDocs[0].length > 0) {
  context = contextDocs[0].join(" ");
}
const augmentedPrompt = `Using this data: ${context}. Respond to this prompt: ${prompt}`;
const promptTokensLength = llama3Tokenizer.encode(augmentedPrompt).length;

if (promptTokensLength > ollamaContextWindow) {
  console.warn("Exceeding default ollama context window:", promptTokensLength)
}

console.log("Prompting llm...");
const output = await ollama.generate({
  model: llmModel,
  prompt: augmentedPrompt,
  options: {
    num_ctx: Math.max(ollamaContextWindow, promptTokensLength + 200)
  }
});

console.log("======= PROMPT RESULT =======");
console.log(output.response);