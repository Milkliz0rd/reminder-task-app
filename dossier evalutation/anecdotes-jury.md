# Anecdotes pour la défense orale

> Ce document recense les problèmes techniques rencontrés et résolus pendant le développement.
> Chaque anecdote est structurée pour pouvoir être racontée à l'oral devant le jury, en lien
> avec une ou plusieurs compétences du référentiel CDA.

---

## 1. Bug d'inversion de paramètres dans `updateTask`, révélé par les tests d'intégration

### Contexte
Phase 5 — écriture du test d'intégration `PUT /tasks/:id` (cas nominal). Le test envoyait une requête de mise à jour avec un token JWT valide et un ID de tâche existant. Il attendait un code HTTP **200**, il recevait systématiquement un **404**.

### Diagnostic
En remontant la chaîne d'appels, j'ai trouvé l'origine dans `src/services/taskService.ts` :

```ts
// Service (avant fix)
return updateTaskInDb(userId, taskId, data);  // ❌ ordre inversé
```

Mais la fonction de la couche `db/` attendait :

```ts
// db/taskQueries.ts
export async function updateTask(taskId: number, userId: number, data: ...)
```

Conséquence : Prisma cherchait une tâche avec `where: { id: <vraie userId>, userId: <vraie taskId> }` — aucune ne matchait, levée de l'erreur `P2025`, transformée par le controller en **404 Task not found**.

### Pourquoi TypeScript n'a pas vu le bug
Les deux paramètres ont le même type (`number`). L'inversion était valide côté types — donc invisible au compilateur.

### Résolution
Inversion des deux premiers arguments dans `taskService.ts:36` pour respecter la signature de la couche db :

```ts
return updateTaskInDb(taskId, userId, data);  // ✅ ordre correct
```

### Compétences démontrées
- **CP9 — Élaborer et exécuter des plans de tests** (CCP3) : démontre la valeur des tests d'intégration au-delà des garanties du compilateur.
- **CCP2 — Architecture en couches** : la séparation routes / controllers / services / db expose des contrats inter-couches qu'il faut vérifier explicitement.
- **Compétence transversale — Résolution de problème** : diagnostic d'un bug silencieux qui n'aurait été visible qu'en production.

### Pitch jury (3-4 lignes prêtes à dire)
> « En écrivant le test d'intégration de `PUT /tasks/:id`, j'ai découvert un bug d'inversion de paramètres dans mon service : je passais `(userId, taskId)` à la couche db qui attendait `(taskId, userId)`. TypeScript ne pouvait pas l'attraper, les deux étaient des `number`. Sans ce test, toute mise à jour de tâche aurait échoué silencieusement en prod. C'est précisément la valeur des tests d'intégration : ils valident le contrat entre les couches, pas juste la syntaxe. »

---

## 2. Client Prisma absent du runner CI — résolu via le hook `postinstall`

### Contexte
Phase 5 — premier run du pipeline GitHub Actions après l'ajout des 14 tests d'intégration. En local, les 14 tests passaient au vert. Sur le runner CI, le step `Test` est tombé en erreur :

```
src/db/prisma.ts:3:30 - error TS2307: Cannot find module
'../generated/prisma/client' or its corresponding type declarations.
```

### Diagnostic
Mon fichier `src/db/prisma.ts` importe `PrismaClient` depuis `src/generated/prisma/client`. Ce dossier est généré par la commande `npx prisma generate` et il est volontairement listé dans `.gitignore` (les fichiers générés ne se commitent pas).

Sur ma machine, le dossier existait depuis un `npx prisma generate` antérieur. Sur le runner GitHub Actions fraîchement cloné, le dossier n'existait pas — et `npm install` ne le générait pas tout seul avec le provider Prisma 7 `prisma-client`.

Le step `prisma migrate deploy` était passé sans erreur car il utilise uniquement le **CLI Prisma**, pas le client compilé en TypeScript.

### Résolution
Ajout d'un script `postinstall` dans `package.json` :

```json
"scripts": {
  "postinstall": "prisma generate"
}
```

`npm` exécute automatiquement ce script à la fin de chaque `npm install`, **dans tous les environnements** :
- ma machine locale
- la CI GitHub Actions
- un futur serveur de production
- la machine d'un futur collaborateur qui clone le repo

C'est le pattern documenté par Prisma pour garantir qu'aucun environnement ne peut avoir un client désynchronisé du schéma.

### Compétences démontrées
- **CP11 — Démarche DevOps** (CCP3) : automatisation du build, reproductibilité de l'environnement.
- **CP10 — Préparer le déploiement** (CCP3) : démarche d'automatisation orientée production-ready.
- **Compétence transversale — Résolution de problème** : diagnostic effectué via la lecture des logs de la CI, pas en local.

### Pitch jury (3-4 lignes prêtes à dire)
> « Lors du premier run de ma CI, les tests d'intégration ont planté parce que le client Prisma — généré dans un dossier gitignored — n'existait pas sur le runner. J'ai ajouté un script `postinstall: prisma generate` dans `package.json` qui automatise la génération à chaque `npm install`, quel que soit l'environnement. C'est le pattern recommandé par Prisma : il garantit qu'aucun environnement n'a un client désynchronisé du schéma. C'est aussi une démonstration concrète de démarche DevOps. »
