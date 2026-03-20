# Receipt Generator Application

## Overview

A full-stack receipt generation application for a cable network business. Users can input receipt details, preview a professionally styled receipt, and download/share it as PDF or image. The application is built with React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Hook Form for form handling
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Build Tool**: Vite with hot module replacement

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/`
- Reusable components in `client/src/components/`
- Custom hooks in `client/src/hooks/`
- Shared utilities in `client/src/lib/`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Development**: Vite middleware integration for HMR during development

The server uses a storage abstraction pattern (`IStorage` interface) allowing easy swapping of storage implementations.

### Data Layer
- **Database**: PostgreSQL
- **Schema Definition**: Drizzle schema in `shared/schema.ts`
- **Migrations**: Drizzle Kit with `db:push` command
- **Validation**: Zod schemas generated from Drizzle schema using `drizzle-zod`

### Key Design Patterns
- **Shared Types**: Common types and schemas in `shared/` directory used by both frontend and backend
- **Type-safe API**: Route definitions with input/output schemas in `shared/routes.ts`
- **Path Aliases**: `@/` for client source, `@shared/` for shared modules

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **pg**: Node.js PostgreSQL client
- **connect-pg-simple**: PostgreSQL session store (available for session management)

### Document Generation
- **html2canvas**: Captures DOM elements as images for receipt export
- **jsPDF**: Generates PDF files from captured receipt images

### UI Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, toast, etc.)
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities
- **class-variance-authority**: Component variant management
- **tailwind-merge/clsx**: CSS class utilities

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Backend bundling for production
- **Drizzle Kit**: Database migration tooling
- **TypeScript**: Full type safety across the stack