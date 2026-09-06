---
name: web-skill
description: Complete project knowledge for the Pishkar Web administration panel — a React-based B2B dashboard. Use this skill whenever working on anything inside pishkar/web/src/. Covers architecture, authentication, routing, API integration, B2B chat API contracts, internationalization, and UI conventions.
---

# Pishkar Web — Engineering Reference

## Project Overview

**Pishkar Web** is the B2B administration panel for the Pishkar assistant ecosystem. It is built using **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS**. It provides a dashboard for managing assistant entities, monitoring performance, and configuring B2B-specific settings.

**Key facts:**

- **Framework:** React 19 (Vite-powered)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + PostCSS
- **Internationalization:** `react-i18next` with Persian (`fa`) as the default language. Supports RTL layouts.
- **Routing:** React Router Dom v7.
- **Icons:** `lucide-react`.
- **UI Components:** Modular components in `src/admin/components/ui`.
- **State Management:** React Query + React Context (for Auth).

---

## Top-Level Project Structure

```
pishkar/web/
├── src/
│   ├── admin/               ← Core Administration Panel logic
│   │   ├── components/      ← UI, Dashboard, and Layout components
│   │   ├── context/         ← AuthContext and context providers
│   │   ├── hooks/           ← Custom React hooks (e.g., useAuth, useApiKeysQuery)
│   │   ├── pages/           ← Page components (Dashboard, Login, ApiKeys)
│   │   ├── router/          ← AppRouter and route guard components
│   │   ├── types/           ← TypeScript definitions for API responses and UI models
│   │   └── utils/           ← Helper functions (tokens, errors, dates, query keys)
│   ├── api/                 ← Shared API client and domain-specific services
│   │   ├── auth/            ← Login, logout, identity user info calls
│   │   ├── apikey/          ← API key list/create/delete services
│   │   ├── dashboard/       ← Dashboard data services
│   │   └── httpClient.ts    ← Axios client with auth header injection
│   ├── i18n/                ← Internationalization setup (i18next)
│   ├── locales/             ← Translation JSON files (fa, en)
│   ├── styles/              ← Global CSS and UI utility styles
│   ├── App.tsx              ← Root application component
│   └── main.tsx             ← Entry point; renders App inside Providers
├── package.json             ← Dependencies and scripts
├── vite.config.ts           ← Vite configuration
└── tsconfig.json            ← TypeScript configuration
```

---

## Technical Implementations

### Authentication & Authorization

The app uses a token-based authentication flow backed by `AuthContext` and React Query.

- **`AuthProvider`**: Wraps the application and exposes `isAuthenticated`, `isAuthLoading`, `user`, `organizationId`, and session helpers.
- **Route guards**: `PrivateRoute` and `PublicRoute` control access to protected and public screens.
- **Token storage**: Access tokens are stored in `localStorage` via the helper module in `src/admin/utils/token.ts`.
- **Identity bootstrapping**: The app fetches identity info after login and resolves the active organization from the returned payload.

### Routing

Routing is centralized in `src/admin/router/AppRouter.tsx`.

- `/login`: Public login page.
- `/dashboard`: Protected dashboard view.
- `/api-keys`: Protected page for managing API keys.
- `/`: Redirects to `/dashboard` if authenticated, otherwise to `/login`.

### API Integration Layer

The web app has a dedicated API layer under `src/api/`.

- **`httpClient`**: Central Axios instance configured with the API base URL from `window.__APP_CONFIG__?.API_BASE_URL`, `VITE_API_BASE_URL`, or an empty fallback. It automatically attaches the Bearer token from `getAccessToken()`.
- **Domain services**:
  - `src/api/auth/authApi.ts`: login, logout, and identity user info requests.
  - `src/api/apikey/apiKeysService.ts`: list, create, and delete API keys for a specific organization.
  - `src/api/dashboard/dashboardApi.ts`: dashboard data requests.
- **Data fetching pattern**: React Query hooks in `src/admin/hooks/` wrap these services for pages and mutations.

### B2B Chat API Contract (new change)

The web project now includes a documented B2B chat API contract for integrating assistant chat flows into web clients.

- **Documentation source**: `web/public/ai-as-a-service-chat-api-in-web.md`
- **Endpoint**: `POST /api/v2/Chat`
- **Authentication**: Send `Authorization: Bearer <token>`.
- **Request shape**:
  - `tasks`: array of chat messages.
  - each task includes a stable `chatId` and a user `message`.
- **Response envelope**: the API returns `success`, `message`, `errorCode`, `traceId`, and `data`.
- **Tool-oriented response**: `data.tools` contains one or more tool entries with `toolType` and typed payloads such as `TEXT`, `OTP`, `CONFIRMATION`, `LIST_OPTION`, or `CARD_VIEW`.
- **Implementation note**: when processing responses, preserve the same `chatId` for the ongoing conversation and inspect `data.tools[0].toolType` to decide how to render the reply.

### Internationalization (i18n)

Full RTL/LTR support is integrated using `i18next`.

- **Default Language:** Persian (`fa`).
- **Dynamic Direction:** `App.tsx` updates `document.documentElement.dir` and `lang` based on the active language.
- **Resources:** Translation files are located in `src/locales/`.

### UI & Styling

- **Tailwind CSS:** Used for all styling. Configured in `tailwind.config.js`.
- **Icons:** Uses `lucide-react` for a consistent iconography.
- **Global Styles:** Defined in `src/index.css` and `src/styles/`.

---

## Best Practices & Conventions

1. **Functional Components:** Always use functional components with hooks.
2. **Type Safety:** Ensure all props and state are properly typed using TypeScript.
3. **RTL Awareness:** Use Tailwind utility classes that are direction-agnostic (e.g., `ps-4` instead of `pl-4`) when possible.
4. **Service Layer:** Keep API calls in `src/api/` and use hooks in `src/admin/hooks/` to connect them to UI state.
5. **B2B API Contracts:** Preserve `traceId` for debugging, keep `chatId` stable across conversation turns, and handle tool-based responses based on `toolType`.
6. **UI Consistency:** Use existing components in `src/admin/components/ui` for common UI elements to maintain visual consistency.
