# Peergent Product Blueprint

## Positioning

Peergent analyzes a company, identifies where it loses time, money, customers, or growth, and recommends or deploys the right digital employees to improve it.

Peergent is an **AI Workforce platform** — not a generic chatbot builder. Digital employees (AI Peers) operate as ongoing business contributors with objectives, knowledge, and oversight.

## Target customers

- SMEs
- Online entrepreneurs
- Service companies
- Installation companies
- Dental and healthcare practices
- Agencies and e-commerce businesses

## Core user questions (Command Center)

Every dashboard visit should answer within five seconds:

1. How is my business doing?
2. What requires attention?
3. What should I do next?
4. What is my AI workforce currently doing?

## Data honesty principles

- Never present invented financial savings, revenue, or performance as factual.
- Use qualitative states until real inputs exist.
- Ranges require explicit inputs or documented benchmarks.
- Every estimate must eventually support: source, formula, confidence, missing data.
- Mark non-database information as **Demo insight**, **Provisional**, or **More data required**.
- Real Supabase peer data must never be labeled demo.

## Terminology

| Term | Meaning |
|------|---------|
| AI Peer | A deployed digital employee with role, objective, and status |
| Website Intelligence | Analysis flow that inspects a company website and recommends AI employees |
| Knowledge | Company knowledge sources (website, documents, integrations) |
| Command Center | The Overview dashboard (`/`) for executive visibility |
| Data completeness | Percentage based only on verified connected/available sources |

## Architecture boundaries (current sprint)

- **Real data:** Supabase `peers` table (name, role, status, website, objective)
- **Demo/provisional:** Business health, opportunities, executive brief, peer activity, recent activity
- **Not in scope:** Auth, vector search, embeddings, analytics integrations, schema changes
- **Preserved flows:** `/website-intelligence`, `/peers`, `/peers/[id]`, `/knowledge`

## Module map

| Route | Purpose |
|-------|---------|
| `/` | Command Center (Overview) |
| `/peers` | AI workforce management |
| `/peers/[id]` | Peer control center |
| `/website-intelligence` | Website analysis and recommendations |
| `/knowledge` | Knowledge management hub |
