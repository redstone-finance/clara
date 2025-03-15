import {ChromaClient} from "chromadb";
import ollama from "ollama";

export const embeddingModel = "mxbai-embed-large";
export const KAIKO_RAG_COLLECTION = "kaito_rag";
const chromaClient = new ChromaClient({ path: "http://localhost:8000" });

export async function getChromaCollection(name, description) {
  return chromaClient.getOrCreateCollection({
    name/*,
    metadata: {description},*/
  });
}

export async function addEmbeddings(collection, document) {
  const response = await ollama.embed({
    model: embeddingModel,
    input: document,
    keep_alive: "1m"
  });
  const embeddings = response.embeddings;
  console.log(embeddings);
  await collection.add({
    ids: [`id_${Date.now()}`],
    embeddings: embeddings[0],
    documents: [document],
  });
}
