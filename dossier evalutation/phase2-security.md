# Phase 2 — Veille sécurité OWASP

> Ce document couvre les 6 mesures de sécurité implémentées dans le projet.
> Chaque point référence l'entrée OWASP Top 10 2021 correspondante.

---

## 1. Hachage des mots de passe — bcrypt

**Vulnérabilité OWASP : A02:2021 Cryptographic Failures**

**Menace :** Si les mots de passe sont stockés en clair ou avec un algorithme rapide (MD5, SHA-256), une fuite de base de données expose immédiatement tous les comptes. Un GPU moderne peut tester des milliards de SHA-256 par seconde.

**Mesure prise :** Les mots de passe sont hachés avec `bcrypt` (cost factor 10) avant tout stockage. Bcrypt est lent par conception — chaque vérification prend ~100ms, ce qui rend le brute force post-fuite non viable. Bcrypt génère un sel aléatoire automatiquement : deux utilisateurs avec le même mot de passe ont des hashes différents en base.

**Extrait de code** (`src/services/authService.ts`) :
```ts
const hash = await bcrypt.hash(password, 10)
// puis en base :
data: { email, password_hash: hash }
```

**À l'oral :** bcrypt ne se déchiffre pas — il rehashe le mot de passe entré et compare le résultat. La fonction `bcrypt.compare(password, hash)` retourne `true` ou `false`.

---

## 2. Tokens JWT — secret et expiration courte

**Vulnérabilité OWASP : A02:2021 Cryptographic Failures**

**Menace :** Un token sans expiration reste valide indéfiniment après un vol. Un secret JWT codé en dur dans le code source est exposé à chaque lecture du dépôt.

**Mesure prise :**
- Expiration à 1 heure (`expiresIn: '1h'`) — un token volé devient inutile rapidement
- Secret stocké dans `.env`, jamais commité (`.gitignore` inclut `.env`)
- Guard au démarrage : l'application refuse de lancer si `JWT_SECRET` est absent

**Extrait de code** (`src/services/authService.ts`) :
```ts
const secret = process.env.JWT_SECRET
if (!secret) throw new Error('JWT_SECRET is not defined')
return jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' })
```

**À l'oral :** le payload JWT est lisible par n'importe qui (base64, pas du chiffrement). Ne jamais y mettre de données sensibles — seulement `userId` et les métadonnées de session.

---

## 3. Rate limiting — protection brute force sur /auth/login

**Vulnérabilité OWASP : A07:2021 Identification and Authentication Failures**

**Menace :** Sans limite de tentatives, un attaquant peut essayer des milliers de combinaisons email/password sur le endpoint `/auth/login` (attaque brute force ou credential stuffing).

**Mesure prise :** Le middleware `express-rate-limit` limite à 10 tentatives par fenêtre de 15 minutes par adresse IP, uniquement sur la route `/auth/login`. La route `/auth/register` n'est pas limitée de la même façon — l'attaque cible l'authentification, pas l'inscription.

**Extrait de code** (`src/middleware/rateLimiter.ts`) :
```ts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many login attempts, please try again later' }
})
```

Branché uniquement sur `/login` (`src/routes/auth.ts`) :
```ts
router.post("/login", loginLimiter, login)
```

---

## 4. Requêtes paramétrées — prévention des injections SQL

**Vulnérabilité OWASP : A03:2021 Injection**

**Menace :** Une injection SQL consiste à insérer du code SQL dans un champ utilisateur pour manipuler la requête. Exemple : `' OR 1=1 --` dans un champ email pour contourner l'authentification.

**Mesure prise :** Prisma utilise systématiquement des requêtes paramétrées — les valeurs utilisateur ne sont jamais concaténées dans le SQL. Prisma génère des requêtes préparées avec des placeholders (`$1`, `$2`...) que PostgreSQL traite séparément des données.

**Extrait de code** (`src/services/authService.ts`) :
```ts
// Prisma génère en interne : SELECT * FROM "User" WHERE email = $1
const user = await prisma.user.findUnique({ where: { email } })
```

Aucune concaténation de chaîne n'est utilisée dans les requêtes — la valeur `email` ne peut jamais modifier la structure SQL.

**À l'oral :** savoir traduire cette requête Prisma en SQL classique : `SELECT * FROM "User" WHERE "email" = $1` avec `$1 = email`.

---

## 5. Validation des inputs — rejet des champs malformés

**Vulnérabilité OWASP : A03:2021 Injection**

**Menace :** Un champ vide, nul ou malformé peut provoquer des erreurs inattendues côté serveur, exposer des stack traces, ou contourner des règles métier.

**Mesure prise :** Un middleware de validation vérifie que `email` et `password` sont présents et non vides avant d'atteindre le controller. Les requêtes invalides sont rejetées avec un 400 avant tout accès à la base.

> ⚠️ *Ce middleware sera implémenté en Phase 3 — à documenter avec extrait de code après implémentation.*

---

## 6. CORS — restriction des origines autorisées

**Vulnérabilité OWASP : A05:2021 Security Misconfiguration**

**Menace :** Sans configuration CORS, n'importe quel site peut envoyer des requêtes à l'API au nom d'un utilisateur connecté (attaque CSRF-like via navigateur). Autoriser `*` en production expose l'API à tous les domaines.

**Mesure prise :** Le middleware `cors` restreint les origines acceptées à l'URL du frontend uniquement (variable d'environnement `FRONTEND_URL`). En développement, `http://localhost:5173` est autorisé.

> ⚠️ *La configuration CORS sera implémentée avant le déploiement — à documenter avec extrait de code.*

---

## Récapitulatif

| # | Vulnérabilité OWASP | Code | Mesure | Statut |
|---|---|---|---|---|
| 1 | Cryptographic Failures | A02:2021 | bcrypt cost factor 10 | ✅ |
| 2 | Cryptographic Failures | A02:2021 | JWT expiration 1h + secret en .env | ✅ |
| 3 | Identification and Auth Failures | A07:2021 | Rate limit 10 req/15min sur /login | ✅ |
| 4 | Injection | A03:2021 | Requêtes Prisma paramétrées | ✅ |
| 5 | Injection | A03:2021 | Validation des inputs (middleware) | ⏳ Phase 3 |
| 6 | Security Misconfiguration | A05:2021 | CORS restreint au domaine frontend | ⏳ Déploiement |
