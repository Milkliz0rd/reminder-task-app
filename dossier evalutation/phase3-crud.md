# Phase 3 — Composants d'accès aux données SQL (CRUD tâches + catégories)

> Ce document couvre l'implémentation des routes CRUD sur les ressources `Task` et `Category`,
> avec isolation par utilisateur, filtres, contrainte d'unicité composite, et architecture en couches.

---

## 1. Architecture en couches

Le CRUD est organisé en 4 couches strictement séparées, appliquées à chaque ressource :

```
routes/tasks.ts              → définition des endpoints HTTP + middlewares
controllers/taskController.ts       → gestion HTTP (extraction params, codes de retour)
services/taskService.ts             → logique métier (validation, règles)
db/taskQueries.ts                   → accès Prisma / base de données

routes/categories.ts         → même structure pour la ressource Category
controllers/categoryController.ts
services/categoryService.ts
db/categoryQueries.ts
```

**Principe :** chaque couche ne connaît que la suivante. Le controller ne touche jamais Prisma directement. La couche `db/` ne connaît pas les codes HTTP.

**Justification CCP2 :** cette architecture "organisée en couches" permet de localiser les bugs (une erreur 500 vient du service ou de la db, pas du routing), de tester chaque couche indépendamment, et de modifier la logique métier sans toucher au transport HTTP.

---

## 2. Endpoints implémentés

### Tâches

| Méthode | Route | Action | Auth requise |
|---|---|---|---|
| `POST` | `/tasks` | Créer une tâche | ✅ JWT |
| `GET` | `/tasks` | Lister ses tâches | ✅ JWT |
| `PUT` | `/tasks/:id` | Modifier une tâche | ✅ JWT |
| `DELETE` | `/tasks/:id` | Supprimer une tâche | ✅ JWT |

### Catégories

| Méthode | Route | Action | Auth requise |
|---|---|---|---|
| `POST` | `/categories` | Créer une catégorie | ✅ JWT |
| `GET` | `/categories` | Lister ses catégories | ✅ JWT |
| `PUT` | `/categories/:id` | Renommer une catégorie | ✅ JWT |
| `DELETE` | `/categories/:id` | Supprimer une catégorie | ✅ JWT |

---

## 3. Isolation par utilisateur

L'`userId` est extrait du token JWT par le middleware `authentificateToken`, jamais depuis le body de la requête. Un utilisateur ne peut accéder qu'aux tâches dont il est propriétaire.

**Extrait — middleware branché sur toutes les routes tâches** (`src/routes/tasks.ts`) :
```ts
router.get("/", authentificateToken, getAllTasks)
router.post("/", authentificateToken, createTask)
router.put("/:id", authentificateToken, updateTask)
router.delete("/:id", authentificateToken, removeTask)
```

**Extrait — filtrage en base** (`src/db/taskQueries.ts`) :
```ts
export async function getAllTasks(userId: number) {
  return await prisma.task.findMany({
    where: { userId: userId }
  })
}
```

**Équivalent SQL :**
```sql
SELECT * FROM "Task" WHERE "userId" = $1;
```

---

## 4. Requêtes Prisma et équivalents SQL

### Création (`POST /tasks`)

```ts
return await prisma.task.create({
  data: {
    userId: userId,
    title: data.title,
    deadline: data.deadline,
    description: data.description,
    priority: data.priority,
    categoryId: data.categoryId
  }
})
```

**Équivalent SQL :**
```sql
INSERT INTO "Task" ("userId", "title", "deadline", "description", "priority", "categoryId")
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
```

### Mise à jour (`PUT /tasks/:id`)

```ts
return await prisma.task.update({
  where: { id: taskId, userId: userId },
  data: {
    title: data.title,
    deadline: data.deadline,
    description: data.description,
    priority: data.priority,
    done: data.done
  }
})
```

**Équivalent SQL :**
```sql
UPDATE "Task"
SET "title" = $1, "deadline" = $2, "description" = $3, "priority" = $4, "done" = $5,
    "updated_at" = NOW()
WHERE "id" = $6 AND "userId" = $7;
```

> Note : `updated_at` est géré automatiquement par Prisma via la directive `@updatedAt` dans le schéma.

### Suppression (`DELETE /tasks/:id`)

```ts
return await prisma.task.delete({
  where: { id: taskId, userId: userId }
})
```

**Équivalent SQL :**
```sql
DELETE FROM "Task" WHERE "id" = $1 AND "userId" = $2;
```

---

## 5. Validation des inputs et logique métier

### Validation côté controller (A03:2021 Injection)

Avant tout appel au service, le controller vérifie les champs obligatoires :

```ts
if (!taskData.title) {
  return response.status(400).json({ message: "title is required" })
}
if (!taskData.deadline) {
  return response.status(400).json({ message: "deadline is required" })
}
```

### Règle métier — deadline dans le futur (`src/services/taskService.ts`)

```ts
export async function createTask(userId: number, data: TaskData) {
  if (data.deadline < new Date()) {
    throw new Error('The date is earlier than today')
  }
  return createTaskInDb(userId, data)
}
```

Cette règle vit dans le service, pas dans le controller ni dans la couche db — c'est une décision métier, pas une contrainte HTTP ni une contrainte de stockage.

---

## 6. Gestion des erreurs et sécurité

### Erreur P2025 — tâche introuvable

Quand Prisma ne trouve pas d'enregistrement correspondant à `{ id: taskId, userId: userId }`,
il lève une `PrismaClientKnownRequestError` avec le code `P2025`.

```ts
if (
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2025"
) {
  return response.status(404).json({ message: "Task not found" })
}
```

**Choix de sécurité :** les cas "tâche inexistante" et "tâche appartenant à un autre utilisateur" retournent tous les deux 404. Retourner 403 ("interdit") confirmerait l'existence de la tâche et permettrait à un attaquant d'énumérer les ids — c'est une fuite d'information (information disclosure).

---

## 7. Filtres sur GET /tasks

L'endpoint `GET /tasks` accepte des query params optionnels : `done`, `priority`, `deadline`.

**URL exemple :** `GET /tasks?done=false&priority=HIGH&deadline=2026-06-30T00:00:00.000Z`

**Extraction et conversion dans le controller** (`src/controllers/taskController.ts`) :
```ts
const { done, priority, deadline } = request.query
const doneFilter = done === "true" ? true : done === "false" ? false : undefined
const priorityFilter = priority as "LOW" | "MEDIUM" | "HIGH" | undefined
const deadlineFilter = deadline ? new Date(deadline as string) : undefined
```

Les valeurs de `request.query` sont toujours des strings — la conversion en `boolean` et `Date` se fait dans le controller avant d'atteindre le service.

**Requête Prisma avec filtres dynamiques** (`src/db/taskQueries.ts`) :
```ts
return await prisma.task.findMany({
  where: {
    userId: userId,
    done: done,
    priority: priority,
    deadline: deadline ? { lte: deadline } : undefined
  }
})
```

Prisma ignore automatiquement les champs à `undefined` dans le `where` — pas de condition `if` nécessaire pour chaque filtre optionnel.

**Équivalent SQL avec tous les filtres actifs :**
```sql
SELECT * FROM "Task"
WHERE "userId" = $1
  AND "done" = $2
  AND "priority" = $3
  AND "deadline" <= $4;
```

> `lte` (less than or equal) filtre les tâches dont la deadline est antérieure ou égale à la date fournie — utile pour voir les tâches à traiter avant une certaine date.

---

## 8. Codes HTTP utilisés

| Code | Signification | Cas d'usage |
|---|---|---|
| 200 | OK | GET /tasks, PUT /tasks/:id |
| 201 | Created | POST /tasks |
| 204 | No Content | DELETE /tasks/:id |
| 400 | Bad Request | Champ manquant, deadline dans le passé |
| 401 | Unauthorized | Token absent ou userId non résolu |
| 404 | Not Found | Tâche inexistante ou appartenant à un autre user |
| 500 | Internal Server Error | Erreur inattendue |

---

## 9. Catégories — contrainte d'unicité composite

### Problème identifié

Un utilisateur ne doit pas pouvoir créer deux catégories avec le même nom. Une vérification uniquement applicative (dans le service) expose à une **race condition** : deux requêtes simultanées peuvent toutes deux passer le check "ce nom existe déjà ?" avant que l'une des deux insère, et produire un doublon.

### Solution — contrainte unique composite en base

```prisma
model Category {
  id     Int    @id @default(autoincrement())
  name   String
  userId Int
  ...
  @@unique([userId, name])
}
```

La directive `@@unique([userId, name])` crée un index unique composite sur la paire `(userId, name)`. Deux utilisateurs différents peuvent avoir une catégorie "Travail" — seule la combinaison userId + name doit être unique.

**Migration générée automatiquement par Prisma :**
```sql
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");
```

**Comportement en cas de doublon :** Prisma lève une `PrismaClientKnownRequestError` avec le code `P2002` (unique constraint violation), interceptée dans le controller pour retourner un 409 Conflict.

### Typage TypeScript — `Partial<T>`

Le CRUD catégories nécessite deux contrats différents selon l'opération :
- `createCategory` : `name` est **obligatoire**
- `updateCategory` : `name` est **optionnel** (mise à jour partielle)

```ts
type CreateCategoryData = { name: string }
type UpdateCategoryData = Partial<CreateCategoryData>  // { name?: string }
```

`Partial<T>` est un utilitaire TypeScript qui rend tous les champs d'un type optionnels. Il évite de dupliquer la définition des champs.

---

## Questions jury préparées

**Q : Traduisez `prisma.task.findMany({ where: { userId } })` en SQL.**
`SELECT * FROM "Task" WHERE "userId" = $1` — `$1` est le paramètre lié, jamais concaténé.

**Q : Pourquoi `userId` vient du token et non du body ?**
Le body est contrôlé par le client — il pourrait envoyer n'importe quel `userId`. Le token est signé par le serveur et ne peut pas être falsifié sans le secret JWT.

**Q : Pourquoi 404 et non 403 quand un utilisateur tente de supprimer la tâche d'un autre ?**
Pour ne pas confirmer l'existence de la ressource. Un 403 serait une fuite d'information (information disclosure) permettant l'énumération des ids.

**Q : Où mettez-vous la logique métier et pourquoi ?**
Dans la couche service (`taskService.ts`). Le controller gère le transport HTTP, la couche db gère le stockage. Le service est la seule couche qui connaît les règles métier — ici, qu'une deadline ne peut pas être dans le passé.

**Q : Pourquoi avez-vous mis la contrainte d'unicité des catégories en base et non dans le service ?**
Une vérification applicative seule est vulnérable aux race conditions : deux requêtes simultanées peuvent toutes deux passer le check "nom déjà existant" avant que l'une insère. La contrainte en base est atomique — PostgreSQL garantit l'unicité quelle que soit la concurrence.

**Q : Qu'est-ce que `@@unique([userId, name])` garantit exactement ?**
Que la combinaison `(userId, name)` est unique dans la table. Deux utilisateurs différents peuvent avoir une catégorie "Travail" — seule la paire est contrainte. Traduit en SQL : `CREATE UNIQUE INDEX ON "Category"("userId", "name")`.

**Q : Qu'est-ce que `Partial<T>` en TypeScript ?**
Un utilitaire générique qui rend tous les champs d'un type optionnels. `Partial<{ name: string }>` donne `{ name?: string }`. Utilisé ici pour typer les données d'une mise à jour partielle, sans dupliquer la définition du type complet.
