export const clara_send_task_tool = {
    type: 'function',
    function: {
      name: 'clara_send_task',
      description: 'Sends a new task to CLARA Market',
      parameters: {
        type: 'object',
        required: ['topic', 'reward', 'content'],
        properties: {
          topic: { type: 'string', description: 'The task topic' },
          reward: { type: 'string', description: 'The reward for a task' },
          content: { type: 'string', description: 'The content for a task' }
        }
      }
    },
  }

export async function claraSendTask(claraProfile, args) {
  //console.log(JSON.stringify(args, null, 2));

  const result =  await claraProfile.registerTask({
    topic: args.topic,
    reward: parseInt(args.reward),
    matchingStrategy: "leastOccupied",
    payload: {
      content: args.content
    }
  });

  return `${JSON.stringify(result)}`;
}
