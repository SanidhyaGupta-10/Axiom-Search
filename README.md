# 🔍 Axiom Search
> **Alpha-Version of Perplexity AI** — An authoritative, conversational AI research engine that delivers lightning-fast, well-cited answers by combining real-time web retrieval with high-speed LLM reasoning.

---

## 🌟 Overview

**Axiom Search** is a full-stack AI research assistant engineered for speed, accuracy, and depth. When you submit a query, Axiom:
1. **Searches the Web:** Executes an advanced web crawl via **Tavily** to gather authoritative sources.
2. **Contextualizes & Cites:** Synthesizes indexed citations (`[1]`, `[2]`) through custom prompt engineering.
3. **Streams with Groq:** Leverages **Groq's Llama 3.3 70B** on LPU hardware for instant token streaming.
4. **Persists Conversations:** Saves search sessions and multi-turn threads into **PostgreSQL** using **Prisma ORM**.
5. **Renders with Elegance:** Delivers a Perplexity-grade dark theme interface with live Markdown rendering, interactive source cards, and thread history.

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([👤 User / Browser])
    
    subgraph "Frontend Layer (Port 3000)"
        Web["🖥️ Axiom Web App<br/>(React 18 + Bun + Tailwind CSS)"]
    end

    subgraph "Auth Provider"
        SupabaseAuth["🔐 Supabase Auth<br/>(Google & GitHub OAuth)"]
    end

    subgraph "Backend API Layer (Port 3002)"
        Server["⚙️ Express API Server<br/>(Bun Runtime)"]
        AuthMiddleware["🛡️ Auth & Sync Middleware"]
    end

    subgraph "External AI & Search Services"
        Tavily["🌐 Tavily Web Search API"]
        Groq["⚡ Groq LPU (Llama 3.3 70B)"]
    end

    subgraph "Database Layer"
        Prisma["💎 Prisma ORM"]
        Postgres[("🗄️ PostgreSQL Database<br/>(Conversations & Messages)")]
    end

    User -->|Searches & Explores| Web
    Web -->|Authenticate| SupabaseAuth
    Web -->|JWT Stream Request| Server
    Server --> AuthMiddleware
    AuthMiddleware -->|Upsert User| Prisma
    Server -->|Fetch Sources| Tavily
    Server -->|Stream Prompt + Sources| Groq
    Groq -->|Streamed Tokens| Server
    Server -->|HTTP Stream| Web
    Server -->|Persist Thread & Turns| Prisma
    Prisma --> Postgres
```

---

## ⚡ Tech Stack

| Layer | Technologies & Tools | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React 18**, **TypeScript**, **Tailwind CSS v4** | Interactive Perplexity-inspired UI with custom glassmorphism and real-time streaming |
| **Bundler & Runtime** | **Bun** | Native high-speed JavaScript/TypeScript bundler, hot module reloading (HMR), and server runtime |
| **Routing & UI** | **React Router v7**, **React Markdown**, **Lucide Icons** | Client-side navigation, token-by-token Markdown rendering, and vector UI icons |
| **Backend API** | **Express 5**, **TypeScript** | High-throughput API gateway and token-streaming HTTP endpoints |
| **AI Inference** | **Groq LPU Hardware** + **Llama 3.3 70B Versatile** | Ultra-fast token generation using Vercel AI SDK (`streamText`) |
| **Web Search** | **Tavily Search API** | Real-time deep web crawl and search result extraction |
| **Database & ORM** | **Prisma ORM** + **PostgreSQL** (Supabase DB) | Relational modeling, migrations, and atomic persistence for users, conversations, and messages |
| **Authentication** | **Supabase Auth** | Multi-provider OAuth (Google & GitHub) with secure Bearer JWT verification middleware |

---

## 📦 Project Structure

```
Axiom-Search/
├── server/                   # Backend API (Express 5, Bun, Prisma, Groq, Tavily)
│   ├── prisma/
│   │   ├── migrations/       # PostgreSQL migration history
│   │   └── schema.prisma     # DB Schema (User, Conversation, Message)
│   ├── client.ts             # Supabase backend client
│   ├── db.ts                 # Prisma Client with PostgreSQL adapter
│   ├── index.ts              # Express routes & streaming endpoints
│   ├── middleware.ts         # Token verification & DB user sync
│   ├── prompt.ts             # System prompt & indexed citation formatting
│   ├── prisma.config.ts      # Prisma migration configuration
│   ├── .env                  # Server API keys & DB URLs
│   ├── package.json
│   └── README.md             # Detailed Server Documentation
│
├── web/                      # Frontend Client (React 18, Tailwind CSS, Bun)
│   ├── src/
│   │   ├── components/       # UI Component library
│   │   ├── lib/supabase/     # Supabase browser authentication
│   │   ├── pages/
│   │   │   ├── Home.tsx      # Main search interface & chat thread view
│   │   │   └── Auth.tsx      # Google / GitHub sign-in page
│   │   ├── App.tsx           # React routes
│   │   ├── config.ts         # Backend API URL config
│   │   ├── frontend.tsx      # React root DOM mount
│   │   ├── index.css         # Axiom Perplexity dark theme stylesheet
│   │   ├── index.html        # HTML5 template
│   │   └── index.ts          # Bun dev server with HMR
│   ├── styles/globals.css    # Tailwind CSS theme variables
│   ├── .env                  # Supabase public keys
│   ├── package.json
│   └── README.md             # Detailed Frontend Documentation
│
└── README.md                 # Root Documentation
```

---

## ⚡ Quickstart Guide

### Prerequisites
- [Bun](https://bun.sh/) (`v1.2+`)
- [Tavily API Key](https://tavily.com/)
- [Groq API Key](https://console.groq.com/)
- [Supabase Project](https://supabase.com/) (PostgreSQL & OAuth)

---

### 1. Clone the Repository
```bash
git clone https://github.com/SanidhyaGupta-10/Axiom-Search.git
cd Axiom-Search
```

---

### 2. Configure & Run Backend Server
```bash
cd server
bun install
```

Create `server/.env`:
```env
TAVILY_API_KEY=tvly-your_key
GROQ_API_KEY=gsk_your_key
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
SUPABSE_API_SECRET=sb_publishable_your_key
```

Run database migrations & start server:
```bash
bunx prisma migrate dev
bun run index.ts
```
> Server running at: **`http://localhost:3002`**

---

### 3. Configure & Run Web Client
Open a second terminal window:
```bash
cd web
bun install
```

Create `web/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Start the frontend:
```bash
bun run dev
```
> Web client running at: **`http://localhost:3000`**

---

## 🎯 Key Features

- **🌐 Live Web Search:** Deep web crawling via Tavily for fresh, real-time data.
- **⚡ Blazing Fast Generation:** Powered by Groq LPUs running Llama 3.3 70B Versatile.
- **📑 Inline Citations:** Clear numerical references `[1]`, `[2]` mapped to interactive source cards.
- **💬 Multi-Turn Threads:** Ask continuous follow-up questions with full contextual awareness.
- **📚 Persistent History:** All searches automatically saved and accessible from the sidebar.
- **🔒 Secure OAuth:** One-click Google and GitHub login via Supabase Auth.
- **🎨 Perplexity Aesthetics:** Crafted dark mode interface with glassmorphism, responsive layouts, and micro-animations.

---

## 📄 License

Distributed under the MIT License.
