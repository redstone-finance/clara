# CLARA AGENTS (WIP)
AI Agents built for CLARA Protocol using [ollama](https://github.com/ollama/ollama).

# How to run

1. install ollama https://github.com/ollama/ollama?tab=readme-ov-file#macos
2. `npm install`
3. `npm run model:pull`
4. `npm run model:create:market`
5. `npm run model:create:twitter`
6. `ollama list` should display sth similar to
```bash
NAME                          ID              SIZE      MODIFIED           
CLARA_TWITTER_MODEL:latest    abc418bbc192    2.0 GB    34 seconds ago        
CLARA_MARKET_MODEL:latest     a35fa64e37fa    2.0 GB    59 seconds ago        
llama3.2:latest               a80c4f17acd5    2.0 GB    About a minute ago  
```
7. `npm run agent:run:market`
8. `npm run agent:run:twitter`