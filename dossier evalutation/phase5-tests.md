# Phase 5 — Plan de tests, tests de sécurité et CI/CD

> Ce document couvre la stratégie de tests automatisés du projet : 14 tests d'intégration
> couvrant l'authentification, le CRUD tâches, l'isolation par utilisateur et un test
> explicite d'injection SQL. Tous les tests s'exécutent automatiquement à chaque push
> via GitHub Actions.

---

## 1. Stratégie de tests — pourquoi des tests d'intégration

Deux types de tests automatisés coexistent dans l'écosystème :

| Type | Ce qu'il teste | Exemple |
|---|---|---|
| **Test unitaire** | Une fonction isolée, dépendances mockées | `computeStatus()` (projet Osol) |
| **Test d'intégration** | Une chaîne complète : HTTP → controller → service → DB | `POST /tasks` valide bien que la tâche soit créée en base, isolée par user |

**Choix pour ce projet : tests d'intégration.**

Le projet Osol (formation principale) couvre déjà les tests unitaires sur la logique de calcul de statut. Ce projet vient compléter le dossier CDA en démontrant des **tests d'intégration sur API REST + base de données relationnelle** — une compétence distincte que le jury attend explicitement (CP9 / CCP3).

**Ce qu'un test d'intégration garantit :**
- Le contrat HTTP est respecté (codes, payloads)
- Les middlewares (JWT, validation) sont bien branchés
- Les requêtes Prisma fonctionnent réellement contre une vraie DB
- L'isolation par utilisateur est effective de bout en bout
- Les mesures de sécurité (anti information disclosure, anti injection SQL) tiennent en conditions réelles

---

## 2. Architecture des tests

```
backend/
├── tests/
│   ├── auth.test.ts          → 5 tests : register, login (cas nominaux + erreurs + sécurité)
│   ├── tasks.test.ts         → 8 tests : CRUD complet + isolation par user
│   ├── security.test.ts      → 1 test : tentative d'injection SQL
│   ├── setup.ts              → Chargement .env.test (avant le framework Jest)
│   ├── jest.setup.ts         → beforeEach(resetDb) + afterAll(prisma.$disconnect)
│   └── helpers/
│       ├── resetDb.ts        → Vide les tables entre chaque test
│       └── authTestUser.ts   → Factory : crée un user + signe un token JWT
└── jest.config.js            → Branche les deux setup files
```

**Outils utilisés :**

| Outil | Rôle |
|---|---|
| **Jest** | Framework de test : exécute, regroupe, rapporte |
| **Supertest** | Simule des requêtes HTTP sur l'app Express en mémoire (pas de port à ouvrir) |
| **ts-jest** | Permet à Jest d'exécuter du TypeScript directement |
| **dotenv-cli** | Charge `.env.test` pour les commandes CLI (migrations) |

---

## 3. Isolation des environnements — pattern 12-Factor App

> Le principe **12-Factor App** impose une séparation stricte entre les environnements
> (dev / test / prod). Chacun a sa propre base de données et sa propre configuration.

### Trois bases, trois fichiers `.env`

| Environnement | Base de données | Variables d'env | Quand ? |
|---|---|---|---|
| Dev local | `task_reminder` (Postgres local, port 5433) | `.env` | Pendant le développement quotidien |
| Tests automatiques | `task_reminder_test` (Postgres local, port 5433) | `.env.test` | À chaque `npm test` |
| Prod (Phase 7) | Postgres hébergé (Neon ou autre) | Variables CI/serveur | Sur le serveur déployé |

**Pourquoi un fichier `.env.test` séparé ?**
Le code de test ne doit jamais pouvoir toucher la base de prod ni la base de dev. Une erreur de config ne doit pas pouvoir détruire des données réelles. La séparation physique des bases est une **mesure de sécurité par défaut**.

### Chargement des variables — astuce dotenv

`tests/setup.ts` est exécuté **avant le framework Jest** (option `setupFiles` de Jest). Il charge `.env.test` dans `process.env` :

```ts
import dotenv from "dotenv"
dotenv.config({ path: ".env.test" })
```

Quand le code source charge ensuite `dotenv/config` (par défaut, lit `.env`), il **n'écrase pas** les variables déjà définies. La DB de test est donc utilisée pour toute la suite de tests, sans modifier aucun code applicatif.

**À l'oral :** le comportement par défaut de `dotenv` (ne pas écraser) est exploité comme mécanisme de priorité — `.env.test` chargé en premier gagne.

---

## 4. Helpers de tests

### `resetDb` — vider les tables entre chaque test

```ts
// tests/helpers/resetDb.ts
import { prisma } from "../../src/db/prisma"

export async function resetDb() {
  await prisma.task.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
}
```

L'ordre est explicite (du plus dépendant au moins dépendant) pour la lisibilité et la robustesse face aux futurs changements de schéma. Branché en `beforeEach` global :

```ts
// tests/jest.setup.ts
beforeEach(async () => {
  await resetDb()
})

afterAll(async () => {
  await prisma.$disconnect()  // ferme la connexion pour que Jest exit proprement
})
```

**Trois propriétés garanties par ce setup :**
- **Prévisibilité** — chaque test démarre avec une base vide, état connu
- **Idempotence** — relancer le même test plusieurs fois donne le même résultat
- **Isolation** — un test qui plante ne contamine pas le suivant

### `createAuthUser` — factory pour préparer un user authentifié

```ts
// tests/helpers/authTestUser.ts
export async function createAuthUser(email: string, password: string) {
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, password_hash: hash }
  })

  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET is not defined")

  const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "1h" })

  return { user: { id: user.id, email: user.email }, token }
}
```

**Pourquoi une factory plutôt qu'un appel à `POST /auth/register` ?**
Pour tester `POST /tasks`, il faut un user authentifié — mais on ne veut **pas** que ce test dépende du bon fonctionnement de `register`. Si `register` casse demain, seul son propre test doit échouer, pas tous les tests CRUD. La factory prépare l'état directement en base, par la voie la plus courte.

**À l'oral :** principe « test independence » — un bug = un test rouge, pas une cascade de rouges qui masque la cause racine.

---

## 5. Exécution séquentielle (`--runInBand`)

Par défaut, Jest exécute les fichiers de tests **en parallèle** dans plusieurs workers. Avec une **base de données partagée**, cela provoque des conditions de course : un worker fait `resetDb()` pendant qu'un autre est en train d'insérer.

Solution adoptée : forcer l'exécution séquentielle.

```json
// package.json
"test": "NODE_OPTIONS=--experimental-vm-modules jest --runInBand --passWithNoTests"
```

**Trade-off :** légèrement plus lent (2-3 secondes vs 1-2 en parallèle), mais **100% déterministe**. Pour des tests d'intégration sur DB partagée, la fiabilité prime sur la vitesse.

> `NODE_OPTIONS=--experimental-vm-modules` est nécessaire pour que Jest puisse charger du code ESM (le client Prisma 7 utilise `import.meta.url`).

---

## 6. Tests d'authentification — `tests/auth.test.ts`

5 tests couvrent `POST /auth/register` et `POST /auth/login`.

| # | Test | Cas | Code HTTP |
|---|---|---|---|
| 1 | register cas nominal | email + password valides, DB vide | **201** + message + user en base avec hash bcrypt |
| 2 | register email déjà pris | un user existe déjà avec cet email | **409** + pas de doublon créé |
| 3 | login cas nominal | credentials corrects | **200** + token JWT (3 segments) |
| 4 | login mauvais password | email existant, password faux | **401** + message générique |
| 5 | login user inexistant | aucun user en base | **401** + **même** message qu'au test 4 |

**Focus sécurité : tests 4 et 5 prouvent l'anti information disclosure (OWASP A07:2021)**

```ts
// Wrong password
expect(response.body.message).toBe("Credentials are not correct")

// Nonexistent user
expect(response.body.message).toBe("Credentials are not correct")  // ← identique
```

Le test assert explicitement que les deux cas renvoient le **même** message → un attaquant ne peut pas énumérer les emails existants en mesurant la différence de réponses.

**À l'oral :** la sécurité ne se prouve pas par déclaration ; le test la **démontre**.

---

## 7. Tests CRUD `/tasks` — `tests/tasks.test.ts`

8 tests couvrent les 4 opérations avec un focus particulier sur **l'isolation par utilisateur**.

| # | Test | Cas | Code HTTP |
|---|---|---|---|
| 1 | POST cas nominal (auth) | user authentifié crée une tâche | **201** + tâche liée à `userId` du token |
| 2 | POST sans token | requête sans header Authorization | **401** |
| 3 | POST sans title | payload incomplet | **400** + message `"title is required"` |
| 4 | GET isolation par user | 2 users, 2 tâches user1 + 1 tâche user2 → user1 ne voit que ses 2 tâches | **200** + 2 tâches retournées |
| 5 | PUT cas nominal | user met à jour sa tâche | **200** + champ modifié en base |
| 6 | PUT tâche d'un autre user | user1 tente de modifier la tâche de user2 | **404** + tâche **non modifiée** en base |
| 7 | DELETE cas nominal | user supprime sa tâche | **204** + tâche absente de la base |
| 8 | DELETE tâche d'un autre user | user1 tente de supprimer la tâche de user2 | **404** + tâche **toujours présente** en base |

**Focus sécurité : tests 4, 6 et 8 prouvent l'absence d'IDOR (OWASP A01:2021 — Broken Access Control)**

Le test 4 utilise `.every()` pour vérifier que **toutes** les tâches retournées appartiennent au user du token :

```ts
expect(response.body.tasks).toHaveLength(2)
expect(
  response.body.tasks.every(
    (task: { userId: number }) => task.userId === user1.user.id
  )
).toBe(true)
```

Les tests 6 et 8 vérifient le **404** (et non 403) cohérent avec la stratégie anti information disclosure documentée en Phase 3.

**À l'oral :** preuve concrète qu'un user ne peut accéder, modifier ou supprimer **aucune** ressource appartenant à un autre — quelle que soit l'opération.

---

## 8. Test d'injection SQL — `tests/security.test.ts`

> Test explicite obligatoire pour le jury (CCP3 — Tests de sécurité).
> Démonstration que la couche Prisma neutralise OWASP A03:2021 Injection.

```ts
describe("Security — SQL injection", () => {
  it("Login refuses SQL injection attempt - 401", async () => {
    // ARRANGE — un user légitime existe en base
    const hash = await bcrypt.hash("password1234", 10)
    await prisma.user.create({
      data: { email: "alex@test.com", password_hash: hash }
    })

    // ACT — tenter une injection dans le champ email
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "' OR 1=1 --",
        password: "anything"
      })

    // ASSERT — l'injection n'a pas contourné l'auth
    expect(response.status).toBe(401)
    expect(response.body.message).toBe("Credentials are not correct")

    // ASSERT — le user légitime existe toujours (base non altérée)
    const userStillThere = await prisma.user.findUnique({
      where: { email: "alex@test.com" }
    })
    expect(userStillThere).not.toBeNull()
  })
})
```

**Ce que le test démontre concrètement :**
1. La chaîne `' OR 1=1 --` est traitée comme une **valeur littérale**, pas comme du SQL exécutable
2. PostgreSQL cherche un user dont l'email est *exactement* `' OR 1=1 --` → aucun match → 401
3. La base n'a pas été altérée (le user légitime existe toujours)

**Pourquoi ça marche : requête paramétrée générée par Prisma**

```sql
SELECT * FROM "User" WHERE email = $1
-- avec $1 = ' OR 1=1 --
```

La valeur `$1` est **liée** par PostgreSQL en tant que paramètre, pas concaténée dans le SQL. Le serveur de base de données traite la valeur comme une chaîne de caractères, jamais comme du code.

**À l'oral :** « Si j'avais écrit `\`SELECT * FROM users WHERE email = '${email}'\`` avec concaténation, l'injection aurait fonctionné — `' OR 1=1 --` aurait fermé le quote et désactivé le check password. Prisma rend ce type de bug impossible par construction. »

---

## 9. Pipeline CI — GitHub Actions

À chaque push sur `main`, le pipeline s'exécute automatiquement sur un runner Ubuntu fraîchement créé. Il garantit qu'aucun code cassé ne reste sur la branche principale.

### Étapes du pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: task_reminder_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/task_reminder_test
      JWT_SECRET: ci_test_secret_not_for_prod

    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies
        run: npm install
      - name: Apply Prisma migrations
        run: npx prisma migrate deploy
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm test
```

### Points clés à expliquer au jury

| Élément | Rôle |
|---|---|
| `services: postgres` | Container Docker démarré en parallèle du job — fournit une vraie DB Postgres au runner |
| `env: DATABASE_URL / JWT_SECRET` | Variables injectées dans tous les steps — remplace le `.env.test` (qui est gitignored) |
| `postinstall: prisma generate` | Script dans `package.json` qui génère le client Prisma à chaque `npm install` — garantit qu'il existe sur le runner |
| `npx prisma migrate deploy` | Applique les migrations existantes sur la DB de test, mode non-interactif (pas de `migrate dev`) |
| `--runInBand` | Évite les race conditions sur la DB partagée (cf. section 5) |

> Le bug de génération du client Prisma absent du runner a été rencontré et documenté dans
> `anecdotes-jury.md` (anecdote 2) — démarche DevOps concrète à raconter à l'oral.

### Capture du pipeline vert

> 📸 *À ajouter avant la soutenance — capture d'écran de l'onglet "Actions" du repo GitHub
> montrant le run vert du commit qui a finalisé la Phase 5.*

---

## 10. Jeu d'essai rempli

| Cas | Données en entrée | Résultat attendu | Résultat obtenu | Écart |
|---|---|---|---|---|
| Register nominal | email + password valides | 201 + user créé avec hash bcrypt | 201 + user en base, password hashé | ✅ |
| Register email déjà pris | email d'un user existant | 409 | 409 + pas de doublon | ✅ |
| Login nominal | credentials valides | 200 + token JWT | 200 + JWT à 3 segments | ✅ |
| Login mauvais password | email existant, password faux | 401 | 401 + message générique | ✅ |
| Login user inexistant | aucun user en base | 401 (même message qu'au cas précédent) | 401 + message identique | ✅ |
| POST /tasks nominal | user auth + payload complet | 201 + tâche liée au userId du token | 201 + userId correct en base | ✅ |
| POST /tasks sans token | requête sans Authorization | 401 | 401 | ✅ |
| POST /tasks sans title | payload incomplet | 400 + message "title is required" | 400 + message conforme | ✅ |
| GET /tasks isolation | 2 users, tâches mixtes | user1 ne voit que ses tâches | 2 tâches retournées, toutes liées à user1 | ✅ |
| PUT /tasks nominal | user met à jour sa tâche | 200 + champ modifié | 200 + base modifiée | ✅ |
| PUT /tasks autre user | user1 modifie tâche de user2 | 404 + tâche intacte | 404 + titre inchangé en base | ✅ |
| DELETE /tasks nominal | user supprime sa tâche | 204 + absente de base | 204 + `findUnique` retourne null | ✅ |
| DELETE /tasks autre user | user1 supprime tâche de user2 | 404 + tâche conservée | 404 + tâche toujours en base | ✅ |
| Injection SQL sur login | email = `' OR 1=1 --` | 401 + base non altérée | 401 + user légitime intact | ✅ |

**Total : 14 tests passent en local et sur la CI.**

---

## 11. Compétences couvertes

| Compétence | Élément démontré |
|---|---|
| **CP9 — Élaborer et exécuter des plans de tests** | 14 tests d'intégration documentés, jeu d'essai rempli |
| **CCP3 — Tests, sécurité, déploiement** | Tests de sécurité explicites (injection SQL, isolation par user) |
| **CP11 — Démarche DevOps** | Pipeline GitHub Actions complet avec service Postgres, exécution automatique sur chaque push |
| **CCP1 — Sécurité applicative** | Anti information disclosure et anti IDOR prouvés par des tests, pas seulement déclarés |
| **CCP2 — Architecture en couches** | Tests qui valident le contrat entre couches (révélation du bug `updateTask` documentée dans `anecdotes-jury.md`) |
| **Compétence transversale — Anglais** | Documentation Jest, Supertest, Prisma consultée en anglais |

---

## 12. Questions jury préparées

**Q : Quelle différence entre test unitaire et test d'intégration ?**
Un test unitaire isole une fonction et mocke ses dépendances (rapide, ciblé). Un test d'intégration exécute une chaîne complète, sans mock, contre une vraie base de données. J'ai choisi des tests d'intégration parce que le projet Osol couvre déjà l'unitaire, et parce que les tests d'intégration sont les seuls à pouvoir détecter des bugs de contrat entre couches.

**Q : Comment garantissez-vous que vos tests ne s'influencent pas entre eux ?**
Trois mécanismes : (1) un `beforeEach` qui vide les tables avant chaque test, (2) le flag `--runInBand` qui force l'exécution séquentielle (sinon race conditions sur la DB partagée), (3) une base `task_reminder_test` physiquement séparée de la base de dev.

**Q : Comment votre test d'injection SQL prouve-t-il que vous êtes protégé ?**
Il envoie une chaîne d'injection classique (`' OR 1=1 --`) dans le champ email du login. Avec une concaténation naïve, ça aurait contourné l'authentification. Avec Prisma — qui utilise des requêtes paramétrées — la chaîne est traitée comme une valeur littérale, PostgreSQL cherche un user avec cet email exact, n'en trouve pas, renvoie 401. Le test vérifie aussi que la base n'a pas été altérée.

**Q : Pourquoi `--runInBand` plutôt que le parallélisme par défaut ?**
Parce que mes tests d'intégration tapent tous sur la même base. Sans `--runInBand`, deux workers peuvent faire `resetDb` puis insérer simultanément → l'un efface les données de l'autre. Trade-off accepté : tests un peu plus lents, mais déterministes. C'est un cas où la fiabilité prime sur la vitesse.

**Q : Comment votre CI sait qu'elle doit utiliser une autre base que celle de votre dev ?**
Le workflow GitHub Actions définit `DATABASE_URL` directement comme variable d'environnement du job — elle pointe vers un container Postgres démarré en parallèle (`services: postgres`). Le fichier `.env.test` est gitignored donc absent du runner — c'est la variable injectée par le workflow qui prend le relais. Pattern 12-Factor App : la config par environnement.

**Q : Vous avez un script `postinstall` dans votre `package.json` — à quoi sert-il ?**
Il exécute automatiquement `prisma generate` après chaque `npm install`. Sans ça, le client Prisma n'existerait pas sur le runner CI (le dossier `src/generated/prisma/` est gitignored). C'est le pattern recommandé par Prisma pour garantir qu'aucun environnement (local, CI, prod) ne peut avoir un client désynchronisé du schéma. C'est une démarche DevOps : automatiser pour éliminer les écarts entre environnements.
