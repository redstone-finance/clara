import { open } from 'lmdb'; // or require

let db;

export function openDb(location) {
  if (!db) {
    db = open({
      path: `./storage/${location}`,
    });
  }
  return db;
}


