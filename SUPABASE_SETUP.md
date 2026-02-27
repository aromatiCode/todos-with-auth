# Supabase Setup Guide

This guide will help you set up Supabase for your todo app with Edge Functions.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js 18+ installed
3. Supabase CLI installed (`npm install -g supabase`)

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter your project details:
   - **Name**: `todo-app` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select a region close to you
4. Click "Create new project"
5. Wait for the project to be provisioned (may take a minute)

## Step 2: Get Your Credentials

1. Go to **Project Settings** (gear icon) → **API**
2. Copy the following values:
   - **Project URL**: e.g., `https://xyzabc123.supabase.co`
   - **anon public** key (under "Project API keys")

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_EDGE_FUNCTION_URL=https://your-project.supabase.co/functions/v1
   ```

## Step 4: Set Up the Database

1. Open the Supabase SQL Editor (in your project dashboard)
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL script

This will create:
- The `todos` table
- Row Level Security (RLS) policies
- Helper functions for CRUD operations

## Step 5: Deploy the Edge Function

1. Initialize Supabase in your project (if not already done):
   ```bash
   cd todo-app
   supabase init
   ```

2. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (You can find the project ref in your Supabase dashboard URL)

3. Deploy the Edge Function:
   ```bash
   supabase functions deploy todos
   ```

## Step 6: Install Dependencies

```bash
npm install
```

## Step 7: Run the App

```bash
npm start
```

## Troubleshooting

### Edge Function Not Found
- Make sure you've deployed the function: `supabase functions deploy todos`
- Verify the `VITE_EDGE_FUNCTION_URL` in your `.env` file matches your Supabase project URL

### Authentication Issues
- Make sure you've configured your `.env` file with valid credentials
- Check the browser console for specific error messages
- Verify email confirmation (if enabled in Supabase)

### CORS Errors
- The Edge Function includes CORS headers for localhost
- For production, update the `corsHeaders` in the Edge Function

## Project Structure After Migration

```
todo-app/
├── supabase/
│   ├── functions/
│   │   └── todos/
│   │       └── index.ts      # Edge Function for todos CRUD
│   └── schema.sql            # Database schema
├── src/
│   ├── lib/
│   │   ├── supabase.js       # Supabase client config
│   │   └── todosApi.js       # API functions for todos
│   ├── context/
│   │   └── AuthContext.js    # Updated for Supabase Auth
│   └── pages/
│       └── Todos/
│           └── Todos.jsx     # Updated to use Edge Functions
├── .env.example
└── SUPABASE_SETUP.md         # This file
```

## Features Implemented

### Authentication
- Email/password registration with Supabase Auth
- Email/password login
- Session persistence
- Secure password hashing (handled by Supabase)

### Todos API (Edge Functions)
- **GET /todos** - Fetch all todos for authenticated user
- **POST /todos** - Create a new todo
- **PUT /todos/:id** - Update a todo
- **DELETE /todos/:id** - Delete a todo

### Security
- Row Level Security (RLS) ensures users can only access their own data
- JWT tokens for API authentication
- Service role key only used server-side in Edge Functions

## Supabase Console

You can manage your project from the Supabase Dashboard:
- **Table Editor**: View and manage database tables
- **Authentication**: Configure auth settings
- **Edge Functions**: Deploy and manage functions
- **Settings**: API keys, environment variables, etc.
