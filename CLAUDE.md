# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SM (System Maintenance) 이력관리 시스템 - A Next.js application for managing system maintenance records with Supabase backend.

## Commands

### Development
```bash
npm run dev         # Start development server on http://localhost:3000
npm run build       # Build production application
npm run start       # Start production server
npm run lint        # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 with TailwindCSS
- **Forms**: React Hook Form
- **Database**: Supabase (PostgreSQL)
- **Scheduler**: node-cron for automated tasks
- **Date handling**: date-fns

### Key Components

1. **SM Record Management** (`src/components/SMForm.tsx`, `src/components/SMList.tsx`)
   - Form for creating/editing SM records with 32 fields
   - List view with search, sort, and Excel export functionality
   - Auto-generation of Task Numbers based on category

2. **File Management** (`src/components/FileManager.tsx`)
   - File upload/download using Supabase Storage
   - Document versioning support

3. **Scheduler System** (`src/components/SchedulerManager.tsx`, `src/lib/scheduler.ts`)
   - Cron-based task scheduling
   - Templates for common SM activities
   - API endpoints for manual triggers

4. **Context & State** (`src/context/SMContext.tsx`)
   - Global state management for SM records
   - Local storage fallback when Supabase is not configured

### Database Schema

Main table: `sm_records` with 32 columns representing SM activity fields:
- Categories: 대시보드, PLAN, 기타
- Auto-generated fields: year, targetMonth (from receiptDate)
- Task numbering: category-based sequential numbering

### API Routes

- `/api/scheduler` - Manual scheduler trigger
- `/api/scheduler/daily` - Daily automated tasks
- `/api/scheduler/dashboard` - Dashboard-specific tasks
- `/api/scheduler/uplan` - UPLAN-specific tasks
- `/api/files/*` - File management endpoints

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Important Patterns

1. **Supabase Integration**: The app uses direct REST API calls to Supabase (see `src/lib/supabase.ts`) with fallback to local storage when not configured.

2. **Field Mapping**: TypeScript interfaces use camelCase (`taskNo`) but database columns use lowercase (`taskno`). Conversion happens in `convertSMRecordToRecord()`.

3. **Date Handling**: Dates are stored as strings in YYYY-MM-DD format. Auto-calculation of year/month from receipt date.

4. **Task Number Generation**: Format is `{category}-{YYYY}-{sequential_number}` (e.g., "대시보드-2024-001").

5. **Webpack Configuration**: Custom fallbacks for Node.js modules in browser environment (see `next.config.ts`).