import {ChromaClient} from "chromadb";
import "cheerio";
import {CheerioWebBaseLoader} from "@langchain/community/document_loaders/web/cheerio";
import ollama from "ollama";
import llama3Tokenizer from 'llama3-tokenizer-js';
import { SentenceSplitter } from "@llamaindex/core/node-parser";

const llmModel = "llama3.2";
const embeddingModel = "mxbai-embed-large";
const prompt = "How the RED token is distributed?";
const chromaCollectionName = "redstone_collection_demo_1";
const ollamaContextWindow = 2048; // default context window size in ollama (in tokens)

// docker pull chromadb/chroma
// docker run -v ./chroma-data:/chroma/chroma/ -p 8000:8000 chromadb/chroma
const chromaClient = new ChromaClient({ path: "http://localhost:8000" });
console.log("Connected to Chroma Vector db");

(async () => {
  console.log("Pulling models from ollama");
  await ollama.pull({model: llmModel});
  await ollama.pull({model: embeddingModel});
  /*const collection = await chromaClient.getOrCreateCollection({
    name: chromaCollectionName,
    metadata: {description: "A collection for RAG with Ollama - RedStone Tokenomics"},
  });*/

  const cheerioLoaderP = new CheerioWebBaseLoader(
    "https://blog.redstone.finance/2025/02/12/introducing-red-tokenomics/",
    {
      selector: "p",
    }
  );
  // cannot combine different selectors, suxx hard.
  const cheerioLoaderTable = new CheerioWebBaseLoader(
    "https://blog.redstone.finance/2025/02/12/introducing-red-tokenomics/",
    {
      selector: "td"
    }
  );
  console.log("Loading docs");
  const docsP = await cheerioLoaderP.load();
  const docsTable = await cheerioLoaderTable.load();
  const docs = docsP.concat(...docsTable);
  const documents = docs.map(doc => doc.pageContent).join("\n");

  // TODO: analyze different splitting methods and choose the best - to limit context size
  const splitter = new SentenceSplitter({
    chunkSize: 256,
    chunkOverlap: 32,
  });
  const splittedDocs = splitter.splitText(documents);

  try {
    await chromaClient.deleteCollection({name: chromaCollectionName});
  } catch (e) {
    // no such collection yet
  }
  const collection = await chromaClient.getOrCreateCollection({
    name: chromaCollectionName,
    metadata: {description: "A collection for RAG with Ollama - RedStone Tokenomics"},
  });

  let counter = 0;
  for (const document of splittedDocs) {
    const response = await ollama.embed({
      model: embeddingModel,
      input: document,
      keep_alive: "1m"
    });
    const embeddings = response.embeddings;
    console.log(embeddings);
    await collection.add({
      ids: [`id_${++counter}`],
      embeddings: embeddings[0],
      documents: [document],
    });
  }

  console.log("Embeddings generated");

  const promptEmbedding = await ollama.embed({
      model: embeddingModel,
      input: prompt
    }
  );
  console.log("PromptEmbedding generated");
  //console.log(promptEmbedding);

  console.log('querying Chroma');
  const results = await collection.query({
    queryEmbeddings: promptEmbedding.embeddings[0],
    nResults: 1
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
})();
