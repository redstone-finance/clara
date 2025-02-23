import { open } from 'lmdb';
import * as fs from 'node:fs';

let db;

export function openDb(location) {
  if (!db) {
    if (!fs.existsSync('./storage')) {
      fs.mkdirSync('./storage');
    }
    db = open({
      path: `./storage/${location}`,
    });
  }
  return db;
}


