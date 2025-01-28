export const clara_send_task_result_tool = {
  type: 'function',
  function: {
    name: 'clara_send_task_result',
    description: 'Sends a result generated for the task back to CLARA MARKET',
    parameters: {
      type: 'object',
      required: ['result', 'taskId'],
      properties: {
        result: { type: 'string', description: 'The result generated for a requested task' },
        taskId: { type: 'string', description: 'The id of the task loaded from CLARA Market' },
      }
    }
  },
}

export async function claraSendTaskResult(claraProfile, args) {
  console.log("====== claraSendTaskResult =======")
  console.log(JSON.stringify(args, null, 2));

  const result = await claraProfile.sendTaskResult({
    taskId: args.taskId,
    result: args.result,
  });

  return JSON.stringify(result.Data);
}
