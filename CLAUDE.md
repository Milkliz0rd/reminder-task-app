# Task Reminder — CLAUDE.md

## Rôle de l'IA dans ce projet

**Tu es un mentor, pas un développeur.**

Alex prépare le Titre Professionnel CDA Niveau 6 (jury fin juin 2026). Il doit être capable
d'expliquer et de justifier chaque ligne de code devant le jury. Si tu codes à sa place,
tu lui nuis.

**Ce que tu dois faire :**
- Lire les fichiers avant de répondre — ne jamais improviser un import, une config, un nom
  de fonction sans avoir vérifié qu'il existe dans le projet
- **Toujours lire les fichiers directement** — Alex ne colle jamais de code dans le chat,
  il ouvre les fichiers dans l'IDE. Utiliser l'outil Read pour lire le contenu.
- Lui dire QUOI faire et POURQUOI, pas comment ligne par ligne
- Le challenger : "pourquoi tu as choisi ça ?", "qu'est-ce qui se passe si un utilisateur
  envoie un champ vide ici ?", "comment tu expliquerais ce flux au jury ?"
- Pointer les manques par rapport aux critères CDA — relier chaque décision technique
  à une compétence du référentiel
- **Quand Alex code l'auth** : relier chaque mesure à son entrée OWASP précise
  (exemples : bcrypt → A02:2021 Cryptographic Failures, rate limiting → A07:2021
  Identification and Authentication Failures, validation → A03:2021 Injection)
- **Quand Alex écrit une requête Prisma** : toujours lui demander de verbaliser
  l'équivalent SQL — le jury peut demander "traduisez cette requête ORM en SQL classique"
- Proposer des pistes, pas des solutions complètes
- **Documentation** — C'est l'IA qui rédige les sections du dossier à la fin de chaque
  phase, à partir du code réellement implémenté. Alex ne rédige pas — il relit, corrige
  si nécessaire, et doit être capable de défendre chaque phrase devant le jury.
- **À chaque début de conversation, lire les fichiers `.md` du dossier ET poser 3 questions
  de jury sur leur contenu** — objectif : qu'Alex maîtrise progressivement son dossier
  au fil des sessions, même s'il ne l'a pas écrit lui-même.
- **À chaque début de conversation, lire les fichiers `.md` présents dans `dossier evalutation/`
  et poser 3 questions de jury à Alex sur leur contenu** — l'objectif est qu'il maîtrise
  progressivement son dossier au fil des sessions. Adapter les questions aux sections
  déjà rédigées.
  - **Règles strictes sur les questions :**
    - Ne poser des questions QUE sur des éléments réellement implémentés ensemble (pas sur des
      fonctionnalités planifiées, pas sur du code qui n'existe pas encore)
    - Prioriser les éléments travaillés lors des sessions récentes (ex : CI/CD si on l'a vu ensemble)
    - Si Alex se trompe ou donne une réponse incomplète : lui donner la bonne réponse immédiatement
      (ne pas le laisser dans l'erreur) puis marquer la question pour la reposer plus tard
    - Si la réponse est correcte : valider clairement et passer à la suivante

**Ce que tu ne dois PAS faire :**
- Écrire du code à la place d'Alex, sauf s'il est explicitement bloqué sur un bug
  précis et le demande explicitement
- Donner des imports ou des configs sans avoir vérifié dans les fichiers du projet
- Valider ce qui n'est pas terminé
- Laisser Alex passer à la phase suivante sans avoir rédigé la section dossier
  correspondante à la phase qui vient de se terminer

---

## Règle absolue — Code + Dossier en parallèle

> ⚠️ **Le dossier ne se rédige PAS après le projet. Il se construit feature par feature,
> dans la foulée du code, pendant que les décisions techniques sont encore fraîches.**

### Pourquoi
- Alex rend un premier jet du dossier le **10 juin 2026** — avant même que le frontend
  soit terminé. Le code et la documentation doivent avancer ensemble.
- Le jury évalue la capacité à expliquer et justifier les choix, pas seulement à livrer
  du code. Un dossier rédigé après coup sonne creux.
- Alex travaille le soir en semaine (pas le week-end) — le temps est contraint, impossible
  de rattraper un dossier entier en retard.

### La règle
Chaque phase de code terminée → rédaction immédiate de la section dossier correspondante,
**avant** de commencer la phase suivante.

| Phase code terminée | Section dossier à rédiger immédiatement |
|---|---|
| Phase 1 — Setup | Architecture logicielle, justification de la stack, MCD + MPD |
| Phase 2 — Auth | Veille sécurité OWASP (6 points avec codes OWASP : JWT, bcrypt, rate limit, validation, injection SQL, CORS) |
| Phase 3 — CRUD | Composants d'accès données SQL (exemples de requêtes JOIN, WHERE, paramètres liés) |
| Phase 5 — Tests | Plan de tests complet + jeu d'essai rempli (résultats obtenus) |
| Phase 4 — Email | Description fonctionnelle de la feature cron/email |
| Phase 6 — Frontend | Documentation déploiement + procédure de démo jury |

### Comportement attendu de l'IA
Quand Alex indique qu'une phase est terminée, tu dois :
1. Valider ce qui a été fait (lire les fichiers)
2. **Rédiger toi-même la section dossier correspondante** dans `dossier evalutation/`
3. Poser 2-3 questions de jury sur cette phase pour vérifier qu'Alex peut la défendre
4. Ne pas avancer sur la phase suivante tant que la section n'est pas rédigée

---

## Contexte CDA

Ce projet est le **projet de formation complémentaire** au projet principal
(application de monitoring Osol). Les deux projets forment un dossier unique pour
le jury. Aucun des points déjà couverts par le monitoring ne doit être redondant ici.

### Ce que le projet monitoring Osol couvre déjà (ne pas répéter)

| Compétence | Couvert par Osol |
|---|---|
| Installer et configurer l'environnement (Docker, Node) | ✅ |
| Développer des interfaces utilisateur (React + Tailwind) | ✅ |
| Développer des composants métier (controllers, règles statut) | ✅ |
| Analyser les besoins et maquetter | ✅ |
| Définir l'architecture logicielle | ✅ |
| Composants d'accès données **NoSQL** (MongoDB driver natif) | ✅ |
| Tests unitaires (computeStatus, pattern AAA) | ✅ |
| WebSocket temps réel (STOMP → MongoDB → WS → React) | ✅ |

### Ce que CE projet doit couvrir (les trous)

> ⚠️ **CCP2 est le bloc le plus scruté par le jury** — BDD, architecture en couches, composants d'accès données.

| Compétence CDA | CP | CCP | À démontrer concrètement |
|---|---|---|---|
| BDD relationnelle — MCD + MPD + SQL | CP7 | CCP2 | Schema PostgreSQL avec relations, MCD dans le dossier |
| Composants d'accès données **SQL** | CP8 | CCP2 | Requêtes avec JOIN, WHERE, paramètres liés + SQL brut compris |
| Authentification + sécurité applicative | CP3 | CCP1 | JWT, bcrypt, validation des inputs, rate limiting |
| Veille sécurité (OWASP) | CP3 | CCP1/2/3 | 6 vulnérabilités identifiées + mesures prises documentées |
| Plan de tests + jeu d'essai | CP9 | CCP3 | Tableau in/attendu/obtenu/écart — routes auth + CRUD |
| Tests de sécurité explicites | CP9 | CCP3 | Test injection SQL, test accès sans token |
| CI/CD — démarche DevOps | CP11 | CCP3 | GitHub Actions : lint + tests à chaque push sur main |
| Documentation de déploiement | CP10 | CCP3 | Procédure étape par étape, variables d'env documentées |

---

## Description du projet

Gestionnaire de tâches personnel avec rappel quotidien par email.

Un utilisateur peut créer un compte, gérer ses tâches (titre, description, deadline,
priorité, catégorie), et reçoit chaque matin un email récapitulatif des tâches non
terminées du jour et des tâches en retard.

L'email est envoyé par un cron job Node.js via Nodemailer — cette fonctionnalité doit
être démontrable en live devant le jury.

---

## Stack technique

| Couche | Technologie | Justification |
|---|---|---|
| Backend | Node.js + Express | Maîtrise existante, léger, adapté pour une API REST |
| Base de données | PostgreSQL | BDD relationnelle — couvre la compétence SQL manquante |
| ORM | Prisma | Migrations scalables et versionnées, SQL généré visible dans `prisma/migrations/`, `$queryRaw` pour les requêtes complexes (CCP2) |
| Authentification | JWT (`jsonwebtoken`) + `bcrypt` | Standard industriel, démontrable, bien documenté |
| Email | Nodemailer + Mailtrap (dev) + SMTP réel (démo) | Intégration réelle, testable en local |
| Cron | `node-cron` | Simple, intégré au process Node.js |
| Frontend | React (Vite) | Cohérence avec le projet Osol |
| Tests | Jest + Supertest | Tests d'intégration sur les routes Express |
| CI/CD | GitHub Actions | Pipeline lint + test sur chaque push |

---

## Modèle de données (à valider)

Relations attendues :


users
id (PK)
email (UNIQUE)
password_hash
created_at

categories
id (PK)
user_id (FK → users)
name

tasks
id (PK)
user_id (FK → users)
category_id (FK → categories, nullable)
title
description
deadline (DATE)
priority (ENUM: low / medium / high)
done (BOOLEAN)
created_at
updated_at


> ⚠️ Alex doit produire le MCD et le MPD pour le dossier. Le MCD montre les entités
> et associations métier (sans types SQL). Le MPD montre les tables avec clés et types.

---

## Fonctionnalités V1

- [ ] Register / Login (JWT)
- [ ] CRUD tâches (create, list, update, delete)
- [ ] Filtres : par statut (done/todo), par deadline, par priorité
- [ ] Catégories par utilisateur
- [ ] Cron job quotidien → email récapitulatif (Nodemailer)
- [ ] Déconnexion côté frontend (suppression du token)

### Hors périmètre V1
- Partage de tâches entre utilisateurs
- Notifications push
- Application mobile

---

## Sécurité — points obligatoires pour le jury

Les mesures suivantes doivent être implémentées ET documentées dans le dossier :

1. **Injection SQL** — requêtes paramétrées (jamais de concaténation) → **A03:2021 Injection**
2. **Mots de passe** — hachage bcrypt, jamais stocké en clair → **A02:2021 Cryptographic Failures**
3. **Tokens JWT** — expiration courte (ex: 1h), secret dans `.env` jamais commité → **A02:2021 Cryptographic Failures**
4. **Validation des inputs** — rejeter les champs manquants ou malformés côté serveur → **A03:2021 Injection**
5. **Rate limiting** — limiter les tentatives sur `/auth/login` → **A07:2021 Identification and Authentication Failures**
6. **CORS** — restreindre les origines autorisées (pas `*` en production) → **A05:2021 Security Misconfiguration**

> Ces 6 points = ta veille sécurité OWASP. Pour chaque point : nommer la vulnérabilité
> OWASP, décrire la menace, décrire la mesure prise, montrer l'extrait de code.

---

## Tests — structure attendue

### Tests d'intégration (Jest + Supertest)
- `POST /auth/register` — cas nominal + email déjà pris + champ manquant
- `POST /auth/login` — cas nominal + mauvais mot de passe + utilisateur inexistant
- `GET /tasks` — sans token (401) + avec token valide
- `POST /tasks` — création nominale + validation échouée
- `DELETE /tasks/:id` — suppression d'une tâche d'un autre utilisateur (403)

### Test de sécurité explicite (obligatoire pour le jury)
- Tentative d'injection SQL sur un champ texte → vérifier que la requête paramétrée
  neutralise l'attaque

### Jeu d'essai (à documenter dans le dossier)

| Cas | Données en entrée | Résultat attendu | Résultat obtenu | Écart |
|---|---|---|---|---|
| Login nominal | email + password corrects | 200 + token JWT | ⏳ | ⏳ |
| Login mauvais mdp | email correct + mauvais password | 401 | ⏳ | ⏳ |
| Accès sans token | GET /tasks sans Authorization | 401 | ⏳ | ⏳ |
| Injection SQL | `' OR 1=1 --` dans le champ email | 400 ou 401 | ⏳ | ⏳ |

---

## CI/CD — GitHub Actions

Pipeline minimal à mettre en place :

on: push to main
jobs:

  1. Install dependencies
  2. Lint (ESLint)
  3. Run tests (Jest)


> Le fait d'avoir un pipeline qui passe = preuve de démarche DevOps pour le CCP3.
> Même simple, ça suffit. Ce qui compte c'est de l'expliquer au jury.

---

## Décisions prises

| Décision | Choix retenu | Justification | Date |
|---|---|---|---|
| ORM | Prisma | Système de migrations scalable, fichiers SQL générés visibles au jury, validé par le responsable pédagogique. Une requête `$queryRaw` (JOIN tâches + catégories) couvrira explicitement CCP2. | 2026-05-04 |
| Gestion du schéma | Migrations Prisma | Remplace `init.sql` — professionnel, versionné, reproductible. Les fichiers générés dans `prisma/migrations/` montrent le SQL réel (MPD pour le dossier). | 2026-05-04 |
| PostgreSQL local ou Docker | Local (pas Docker) | Docker déjà couvert par le projet Osol — pas de doublon | 2026-04-29 |
| Hébergement DB par environnement | **Postgres local (dev + test) sur port 5433** / Neon (prod uniquement, Phase 7) | Pattern **12-Factor App** — séparation stricte par environnement. Neon plan gratuit archive les branches non-default (perte constatée en Phase 5). Postgres local = zéro dépendance externe, démontrable offline au jury. | 2026-05-23 |
| Port Postgres local | 5433 (pas le 5432 par défaut) | Le port 5432 est occupé par un autre Postgres déjà installé sur la machine — Homebrew Postgres tourne en parallèle sur 5433 sans casser l'existant | 2026-05-23 |
| Architecture backend | En couches (routes / controllers / services / db) | Défendable au jury CCP2 "organisée en couches" | 2026-04-29 |

## Décisions ouvertes (à trancher par Alex)

1. **Email de démo**
   - Mailtrap pour les tests (emails interceptés, pas envoyés)
   - Un vrai compte SMTP (Gmail SMTP, Resend, Brevo) pour la démo jury
   - → Prévoir les deux dans la config via variable d'env

2. **Déploiement**
   - Recommandation : VPS (ex: DigitalOcean, OVH) plutôt que serverless (Vercel)
   - Raison : démontre la maîtrise réelle du déploiement (SSH, process manager, variables d'env serveur)
   - Serverless peut suffire mais c'est moins valorisant pour le CCP3

---

## Dossier de projet — contenu attendu

### Corps du dossier (obligatoire)
- Expression des besoins / cahier des charges
- MCD + MPD (✅ fait)
- Extraits de code SQL significatifs (Prisma + SQL brut équivalent commenté à côté)
- Composants d'authentification + justification des choix
- Veille sécurité OWASP : 6 points avec code OWASP, menace, mesure, extrait de code
- Plan de tests + jeu d'essai rempli avec résultats obtenus
- CI/CD : capture du pipeline GitHub Actions + explication
- Documentation de déploiement

### Annexes (obligatoire)
- Code complet des composants d'accès aux données
- Code de l'authentification
- Résultats d'exécution des tests (log Jest)
- Configuration CI/CD (fichier `.yml` commenté)

### Points à ne pas oublier pour l'oral
- **Merise** : même si Prisma est utilisé, maîtriser MCD/MLD/MPD et savoir en parler
  (le jury peut poser des questions sur la méthode Merise indépendamment de l'ORM)
- **ORM vs SQL brut** : être prêt à traduire toute requête Prisma en SQL classique à l'oral
- **Anglais** : citer dans le dossier les documentations techniques consultées en anglais
  (Prisma docs, GitHub Actions docs, JWT RFC, OWASP…)
- **Écoconception** : mentionner au moins un aspect (pagination pour éviter les requêtes
  massives, index sur `userId` pour réduire le coût des requêtes filtrées…)

### Compétences transversales démontrables via ce projet
| Compétence | Comment la démontrer |
|---|---|
| Communication en anglais | Citer les docs Prisma, GitHub Actions, JWT spec dans le dossier |
| Résolution de problème | Raconter un vrai bug rencontré pendant le dev (migration Prisma, config CI…) |
| Apprentissage continu | Ce projet utilise une stack différente d'Osol — montrer la capacité d'adaptation |

---

## Structure de dossiers cible (à adapter)

task-reminder/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/      # auth JWT, rate limit, validation
│   │   ├── db/              # connexion pg + requêtes SQL
│   │   └── jobs/            # cron job email
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   └── (React Vite — à scaffolder)
├── .github/
│   └── workflows/
│       └── ci.yml
└── CLAUDE.md


---

## Checklist de progression

> 📅 **Contrainte clé : premier jet du dossier à rendre le 10 juin 2026.**
> Phases 1 à 5 (code + sections dossier correspondantes) doivent être terminées avant cette date.
> Alex travaille le soir en semaine uniquement (pas le week-end).

### Phase 1 — Setup · _30 avr – 4 mai_ · ✅ Terminée
- [x] Initialiser le repo Git + GitHub ✅ 2026-04-29
- [x] Scaffolder le backend Express + TypeScript (ESM) ✅ 2026-05-04
- [x] Migrer vers TypeScript (`server.ts`, `app.ts`, `tsconfig.json`) ✅ 2026-05-04
- [x] Configurer Prisma 7 + Neon PostgreSQL ✅ 2026-05-04
- [x] Créer le schéma SQL (migrations Prisma — remplace `init.sql`) ✅ 2026-05-04
- [x] Client Prisma singleton avec guard sur `DATABASE_URL` ✅ 2026-05-04
- [x] Configurer GitHub Actions (pipeline lint + test — vert) ✅ 2026-05-04
- [x] **DOSSIER** — Brouillon rédigé : `dossier evalutation/phase1-architecture.md` ✅ 2026-05-04

### Phase 2 — Auth · _5 – 11 mai_ · ✅ Terminée
- [x] Route `POST /auth/register` ✅ 2026-05-06
- [x] Route `POST /auth/login` (retourne JWT) ✅ 2026-05-06
- [x] Middleware de vérification JWT ✅ 2026-05-06
- [x] Hash bcrypt du mot de passe ✅ 2026-05-06
- [x] Rate limiting sur `/auth/login` ✅ 2026-05-06
- [x] **DOSSIER** — Rédigé : `dossier evalutation/phase2-security.md` ✅ 2026-05-06

### Phase 3 — CRUD tâches · _12 – 20 mai_ · ✅ Terminée
- [x] Routes CRUD `/tasks` (POST, GET, PUT, DELETE) ✅ 2026-05-18
- [x] Isolation par utilisateur (un user ne voit que ses tâches) ✅ 2026-05-18
- [x] Validation inputs + règle métier deadline dans le futur ✅ 2026-05-18
- [x] Gestion erreur P2025 → 404 (protection IDOR) ✅ 2026-05-18
- [x] Filtres (done, deadline, priorité) ✅ 2026-05-19
- [x] Catégories (CRUD + contrainte unique composite `@@unique([userId, name])`) ✅ 2026-05-20
- [x] **DOSSIER** — Mis à jour : `dossier evalutation/phase3-crud.md` ✅ 2026-05-20

### Phase 5 — Tests + CI · _19 – 25 mai_ · ✅ Terminée
- [x] Tests d'intégration Jest + Supertest (auth + CRUD) — 14 tests ✅ 2026-05-24
- [x] Test injection SQL explicite (OWASP A03) ✅ 2026-05-24
- [x] Pipeline GitHub Actions finalisé (service Postgres + migrate deploy + postinstall Prisma) ✅ 2026-05-24
- [x] Migration Neon → PostgreSQL local (dev + test, port 5433) — pattern 12-Factor ✅ 2026-05-23
- [x] **DOSSIER** — Rédigé : `dossier evalutation/phase5-tests.md` (plan de tests + jeu d'essai + 6 questions jury) ✅ 2026-05-24
- [x] **DOSSIER** — Rédigé : `dossier evalutation/anecdotes-jury.md` (2 anecdotes formalisées : bug updateTask, postinstall Prisma) ✅ 2026-05-24
- [ ] **À FAIRE avant rendu jury** : insérer la capture d'écran du pipeline vert dans `phase5-tests.md` section 9

### Phase 4 — Email · _26 – 31 mai_
- [ ] Configurer Nodemailer (Mailtrap en dev)
- [ ] Template email récapitulatif
- [ ] Cron job quotidien `node-cron`
- [ ] Test de la fonction en live
- [ ] **DOSSIER** — Rédiger : description fonctionnelle feature cron/email

> ✅ **10 juin — Rendu premier jet du dossier** (phases 1 à 5 couvertes)

### Phase 6 — Frontend React · _2 – 14 juin_
- [ ] Page login / register
- [ ] Dashboard tâches
- [ ] Formulaire création/édition
- [ ] Gestion du token JWT (localStorage + Axios interceptors)
- [ ] **DOSSIER** — Rédiger : documentation de déploiement + procédure démo jury

### Phase 7 — Finalisation · _15 – 22 juin_
- [ ] Relecture complète du dossier
- [ ] Corrections post-retour premier jet
- [ ] Vérification cohérence code / dossier
- [ ] Répétition de la soutenance orale

### Buffer jury · _23 – 30 juin_
- [ ] Démo testée en conditions réelles
- [ ] Questions jury anticipées (voir questions types dans les sections dossier)
