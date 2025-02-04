import { backOff } from 'exponential-backoff';
import { result } from '@permaweb/aoconnect';

export async function getMessageResult(processId, messageId) {
  const r = await backOff(
    () =>
      result({
        process: processId,
        message: messageId,
      }),
    {
      delayFirstAttempt: true,
      numOfAttempts: 3,
      startingDelay: 500,
    }
  );

  if (r.Error) {
    throw new Error(r.Error);
  } else {
    return r;
  }
}

export function containsTagWithValue(result, { name, value }) {
  return result.Messages[0].Tags.find((t) => t.name === name && t.value === value);
}

export function messageWithTags(result, requiredTags) {
  for (let msg of result.Messages) {
    let foundTags = 0;
    for (let requiredTag of requiredTags) {
      if (
        requiredTag.name == 'Task-Id' &&
        msg.Tags.find(({ name, value }) => name === requiredTag.name && value.includes(requiredTag.value))
      ) {
        foundTags++;
      } else if (msg.Tags.find(({ name, value }) => name === requiredTag.name && value === requiredTag.value)) {
        foundTags++;
      }
      if (foundTags === requiredTags.length) {
        return msg;
      }
    }
  }
}

export function getTagValue(tags, name) {
  const tag = tags.find((t) => t.name === name);
  return tag?.value;
}
