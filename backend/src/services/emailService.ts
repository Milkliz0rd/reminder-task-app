import nodemailer from "nodemailer";
import dotenv from "dotenv";
import type { Task } from "../generated/prisma/client";
import { getUsersWithPendingTasks } from "../db/emailQueries";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

export async function sendDailyReminder() {
  const users = await getUsersWithPendingTasks();
  for (const user of users) {
    const tasksClassified = classifyTasks(user.tasks);
    const overdueSection =
      tasksClassified.overdue.length > 0
        ? `<h2>Tâche(s) en retard(s): </h2>
          <ul>${tasksClassified.overdue
            .map((task) => `<li>${task.title}</li>`)
            .join(" ")}
          </ul>`
        : "";
    const todaySection =
      tasksClassified.today.length > 0
        ? `<h2>Tâche(s) du jour: </h2>
          <ul>${tasksClassified.today
            .map((task) => `<li>${task.title}</li>`)
            .join(" ")}
          </ul>`
        : "";
    const upcomingSection =
      tasksClassified.upcoming.length > 0
        ? `<h2>Tâche(s) à venir:</h2>
          <ul>${tasksClassified.upcoming
            .map(
              (task) =>
                `<li><a href="http://localhost:5173/tasks/${task.id}">${task.title} ${task.deadline.toLocaleDateString("fr-FR")}</a></li>`,
            )
            .join(" ")}
          </ul>`
        : "";
    await transporter.sendMail({
      from: `"Tak Reminder" <noreply@taskreminder.com>`,
      to: user.email,
      subject: "Vos tâches restantes ✅",
      html: ` <h1>Bonjour ${user.email} </h1>
      ${overdueSection}
      ${todaySection}
      ${upcomingSection}
      <p>N'oubliez pas de valider vos tâches sur votre profil<p>
      <h3>Merci d'avoir choisi Task Reminder by Alexandre Morozoff Dev</h3>
      `,
    });
  }
}

export function classifyTasks(tasks: Task[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const overdue: Task[] = [];
  const thisDay: Task[] = [];
  const upcoming: Task[] = [];
  tasks.forEach((task) => {
    if (task.deadline < today) {
      return overdue.push(task);
    }
    if (task.deadline >= today && task.deadline < tomorrow) {
      return thisDay.push(task);
    }
    if (task.deadline >= tomorrow) {
      return upcoming.push(task);
    }
  });
  return { overdue, today: thisDay, upcoming };
}
