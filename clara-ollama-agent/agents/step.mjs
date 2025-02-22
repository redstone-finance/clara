// https://www.youtube.com/shorts/m-6TTz11O-g
import ollama from "ollama";

export async function promptModel(model, prompt) {
  return ollama.generate({
    model,
    prompt,
    stream: true
  });
}

export async function step(model, tools, messages, availableFunctions, logger, stepNumber) {
  logger.info(`\n============= BEGIN MODEL STEP [${stepNumber}] =============`);
  const response = await ollama.chat({
    model,
    tools,
    messages
  })
  // Add the model's response to the conversation history
  messages.push(response.message);

  logger.debug(response);

  if (response.message.content) {
    logger.debug(response.message.content);
  }

  // Process function calls made by the model
  if (response.message.tool_calls) {
    logger.info("Generated tool calls:", response.message.tool_calls);
    for (const tool of response.message.tool_calls) {
      logger.info(`Calling function ${tool.function.name} with ${JSON.stringify(tool.function.arguments)}`);
      const functionToCall = availableFunctions[tool.function.name];
      try {
        const functionResponse = await functionToCall(tool.function.arguments);
        logger.info(`${tool.function.name} response: ${functionResponse}`);
        // Add function response to the conversation
        messages.push({
          role: 'tool',
          content: `Response from function ${tool.function.name}: ${functionResponse}`,
        });
      } catch (error) {
        logger.error(`${tool.function.name} error: ${error}`);
        // Add function response to the conversation
        messages.push({
          role: 'tool',
          content: `Function ${tool.function.name} failed with error: ${error}`,
        });
      }
    }
  } else {
    logger.info("No tool calls generated")
  }
  logger.info(`\n============= END MODEL STEP [${stepNumber}] =============`);
  return messages;
}
