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
- Proposer des pistes, pas des solutions complètes
- **Rappeler systématiquement, à la fin de chaque phase terminée, quelle section du
  dossier doit être rédigée dans la foulée** (voir règle "Code + Dossier en parallèle")

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
| Phase 2 — Auth | Veille sécurité OWASP (points 1 à 5 : JWT, bcrypt, rate limit, validation, injection SQL) |
| Phase 3 — CRUD | Composants d'accès données SQL (exemples de requêtes JOIN, WHERE, paramètres liés) |
| Phase 4 — Email | Description fonctionnelle de la feature cron/email |
| Phase 5 — Tests | Plan de tests complet + jeu d'essai rempli (résultats obtenus) |
| Phase 6 — Frontend | Documentation déploiement + procédure de démo jury |

### Comportement attendu de l'IA
Quand Alex indique qu'une phase est terminée, tu dois :
1. Valider ce qui a été fait (si tu as accès aux fichiers)
2. Lui indiquer précisément quelle section du dossier rédiger maintenant
3. Lui poser 2-3 questions de jury sur cette phase pour l'aider à structurer sa rédaction
4. Ne pas avancer sur la phase suivante tant que la section n'est pas au moins en brouillon

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

| Compétence CDA | CCP | À démontrer concrètement |
|---|---|---|
| BDD relationnelle — MCD + MPD + SQL | CCP2 | Schema PostgreSQL avec relations, MCD dans le dossier |
| Composants d'accès données **SQL** | CCP2 | Requêtes avec JOIN, WHERE, paramètres liés (pas de raw string) |
| Authentification + sécurité applicative | CCP1 | JWT, bcrypt, validation des inputs, rate limiting |
| Veille sécurité (OWASP) | CCP1/2/3 | 3 vulnérabilités identifiées + mesures prises documentées |
| Plan de tests + jeu d'essai | CCP3 | Tableau in/attendu/obtenu/écart — routes auth + CRUD |
| Tests de sécurité explicites | CCP3 | Test injection SQL, test accès sans token |
| CI/CD — démarche DevOps | CCP3 | GitHub Actions : lint + tests à chaque push sur main |
| Documentation de déploiement | CCP3 | Procédure étape par étape, variables d'env documentées |

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
| ORM | `pg` (driver natif) | Décidé : SQL visible au jury, meilleur pour démontrer CCP2 |
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

1. **Injection SQL** — utiliser des requêtes paramétrées (jamais de concaténation
   de chaîne dans les requêtes SQL)
2. **Mots de passe** — hachage bcrypt, jamais stocké en clair
3. **Tokens JWT** — expiration courte (ex: 1h), secret dans `.env` jamais commité
4. **Validation des inputs** — rejeter les champs manquants ou malformés côté serveur
5. **Rate limiting** — limiter les tentatives sur `/auth/login` (ex: `express-rate-limit`)
6. **CORS** — restreindre les origines autorisées (pas `*` en production)

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

## Décisions prises (2026-04-29)

| Décision | Choix retenu | Justification |
|---|---|---|
| ORM ou driver natif | `pg` natif | SQL brut visible au jury → valide CCP2 "composants d'accès données SQL" |
| PostgreSQL local ou Docker | Local (pas Docker) | Docker déjà couvert par le projet Osol — pas de doublon |
| Architecture backend | En couches (routes / controllers / services / db) | Défendable au jury CCP2 "organisée en couches" |

## Décisions ouvertes (à trancher par Alex)

1. **Email de démo**
   - Mailtrap pour les tests (emails interceptés, pas envoyés)
   - Un vrai compte SMTP (Gmail SMTP, Resend, Brevo) pour la démo jury
   - → Prévoir les deux dans la config via variable d'env

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

### Phase 1 — Setup · _30 avr – 4 mai_ · 🟡 En cours
- [x] Initialiser le repo Git + GitHub ✅ 2026-04-29
- [x] Scaffolder le backend Express ✅ 2026-04-29 (`server.js` + `src/app.js`, Express + nodemon)
- [x] Configurer PostgreSQL local ✅ 2026-04-29 (v18, base `task_reminder` créée)
- [ ] Créer le schéma SQL (script `init.sql`)
- [ ] Configurer GitHub Actions (pipeline vide qui passe)
- [ ] **DOSSIER** — Rédiger : architecture logicielle, justification stack, MCD + MPD

### Phase 2 — Auth · _5 – 11 mai_
- [ ] Route `POST /auth/register`
- [ ] Route `POST /auth/login` (retourne JWT)
- [ ] Middleware de vérification JWT
- [ ] Hash bcrypt du mot de passe
- [ ] Rate limiting sur `/auth/login`
- [ ] **DOSSIER** — Rédiger : veille sécurité OWASP (6 points : injection SQL, bcrypt, JWT, validation, rate limit, CORS)

### Phase 3 — CRUD tâches · _12 – 18 mai_
- [ ] Routes CRUD `/tasks`
- [ ] Isolation par utilisateur (un user ne voit que ses tâches)
- [ ] Filtres (done, deadline, priorité)
- [ ] Catégories
- [ ] **DOSSIER** — Rédiger : composants d'accès données SQL (exemples de requêtes avec JOIN, WHERE, paramètres liés)

### Phase 4 — Email · _19 – 22 mai_
- [ ] Configurer Nodemailer (Mailtrap en dev)
- [ ] Template email récapitulatif
- [ ] Cron job quotidien `node-cron`
- [ ] Test de la fonction en live
- [ ] **DOSSIER** — Rédiger : description fonctionnelle feature cron/email

### Phase 5 — Tests + CI · _23 mai – 1er juin_
- [ ] Tests d'intégration Jest + Supertest
- [ ] Test injection SQL
- [ ] Pipeline GitHub Actions finalisé (lint + tests)
- [ ] **DOSSIER** — Rédiger : plan de tests complet + jeu d'essai rempli avec résultats obtenus

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
