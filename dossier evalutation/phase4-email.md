# Phase 4 — Fonctionnalité email : cron job + Nodemailer

> Ce document décrit l'implémentation du rappel quotidien par email :
> chaque matin à 8h, chaque utilisateur reçoit un récapitulatif de ses tâches
> non terminées, classées par urgence.

---

## 1. Architecture de la fonctionnalité

La fonctionnalité est organisée en 3 couches distinctes, cohérentes avec l'architecture en couches du projet :

```
src/
├── db/emailQueries.ts        → accès base de données (requête Prisma)
├── services/emailService.ts  → logique métier (classification, template, envoi)
└── jobs/emailJob.ts          → planification (cron node-cron)
```

Le cron job est importé dans `server.ts` au démarrage — un simple `import` suffit pour l'activer, car `cron.schedule()` s'exécute au chargement du module.

---

## 2. Requête base de données — `emailQueries.ts`

```ts
export async function getUsersWithPendingTasks() {
  return await prisma.user.findMany({
    where: {
      tasks: {
        some: { done: false },
      },
    },
    include: {
      tasks: {
        where: { done: false },
      },
    },
  });
}
```

**Équivalent SQL :**
```sql
SELECT "User".*, "Task".*
FROM "User"
JOIN "Task" ON "Task"."userId" = "User"."id"
WHERE "Task"."done" = false
AND EXISTS (
  SELECT 1 FROM "Task" t
  WHERE t."userId" = "User"."id"
  AND t."done" = false
)
```

**Points clés :**
- `some` dans le `where` → filtre les users qui ont au moins une tâche non terminée (correspond à un `EXISTS` en SQL)
- `where` dans l'`include` → filtre les tâches incluses (seules les tâches `done = false`)
- Résultat structuré : liste de users, chaque user contient ses tâches → structure optimale pour envoyer un email par user

**Décision de périmètre :** le rappel couvre toutes les tâches non terminées (pas seulement celles du jour), car l'intérêt de l'application est de rappeler les tâches jusqu'à leur validation. La deadline sert de jauge d'urgence dans le template.

---

## 3. Logique métier — `emailService.ts`

### Configuration du transporteur Nodemailer

```ts
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});
```

**Deux environnements :**
- Dev : Mailtrap (sandbox SMTP) — les emails sont interceptés et consultables dans l'interface web, jamais envoyés réellement
- Prod (démo jury) : un vrai compte SMTP (variable `MAILTRAP_*` remplacée par un vrai fournisseur)

### Classification des tâches par urgence

```ts
export function classifyTasks(tasks: Task[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const overdue: Task[] = [];
  const thisDay: Task[] = [];
  const upcoming: Task[] = [];

  tasks.forEach((task) => {
    if (task.deadline < today)                              overdue.push(task);
    else if (task.deadline >= today && task.deadline < tomorrow) thisDay.push(task);
    else if (task.deadline >= tomorrow)                     upcoming.push(task);
  });

  return { overdue, today: thisDay, upcoming };
}
```

**Pourquoi `setHours(0, 0, 0, 0)` ?**
Les deadlines sont stockées en base avec une heure précise. Sans ramener les deux dates à minuit, `new Date()` (ex: `10:32:15`) serait différent d'une deadline à `08:00:00` même si elles sont le même jour — la comparaison serait fausse.

### Template email — 3 sections conditionnelles

Chaque section n'est incluse dans l'email que si elle contient au moins une tâche (`length > 0`). Un email avec 3 sections vides serait du bruit inutile.

```ts
const overdueSection = tasksClassified.overdue.length > 0
  ? `<h2>Tâche(s) en retard</h2>
     <ul>${tasksClassified.overdue.map(t => `<li>${t.title}</li>`).join('')}</ul>`
  : ''
```

---

## 4. Cron job — `emailJob.ts`

```ts
import cron from 'node-cron'
import { sendDailyReminder } from '../services/emailService'

cron.schedule('0 8 * * *', async () => {
  try {
    await sendDailyReminder()
  } catch (error) {
    console.error('Email job failed:', error)
  }
})
```

**Syntaxe cron `0 8 * * *` :**

| Champ | Valeur | Signification |
|---|---|---|
| minute | 0 | à la minute 0 |
| heure | 8 | à 8h |
| jour du mois | * | tous les jours |
| mois | * | tous les mois |
| jour de la semaine | * | tous les jours |

**Try/catch obligatoire :** sans lui, une erreur SMTP (ex: Mailtrap rate limit) ferait crasher le process Node.js tout entier — le serveur s'arrêterait. Avec le try/catch, l'erreur est loggée et le serveur continue de fonctionner.

---

## 5. Variables d'environnement ajoutées

```
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=<token>
MAILTRAP_PASS=<token>
```

Documentées dans `.env.example` — jamais committées avec leurs vraies valeurs.

---

## 6. Questions jury préparées

**Q : Pourquoi Mailtrap et pas directement Gmail SMTP ?**
En développement, on ne veut pas envoyer de vrais emails à de vrais utilisateurs par erreur. Mailtrap est un serveur SMTP sandbox — il accepte les emails mais les intercepte au lieu de les livrer. Pour la démo jury, les credentials seront remplacés par un vrai SMTP via la variable d'environnement.

**Q : Qu'est-ce qu'un cron job ? Pourquoi `node-cron` et pas `setTimeout` ?**
Un cron job est une tâche planifiée qui s'exécute à intervalles réguliers selon une expression temporelle. `setTimeout` s'exécute une seule fois après un délai. `node-cron` suit la syntaxe cron standard (minutes, heures, jours…), est précis à la minute, et persiste tant que le process tourne.

**Q : Que se passe-t-il si le serveur est éteint à 8h ?**
Le cron job ne s'exécute pas — la tâche est perdue pour ce jour. C'est une limitation connue d'un cron embarqué dans le process applicatif. Une solution de production serait un cron système (crontab) ou un service externe. Pour ce projet, la contrainte est acceptable et sera mentionnée en démo.

**Q : Comment avez-vous testé l'envoi d'email sans attendre 8h du matin ?**
En changeant temporairement l'expression cron à `* * * * *` (toutes les minutes) pendant le développement. Ce pattern "expression configurable" est une bonne pratique — en production on met `0 8 * * *`, en debug on peut forcer une exécution rapide.

**Q : Pourquoi `setHours(0, 0, 0, 0)` dans `classifyTasks` ?**
Pour comparer des dates sans tenir compte de l'heure. Un objet `Date` en JavaScript contient la date ET l'heure jusqu'à la milliseconde. Deux dates du même jour auraient des timestamps différents si on les compare directement. `setHours(0, 0, 0, 0)` ramène les deux dates à minuit avant comparaison.
