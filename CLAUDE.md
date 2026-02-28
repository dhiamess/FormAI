# CLAUDE.md — FormAI Project Guide

## Project Overview

FormAI is a SaaS platform for AI-powered form management. Users describe a form in natural language, the AI (Claude API) generates it as a structured JSON schema, the system renders it as an interactive form, and each form stores submissions in a dedicated MongoDB collection.

**Primary language**: French (UI, documentation, comments). Code identifiers and variable names in English.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | Turborepo |
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Shadcn/ui |
| **Backend** | Express + TypeScript |
| **Database** | MongoDB (Mongoose) — dynamic collections per form |
| **Cache/Sessions** | Redis (ioredis) |
| **AI** | Anthropic Claude API (`claude-sonnet-4-5-20250929`) via `@anthropic-ai/sdk` |
| **Auth** | JWT (access + refresh tokens) + bcrypt |
| **File Storage** | MinIO (S3-compatible) |
| **Real-time** | Socket.io |
| **Validation** | Zod everywhere (API inputs, form schemas, env vars) |
| **Testing** | Jest (unit/integration) + Playwright (E2E) |
| **Containerization** | Docker Compose |

## Project Structure

```
formai/
├── apps/
│   ├── web/                    # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, register, forgot-password pages
│   │   │   ├── (dashboard)/    # Dashboard layout + all authenticated pages
│   │   │   │   ├── forms/      # Form CRUD, AI builder, submissions
│   │   │   │   ├── users/
│   │   │   │   ├── groups/
│   │   │   │   ├── connections/
│   │   │   │   └── settings/
│   │   │   └── f/[slug]/       # Public form rendering
│   │   ├── components/
│   │   │   ├── ui/             # Shadcn/ui components
│   │   │   ├── forms/          # FormRenderer, FormBuilder, AIFormChat, FieldRenderer
│   │   │   ├── layout/         # Sidebar, Header, Breadcrumbs
│   │   │   └── shared/         # DataTable, StatusBadge, ConfirmDialog
│   │   ├── lib/                # API client, auth helpers, utils
│   │   └── hooks/              # useAuth, useForms, useAI
│   │
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── index.ts        # Entry point
│       │   ├── config/         # env.ts, database.ts, redis.ts, ai.ts
│       │   ├── middleware/     # auth.ts, permissions.ts, rateLimiter.ts, validator.ts, errorHandler.ts
│       │   ├── routes/         # One file per resource (auth, forms, ai, submissions, users, groups, connections)
│       │   ├── controllers/    # One file per resource
│       │   ├── services/       # Business logic (ai.service, form.service, connector.service, etc.)
│       │   ├── models/         # Mongoose models (User, Organization, Group, Form, ApiConnection, AuditLog)
│       │   ├── utils/          # encryption.ts, dynamicCollection.ts, logger.ts, validators.ts
│       │   └── types/          # TypeScript type definitions
│       └── tests/
│           ├── unit/
│           └── integration/
│
├── packages/
│   └── shared/                 # Shared TypeScript types and constants between frontend/backend
│       └── src/types/index.ts  # Enums (UserRole, FormStatus, FieldType, etc.) and interfaces
│
├── docker-compose.yml
├── .env.example
├── turbo.json
└── package.json
```

## Common Commands

```bash
# Install dependencies (from monorepo root)
npm install

# Development
npm run dev              # Start all services (Turborepo)
npm run dev --filter=web # Frontend only
npm run dev --filter=api # Backend only

# Build
npm run build            # Build all packages
npm run build --filter=web
npm run build --filter=api

# Testing
npm run test             # Run all tests
npm run test --filter=api # Backend tests only
npm run lint             # ESLint across all packages
npm run type-check       # TypeScript type checking

# Database
npm run seed             # Run seed script (scripts/seed.ts)

# Docker
docker-compose up -d     # Start all services (MongoDB, Redis, MinIO, app)
docker-compose down      # Stop all services

# E2E tests (if Playwright configured)
npm run test:e2e
```

## Architecture Patterns

### Backend (Express API)

- **Route → Controller → Service → Model** pattern for all API endpoints
- Every route has Zod validation middleware before the controller
- Auth middleware (`authenticate`) verifies JWT and attaches `req.user`
- Permissions middleware (`requirePermission`) checks RBAC group permissions
- Superadmin role bypasses all permission checks
- Standardized API response format: `ApiResponse<T>` with `{ success, data?, error?, message?, pagination? }`
- Structured logging via winston — never use `console.log` in production
- Error handling with custom error types and a global error handler middleware

### Frontend (Next.js)

- App Router with route groups: `(auth)` for unauthenticated pages, `(dashboard)` for authenticated pages
- React Hook Form + Zod for all form validation
- TanStack Query (`@tanstack/react-query`) for server state management
- Axios-based API client in `lib/api.ts`
- Shadcn/ui component library (components live in `components/ui/`)
- Dark/light theme via `next-themes` + Tailwind
- Responsive sidebar layout with Lucide icons

### Dynamic Collections

Each form gets its own MongoDB collection named `form_{formId}_submissions`. The `dynamicCollection.ts` utility creates Mongoose models on the fly based on the form's field schema. Test submissions are marked with `isTestSubmission: true` and purged on publish.

### AI Integration

- Claude API called from `AIService` on the backend only (API key never exposed to client)
- System prompt instructs Claude to return strict JSON matching the `FormSchema` Zod schema
- AI output is validated with Zod; on failure, retried up to 2 times
- Two operations: `generateForm` (from scratch) and `refineForm` (modify existing)
- Rate limited: 10 AI calls per minute per user

## Key Data Models

- **User**: email, role (superadmin/admin/manager/user), groups, organization, preferences
- **Organization**: multi-tenant container with plan limits
- **Group**: RBAC permission sets (forms.create, submissions.read, users.manage, etc.)
- **Form**: name, slug, status (draft/testing/published/archived), versioned schema, access control, integrations
- **FormSchema**: fields array with types (20+ field types), layout config, settings
- **ApiConnection**: encrypted credentials for external DB connectors (SQL Server, MongoDB, PostgreSQL, REST API)
- **AuditLog**: tracks all user actions for compliance

## API Endpoints Summary

| Module | Base Path | Key Operations |
|--------|-----------|----------------|
| Auth | `/api/auth` | register, login, refresh, logout, forgot-password, me |
| Forms | `/api/forms` | CRUD, publish, archive, duplicate, versions |
| AI | `/api/ai` | generate, refine, describe (image→form) |
| Submissions | `/api/forms/:id/submissions` | list, create, update status, delete, export CSV |
| Users | `/api/users` | CRUD + activation |
| Groups | `/api/groups` | CRUD + permission management |
| Connections | `/api/connections` | CRUD, test, execute query |

## Coding Conventions

### TypeScript
- **Strict mode** enabled everywhere — avoid `any` unless justified with a comment
- Shared types live in `packages/shared` and are imported as `@formai/shared`
- Zod schemas are the source of truth for validation; derive TypeScript types from them when possible

### Naming
- **Files**: kebab-case for utilities (`dynamic-collection.ts`), PascalCase for components (`FormRenderer.tsx`), camelCase for services (`ai.service.ts`)
- **MongoDB field names**: snake_case (e.g., `first_name`, `created_at`)
- **Form field `name` property**: always snake_case, no accents, no spaces
- **API routes**: kebab-case, plural nouns (`/api/forms`, `/api/connections`)

### Security
- All credentials encrypted with AES-256-GCM before storage
- Parameterized queries to prevent SQL injection
- Input sanitization: express-validator (server), DOMPurify (client)
- CORS whitelist, Helmet.js headers, rate limiting on auth endpoints
- JWT access tokens expire in 15 minutes; refresh tokens in 7 days (httpOnly cookie)

### Error Handling
- Custom error classes with HTTP status codes
- Global error handler middleware catches all unhandled errors
- API always returns `{ success: false, error: "message" }` on failure
- Never expose stack traces in production

### Testing
- Unit tests for services, middleware, and utilities
- Integration tests for full API flows (register → login → create form → submit)
- Mock Claude API responses in tests
- Test files co-located in `tests/unit/` and `tests/integration/`

## Form Lifecycle

```
Describe (text) → Generate (AI) → Preview → Refine (AI) → Test → Publish
     │                  │              │           │          │        │
     │            POST /ai/generate    │    POST /ai/refine   │  POST /forms/:id/publish
     │            Status: draft        │    New version        │  Purge test data
     │                                 │                      │  Status: published
     │                                 │               Status: testing
```

## Implementation Priority

When building features, follow this priority order:

1. **P0 (Critical)**: Auth + Forms CRUD + AI Generation + FormRenderer + Submissions
2. **P1 (Important)**: Dashboard stats + Groups/Permissions RBAC + Form versioning
3. **P2 (Nice-to-have)**: DB Connectors + Webhooks + CSV Export + File upload (MinIO)
4. **P3 (Bonus)**: Real-time Socket.io + Collaboration + Audit logs

## Environment Variables

Required environment variables (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Min 32 chars, for access tokens |
| `JWT_REFRESH_SECRET` | Min 32 chars, for refresh tokens |
| `ANTHROPIC_API_KEY` | Starts with `sk-ant-` |
| `ENCRYPTION_KEY` | Min 32 chars, for AES-256-GCM |
| `FRONTEND_URL` | Frontend origin for CORS |

## Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| web | 3000 | Next.js frontend |
| api | 4000 | Express backend |
| mongodb | 27017 | Primary database |
| redis | 6379 | Cache and sessions |
| minio | 9000/9001 | File storage (S3-compatible) |

## Design System

- **Primary**: `#2563eb` (blue)
- **Secondary**: `#7c3aed` (violet)
- **Success**: `#16a34a`
- **Danger**: `#dc2626`
- **Background**: `#f8fafc` (light) / `#0f172a` (dark)
- **Font**: Inter
- **Border radius**: 8px
- Dark/light mode toggle supported
