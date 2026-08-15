import { createClient } from "../lib/supabase/client"
import { BACKEND_URL } from "../lib/config"
import type { User } from "@supabase/supabase-js"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router"
import axios from "axios"

// ─── Modular Lib Imports ───
import type { Message, ConversationItem, Source } from "../lib/types"
import { AVAILABLE_MODELS } from "../lib/constants"

// ─── Modular Component Imports ───
import { Navbar } from "../components/Navbar"
import { Sidebar } from "../components/Sidebar"
import { HeroSearch } from "../components/HeroSearch"
import { MessageThread } from "../components/MessageThread"
import { FollowupBar } from "../components/FollowupBar"

const supabase = createClient()

export function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [query, setQuery] = useState("")
  const [selectedModelId, setSelectedModelId] = useState<string>("groq-llama-70b")
  const [messages, setMessages] = useState<Message[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchStatus, setSearchStatus] = useState("")
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<"answer" | "sources">("answer")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const answerScrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // 1. Auth Initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Fetch Conversations (Cloud + LocalStorage Hybrid)
  const fetchConversations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const res = await axios.get(`${BACKEND_URL}/conversations`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const list = res.data?.conversations || (Array.isArray(res.data) ? res.data : [])
        setConversations(list)
        return
      }
    } catch (err) {
      console.error("Failed to load cloud conversations:", err)
    }

    // Guest fallback from localStorage
    try {
      const saved = localStorage.getItem("axiom_guest_conversations")
      if (saved) {
        setConversations(JSON.parse(saved))
      }
    } catch {}
  }

  useEffect(() => {
    fetchConversations()
  }, [user])

  // 3. Auto Scroll on streaming
  useEffect(() => {
    if (answerScrollRef.current) {
      answerScrollRef.current.scrollTop = answerScrollRef.current.scrollHeight
    }
  }, [messages, isSearching])

  // 4. Handle Search Execution (Multi-Turn Stream with OpenRouter/Groq routing)
  const handleSearch = async (overrideQuery?: string) => {
    const searchQuery = overrideQuery || query
    if (!searchQuery.trim() || isSearching) return

    const userMessage: Message = { role: "user", content: searchQuery }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setQuery("")
    setIsSearching(true)
    setSearchStatus("Searching live web...")

    const modelConfig = AVAILABLE_MODELS.find(m => m.id === selectedModelId) ?? AVAILABLE_MODELS[0]!

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }

      const isFollowUp = !!currentConversationId
      const endpoint = isFollowUp
        ? `${BACKEND_URL}/perplexity_ask/follow_up`
        : `${BACKEND_URL}/perplexity-ask`

      const payload = isFollowUp
        ? {
            conversationId: currentConversationId,
            query: searchQuery,
            provider: modelConfig.provider,
            model: modelConfig.model,
            mode: modelConfig.id.includes('quicksilver') ? 'quicksilver' : 'standard',
            clientHistory: messages.map(m => ({ role: m.role, content: m.content })),
          }
        : {
            query: searchQuery,
            provider: modelConfig.provider,
            model: modelConfig.model,
            mode: modelConfig.id.includes('quicksilver') ? 'quicksilver' : 'standard',
          }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Search request failed with status: ${response.status}`)
      }

      // Read custom header for conversation ID
      const headerConvId = response.headers.get("x-conversation-id")
      let activeConversationId = currentConversationId

      if (headerConvId && !currentConversationId) {
        activeConversationId = headerConvId
        setCurrentConversationId(headerConvId)

        // Optimistically add to sidebar immediately!
        const newThreadItem: ConversationItem = {
          id: headerConvId,
          title: searchQuery.length > 50 ? searchQuery.slice(0, 47) + "..." : searchQuery,
        }
        setConversations(prev => {
          const exists = prev.some(c => c.id === headerConvId)
          const updated = exists ? prev : [newThreadItem, ...prev]
          if (!session?.user) {
            localStorage.setItem("axiom_guest_conversations", JSON.stringify(updated))
          }
          return updated
        })
      }

      setSearchStatus("Synthesizing answers with " + modelConfig.name + "...")
      setMessages([...nextMessages, { role: "assistant", content: "", sources: [] }])

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulated += chunk

          // Check if sources delimiter reached
          if (accumulated.includes("\n------SOURCES-------\n")) {
            const parts = accumulated.split("\n------SOURCES-------\n")
            const textContent = parts[0] ?? ""
            const metaJson = parts[1] ?? ""
            let parsedSources: Source[] = []

            try {
              if (metaJson) {
                const parsed = JSON.parse(metaJson)
                if (parsed.sources) parsedSources = parsed.sources
                if (parsed.conversationId && !currentConversationId) {
                  activeConversationId = parsed.conversationId
                  setCurrentConversationId(parsed.conversationId)
                }
              }
            } catch {
              // Incomplete chunk JSON, wait for next stream packet
            }

            const updatedMessages: Message[] = [
              ...nextMessages,
              { role: "assistant", content: textContent, sources: parsedSources },
            ]
            setMessages(updatedMessages)

            // Save to localStorage for guests
            if (!session?.user && activeConversationId) {
              localStorage.setItem(
                `axiom_guest_messages_${activeConversationId}`,
                JSON.stringify(updatedMessages)
              )
            }
          } else {
            setMessages([
              ...nextMessages,
              { role: "assistant", content: accumulated, sources: [] },
            ])
          }
        }
      }

      if (session?.user) fetchConversations()
    } catch (err) {
      console.error("Search streaming error:", err)
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "❌ Sorry, an error occurred while searching. Please try again.",
          sources: [],
        },
      ])
    } finally {
      setIsSearching(false)
      setSearchStatus("")
    }
  }

  // 5. Select Existing Conversation
  const handleSelectConversation = async (conversationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const res = await axios.get(`${BACKEND_URL}/conversations/${conversationId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        const conv = res.data?.conversation || res.data
        if (conv && conv.messages) {
          const loadedMsgs: Message[] = conv.messages.map((m: any) => ({
            role: m.role.toLowerCase() === "user" ? "user" : "assistant",
            content: m.content,
            sources: m.sources ? (typeof m.sources === "string" ? JSON.parse(m.sources) : m.sources) : [],
          }))
          setMessages(loadedMsgs)
          setCurrentConversationId(conversationId)
          return
        }
      }
    } catch (err) {
      console.error("Failed to load thread from server:", err)
    }

    // Guest fallback from localStorage
    try {
      const stored = localStorage.getItem(`axiom_guest_messages_${conversationId}`)
      if (stored) {
        setMessages(JSON.parse(stored))
        setCurrentConversationId(conversationId)
      }
    } catch {}
  }

  // 6. Delete Conversation
  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await axios.delete(`${BACKEND_URL}/conversations/${conversationId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      }
    } catch (err) {
      console.error("Failed to delete conversation on server:", err)
    }

    setConversations(prev => {
      const updated = prev.filter(c => c.id !== conversationId)
      if (!user) {
        localStorage.setItem("axiom_guest_conversations", JSON.stringify(updated))
        localStorage.removeItem(`axiom_guest_messages_${conversationId}`)
      }
      return updated
    })

    if (currentConversationId === conversationId) {
      handleNewSearch()
    }
  }

  const handleNewSearch = () => {
    setMessages([])
    setQuery("")
    setCurrentConversationId(null)
  }

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setConversations([])
    localStorage.removeItem("axiom_guest_conversations")
    handleNewSearch()
  }

  const currentSources = messages
    .filter(m => m.role === "assistant")
    .flatMap(m => m.sources || [])

  return (
    <div className="axiom-app">
      {/* ── 1. Sidebar ── */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        conversations={conversations}
        currentConversationId={currentConversationId}
        user={user}
        onNewSearch={handleNewSearch}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onSignOut={handleSignOut}
        onNavigateAuth={() => navigate("/auth")}
      />

      {/* ── 2. Main Area ── */}
      <div className="axiom-main">
        {/* Top Navbar */}
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          hasMessages={messages.length > 0}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentSources={currentSources}
          onShare={() => handleCopy(window.location.href, -1)}
        />

        {/* Content View */}
        <div className="axiom-content-container" ref={answerScrollRef}>
          {messages.length === 0 ? (
            <HeroSearch
              textareaRef={textareaRef}
              query={query}
              setQuery={setQuery}
              selectedModelId={selectedModelId}
              setSelectedModelId={setSelectedModelId}
              isSearching={isSearching}
              onSearch={handleSearch}
            />
          ) : (
            <MessageThread
              messages={messages}
              isSearching={isSearching}
              searchStatus={searchStatus}
              copiedIndex={copiedIndex}
              onCopy={handleCopy}
            />
          )}
        </div>

        {/* Pinned Bottom Follow-up bar */}
        {messages.length > 0 && (
          <FollowupBar
            textareaRef={textareaRef}
            query={query}
            setQuery={setQuery}
            selectedModelId={selectedModelId}
            setSelectedModelId={setSelectedModelId}
            isSearching={isSearching}
            onSearch={() => handleSearch()}
          />
        )}
      </div>
    </div>
  )
}
export default Home;
