---
name: landing-page-skill
description: Documents the architecture, component structure, styling conventions, data flow, and development practices for the Pishkar landing page, a Next.js application. Use this skill when working on the landing page UI, features, or understanding its overall structure.
disable-model-invocation: false
---

## Pishkar Landing Page Skill

This skill provides comprehensive knowledge about the `landing` directory, which hosts the Pishkar landing page — a Next.js application built with React and TypeScript.

### 1. High-Level Architecture

The landing page follows a component-based architecture typical of Next.js applications using the App Router. It is structured around pages (`app/`) and reusable components (`components/`).

### 2. Key Directories and Their Responsibilities

- `app/`: Contains the route segments and UI for the application. Each folder within `app/` represents a route. `page.tsx` defines the UI for a route, and `layout.tsx` defines the UI that is shared across multiple routes.
  - `app/layout.tsx`: Root layout for the entire application.
  - `app/page.tsx`: The main landing page.
  - `app/[feature]/page.tsx`: Individual feature pages (e.g., `about/page.tsx`, `blog/page.tsx`).
- `components/`: Houses all reusable UI components. This directory is further organized by logical sections of the landing page (e.g., `Header/`, `Footer/`, `Hero/`, `Blog/`, `About/`).
  - `components/Common/`: Contains common UI elements like `Breadcrumb`, `ScrollUp`, `SectionTitle`.
  - `components/Blog/blogData.tsx`: Data for blog posts.
  - `components/Brands/brandsData.tsx`: Data for brand logos.
  - `components/Features/featuresData.tsx`: Data for features.
  - `components/Header/menuData.tsx`: Data for the navigation menu.
- `public/`: Stores static assets such as images (`public/images/`) and fonts (`public/fonts/`).
- `styles/`: Contains global CSS styles, primarily `index.css` which integrates Tailwind CSS.
- `types/`: Defines TypeScript interfaces and types used throughout the application, ensuring strong typing and better code maintainability.
  - `types/blog.ts`, `types/brand.ts`, `types/feature.ts`, `types/menu.ts`, `types/testimonial.ts`: Type definitions for various data structures.
- `next.config.js`: Next.js configuration.
- `tailwind.config.js`, `postcss.config.js`: Tailwind CSS and PostCSS configuration files.

### 3. UI and Feature Development

- **Components**: New UI elements should be developed as reusable React components and placed in the appropriate subdirectory within `components/`. Follow existing naming conventions and component structure.
- **Pages**: New routes/pages should be created under the `app/` directory, adhering to the Next.js App Router conventions.
- **Styling**: Tailwind CSS is used for styling. Utility classes should be preferred. Custom styles can be added to `styles/index.css` if necessary, following Tailwind's `@apply` directives.
- **Data Flow**: Data can be fetched on the server (Server Components) or on the client (Client Components using hooks like `useEffect` or data fetching libraries). Static data used by components is often defined directly within the `components/` subdirectories (e.g., `blogData.tsx`).

### 4. Navigation

Next.js's file-system based routing is used. Navigation links are typically handled using the `next/link` component.

### 5. Development Conventions

- **TypeScript**: All new code should be written in TypeScript, leveraging interfaces and types defined in the `types/` directory.
- **Code Structure**: Keep components small, focused, and reusable. Separate concerns by placing data, types, and components in their respective files and directories.
- **Accessibility**: Ensure all UI components are built with accessibility in mind.

### 6. Integration with other parts of the project

This `landing` project is a standalone Next.js application. While it shares the overall `pishkar` repository, its primary interaction is with its own internal components and potentially external APIs for dynamic content. It does not directly interact with the `mobile` or `server` projects within this monorepo unless specific API routes are implemented for such interactions.
