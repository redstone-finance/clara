import {Ollama, OllamaEmbeddings} from '@langchain/ollama';
import {ChromaClient} from "chromadb";
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const llmModel = "llama3.2";

// docker pull chromadb/chroma
// docker run -p 8000:8000 chromadb/chroma
const chromaClient = new ChromaClient();
console.log("Connected to Chroma Vector db");

class ChromaDBEmbeddingFunction {
  constructor(langchainEmbeddings) {
    this.langchainEmbeddings = langchainEmbeddings;
  }

  async generate(input) {
    if (typeof input === 'string') {
      input = [input];
    }
    return await this.langchainEmbeddings.embedDocuments(input);
  }
}

const embedding = new ChromaDBEmbeddingFunction(
  new OllamaEmbeddings({
    model: llmModel,
    baseUrl: "http://localhost:11434"
  })
);

(async () => {
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

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, chunkOverlap: 500
  });
  const collectionName = "redstone_collection_demo_1";
  const collection = await chromaClient.getOrCreateCollection({
    name: collectionName,
    metadata: { description: "A collection for RAG with Ollama - RedStone Tokenomics" },
    embeddingFunction: embedding
  });

  async function addDocumentsToCollection(documents, ids) {
    await collection.add({
      documents,
      ids
    });
  }
  console.log("Splitting documents");
  const documents = (await splitter.splitDocuments(docs)).map(doc => doc.pageContent);
  console.log("Generated chunks", documents.length);
  const ids = documents.map((_, index) => `id_${++index}`);
  //console.log(documents);

  await addDocumentsToCollection(documents, ids);
  console.log("Documents added to collection");

  async function queryChromaDB(queryText, nResults = 1) {
    const results = await collection.query({
      queryTexts: [queryText],
      nResults: nResults
    });
    return { documents: results.documents, metadatas: results.metadatas };
  }

  async function queryOllama(prompt) {
    const llm = new Ollama({ model: llmModel });
    return await llm.invoke(prompt);
  }

  async function ragPipeline(queryText) {
    const { documents: retrievedDocs } = await queryChromaDB(queryText);
    let context = "No relevant documents found.";
    if (retrievedDocs && retrievedDocs.length > 0 && retrievedDocs[0].length > 0) {
      context = retrievedDocs[0].join(" ");
    }

    const augmentedPrompt = `Context: ${context}\n\nQuestion: ${queryText}\nAnswer:`;
    console.log("######## Augmented Prompt ########");
    console.log(augmentedPrompt);

    const response = await queryOllama(augmentedPrompt);
    return response;
  }

  const query = "How the RED token is distributed?";
  const response = await ragPipeline(query);
  console.log("######## Response from LLM ########\n", response);
})();
