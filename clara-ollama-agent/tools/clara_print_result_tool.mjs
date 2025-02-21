export const clara_print_result_tool = {
    type: 'function',
    function: {
      name: 'clara_print_result',
      description: 'Prints the result of a task with a stored id loaded from CLARA Market',
      parameters: {
        type: 'object',
        required: ['taskId', 'response'],
        properties: {
          taskId: { type: 'string', description: 'The id of the task sent to CLARA Market' },
          response: { type: 'string', description: 'The response from CLARA Market for this task' }
        }
      }
    },
  }

export async function claraPrintResults(claraProfile, args) {
  console.log(JSON.stringify(args, null, 2));

  return "Job's done";
}
