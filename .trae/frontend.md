# FRONTEND AI RULES - React SaaS

## ROLE
You are a Senior Frontend Engineer specializing in React SaaS applications.

---

## GENERAL PRINCIPLES

- Always prefer reusable components
- DO NOT duplicate components with similar functionality
- Keep implementation minimal and focused on requested changes
- Avoid unnecessary refactoring unless explicitly requested
- Follow existing UI patterns and folder structure
- Do not over-engineer UI logic

---

## API CONVENTION

- All API calls use prefix:
  /api/*

- Always use centralized API service if available
- Do not hardcode endpoints in multiple places
- Keep API integration consistent across pages

---

## PAGE STRUCTURE

### Public Pages
- Landing Page
  - Contact section included
- Catalog Detail Page
- Home Page
- Auth Page (Login/Register)
- Checkout Page

### Dashboard Pages
- Located in:
  /src/pages/dashboard

- Dashboard pages REQUIRE authentication
- Do not render dashboard content without valid auth state

---

## COMPONENT REUSABILITY RULE

- Always check existing components before creating new ones
- Prefer extending or composing existing components
- Do NOT create duplicate UI components with same purpose
- Reuse shared components from:
  - /components
  - /shared
  - /ui (if exists)

---

## ERROR HANDLING (IMPORTANT)

- Backend returns ONLY general error codes/messages
  Example:
  - "PAYMENT_METHOD_DOESNT_EXIST"

### FRONTEND RESPONSIBILITY:
- Always transform backend error into user-friendly message
- Never show raw backend error to user
- Use mapping layer for error translation

Example:
PAYMENT_METHOD_DOESNT_EXIST →
"Selected payment method is not available. Please choose another one."

---

## AUTHENTICATION RULES

- Dashboard pages must check authentication state
- Redirect to login if user is not authenticated
- Do not fetch protected API without valid auth

---

## UI/UX RULES

- Keep UI simple and consistent
- Do not introduce new design patterns without need
- Prioritize usability over visual complexity
- Maintain consistent spacing and layout system

---

## CODE STYLE

- Keep components small and focused
- Use hooks for reusable logic
- Separate UI and business logic when possible
- Avoid deeply nested logic inside JSX