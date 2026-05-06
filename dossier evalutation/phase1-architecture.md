# Phase 1 — Architecture logicielle, stack technique, MCD et MPD

## 1. Architecture logicielle

L'application est organisée en **architecture en couches** côté backend :

```
server.ts          → Point d'entrée, démarre le serveur HTTP
src/
├── routes/        → Définition des endpoints HTTP (GET, POST, PUT, DELETE)
├── controllers/   → Chef d'orchestre : reçoit la requête, appelle le service, renvoie la réponse
├── services/      → Logique métier : règles, traitements, appels à la base de données
├── middleware/    → Fonctions transversales : vérification JWT, rate limiting, validation
├── db/            → Client Prisma (connexion à la base de données)
└── jobs/          → Cron job quotidien pour l'envoi d'emails
```

**Pourquoi cette séparation ?**
Chaque couche a une responsabilité unique (principe de responsabilité unique). Le controller ne contient pas de logique métier — il transmet. Le service ne connaît pas la requête HTTP — il traite. Cette séparation permet de localiser précisément l'origine d'un bug, et de tester chaque couche indépendamment.

---

## 2. Justification de la stack technique

| Technologie | Rôle | Justification |
|---|---|---|
| Node.js + Express | Serveur HTTP | Maîtrise existante, léger, adapté aux APIs REST |
| TypeScript | Langage | Typage statique, détection d'erreurs à la compilation, standard industrie |
| Prisma 7 | ORM + migrations | Système de migrations versionné, standard dans l'écosystème Node.js/NestJS, fichiers SQL générés visibles |
| PostgreSQL (Neon) | Base de données | BDD relationnelle — couvre la compétence SQL manquante (CCP2) |
| JWT + bcrypt | Authentification | Standard industriel, sécurisé, démontrable |
| Nodemailer + node-cron | Email + planification | Intégration réelle, testable en live devant le jury |
| GitHub Actions | CI/CD | Pipeline automatisé : lint + tests à chaque push sur main |

**Sur le choix Prisma vs driver natif `pg` :**
Prisma est devenu le standard de facto dans l'écosystème Node.js (utilisé avec NestJS, Express, etc.). Son système de migrations versionnées est plus professionnel et scalable qu'un fichier `init.sql` statique. Pour démontrer la compétence CCP2 "composants d'accès données SQL", au moins une requête complexe (JOIN tâches + catégories) sera écrite en SQL brut via `prisma.$queryRaw` — choix délibéré pour garder le contrôle et la lisibilité sur cette requête.

---

## 3. MCD — Modèle Conceptuel de Données

> Le MCD représente les entités métier et leurs associations, sans types SQL.

```
┌─────────┐         ┌────────────┐         ┌──────────┐
│  USER   │         │  CATEGORY  │         │   TASK   │
├─────────┤         ├────────────┤         ├──────────┤
│ email   │         │ name       │         │ title    │
│ password│         └────────────┘         │ descr.   │
└─────────┘                                │ deadline │
     │                    │                │ priority │
     │ possède (1,n)       │ regroupe (0,n) │ done     │
     └────────────────────┴────────────────┘
```

**Associations :**
- Un `User` possède zéro ou plusieurs `Task` — relation 1,N
- Un `User` possède zéro ou plusieurs `Category` — relation 1,N
- Une `Category` regroupe zéro ou plusieurs `Task` — relation 0,N (une tâche peut exister sans catégorie)

---

## 4. MPD — Modèle Physique de Données

> Le MPD est généré automatiquement par Prisma à partir du schéma. Fichier source : `backend/prisma/migrations/20260504132702_init/migration.sql`

```sql
-- Enum pour la priorité des tâches
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- Table des utilisateurs
CREATE TABLE "User" (
    "id"            SERIAL NOT NULL,
    "email"         TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Index unique sur l'email (contrainte d'unicité)
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Table des catégories
CREATE TABLE "Category" (
    "id"     SERIAL NOT NULL,
    "name"   TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- Table des tâches
CREATE TABLE "Task" (
    "id"          SERIAL NOT NULL,
    "userId"      INTEGER NOT NULL,
    "categoryId"  INTEGER,               -- nullable : tâche sans catégorie possible
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "deadline"    TIMESTAMP(3) NOT NULL,
    "priority"    "Priority" NOT NULL DEFAULT 'LOW',
    "done"        BOOLEAN NOT NULL DEFAULT false,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- Clés étrangères avec comportements de suppression
ALTER TABLE "Category"
    ADD CONSTRAINT "Category_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE;   -- suppression user → suppression de ses catégories

ALTER TABLE "Task"
    ADD CONSTRAINT "Task_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE;   -- suppression user → suppression de ses tâches

ALTER TABLE "Task"
    ADD CONSTRAINT "Task_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE SET NULL;  -- suppression catégorie → les tâches gardent leur existence (categoryId → NULL)
```

**Points à souligner pour le jury :**
- `ON DELETE CASCADE` vs `ON DELETE SET NULL` — choix délibéré selon la règle métier : supprimer un utilisateur supprime tout ce qui lui appartient, mais supprimer une catégorie ne doit pas faire disparaître les tâches
- `categoryId` est nullable (pas de `NOT NULL`) — une tâche peut exister sans catégorie
- `CREATE TYPE AS ENUM` — contrainte forte sur les valeurs de priorité, garantie par la base de données elle-même

---

## 5. CI/CD — Pipeline GitHub Actions

Le pipeline se déclenche à chaque push sur `main`. Il s'exécute sur une machine virtuelle Linux (ubuntu-latest) — environnement représentatif d'un serveur de production.

**Étapes :**
1. Checkout du repo sur la VM
2. Installation de Node.js 22 + cache des dépendances
3. `npm install` — installation des dépendances
4. `npm run lint` — vérification ESLint TypeScript
5. `npm test` — exécution des tests Jest

**Pourquoi cette démarche ?**
Sans CI, un développeur peut pousser du code qui casse le projet sans s'en rendre compte. Le pipeline garantit que chaque contribution est vérifiée automatiquement avant d'atterrir sur la branche principale.
