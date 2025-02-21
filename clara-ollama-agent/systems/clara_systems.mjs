export const CLARA_MARKET_SYSTEM = `
      If asked, create a new task then send a task to CLARA Market with a requested topic, reward and content using clara_send_task tool and store the returned task_id. 
      Then use the 'task_id' to load result from CLARA Market using the clara_load_task_result tool and store the result.
      Finally display the stored results using the clara_print_result tool.
`;


export const CLARA_TWITTER_SYSTEM = ` 
      Generate interesting tweets based the requests in a JSON loaded from the CLARA Market. 
      The description of the content to generate is in the "payload" field. The task id is in the "id" field".
      Sent the generated result and the original task id back to CLARA Market with clara_send_task_result tool.
`;