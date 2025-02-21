// https://www.youtube.com/shorts/m-6TTz11O-g
import ollama from "ollama";

export async function promptModel(model, prompt) {
  return ollama.generate({
    model,
    prompt,
    stream: true
  });
}

export async function step(model, tools, messages, availableFunctions, stepNumber) {
  console.log(`\n============= BEGIN MODEL STEP [${stepNumber}] =============`);
  const response = await ollama.chat({
    model,
    tools,
    messages
  })
  // Add the model's response to the conversation history
  messages.push(response.message);

  console.log(messages);
  console.log(response);

  if (response.message.content) {
    console.log(response.message.content);
  }

  // Process function calls made by the model
  if (response.message.tool_calls) {
    console.log("Generated tool calls:", response.message.tool_calls);
    for (const tool of response.message.tool_calls) {
      console.log(`Calling function ${tool.function.name} with ${JSON.stringify(tool.function.arguments)}`);
      const functionToCall = availableFunctions[tool.function.name];
      try {
        const functionResponse = await functionToCall(tool.function.arguments);
        console.log(`${tool.function.name} response: ${functionResponse}`);
        // Add function response to the conversation
        messages.push({
          role: 'tool',
          content: `Response from function ${tool.function.name}: ${functionResponse}`,
        });
      } catch (error) {
        console.error(`${tool.function.name} error: ${error}`);
        // Add function response to the conversation
        messages.push({
          role: 'tool',
          content: `Function ${tool.function.name} failed with error: ${error}`,
        });
      }
    }
  } else {
    console.log("No tool calls generated")
  }
  console.log(`\n============= END MODEL STEP [${stepNumber}] =============`);
  return messages;
}
