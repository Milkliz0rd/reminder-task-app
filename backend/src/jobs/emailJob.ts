import cron from "node-cron";
import { sendDailyReminder } from "../services/emailService";

cron.schedule(" 0 8 * * *", () => {
  try {
    sendDailyReminder();
  } catch (error) {
    console.error("Email job failed: ", error);
  }
});
