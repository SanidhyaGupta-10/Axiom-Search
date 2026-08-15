import { createClient } from "@/lib/supabase/client"
import { BACKEND_URL } from "@/config"
import type { User } from "@supabase/supabase-js"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router"
import Markdown from "react-markdown"
import axios from "axios"

const supabase = createClient()

// ─── Types ───
interface Source { title: string; url: string; content: string }
interface SearchResult { query: string; answer: string; sources: Source[] }

// ─── Icons ───
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
)
const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
)
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)
const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
)
const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
)
const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
)

// ─── Helpers ───
function getDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

const SUGGESTIONS = [
  "What is quantum computing?",
  "Best resources to learn Rust",
  "How does GraphQL differ from REST?",
  "Explain blockchain in simple terms",
]

// ─── Component ───
export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const answerRef = useRef<HTMLDivElement>(null)

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  // Get JWT for API calls
  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  // Main search
  async function handleSearch(searchQuery?: string) {
    const q = (searchQuery || query).trim()
    if (!q || isSearching) return

    setQuery(q)
    setIsSearching(true)
    setIsStreaming(true)
    setResult({ query: q, answer: "", sources: [] })

    try {
      const token = await getToken()
      const response = await fetch(`${BACKEND_URL}/perplexity-ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: q })
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk

          // Check if we've hit the sources delimiter
          const sourcesIdx = fullText.indexOf("\n------SOURCES-------\n")
          if (sourcesIdx === -1) {
            setResult(prev => prev ? { ...prev, answer: fullText } : null)
          }

          // Auto-scroll
          if (answerRef.current) {
            answerRef.current.scrollTop = answerRef.current.scrollHeight
          }
        }
      }

      // Parse sources from the end of the stream
      const sourcesIdx = fullText.indexOf("\n------SOURCES-------\n")
      let answer = fullText
      let sources: Source[] = []

      if (sourcesIdx !== -1) {
        answer = fullText.substring(0, sourcesIdx)
        const sourcesRaw = fullText.substring(sourcesIdx + "\n------SOURCES-------\n".length)
        // Sources are JSON-stringified URLs
        const urls = sourcesRaw.match(/"[^"]+"/g) || []
        sources = urls.map((u, i) => ({
          title: `Source ${i + 1}`,
          url: JSON.parse(u),
          content: ""
        }))
      }

      setResult({ query: q, answer, sources })
    } catch (err) {
      console.error("Search error:", err)
      setResult(prev => prev ? { ...prev, answer: "Something went wrong. Please try again." } : null)
    } finally {
      setIsSearching(false)
      setIsStreaming(false)
      setQuery("")
    }
  }

  function handleNewSearch() {
    setResult(null)
    setQuery("")
  }

  // ─── Render ───
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <SparkleIcon /> Axiom
          </div>
        </div>

        <button className="new-chat-btn" onClick={handleNewSearch}>
          <PlusIcon /> New Search
        </button>

        <div className="sidebar-section">Recent</div>
        <div className="sidebar-threads">
          {result && (
            <div className="thread-item active">
              <ChatIcon />
              <span>{result.query}</span>
            </div>
          )}
          {!result && (
            <div className="thread-item" style={{ color: '#444', cursor: 'default' }}>
              No searches yet
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          {user ? (
            <div className="user-pill">
              <div className="user-avatar">
                {(user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
              </div>
              <span className="user-name">
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </span>
              <button className="logout-btn" onClick={() => {
                supabase.auth.signOut()
                setUser(null)
              }}>
                Sign out
              </button>
            </div>
          ) : (
            <button className="new-chat-btn" onClick={() => navigate("/auth")}>
              Sign in
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {!result ? (
          /* ── Welcome / Home ── */
          <div className="home-container">
            <div className="home-brand">
              <h1>Axiom Search</h1>
              <p>AI-powered answers from the web — instantly.</p>
            </div>

            <div className="home-search">
              <div className="search-container">
                <div className="search-input-wrapper">
                  <input
                    className="search-input"
                    placeholder="Ask anything..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    autoFocus
                  />
                  <button
                    className="search-submit"
                    onClick={() => handleSearch()}
                    disabled={!query.trim() || isSearching}
                  >
                    <ArrowIcon />
                  </button>
                </div>
              </div>
            </div>

            <div className="suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="suggestion-chip" onClick={() => { setQuery(s); handleSearch(s) }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Answer View ── */
          <>
            <div className="answer-container" ref={answerRef}>
              <h2 className="answer-query">{result.query}</h2>

              {/* Sources */}
              {result.sources.length > 0 && (
                <div className="sources-section">
                  <div className="sources-label">
                    <GlobeIcon /> Sources
                  </div>
                  <div className="sources-grid">
                    {result.sources.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener" className="source-card">
                        <div className="source-card-domain">{getDomain(s.url)}</div>
                        <div className="source-card-title">{s.title || getDomain(s.url)}</div>
                        <div className="source-card-index">{i + 1}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer */}
              <div className="answer-section">
                <div className="answer-label">
                  <SparkleIcon /> Answer
                </div>
                <div className={`answer-body ${isStreaming ? 'streaming-cursor' : ''}`}>
                  {isSearching && !result.answer ? (
                    <div className="loading-dots">
                      <span /><span /><span />
                    </div>
                  ) : (
                    <Markdown>{result.answer}</Markdown>
                  )}
                </div>
              </div>
            </div>

            {/* Follow-up bar */}
            <div className="followup-bar">
              <div className="search-container">
                <div className="search-input-wrapper">
                  <input
                    className="search-input"
                    placeholder="Ask a follow-up..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                  />
                  <button
                    className="search-submit"
                    onClick={() => handleSearch()}
                    disabled={!query.trim() || isSearching}
                  >
                    <ArrowIcon />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
