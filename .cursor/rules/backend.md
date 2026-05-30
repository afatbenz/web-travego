## AUTOMATIC AUDIT FIELDS (IMPORTANT)

### ORGANIZATION CONTEXT

- Any table column named `organization_id` MUST ALWAYS be taken from:
  ctx.Locals("organization_id")

- NEVER accept `organization_id` from request payload

---

### DATABASE
PostgreSQL

### CREATE OPERATIONS (INSERT)

For every INSERT operation, ALWAYS include:

- created_at → CURRENT TIMESTAMP
- created_by → ctx.Locals("user_id")

Rule:
- created_at must be set automatically using current time
- created_by must always come from authenticated user (ctx.Locals)

---

### UPDATE OPERATIONS

For every UPDATE operation, ALWAYS include:

- updated_at → CURRENT TIMESTAMP
- updated_by → ctx.Locals("user_id")

Rule:
- updated_at must always reflect current timestamp
- updated_by must always come from authenticated user

---

### STRICT RULES

- These fields MUST NOT be provided from request body
- These fields MUST ALWAYS be enforced in repository/service layer
- Do NOT allow frontend or client to override them
- Do NOT explain and summarize them in code, only edit or modify them
- Do NOT use them in any way except as described in this document

---

## POSTGRESQL STRICT CODE GENERATION RULES

- NEVER write conditional logic for multiple database drivers (e.g., NO `if driver == "postgres"` or checking for alternative drivers).
- ALWAYS assume the database is strictly and exclusively PostgreSQL.
- Write raw queries or expressions using native PostgreSQL syntax directly.
- Hardcode the query parameters or placeholders specifically for PostgreSQL style (e.g., `$1`, `$2`, `$3`) if placeholders are required.
- Do NOT perform dynamic data type casting like `::text` on `organization_id` unless explicitly requested. Assume `organization_id` data type matches the repository/database schema directly.
- Example of BAD code:
  orgExpr := "organization_id = " + r.getPlaceholder(3)
  if r.driver == "postgres" { orgExpr = "organization_id::text = " + r.getPlaceholder(3) }

- Example of GOOD code:
  orgExpr := "organization_id = $3" (or use the appropriate pure Postgres placeholder method from the codebase)