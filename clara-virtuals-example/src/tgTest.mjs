import 'dotenv/config'
import {sendToTelegram} from "./commons.mjs";

await sendToTelegram("Just a test", {
  tgChatId: process.env.TG_CHAT_ID,
  tgBotToken: process.env.CLARA_1_TG_BOT_TOKEN
})

