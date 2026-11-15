# Codex — Instructions for Tech Store

## Mission
Build a React + TypeScript frontend and Spring Boot REST backend for a technology e-commerce coursework project, backed by MySQL 8 and Cloudinary.

## Read only what is relevant
- Business behavior: `docs/requirements/BUSINESS_RULES.md` + target UC in `docs/requirements/UC_MATRIX.md`.
- Data changes: `docs/architecture/DATABASE.md` + `database/schema/01_schema_21_tables_mysql8.sql`.
- API/client integration: `docs/architecture/API_CONTRACT.md`.
- UI changes: `docs/design/DESIGN_SYSTEM.md`, `docs/design/SCREEN_MAP.md`, and the approved Figma frame/component linked there.
- Work scope/review: `docs/team/TASK_BOARD.md`, `docs/team/GIT_WORKFLOW.md`.
- **Diagram lookup:** `docs/diagrams/DIAGRAM_INDEX.md` (map UC → đúng sequence và ERD); read diagram sources as plain text.

## Must do
1. Work on **one explicit Issue/UC at a time**. Before changing code, state scope, affected files, acceptance criteria and tests.
2. Do not invent/rename a DB column, REST endpoint, DTO field, enum value, role or status transition. When contract is missing/conflicting, ask team to approve a decision and update docs before implementation.
3. Match approved Figma designs and shared tokens; reuse existing components. Do not change global styles/navigation without approval.
4. Split business logic into service layer; keep controller thin. Validate identity, ownership, roles and money on backend. Never trust frontend totals or userId.
5. Do not modify files outside task scope or unrelated features. Never silently migrate DB or modify production data.
6. Add tests for normal, forbidden and edge-case behavior. Verify affected build/test commands actually run. Report commands + outcomes; do not claim unexecuted checks passed.
7. Do not commit, push, open PR, install third-party dependencies, deploy or use external accounts without the operator's explicit direction.
8. No secrets in commits, logs or frontend. Image upload authenticated on backend to Cloudinary.
9. For changes affecting API, DB or design, update corresponding source-of-truth document in the same PR.
10. End each task with a handoff: what changed, files, how to run/test, unresolved decisions, screenshots where UI is involved.

## Core invariants
- `ROLE_ADMIN` has Staff management capability; Customer rights require `ROLE_CUSTOMER`.
- New orders `PENDING`; COD `UNPAID`, successful ONLINE_MOCK `PAID`. Failed ONLINE_MOCK creates no order or stock/coupon/cart changes.
- Cart does not reserve stock; BUY_NOW leaves cart intact; successful CART checkout removes selected cart items only.
- Only PENDING/CONFIRMED orders can be CANCELLED. Cancellation restores stock/coupon at most once.
- Checkout inventory/coupon/branch validated atomically under concurrency protection.
- Cloudinary holds images, MySQL holds secure URL + public ID. Do not delete assets referenced by order snapshots.

**STOP** when specification conflicts: do not replace it with a guessed implementation.


## Diagram reading policy (Starter v2)
1. **For EVERY UC task:** read `docs/requirements/UC_MATRIX.md`, `docs/requirements/BUSINESS_RULES.md` and the matching row in `docs/diagrams/DIAGRAM_INDEX.md`; open every Sequence Diagram listed for that UC.
2. **For DB/model tasks:** additionally read `docs/diagrams/class/CLASS_MODEL_INDEX.md`, the relevant `docs/diagrams/erd/ERD_*.puml` and the current SQL/migration. ERD was generated from **proposal SQL**, not verified on a running DB.
3. **For UI tasks:** additionally read `docs/design/SCREEN_MAP.md`, `DESIGN_SYSTEM.md` and approved Figma frame. UML does NOT replace Figma.
4. Do not silently infer workflow, permission, DTO, FK or transaction details that a diagram omits. Diagrams are **illustrative**, several sequences intentionally omit error/concurrency details.
5. If `.drawio`, `.puml`, markdown, API contract and SQL conflict, summarize the precise conflict, log a decision in `docs/team/DECISIONS.md`, and **stop affected work** until owner approves.
6. If code alters a flow/model, update affected `.puml`, `DIAGRAM_INDEX.md` (only if mapping changes), README and contract in the same PR.
7. Git policy: repository owner/Tech Lead is the **only designated merger**; contributors create PRs and do not merge. For owner's own PR, independent approval can come from teammate if branch rules require one; GitHub will not count self-approval.
