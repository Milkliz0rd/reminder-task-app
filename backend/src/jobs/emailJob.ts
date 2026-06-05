import cron from "node-cron";
import { sendDailyReminder } from "../services/emailService";

cron.schedule(" 0 8 * * *", async () => {
  try {
    await sendDailyReminder();
  } catch (error) {
    console.error("Email job failed: ", error);
  }
});
