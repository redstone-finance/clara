export const clara_load_assigned_task_tool = {
  type: 'function',
  function: {
    name: 'clara_load_assigned_task',
    description: 'Loads next assigned task from CLARA MARKET',
    parameters: {
    }
  },
}

export async function claraLoadAssignedTask(claraProfile, args) {
  console.log("====== loadNextAssignedTask =======")
  console.log(JSON.stringify(args, null, 2));

  const result = await claraProfile.loadNextAssignedTask();
  if (!result) {
    throw new Error("No pending tasks in CLARA Market");
  }

  return JSON.stringify({
    taskId: result.id,
    request: result.payload
  });
}
