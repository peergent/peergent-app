# Peergent Core Principles

Version: 1.0  
Status: Living Document

---

# Purpose

These principles guide every product, design, engineering and AI decision inside Peergent.

When multiple implementations are technically possible, the option that best follows these principles should be preferred.

These principles apply to:

- customer-facing experiences;
- platform-admin experiences;
- AI behavior;
- data architecture;
- integrations;
- workflows;
- rendering;
- publishing;
- future Peers.

---

# 1. A Peer Is a Colleague, Not a Feature

A Peer represents a digital colleague with a defined role inside an organization.

A Peer has:

- a role;
- responsibilities;
- objectives;
- permissions;
- tools;
- context;
- knowledge;
- work;
- deliverables;
- measurable performance.

A feature may support a Peer, but a Peer must never be reduced to a collection of disconnected buttons or AI prompts.

The interface should communicate:

- what the Peer understands;
- what the Peer is doing;
- what the Peer needs;
- what the Peer delivered;
- what changed as a result.

---

# 2. Work Is the Primary Product Object

Peergent is organized around work, not around chat.

Conversation may initiate, clarify or review work, but conversation is not the end product.

A user should be able to see:

- assigned work;
- planned work;
- active work;
- blocked work;
- work awaiting approval;
- completed work;
- recurring work;
- results created by work.

Every meaningful Peer action should eventually be traceable to a work object.

---

# 3. Outcomes Matter More Than AI Activity

Customers should not have to interpret technical AI activity.

They care about:

- leads;
- appointments;
- campaigns;
- content;
- resolved requests;
- completed tasks;
- saved time;
- reduced costs;
- revenue;
- risk;
- business progress.

Peergent may internally track prompts, model calls, tokens, validation and agent reasoning.

Customer-facing experiences should translate this into useful business context.

Prefer:

> Emma created three campaign concepts and recommends concept B.

Over:

> The model generated 48 outputs using 32,000 tokens.

---

# 4. Shared Capabilities Before Peer-Specific Implementations

When a capability can support multiple Peers, it should be implemented as shared platform infrastructure.

Examples include:

- identity;
- organizations;
- permissions;
- context;
- memory;
- knowledge;
- assets;
- brand rules;
- workflows;
- approvals;
- notifications;
- publishing;
- performance measurement;
- audit logging;
- integrations.

Peer-specific code should define role behavior, domain rules and presentation.

It should not recreate shared infrastructure.

---

# 5. Organization Context Is the Foundation

Every Peer works within an Organization.

Organization context includes:

- company identity;
- products;
- services;
- audiences;
- goals;
- positioning;
- brand;
- internal processes;
- approved knowledge;
- connected systems;
- policies;
- constraints;
- performance history.

A Peer must never operate as a generic assistant when relevant organization context is available.

All organization-specific data must remain organization-scoped.

---

# 6. Simple Externally, Explicit Internally

The customer experience should feel simple.

The internal architecture should be explicit.

Internally, Peergent should clearly represent:

- organization;
- user;
- role;
- Peer;
- responsibility;
- objective;
- work unit;
- workflow;
- deliverable;
- approval;
- asset;
- integration;
- result;
- audit event.

Avoid hidden coupling, ambiguous ownership and logic that only exists inside prompts.

Important business rules must be represented in code or structured data where possible.

---

# 7. Human Control Must Be Proportional to Risk

Not every action requires approval.

Approval requirements should depend on impact and reversibility.

Examples:

Low-risk:

- preparing a draft;
- suggesting a task;
- analyzing performance;
- creating an internal summary.

Medium-risk:

- scheduling content;
- updating CRM fields;
- contacting an existing lead;
- changing a campaign draft.

High-risk:

- publishing publicly;
- spending money;
- issuing refunds;
- sending legal or financial communications;
- deleting data;
- changing permissions;
- contacting sensitive audiences.

Peergent should support:

- fully autonomous actions;
- approval-required actions;
- human-executed actions;
- blocked actions.

The product must clearly communicate which mode applies.

---

# 8. Trust Requires Explainability

A Peer should be able to explain important decisions in useful language.

Examples:

- why a campaign concept was recommended;
- which organization context was used;
- why a task was prioritized;
- why approval is required;
- why an action was blocked;
- why one asset or template was selected.

Explainability should not expose private system prompts or unnecessary chain-of-thought.

It should expose relevant evidence, rules, context and business rationale.

---

# 9. Memory Must Be Structured and Governed

Peergent should not treat all historical data as permanent memory.

Memory must have:

- scope;
- source;
- owner;
- confidence;
- creation date;
- last update;
- sensitivity;
- retention rules;
- permission boundaries.

Different forms of memory include:

- organization facts;
- user preferences;
- Peer work history;
- campaign performance;
- decisions;
- approved knowledge;
- temporary task context.

Memory must be correctable and removable.

---

# 10. Brand Compliance Is Deterministic Where Possible

Brand consistency should not depend entirely on generative model judgment.

Use deterministic rules for:

- colors;
- typography;
- spacing;
- logo placement;
- approved assets;
- safe areas;
- layout constraints;
- text length;
- channel dimensions.

AI may select and combine approved elements.

Rendering should enforce the final output.

---

# 11. Performance Must Improve Future Work

Completed work should create learning signals.

Relevant signals may include:

- approval or rejection;
- user edits;
- customer feedback;
- engagement;
- conversion;
- revenue;
- completion time;
- error rate;
- intervention rate;
- channel performance.

Performance data should improve future recommendations, selection and prioritization.

Peergent must distinguish:

- measured performance;
- predicted performance;
- qualitative feedback;
- assumptions.

Predictions must never be presented as guaranteed outcomes.

---

# 12. Integrations Are Tools, Not the Product

External systems provide capabilities and data.

Examples:

- CRM;
- calendar;
- email;
- advertising platforms;
- accounting;
- support tools;
- storage;
- analytics;
- publishing channels.

Peergent coordinates work across these systems.

Integrations should be accessed through shared capability interfaces so that Peers are not tightly coupled to one vendor.

---

# 13. Customer and Platform-Admin Experiences Must Be Separated

Customers should only see information necessary to operate their own organization and Peers.

Customers must not see:

- raw system prompts;
- private model configuration;
- platform-wide customer data;
- token costs;
- internal debugging;
- raw execution logs;
- failed internal generations;
- template source code;
- cross-organization metrics;
- internal support notes.

Platform staff may require these capabilities through a separately authorized admin environment.

The separation must be enforced server-side, not only visually.

---

# 14. Organization Isolation Is Non-Negotiable

Every organization-owned object must be scoped to an organization.

A user must never gain access to another organization by modifying:

- a URL;
- a request body;
- a query parameter;
- a client-side state value;
- an object identifier.

Isolation must be enforced through:

- server-side authorization;
- database policies;
- organization membership checks;
- scoped queries;
- audited admin access.

---

# 15. Migration Must Be Incremental and Reversible

Peergent is an evolving product.

Major architectural migrations must be split into small actions.

Every migration action should define:

- objective;
- affected files;
- expected behavior;
- risks;
- tests;
- rollback method;
- database impact.

Avoid large rewrites when existing behavior can be migrated incrementally.

---

# 16. Preview and Development Surfaces Must Never Become Product Surfaces Accidentally

Design previews, fixtures, development routes and internal test controls must be clearly classified.

They must not:

- appear in customer navigation;
- expose internal data;
- become production entry points;
- bypass normal authorization;
- be mistaken for canonical product routes.

Every new preview or development route must be registered and protected.

---

# 17. One Canonical Source of Truth per Concern

Peergent should avoid multiple competing definitions for the same concept.

Examples:

- one route manifest;
- one customer navigation configuration;
- one role model;
- one organization identity model;
- one work lifecycle;
- one approval model;
- one asset model;
- one publishing abstraction.

Legacy interfaces may exist during migration, but the canonical source must be explicit.

---

# 18. Configuration Must Not Become Business Logic

Configuration may define:

- labels;
- routes;
- templates;
- permissions;
- thresholds;
- available capabilities;
- display behavior.

Complex business decisions should live in tested domain logic.

Avoid hiding important workflows inside large JSON files or prompts without validation.

---

# 19. AI Must Operate Inside Defined Boundaries

Every AI operation should have:

- a defined purpose;
- allowed inputs;
- expected output schema;
- validation;
- permissions;
- failure handling;
- observability;
- cost awareness.

A language model is not a substitute for authorization, validation or deterministic business rules.

---

# 20. Every Capability Must Have an Owner

Every system or capability should have a clear architectural owner.

Examples:

- Context Engine owns context assembly.
- Knowledge owns approved information sources.
- Brand Brain owns brand rules.
- Asset Brain owns approved media.
- Workflow Engine owns work lifecycle transitions.
- Publishing Engine owns channel publication.
- Performance Brain owns learning signals and performance interpretation.
- Peer domain modules own role-specific behavior.

Unclear ownership creates duplicate logic and inconsistent behavior.

---

# 21. Customer Experience Must Favor Clarity Over Configuration

Peergent should make strong defaults.

Do not require customers to configure every internal detail before receiving value.

Prefer:

- guided onboarding;
- inferred defaults;
- progressive disclosure;
- actionable recommendations;
- clear approvals.

Advanced controls may exist, but they should not overwhelm the main workflow.

---

# 22. The Product Must Always Show What Happens Next

Every important screen should answer at least one of these questions:

- What is happening?
- What requires my attention?
- What will happen next?
- What was completed?
- What changed?
- What should I decide?
- What result did this create?

Avoid dashboards that only display passive metrics without an actionable narrative.

---

# 23. Peergent Must Be Role-Agnostic at the Platform Layer

The shared platform should not assume every Peer is a Marketing Peer.

Core models must support different roles.

A Finance Peer and Marketing Peer may use different tools and workflows, but both should use shared concepts such as:

- responsibilities;
- work units;
- approvals;
- deliverables;
- activity;
- performance;
- knowledge;
- permissions.

---

# 24. New Capabilities Must Prove Their Place

Before adding a new capability, answer:

1. Which customer problem does this solve?
2. Which object owns it?
3. Is it shared or Peer-specific?
4. What data does it require?
5. What permissions apply?
6. What is visible to the customer?
7. What is visible only to platform staff?
8. How is success measured?
9. How does it fail safely?
10. Can it be migrated or removed later?

A capability without clear answers should not be implemented yet.
