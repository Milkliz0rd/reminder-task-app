import { useState, useEffect } from "react";
import { getTasks } from "../services/taskService";
import type { Task } from "../types/task";

// Mappe la priorité de l'API (LOW/MEDIUM/HIGH) vers les classes/labels de la charte Matin.
const PRIORITY: Record<Task["priority"], { cls: string; label: string }> = {
  HIGH: { cls: "p-haute", label: "Haute" },
  MEDIUM: { cls: "p-moyenne", label: "Moyenne" },
  LOW: { cls: "p-basse", label: "Basse" },
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]); // Empty list at begin

  useEffect(() => {
    getTasks().then(setTasks); // We get tasks and bring it on the state
  }, []); // [] = just one times

  return (
    <div className="matin dark">
      <div className="mt-app">
        <div className="mt-main">
          <div className="mt-content">
            <h1 className="mt-page-t" style={{ marginBottom: 20 }}>
              Mes tâches
            </h1>

            {tasks.length === 0 ? (
              <div className="mt-empty">
                <div className="mt-empty-ic">🗒️</div>
                <div className="mt-empty-t">Aucune tâche pour l'instant</div>
                <div className="mt-empty-p">
                  Crée ta première tâche pour la voir apparaître ici.
                </div>
              </div>
            ) : (
              <div className="mt-cards">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={"mt-task" + (task.done ? " done" : "")}
                  >
                    <div className="mt-task-top">
                      <span className={"mt-prio " + PRIORITY[task.priority].cls}>
                        <b></b>
                        {PRIORITY[task.priority].label}
                      </span>
                      <span className="mt-dead">
                        {new Date(task.deadline).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="mt-task-title">{task.title}</div>
                    {task.description && (
                      <div className="mt-task-desc">{task.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
