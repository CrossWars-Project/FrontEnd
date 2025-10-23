# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Frontend

## Set Up instructions

### Prerequisits
- Node.JS
    -  node -v
    - npm -v
- Backend running locally (to check connection)
### 1. Clone Repo
### 2. Install dependencies
- install react, vite, and other packages
- install react icons 
>> npm install
### 3. Set up environement 
- change .env.example to just .env
- in your .env file you should have exactly: 
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://byhqkcehtdbknddgzzto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aHFrY2VodGRia25kZGd6enRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzMyOTEsImV4cCI6MjA3NTcwOTI5MX0.GcRx9x9lNTdLpS-Q0dsDpG4YucP6UcfpzckigpFPSbc
- if necessary replace http://127.0.0.1:8000 to whatever your backend port is 
### 4. Start Development server
>> npm run dev
