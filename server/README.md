# ⚙️ Axiom Search — Backend Server

The high-performance API server powering **Axiom Search**. It orchestrates real-time web search with Tavily, high-speed LLM generation with Groq, and user & conversation persistence with Prisma ORM on PostgreSQL.

---

## 🚀 Tech Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [Express 5](https://expressjs.com/)
- **ORM & Database:** [Prisma ORM](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/) (Supabase DB)
- **AI & LLM Provider:** [Vercel AI SDK](https://sdk.vercel.ai/) (`streamText`) + [Groq](https://groq.com/) (`llama-3.3-70b-versatile`)
- **Search Engine:** [Tavily Search API](https://tavily.com/) (Advanced search depth)
- **Authentication:** [Supabase Auth](https://supabase.com/docs/guides/auth) + Custom Express Token Middleware

---

## 📁 Folder Structure

```
server/
├── prisma/
│   ├── migrations/       # SQL migration history files
│   ├── generated/        # Generated Prisma Client types
│   └── schema.prisma     # Database schema models (User, Conversation, Message)
├── client.ts             # Supabase backend client initialization
├── db.ts                 # Prisma Client with PostgreSQL adapter
├── index.ts              # Express routes, streaming endpoints & server boot
├── middleware.ts         # Token verification & automatic User DB syncing
├── prompt.ts             # System prompt & indexed web citation templates
├── prisma.config.ts      # Prisma v6/v7 migration configuration
├── .env                  # Secrets (Tavily, Groq, Supabase & Database URLs)
└── package.json          # Server dependencies & scripts
```

---

## 🔌 API Endpoints

All endpoints are secured by `middleware.ts` requiring a valid `Authorization: Bearer <jwt>` header.

### 1. `POST /perplexity-ask`
Performs an AI-powered live web search and streams the answer back.
- **Request Body:** `{ "query": "What are the latest developments in quantum computing?" }`
- **Workflow:**
  1. Searches web using Tavily for high-relevance sources.
  2. Synthesizes indexed citations (`[1]`, `[2]`).
  3. Streams Llama 3.3 70B response tokens via HTTP stream.
  4. Automatically creates a `Conversation` record in PostgreSQL.
  5. Atomically saves `USER` and `ASSISTANT` messages to the database.
  6. Appends structured source metadata at the end of the stream.

### 2. `POST /perplexity_ask/follow_up`
Continues an existing conversation thread with multi-turn memory.
- **Request Body:** `{ "conversationId": "...", "query": "How does this compare to classical supercomputers?" }`
- **Workflow:** Loads past messages from DB, forwards conversation history to Groq, streams response, and persists the new turn.

### 3. `GET /conversations`
Retrieves all search history threads for the authenticated user, ordered chronologically.

### 4. `GET /conversations/:conversationId`
Fetches a specific conversation including all historical messages and citations.

### 5. `DELETE /conversations/:conversationId`
Deletes a search conversation and cascades removal of its associated messages.

---

## 🗄️ Database Schema

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  provider      AuthProvider
  supabaseId    String
  name          String
  conversations Conversation[]
}

model Conversation {
  id        String      @id @default(uuid())
  title     String
  slug      String
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  Message[]
}

model Message {
  id             Int          @id @default(autoincrement())
  content        String
  role           MessageRole
  createdAt      DateTime     @default(now())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Configure Environment Variables
Create a `.env` file in `server/`:
```env
TAVILY_API_KEY=tvly-xxx
GROQ_API_KEY=gsk_xxx
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
SUPABSE_API_SECRET=sb_publishable_xxx
```

### 3. Apply Migrations & Generate Prisma Client
```bash
bunx prisma migrate dev
bunx prisma generate
```

### 4. Run the Server
```bash
bun run index.ts
```
The server will start on **`http://localhost:3002`**.
