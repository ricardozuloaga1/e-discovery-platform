# Relativity Clone - E-Discovery Platform

## Overview

This repository contains a full-featured e-discovery platform that allows users to upload, review, redact, and produce documents. The application is built with a modern React frontend and Express backend, using PostgreSQL for data storage. The platform is designed to help legal professionals manage document review workflow similar to commercial e-discovery platforms like Relativity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **React**: Client-side UI framework with functional components and hooks
- **TailwindCSS**: Utility-first CSS framework for styling
- **Shadcn UI**: React component library based on Radix UI primitives
- **React Query**: Data fetching and state management library
- **Wouter**: Lightweight routing library
- **Vite**: Fast, modern frontend build tool

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework for handling HTTP requests
- **Drizzle ORM**: TypeScript-first ORM for database operations
- **Multer**: Middleware for handling file uploads
- **Zod**: Schema validation for type-safe APIs

### Database
- **PostgreSQL**: Relational database for storing application data
- **Drizzle ORM**: Used for database schema management and queries

## Key Components

### Database Schema
The application uses several tables to manage e-discovery workflow:
- **users**: Authentication and user management
- **documents**: Core document data with metadata
- **tags**: Document categorization system
- **documentTags**: Many-to-many relationship between documents and tags
- **redactions**: Tracks redacted areas in documents
- **productionSets**: Manages document productions
- **productionDocuments**: Links documents to production sets

### Frontend
1. **Page Structure**
   - Dashboard: Overview of document processing status
   - Documents: Document list and upload interface
   - Document Viewer: Review interface for individual documents
   - Redaction: Tools for redacting sensitive information
   - Export: Controls for document production
   - Settings: System configuration

2. **UI Components**
   - Document list/grid for browsing uploaded content
   - Document viewer with metadata panel
   - Redaction tools (draw, text selection, auto-detection)
   - Tag management system
   - Search functionality

3. **State Management**
   - React Query for server state
   - React hooks for local UI state
   - Custom hooks for domain-specific functionality

### Backend
1. **API Endpoints**
   - Document CRUD operations
   - Tag management
   - Redaction storage
   - Production set generation
   - File upload handling

2. **File Processing**
   - Storage of uploaded documents
   - Metadata extraction
   - OCR processing (mocked in current implementation)
   - AI-assisted summaries (mocked in current implementation)

## Data Flow

1. **Document Upload Flow**
   - User uploads document through the UI
   - File is processed by Multer middleware
   - Metadata is extracted and stored in the database
   - Document becomes available for review

2. **Document Review Flow**
   - User selects document from list
   - Document is loaded in the viewer
   - User can add tags, review content, and add redactions
   - Changes are persisted to database

3. **Production Flow**
   - User creates a production set
   - Selects documents to include
   - System applies redactions and generates production versions
   - User can export the final production

## External Dependencies

### Frontend Libraries
- Radix UI components (extensive component library)
- Lucide React for icons
- React Query for data fetching
- Embla Carousel for carousel components
- React Hook Form with Zod for form validation

### Backend Libraries
- Drizzle ORM for database operations
- Neon Database Serverless for PostgreSQL connectivity
- Multer for file upload handling
- Express for routing and API

## Deployment Strategy

The application is configured for deployment on the Replit platform:

1. **Development Mode**
   - Uses `npm run dev` command
   - Server runs with hot reloading enabled
   - Vite provides fast frontend development experience

2. **Production Mode**
   - Build step uses Vite to bundle frontend assets
   - Backend is bundled with esbuild
   - Production server runs optimized Node.js code

3. **Database**
   - PostgreSQL is provisioned as a Replit module
   - Connection is managed through DATABASE_URL environment variable

4. **Scaling**
   - Deployment target is set to "autoscale" in .replit configuration
   - Static assets are served from dist/public directory

## Getting Started

1. **Environment Setup**
   - Ensure DATABASE_URL environment variable is set
   - Run `npm install` to install dependencies

2. **Database Initialization**
   - Run `npm run db:push` to initialize the database schema

3. **Development**
   - Run `npm run dev` to start the development server
   - Access the application at the provided URL

4. **Production Build**
   - Run `npm run build` to create production bundles
   - Run `npm run start` to start the production server