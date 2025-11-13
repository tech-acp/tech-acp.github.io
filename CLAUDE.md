# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React + Vite application with Tailwind CSS v4 and shadcn/ui components. The project uses TypeScript (TSX) for all React components.

## Commands

- **Development server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Preview production build**: `npm run preview`

## Architecture & Structure

### Tech Stack
- **Build tool**: Vite 7 with HMR
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite` plugin
- **Component library**: shadcn/ui (New York style)
- **Icons**: lucide-react
- **TypeScript**: Fully configured with strict mode enabled; all components are `.tsx`

### Path Aliases
Configured in both `tsconfig.json` and `components.json`:
- `@/*` → `./src/*`
- `@/components` → components directory
- `@/lib` → utility functions
- `@/hooks` → custom hooks

### File Organization
- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `src/lib/utils.ts` - Utility functions (includes `cn()` for className merging with clsx + tailwind-merge)
- `src/index.css` - Global styles and Tailwind imports
- `components.json` - shadcn/ui configuration

### shadcn/ui Configuration
- Style: New York
- Base color: neutral
- CSS variables enabled
- Icon library: lucide
- No RSC (React Server Components)
- TSX for all components

### Styling Approach
- Tailwind CSS v4 (latest) with Vite plugin integration
- CSS variables for theming
- Use the `cn()` utility from `@/lib/utils` for conditional className merging

### Linting
ESLint configured for TypeScript with:
- TypeScript ESLint parser and plugin
- React Hooks rules (recommended-latest)
- React Refresh for Vite
- Custom rule: unused vars allowed if they match `^[A-Z_]` pattern
- Le code de @supabase/functions/sync-brevets/index.ts doit toujours être tenu à jour