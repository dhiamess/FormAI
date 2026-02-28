# 🏗️ FormAI — Conception Complète

## 1. Vision du Produit

**FormAI** est une plateforme SaaS de gestion de formulaires intelligents propulsée par l'IA. L'utilisateur décrit un formulaire en langage naturel (ou dessine un schéma), et l'IA génère automatiquement un formulaire fonctionnel, prêt à être testé puis mis en production. Chaque formulaire possède sa propre collection MongoDB, éliminant totalement le papier.

---

## 2. Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Dashboard │ │Form      │ │Form      │ │ Admin      │ │
│  │          │ │Builder   │ │Renderer  │ │ Panel      │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API / WebSocket
┌──────────────────────┴──────────────────────────────────┐
│                   BACKEND (Node.js + Express)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Auth     │ │ Form     │ │ AI       │ │ Data       │ │
│  │ Service  │ │ Service  │ │ Service  │ │ Service    │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└───────┬──────────┬──────────┬──────────────┬────────────┘
        │          │          │              │
   ┌────┴───┐ ┌───┴────┐ ┌──┴───┐   ┌─────┴──────┐
   │MongoDB │ │Redis   │ │AI API│   │Connecteurs │
   │        │ │Cache   │ │      │   │SQL/Mongo   │
   └────────┘ └────────┘ └──────┘   └────────────┘
```

---

## 3. Stack Technologique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR, routing, performance |
| **UI Components** | Shadcn/ui + Tailwind CSS | Design system moderne et accessible |
| **Form Rendering** | React Hook Form + Zod | Validation dynamique côté client |
| **Backend** | Node.js + Express + TypeScript | Écosystème riche, performance |
| **Base de données principale** | MongoDB (Mongoose) | Collections dynamiques par formulaire |
| **Cache / Sessions** | Redis | Sessions, cache des schémas |
| **Authentification** | JWT + bcrypt + refresh tokens | Sécurité, stateless |
| **IA** | Anthropic Claude API (claude-sonnet-4-5) | Meilleur ratio qualité/coût pour la génération de code structuré |
| **File Storage** | MinIO (S3-compatible) | Upload de fichiers dans les formulaires |
| **Temps réel** | Socket.io | Notifications, collaboration |
| **Tests** | Jest + Playwright | Unit + E2E |
| **CI/CD** | GitHub Actions + Docker | Déploiement automatisé |

### Pourquoi Claude API plutôt qu'OpenAI/Gemini ?

1. **Meilleure génération de JSON structuré** — Claude excelle à produire des schémas JSON valides et complexes
2. **Context window large** (200k tokens) — Permet d'envoyer des descriptions complexes de formulaires
3. **Cohérence** — Moins d'hallucinations sur les structures de données
4. **Prix compétitif** — Sonnet 4.5 offre le meilleur rapport qualité/prix

---

## 4. Modèle de Données

### 4.1 Collections Système (MongoDB)

#### `users`
```json
{
  "_id": "ObjectId",
  "email": "string (unique)",
  "passwordHash": "string",
  "firstName": "string",
  "lastName": "string",
  "avatar": "string (URL)",
  "role": "enum: superadmin | admin | manager | user",
  "groups": ["ObjectId (ref: groups)"],
  "organization": "ObjectId (ref: organizations)",
  "isActive": "boolean",
  "lastLogin": "Date",
  "preferences": {
    "language": "fr | en",
    "theme": "light | dark",
    "notifications": "boolean"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### `organizations`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "slug": "string (unique)",
  "logo": "string (URL)",
  "plan": "enum: free | pro | enterprise",
  "settings": {
    "maxForms": "number",
    "maxUsers": "number",
    "maxSubmissions": "number",
    "allowedAIProviders": ["claude", "openai", "gemini"],
    "defaultAIProvider": "claude",
    "customDomain": "string | null"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### `groups`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "organization": "ObjectId (ref: organizations)",
  "permissions": {
    "forms": {
      "create": "boolean",
      "read": "boolean",
      "update": "boolean",
      "delete": "boolean",
      "publish": "boolean"
    },
    "submissions": {
      "read": "boolean",
      "export": "boolean",
      "delete": "boolean"
    },
    "users": {
      "manage": "boolean"
    },
    "settings": {
      "manage": "boolean"
    }
  },
  "members": ["ObjectId (ref: users)"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### `forms`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "slug": "string (unique par org)",
  "description": "string",
  "organization": "ObjectId (ref: organizations)",
  "createdBy": "ObjectId (ref: users)",
  "status": "enum: draft | testing | published | archived",
  "version": "number",
  "versions": [{
    "version": "number",
    "schema": "FormSchema (voir ci-dessous)",
    "createdAt": "Date",
    "createdBy": "ObjectId"
  }],
  "schema": {
    "fields": [{
      "id": "string (uuid)",
      "type": "enum: text | textarea | number | email | phone | date | datetime | select | multiselect | checkbox | radio | file | image | signature | section | heading | paragraph | hidden | calculated | lookup | table",
      "label": "string",
      "name": "string (slug pour la BD)",
      "placeholder": "string",
      "helpText": "string",
      "required": "boolean",
      "validation": {
        "min": "number | null",
        "max": "number | null",
        "minLength": "number | null",
        "maxLength": "number | null",
        "pattern": "string (regex) | null",
        "customMessage": "string | null"
      },
      "options": [{ "label": "string", "value": "string" }],
      "conditional": {
        "field": "string (id du champ)",
        "operator": "enum: equals | notEquals | contains | greaterThan | lessThan",
        "value": "any"
      },
      "layout": {
        "column": "number (1-12)",
        "row": "number",
        "width": "number (1-12)"
      },
      "defaultValue": "any",
      "readOnly": "boolean",
      "computed": "string (formule) | null"
    }],
    "layout": {
      "type": "enum: single | multi-step | tabs",
      "steps": [{ "title": "string", "fields": ["string (field ids)"] }]
    },
    "settings": {
      "submitButtonText": "string",
      "successMessage": "string",
      "redirectUrl": "string | null",
      "allowMultipleSubmissions": "boolean",
      "requireAuth": "boolean",
      "notifyOnSubmission": ["string (emails)"],
      "autoSave": "boolean",
      "theme": {
        "primaryColor": "string",
        "fontFamily": "string",
        "borderRadius": "string"
      }
    }
  },
  "collectionName": "string (nom de la collection MongoDB pour les soumissions)",
  "accessControl": {
    "viewGroups": ["ObjectId (ref: groups)"],
    "submitGroups": ["ObjectId (ref: groups)"],
    "manageGroups": ["ObjectId (ref: groups)"],
    "isPublic": "boolean"
  },
  "integrations": [{
    "type": "enum: webhook | email | sqlserver | mongodb | api",
    "config": "object (spécifique au type)",
    "enabled": "boolean"
  }],
  "analytics": {
    "totalSubmissions": "number",
    "lastSubmission": "Date",
    "avgCompletionTime": "number (seconds)"
  },
  "aiPromptHistory": [{
    "prompt": "string",
    "response": "object",
    "model": "string",
    "createdAt": "Date"
  }],
  "createdAt": "Date",
  "updatedAt": "Date",
  "publishedAt": "Date | null"
}
```

#### `form_submissions` (collection dynamique : `form_{formId}_submissions`)
```json
{
  "_id": "ObjectId",
  "formId": "ObjectId (ref: forms)",
  "formVersion": "number",
  "data": {
    "field_name_1": "valeur",
    "field_name_2": "valeur"
  },
  "metadata": {
    "submittedBy": "ObjectId (ref: users) | null",
    "submittedAt": "Date",
    "ip": "string",
    "userAgent": "string",
    "completionTime": "number (seconds)",
    "source": "enum: web | api | mobile"
  },
  "status": "enum: submitted | reviewed | approved | rejected",
  "files": [{
    "fieldId": "string",
    "fileName": "string",
    "url": "string",
    "size": "number"
  }],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### `api_connections`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "organization": "ObjectId (ref: organizations)",
  "type": "enum: sqlserver | mongodb | postgresql | mysql | rest_api | graphql",
  "config": {
    "host": "string (chiffré)",
    "port": "number",
    "database": "string",
    "username": "string (chiffré)",
    "password": "string (chiffré)",
    "connectionString": "string (chiffré)",
    "apiUrl": "string",
    "apiKey": "string (chiffré)",
    "headers": "object"
  },
  "status": "enum: active | inactive | error",
  "lastTestedAt": "Date",
  "createdBy": "ObjectId (ref: users)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### `audit_logs`
```json
{
  "_id": "ObjectId",
  "organization": "ObjectId",
  "user": "ObjectId",
  "action": "enum: form.create | form.update | form.publish | form.delete | submission.create | submission.delete | user.login | user.create | settings.update | ...",
  "resource": { "type": "string", "id": "ObjectId" },
  "details": "object",
  "ip": "string",
  "createdAt": "Date"
}
```

---

## 5. Architecture des Modules

### 5.1 Module IA — Génération de Formulaires

**Flux complet :**

```
Utilisateur                  Frontend                Backend               Claude API
    │                           │                       │                      │
    │── Décrit le formulaire ──▶│                       │                      │
    │   (texte ou image)        │── POST /api/ai/gen ──▶│                      │
    │                           │                       │── Prompt enrichi ────▶│
    │                           │                       │                      │
    │                           │                       │◀── JSON Schema ──────│
    │                           │                       │                      │
    │                           │                       │── Valide le schema ──│
    │                           │                       │── Crée collection ───│
    │                           │                       │                      │
    │                           │◀── Form preview ──────│                      │
    │◀── Aperçu interactif ────│                       │                      │
    │                           │                       │                      │
    │── Modifie (texte) ──────▶│── POST /ai/refine ───▶│── Prompt delta ─────▶│
    │                           │                       │◀── Schema modifié ──│
    │◀── Aperçu mis à jour ───│◀── Updated preview ───│                      │
    │                           │                       │                      │
    │── Publie ───────────────▶│── POST /forms/pub ───▶│                      │
    │                           │                       │── Active collection ─│
    │◀── URL du formulaire ───│◀── Published form ────│                      │
```

**System Prompt pour Claude (Génération de formulaires) :**

```
Tu es un expert en conception de formulaires web. Tu reçois une description 
en langage naturel d'un formulaire et tu dois générer un schéma JSON précis.

RÈGLES STRICTES :
1. Retourne UNIQUEMENT du JSON valide, sans aucun texte avant ou après
2. Chaque champ doit avoir un id unique (uuid v4)
3. Le "name" de chaque champ doit être en snake_case, sans accents
4. Déduis intelligemment les types de champs à partir du contexte
5. Ajoute des validations pertinentes automatiquement
6. Organise les champs en sections logiques si > 5 champs
7. Infère les options de select/radio à partir du contexte
8. Ajoute des champs conditionnels quand c'est logique

TYPES DISPONIBLES :
text, textarea, number, email, phone, date, datetime, select, multiselect,
checkbox, radio, file, image, signature, section, heading, paragraph, 
hidden, calculated, lookup, table

FORMAT DE SORTIE (JSON) :
{
  "name": "string",
  "description": "string", 
  "fields": [{ ... selon le schema FormField }],
  "layout": { "type": "single|multi-step|tabs", "steps": [...] },
  "settings": { ... }
}
```

### 5.2 Module Authentification

```
┌─────────────────────────────────┐
│       Auth Flow                 │
│                                 │
│  Login ──▶ JWT Access Token     │
│            (15min expiry)       │
│          + Refresh Token        │
│            (7 days, httpOnly)   │
│                                 │
│  Middleware vérifie :           │
│  1. Token valide                │
│  2. User actif                  │
│  3. Permissions du groupe       │
│  4. Accès au formulaire         │
└─────────────────────────────────┘
```

### 5.3 Module Connecteurs (API / BD)

```
┌──────────────────────────────────────┐
│         Connector Service            │
│                                      │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ SQL      │  │ MongoDB          │  │
│  │ Server   │  │ External         │  │
│  │ Driver   │  │ Driver           │  │
│  └────┬─────┘  └────┬─────────────┘  │
│       │              │               │
│  ┌────┴──────────────┴────────────┐  │
│  │   Connection Pool Manager      │  │
│  │   - Chiffrement des credentials│  │
│  │   - Test de connexion          │  │
│  │   - Query builder sécurisé     │  │
│  └────────────────────────────────┘  │
│                                      │
│  Utilisations :                      │
│  - Lookup fields (données externes)  │
│  - Export des soumissions            │
│  - Sync bidirectionnel               │
│  - Webhooks de soumission            │
└──────────────────────────────────────┘
```

---

## 6. API REST — Endpoints Principaux

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion → JWT |
| POST | `/api/auth/refresh` | Rafraîchir le token |
| POST | `/api/auth/logout` | Déconnexion |
| POST | `/api/auth/forgot-password` | Réinitialisation MDP |
| GET | `/api/auth/me` | Profil utilisateur |

### Formulaires
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/forms` | Lister les formulaires |
| POST | `/api/forms` | Créer un formulaire (manuel) |
| GET | `/api/forms/:id` | Détails d'un formulaire |
| PUT | `/api/forms/:id` | Modifier un formulaire |
| DELETE | `/api/forms/:id` | Supprimer un formulaire |
| POST | `/api/forms/:id/publish` | Publier un formulaire |
| POST | `/api/forms/:id/archive` | Archiver |
| GET | `/api/forms/:id/versions` | Historique des versions |
| POST | `/api/forms/:id/duplicate` | Dupliquer |

### IA
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/ai/generate` | Générer un formulaire par IA |
| POST | `/api/ai/refine` | Raffiner un formulaire existant |
| POST | `/api/ai/describe` | Décrire une image → formulaire |

### Soumissions
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/forms/:id/submissions` | Lister les soumissions |
| POST | `/api/forms/:id/submissions` | Soumettre un formulaire |
| GET | `/api/forms/:id/submissions/:subId` | Détails soumission |
| PUT | `/api/forms/:id/submissions/:subId` | Modifier statut |
| DELETE | `/api/forms/:id/submissions/:subId` | Supprimer |
| GET | `/api/forms/:id/submissions/export` | Export CSV/Excel |

### Utilisateurs & Groupes
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/users` | Lister les utilisateurs |
| POST | `/api/users` | Créer un utilisateur |
| PUT | `/api/users/:id` | Modifier |
| DELETE | `/api/users/:id` | Désactiver |
| GET | `/api/groups` | Lister les groupes |
| POST | `/api/groups` | Créer un groupe |
| PUT | `/api/groups/:id` | Modifier les permissions |

### Connecteurs
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/connections` | Lister les connexions |
| POST | `/api/connections` | Créer une connexion |
| POST | `/api/connections/:id/test` | Tester la connexion |
| DELETE | `/api/connections/:id` | Supprimer |
| POST | `/api/connections/:id/query` | Exécuter une requête |

---

## 7. Structure du Projet

```
formai/
├── apps/
│   ├── web/                          # Frontend Next.js
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── forgot-password/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx              # Dashboard
│   │   │   │   ├── forms/
│   │   │   │   │   ├── page.tsx          # Liste des formulaires
│   │   │   │   │   ├── new/page.tsx      # Nouveau (AI builder)
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx      # Détails
│   │   │   │   │       ├── edit/page.tsx # Éditeur
│   │   │   │   │       ├── test/page.tsx # Mode test
│   │   │   │   │       └── submissions/page.tsx
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── groups/page.tsx
│   │   │   │   ├── connections/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   └── f/[slug]/page.tsx         # Formulaire public
│   │   ├── components/
│   │   │   ├── ui/                       # Shadcn components
│   │   │   ├── forms/
│   │   │   │   ├── FormBuilder.tsx        # Éditeur visuel
│   │   │   │   ├── FormRenderer.tsx       # Rendu dynamique
│   │   │   │   ├── FormPreview.tsx        # Aperçu
│   │   │   │   ├── FieldRenderer.tsx      # Rendu par type de champ
│   │   │   │   └── AIFormChat.tsx         # Chat IA pour génération
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Breadcrumbs.tsx
│   │   │   └── shared/
│   │   │       ├── DataTable.tsx
│   │   │       ├── StatusBadge.tsx
│   │   │       └── ConfirmDialog.tsx
│   │   ├── lib/
│   │   │   ├── api.ts                    # Client API
│   │   │   ├── auth.ts                   # Auth helpers
│   │   │   └── utils.ts
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useForms.ts
│   │       └── useAI.ts
│   │
│   └── api/                              # Backend Express
│       ├── src/
│       │   ├── index.ts                  # Entry point
│       │   ├── config/
│       │   │   ├── database.ts           # MongoDB connection
│       │   │   ├── redis.ts              # Redis connection
│       │   │   ├── ai.ts                 # AI provider config
│       │   │   └── env.ts                # Environment variables
│       │   ├── middleware/
│       │   │   ├── auth.ts               # JWT verification
│       │   │   ├── permissions.ts        # RBAC middleware
│       │   │   ├── rateLimiter.ts
│       │   │   ├── validator.ts          # Zod validation
│       │   │   └── errorHandler.ts
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── forms.routes.ts
│       │   │   ├── ai.routes.ts
│       │   │   ├── submissions.routes.ts
│       │   │   ├── users.routes.ts
│       │   │   ├── groups.routes.ts
│       │   │   └── connections.routes.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── forms.controller.ts
│       │   │   ├── ai.controller.ts
│       │   │   ├── submissions.controller.ts
│       │   │   ├── users.controller.ts
│       │   │   ├── groups.controller.ts
│       │   │   └── connections.controller.ts
│       │   ├── services/
│       │   │   ├── ai.service.ts         # Claude API integration
│       │   │   ├── form.service.ts
│       │   │   ├── submission.service.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── connector.service.ts  # SQL/Mongo connections
│       │   │   ├── email.service.ts
│       │   │   └── audit.service.ts
│       │   ├── models/
│       │   │   ├── User.ts
│       │   │   ├── Organization.ts
│       │   │   ├── Group.ts
│       │   │   ├── Form.ts
│       │   │   ├── ApiConnection.ts
│       │   │   └── AuditLog.ts
│       │   ├── utils/
│       │   │   ├── encryption.ts         # AES-256 pour credentials
│       │   │   ├── dynamicCollection.ts  # Gestion collections dynamiques
│       │   │   └── validators.ts
│       │   └── types/
│       │       ├── form.types.ts
│       │       ├── ai.types.ts
│       │       └── auth.types.ts
│       └── tests/
│           ├── unit/
│           └── integration/
│
├── packages/
│   └── shared/                           # Types partagés
│       ├── types/
│       └── constants/
│
├── docker-compose.yml
├── Dockerfile.api
├── Dockerfile.web
├── .env.example
├── turbo.json                            # Turborepo config
└── package.json
```

---

## 8. Sécurité

### 8.1 Authentification
- JWT avec access token (15 min) + refresh token (7 jours, httpOnly cookie)
- Bcrypt (12 rounds) pour le hashing des mots de passe
- Rate limiting sur les endpoints d'auth (5 tentatives / 15 min)

### 8.2 Autorisation (RBAC)
- 4 niveaux : `superadmin`, `admin`, `manager`, `user`
- Permissions granulaires par groupe
- Middleware vérifie organisation + groupe + formulaire

### 8.3 Données
- Chiffrement AES-256-GCM des credentials de connexion
- Parameterized queries pour prévenir les injections SQL
- Sanitization de toutes les entrées (DOMPurify côté client, express-validator côté serveur)
- CORS strict (whitelist de domaines)
- Helmet.js pour les headers de sécurité

### 8.4 API IA
- Clés API stockées côté serveur uniquement (jamais exposées au client)
- Rate limiting des appels IA (10/min par utilisateur)
- Validation du JSON retourné par l'IA avant utilisation
- Sanitization des prompts pour éviter les injections

---

## 9. Workflow de Création de Formulaire

```
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : CRÉATION                                        │
│                                                             │
│  L'utilisateur tape :                                       │
│  "Créer un formulaire de demande de congé avec :            │
│   - Nom de l'employé, matricule                             │
│   - Type de congé (vacances, maladie, personnel)            │
│   - Date début et fin                                       │
│   - Nombre de jours                                         │
│   - Commentaires                                            │
│   - Signature du manager"                                   │
│                                                             │
│  OU upload une image/photo d'un formulaire papier           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : GÉNÉRATION IA                                    │
│                                                             │
│  → Le texte est envoyé à Claude API avec le system prompt   │
│  → Claude retourne un JSON schema complet                   │
│  → Le backend valide le schema (Zod)                        │
│  → Une collection MongoDB est créée : form_{id}_submissions │
│  → Le formulaire passe en statut "draft"                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : APERÇU & REFINEMENT                             │
│                                                             │
│  → L'utilisateur voit un aperçu interactif du formulaire    │
│  → Il peut :                                                │
│    - Modifier via drag & drop (éditeur visuel)              │
│    - Demander des modifications par texte à l'IA            │
│      "Ajoute un champ upload pour le certificat médical     │
│       qui apparaît seulement si type = maladie"             │
│  → Chaque modification crée une nouvelle version            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 : TEST                                             │
│                                                             │
│  → Le formulaire passe en statut "testing"                  │
│  → URL de test générée (/f/{slug}?mode=test)                │
│  → Les soumissions de test sont marquées comme telles       │
│  → L'utilisateur peut tester toutes les validations         │
│  → Les données de test sont purgées avant la publication    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 : PUBLICATION                                      │
│                                                             │
│  → Le formulaire passe en statut "published"                │
│  → URL publique : /f/{slug}                                 │
│  → Les groupes d'accès sont appliqués                       │
│  → Les intégrations sont activées (webhooks, BD, email)     │
│  → Les soumissions commencent à être collectées             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Variables d'Environnement

```env
# Application
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:4000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/formai

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Claude AI
ANTHROPIC_API_KEY=sk-ant-xxx
AI_MODEL=claude-sonnet-4-5-20250929
AI_MAX_TOKENS=4096

# Encryption (pour les credentials des connecteurs)
ENCRYPTION_KEY=32-bytes-hex-key

# MinIO (File Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=formai-uploads

# Email (optionnel)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx
```

---

## 11. Déploiement (Docker)

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: 
      context: .
      dockerfile: Dockerfile.web
    ports: ["3000:3000"]
    depends_on: [api]
    environment:
      NEXT_PUBLIC_API_URL: http://api:4000

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports: ["4000:4000"]
    depends_on: [mongodb, redis]
    env_file: .env

  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongodb_data:/data/db"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    volumes: ["minio_data:/data"]
    command: server /data --console-address ":9001"

volumes:
  mongodb_data:
  minio_data:
```
