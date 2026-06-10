import { useState, useEffect } from "react";
import { getTasks } from "../services/taskService";
import type { Task } from "../types/task";

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]); // Empty list at begin

  useEffect(() => {
    getTasks().then(setTasks); // We get tasks and bring it on the state
  }, []); // [] = just one times

  return (
    <div>
      <h1>Mes tâches</h1>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </div>
  );
}
