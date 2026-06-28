# ContentPilot AI — API

NestJS backend for ContentPilot AI, a multi-tenant SaaS platform for AI-powered content generation, audits, and competitor analysis.

## Tech Stack

- **Framework:** NestJS 11 (TypeScript)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Passport.js (JWT, OAuth2)
- **Billing:** Stripe

## Folder Structure

```
src/
├── main.ts
├── app.module.ts
│
├── core/                              # Infrastructure & cross-cutting concerns
│   ├── config/                        # Config validation, env schemas
│   ├── database/                      # Prisma service & module
│   ├── guards/                        # JWT guard, RBAC guard (global)
│   ├── interceptors/                  # Response transform, logging
│   ├── filters/                       # Global exception filters
│   ├── decorators/                    # @CurrentUser, @Roles, @Permissions
│   ├── pipes/                         # Validation, parse pipes
│   └── middleware/                    # Request logging, tenant resolver
│
├── common/                            # Shared across modules
│   ├── dto/                           # Pagination, cursor, base response DTOs
│   ├── types/                         # Shared TS interfaces & types
│   ├── utils/                         # Helpers (slugify, hash, date)
│   └── constants/                     # App-wide constants & enums
│
├── modules/
│   ├── auth/                          # Auth flow
│   │   ├── strategies/                # JWT, OAuth2, local Passport strategies
│   │   ├── dto/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── users/                         # User profile & account settings
│   ├── organizations/                 # Multi-tenant orgs, domains, branding
│   │
│   ├── teams/                         # Team members & invitations
│   │   ├── invitations/
│   │   └── members/
│   │
│   ├── rbac/                          # Role-Based Access Control
│   │   ├── roles/
│   │   ├── resources/
│   │   └── permissions/
│   │
│   ├── subscriptions/                 # Stripe billing
│   │   ├── plans/
│   │   ├── usage/
│   │   └── webhooks/                  # Stripe webhook handler
│   │
│   ├── content/                       # Content management
│   │   ├── posts/
│   │   ├── templates/
│   │   └── media/
│   │
│   ├── ai/                            # All AI-powered features
│   │   ├── generation/                # AI content generation
│   │   ├── chat/                      # AI chat assistant
│   │   ├── audits/                    # Scheduled website content audits
│   │   └── competitors/               # Competitor analysis
│   │
│   ├── reports/                       # White-label report generation
│   ├── notifications/                 # Email & in-app notifications
│   └── analytics/                     # Usage & engagement analytics
│
└── generated/                         # Auto-generated Prisma client types
```

## Getting Started

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```
