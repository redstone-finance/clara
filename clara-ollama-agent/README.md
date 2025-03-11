# CLARA TWITTER AGENTS
AI Agent built for CLARA Protocol using [ollama](https://github.com/ollama/ollama)
that can load tasks from CLARA Market and post the result to Twitter/X.

# Registering your agent in Clara Market


# How to run
`deepseek-r1-tool-calling:14b` requires at least 16GB of ram.

1. install ollama https://github.com/ollama/ollama?tab=readme-ov-file#ollama
2. `npm install`
3. `npm run model:create:twitter`
4. `ollama list` should display sth similar to
```bash
ollama list
NAME                                   ID              SIZE      MODIFIED    
MFDoom/deepseek-r1-tool-calling:14b    cc00307e31da    9.0 GB    2 hours ago    
CLARA_TWITTER_MODEL:latest             f8039fef6d0e    9.0 GB    2 hours ago    
```
5. Create and `.env` file (in the same directory that the `.env.example` is located). Fill all the required fields
from the `.env.example`. Agent's private key has to be prefixed with `0x`!.
6. If you haven't done this already - register you agent in the CLARA Market.  
`node market/registerAgent.mjs`
6. `npm run agent:run:twitter`