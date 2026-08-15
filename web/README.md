# 🌐 Axiom Search — Web Client

The frontend client for **Axiom Search** — an AI-powered conversational search engine inspired by Perplexity AI, built for high performance and visual elegance.

---

## 🚀 Tech Stack

- **Runtime & Bundler:** [Bun](https://bun.sh/) (Fast native bundler & dev server)
- **Framework:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + Custom Glassmorphism & Micro-animations
- **Authentication:** [@supabase/ssr](https://supabase.com/docs/guides/auth) (OAuth with Google & GitHub)
- **Markdown & Code:** [react-markdown](https://github.com/remarkjs/react-markdown) for streaming response rendering
- **Networking:** [Axios](https://axios-http.com/) & Fetch API (ReadableStream for real-time tokens)

---

## 📁 Folder Structure

```
web/
├── src/
│   ├── components/       # Reusable UI component library (buttons, inputs, cards)
│   ├── lib/
│   │   └── supabase/     # Supabase browser authentication client
│   ├── pages/
│   │   ├── Home.tsx      # Main Perplexity-style search interface & multi-turn thread view
│   │   └── Auth.tsx      # Clean OAuth authentication screen (Google & GitHub)
│   ├── App.tsx           # Application route definitions
│   ├── config.ts         # Backend API URL configuration
│   ├── frontend.tsx      # React root rendering entry point
│   ├── index.css         # Global stylesheet & Perplexity dark-theme tokens
│   ├── index.html        # HTML5 template with Inter typography
│   ├── index.ts          # Bun static file & HMR development server
│   └── logo.svg          # Axiom vector brand emblem
├── styles/
│   └── globals.css       # Tailwind CSS theme variables & utility classes
├── .env                  # Supabase public project keys
├── package.json          # Web dependencies & scripts
└── tsconfig.json         # TypeScript compiler configurations
```

---

## ✨ Features & Functionalities

1. **⚡ Real-Time Progressive Streaming**
   - Streams answers token-by-token directly from Groq's Llama 3.3 70B model with a typing shimmer indicator.
   - Live Markdown rendering with headers, lists, blockquotes, and syntax-styled code snippets.

2. **🌐 Interactive Sources Carousel**
   - Displays real-time web citations fetched via Tavily.
   - Cards include domain names, page titles, and clickable index badges (`[1]`, `[2]`).

3. **💬 Multi-Turn Conversation Threading**
   - Pinned follow-up bar at the bottom allows you to drill down into queries with full context retention.

4. **📚 Persistent Search History Sidebar**
   - Automatically saves each search session to your PostgreSQL database.
   - View past searches, reload previous chat threads, or delete unwanted sessions with one click.

5. **🔒 OAuth Authentication**
   - Seamless sign-in with Google and GitHub using Supabase Auth.
   - User profile dropdown with session management and avatar badges.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Configure Environment
Verify `.env` contains your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### 3. Run Development Server
```bash
bun run dev
```
Open **`http://localhost:3000`** in your browser.
