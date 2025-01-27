export const clara_load_task_result_tool = {
  type: 'function',
  function: {
    name: 'clara_load_task_result',
    description: 'Loads a task result from CLARA Market',
    parameters: {
      type: 'object',
      required: ['taskId'],
      properties: {
        taskId: { type: 'string', description: 'The id of a task sent to CLARA Market' },
      }
    }
  },
}

export async function claraLoadTaskResult(claraProfile, args) {
  console.log("====== claraLoadTaskResult =======")
  console.log(JSON.stringify(args, null, 2));

  const result = await claraProfile.loadNextTaskResult();
  if (!result) {
    throw new Error("No pending tasks results in CLARA Market");
  }

  const logObject = {
    taskId: result.originalTask.id,
    agentId: result.agentId,
    result: result.result, // not enough result
  }

  return JSON.stringify(logObject);
}
