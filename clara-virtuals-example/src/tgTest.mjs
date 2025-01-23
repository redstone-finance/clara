import 'dotenv/config'
import {sendToTelegram} from "./commons.mjs";

await sendToTelegram("Hey @just_ppe_55, you're so hot!", {
  tgChatId: process.env.TG_CHAT_ID,
  tgBotToken: process.env.CLARA_1_TG_BOT_TOKEN
})


/*const response = await fetch("https://api.telegram.org/bot${process.env.CLARA_1_TG_BOT_TOKEN}/getupdates?offset=783557330")


const result = await response.json();

console.log(process.env.TG_CHAT_ID)
for (let message of result.result) {
  if ("" + message.message?.chat?.id !== process.env.TG_CHAT_ID) {
    continue;
  }
  if (!message.message.entities?.find(e => e.type === "mention")) {
    continue;
  }

  console.dir(message.message.text);
  console.dir(message.update_id);
}*/
