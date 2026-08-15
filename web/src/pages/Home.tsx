import { createClient } from "@/lib/supabase/client"
import { BACKEND_URL } from "@/config"
import type { User } from "@supabase/supabase-js"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router"
import Markdown from "react-markdown"
import axios from "axios"

const supabase = createClient()

// ─── Types ───
interface Source {
  id: number
  title: string
  url: string
  content?: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: Source[]
}

interface ConversationItem {
  id: string
  title: string
  createdAt?: string
}

// ─── Dragon + Axiom Medallion SVG ───
const AxiomEmblem = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="medallionRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="20%" stopColor="#cbd5e1" />
        <stop offset="45%" stopColor="#475569" />
        <stop offset="65%" stopColor="#1e293b" />
        <stop offset="85%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>

      <linearGradient id="dragonChrome" x1="15%" y1="10%" x2="85%" y2="90%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="25%" stopColor="#cbd5e1" />
        <stop offset="50%" stopColor="#334155" />
        <stop offset="75%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#090a0f" />
      </linearGradient>

      <linearGradient id="axiomCore" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#94a3b8" />
        <stop offset="70%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>

      <radialGradient id="darkPlate" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1e293b" stopOpacity="0.6" />
        <stop offset="60%" stopColor="#090a0f" />
        <stop offset="100%" stopColor="#030712" />
      </radialGradient>

      <filter id="metalRelief" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.9" />
      </filter>
    </defs>

    {/* Circular Medallion Base */}
    <circle cx="50" cy="50" r="47" fill="url(#darkPlate)" stroke="url(#medallionRim)" strokeWidth="2" />
    <circle cx="50" cy="50" r="43" stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />

    {/* Coiled Dragon Wings & Serpent Flanks */}
    <g filter="url(#metalRelief)" fill="url(#dragonChrome)" stroke="url(#medallionRim)" strokeWidth="0.6" strokeLinejoin="round">
      <path d="M50 14 C46 14, 42 16, 40 19 C38 22, 39 25, 43 26 C46 27, 49 25, 52 24 C56 22, 60 21, 64 24 C68 27, 69 32, 67 36 C64 41, 58 43, 53 43 C49 43, 44 41, 41 37 C39 34, 40 31, 42 29 C39 30, 36 33, 35 37 C33 43, 37 50, 43 53 C49 55, 56 54, 62 50 C68 45, 72 37, 70 29 C68 20, 59 14, 50 14 Z" />
      <path d="M40 19 L34 16 L31 18 L34 20 L37 20 L33 23 L36 24 L41 22 Z" />
      <path d="M34 16 L29 11 L32 14 L30 8 L35 13 L37 10 L38 15 Z" />
      <path d="M35 37 C30 35, 23 37, 18 42 C14 46, 12 52, 13 58 C15 64, 20 69, 26 71 C22 66, 21 60, 23 54 C25 48, 29 44, 35 43 Z" />
      <path d="M67 36 C73 34, 80 37, 84 42 C88 47, 89 54, 87 60 C84 66, 79 70, 72 72 C77 67, 78 61, 76 54 C74 48, 70 43, 64 42 Z" />
      <path d="M26 71 C32 75, 40 77, 48 76 C56 75, 64 71, 69 65 C74 59, 75 51, 72 44 C70 48, 66 54, 61 58 C55 62, 47 64, 40 62 C34 60, 29 55, 27 49 C25 57, 25 65, 26 71 Z" />
    </g>

    {/* Central Axiom Delta "A" Peak */}
    <g filter="url(#metalRelief)">
      <path
        d="M50 24 L68 68 H58 L53.5 57 H46.5 L42 68 H32 L50 24 Z"
        fill="url(#axiomCore)"
        stroke="url(#medallionRim)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <polygon points="50,37 56,51 44,51" fill="#030712" stroke="url(#medallionRim)" strokeWidth="1.2" />
      <polygon points="50,21 52.5,25 50,29 47.5,25" fill="#ffffff" stroke="#0f172a" strokeWidth="0.6" />
      <circle cx="50" cy="46" r="2" fill="#f8fafc" stroke="#334155" strokeWidth="0.8" />
    </g>

    {/* Cardinal Points */}
    <g stroke="url(#medallionRim)" strokeWidth="1.5" strokeLinecap="round">
      <line x1="50" y1="2" x2="50" y2="6" />
      <line x1="50" y1="94" x2="50" y2="98" />
      <line x1="2" y1="50" x2="6" y2="50" />
      <line x1="94" y1="50" x2="98" y2="50" />
    </g>
  </svg>
)

const SparkleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
)
const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
)
const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
)
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
)
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
)
const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
)
const HistoryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
)

const PanelLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
)

// ─── Helpers ───
function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

const SUGGESTIONS = [
  "What are the best resources to learn Rust programming?",
  "How does Groq LPU architecture differ from Nvidia GPUs?",
  "Explain quantum entanglement like I'm 15",
  "Compare Bun vs Node.js vs Deno in 2026",
]

// ─── Available AI Models ───
const AVAILABLE_MODELS = [
  { id: "groq/llama-3.3-70b", name: "Groq Llama 3.3 70B", provider: "groq", model: "llama-3.3-70b-versatile", badge: "⚡ Fast" },
  { id: "openrouter/deepseek-r1", name: "DeepSeek R1", provider: "openrouter", model: "deepseek/deepseek-r1:free", badge: "🧠 Reasoning" },
  { id: "openrouter/gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "openrouter", model: "google/gemini-2.0-flash-exp:free", badge: "✨ Smart" },
  { id: "openrouter/llama-3.3", name: "Llama 3.3 Free", provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free", badge: "🦙 Open" },
] as const

export default function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string>("groq/llama-3.3-70b")

  // Current chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchStatus, setSearchStatus] = useState<string>("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"answer" | "sources">("answer")

  const currentModelConfig = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0]

  const answerScrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check auth & load conversations
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadConversations()
    })
  }, [])

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [query])

  // Get Supabase JWT
  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  // Load history list from backend
  async function loadConversations() {
    try {
      const token = await getToken()
      if (!token) return
      const res = await axios.get(`${BACKEND_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data?.conversations) {
        setConversations(res.data.conversations)
      }
    } catch (err) {
      console.error("Failed to load conversations:", err)
    }
  }

  // Load a single past conversation
  async function openConversation(convId: string) {
    try {
      const token = await getToken()
      const res = await axios.get(`${BACKEND_URL}/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data?.conversation) {
        const conv = res.data.conversation
        setCurrentConversationId(conv.id)
        setMessages(
          conv.messages.map((m: any) => ({
            role: m.role.toLowerCase() === "user" ? "user" : "assistant",
            content: m.content
          }))
        )
      }
    } catch (err) {
      console.error("Failed to load conversation details:", err)
    }
  }

  // Reset to empty home screen
  function handleNewSearch() {
    setCurrentConversationId(null)
    setMessages([])
    setQuery("")
    setIsSearching(false)
  }

  // Trigger search
  async function handleSearch(overrideQuery?: string) {
    const q = (overrideQuery || query).trim()
    if (!q || isSearching) return

    if (!user) {
      navigate("/auth")
      return
    }

    setQuery("")
    setIsSearching(true)
    setSearchStatus(`Searching the web via ${currentModelConfig.name}...`)

    // Add user message to state
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: q },
      { role: "assistant", content: "", sources: [] }
    ]
    setMessages(newMessages)

    try {
      const token = await getToken()
      let streamUrl = `${BACKEND_URL}/perplexity-ask`
      let bodyData: any = {
        query: q,
        provider: currentModelConfig.provider,
        model: currentModelConfig.model
      }

      // If follow-up in existing conversation
      if (currentConversationId) {
        streamUrl = `${BACKEND_URL}/perplexity_ask/follow_up`
        bodyData = {
          conversationId: currentConversationId,
          query: q,
          provider: currentModelConfig.provider,
          model: currentModelConfig.model
        }
      }

      setSearchStatus(`Synthesizing answer with ${currentModelConfig.name}...`)

      const response = await fetch(streamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let rawStreamText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          rawStreamText += chunk

          // Check for sources separator
          const separator = "\n------SOURCES-------\n"
          const sepIdx = rawStreamText.indexOf(separator)

          let currentAnswer = rawStreamText
          let parsedSources: Source[] = []

          if (sepIdx !== -1) {
            currentAnswer = rawStreamText.substring(0, sepIdx)
            const rawData = rawStreamText.substring(sepIdx + separator.length).trim()
            try {
              const parsed = JSON.parse(rawData)
              if (Array.isArray(parsed)) {
                parsedSources = parsed
              } else if (parsed && parsed.sources) {
                parsedSources = parsed.sources
                if (parsed.conversationId && !currentConversationId) {
                  setCurrentConversationId(parsed.conversationId)
                }
              }
            } catch {
              // Sources may still be streaming
            }
          }

          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last) {
              last.content = currentAnswer
              if (parsedSources.length > 0) {
                last.sources = parsedSources
              }
            }
            return updated
          })

          // Auto-scroll
          if (answerScrollRef.current) {
            answerScrollRef.current.scrollTop = answerScrollRef.current.scrollHeight
          }
        }
      }

      // Refresh sidebar history immediately
      await loadConversations()
    } catch (err: any) {
      console.error("Search error:", err)
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last) {
          last.content = `❌ Error: ${err.message || "Failed to get response. Please try again."}`
        }
        return updated
      })
    } finally {
      setIsSearching(false)
      setSearchStatus("")
    }
  }

  // Delete conversation from sidebar
  async function deleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      const token = await getToken()
      await axios.delete(`${BACKEND_URL}/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (currentConversationId === convId) {
        handleNewSearch()
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err)
    }
  }

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Get current assistant message's sources
  const currentSources = messages.filter(m => m.role === "assistant").flatMap(m => m.sources || [])

  return (
    <div className="axiom-app">
      {/* ── Sidebar ── */}
      <aside className={`axiom-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-top">
          <div className="brand-header">
            <div className="brand-badge">
              <AxiomEmblem className="w-5 h-5" />
              <span className="brand-title">Axiom</span>
              <span className="alpha-tag">ALPHA</span>
            </div>
            <button className="icon-btn" onClick={() => setSidebarOpen(false)} title="Collapse sidebar">
              <PanelLeftIcon />
            </button>
          </div>

          <button className="new-thread-btn" onClick={handleNewSearch}>
            <PlusIcon />
            <span>New Search</span>
            <kbd className="kbd-shortcut">⌘K</kbd>
          </button>
        </div>

        <div className="sidebar-section-title">
          <HistoryIcon />
          <span>Recent Searches</span>
        </div>

        <div className="threads-scroll">
          {conversations.length === 0 ? (
            <div className="empty-threads">
              <span>No search history yet</span>
            </div>
          ) : (
            conversations.map(c => (
              <div
                key={c.id}
                className={`thread-item-wrapper ${currentConversationId === c.id ? "active" : ""}`}
                onClick={() => openConversation(c.id)}
              >
                <span className="thread-title">{c.title}</span>
                <button
                  className="delete-thread-btn"
                  title="Delete search"
                  onClick={(e) => deleteConversation(c.id, e)}
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-bottom">
          {user ? (
            <div className="user-profile-row">
              <div className="user-avatar-circle">
                {(user.user_metadata?.full_name?.[0] || user.email?.[0] || "A").toUpperCase()}
              </div>
              <div className="user-info-text">
                <span className="user-display-name">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
                <span className="user-email-sub">{user.email}</span>
              </div>
              <button
                className="signout-btn"
                title="Sign out"
                onClick={() => {
                  supabase.auth.signOut()
                  setUser(null)
                  setConversations([])
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button className="signin-prompt-btn" onClick={() => navigate("/auth")}>
              Sign In to save history
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="axiom-main">
        {/* Top Navbar */}
        <header className="axiom-topbar">
          <div className="topbar-left">
            {!sidebarOpen && (
              <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Expand sidebar">
                <PanelLeftIcon />
              </button>
            )}
            {messages.length > 0 && (
              <div className="topbar-tabs">
                <button
                  className={`tab-btn ${activeTab === "answer" ? "active" : ""}`}
                  onClick={() => setActiveTab("answer")}
                >
                  <SparkleIcon />
                  <span>Answer</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === "sources" ? "active" : ""}`}
                  onClick={() => setActiveTab("sources")}
                >
                  <GlobeIcon />
                  <span>Sources</span>
                  {currentSources.length > 0 && (
                    <span className="tab-count-badge">{currentSources.length}</span>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="topbar-right">
            <button className="topbar-action-btn" onClick={() => handleCopy(window.location.href, -1)}>
              <ShareIcon />
              <span>Share</span>
            </button>
          </div>
        </header>

        {/* ── Content View ── */}
        <div className="axiom-content-container" ref={answerScrollRef}>
          {messages.length === 0 ? (
            /* ── Hero Home Screen ── */
            <div className="hero-landing">
              <div className="hero-brand-group">
                <div className="hero-logo-halo">
                  <AxiomEmblem className="w-12 h-12" />
                </div>
                <h1 className="hero-heading">Where Knowledge Begins</h1>
                <p className="hero-subtext">Axiom Search · Alpha-Version of Perplexity AI</p>
              </div>

              {/* Big Hero Search Box */}
              <div className="hero-search-box">
                <textarea
                  ref={textareaRef}
                  className="hero-textarea"
                  placeholder="Ask anything... (Search web, code, research)"
                  rows={1}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                  autoFocus
                />
                <div className="hero-box-footer">
                  <div className="box-footer-left">
                    <div className="box-focus-badge">
                      <GlobeIcon />
                      <span>Web Search</span>
                    </div>

                    <div className="model-selector-pill">
                      <select
                        className="model-select-input"
                        value={selectedModelId}
                        onChange={e => setSelectedModelId(e.target.value)}
                      >
                        {AVAILABLE_MODELS.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.badge} {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    className="hero-submit-btn"
                    disabled={!query.trim() || isSearching}
                    onClick={() => handleSearch()}
                  >
                    <ArrowUpIcon />
                  </button>
                </div>
              </div>

              {/* Suggestions Grid */}
              <div className="hero-suggestions-grid">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    className="suggestion-card"
                    onClick={() => {
                      setQuery(s)
                      handleSearch(s)
                    }}
                  >
                    <span className="suggestion-text">{s}</span>
                    <ArrowUpIcon />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Conversation Results View ── */
            <div className="conversation-thread-view">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-block ${msg.role}`}>
                  {msg.role === "user" ? (
                    <div className="user-query-heading">
                      <h2>{msg.content}</h2>
                    </div>
                  ) : (
                    <div className="assistant-response-container">
                      {/* Sources Cards Horizontal Carousel */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="sources-container">
                          <div className="sources-header-title">
                            <GlobeIcon />
                            <span>Sources ({msg.sources.length})</span>
                          </div>
                          <div className="sources-carousel">
                            {msg.sources.map(src => (
                              <a
                                key={src.id}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="source-mini-card"
                              >
                                <div className="source-domain-row">
                                  <span className="source-index-num">[{src.id}]</span>
                                  <span className="source-domain-name">{getDomain(src.url)}</span>
                                </div>
                                <div className="source-card-headline">{src.title}</div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Searching Shimmer Status */}
                      {isSearching && idx === messages.length - 1 && !msg.content && (
                        <div className="shimmer-status-box">
                          <div className="status-spinner" />
                          <span>{searchStatus}</span>
                        </div>
                      )}

                      {/* Markdown Answer Box */}
                      {msg.content && (
                        <div className="answer-wrapper">
                          <div className="answer-badge-row">
                            <div className="axiom-badge-pill">
                              <AxiomEmblem className="w-4 h-4" />
                              <span>Answer</span>
                            </div>
                          </div>

                          <div className="markdown-prose">
                            <Markdown>{msg.content}</Markdown>
                          </div>

                          {/* Action footer */}
                          <div className="answer-actions-bar">
                            <button
                              className="action-pill-btn"
                              onClick={() => handleCopy(msg.content, idx)}
                            >
                              {copiedIndex === idx ? <CheckIcon /> : <CopyIcon />}
                              <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Follow-up Bottom Input Bar ── */}
        {messages.length > 0 && (
          <div className="bottom-followup-bar">
            <div className="followup-inner-box">
              <textarea
                ref={textareaRef}
                className="followup-textarea"
                placeholder="Ask a follow-up question..."
                rows={1}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
              />
              <div className="followup-actions-right">
                <div className="model-selector-pill mini">
                  <select
                    className="model-select-input"
                    value={selectedModelId}
                    onChange={e => setSelectedModelId(e.target.value)}
                  >
                    {AVAILABLE_MODELS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.badge} {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="followup-submit-btn"
                  disabled={!query.trim() || isSearching}
                  onClick={() => handleSearch()}
                >
                  <ArrowUpIcon />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
