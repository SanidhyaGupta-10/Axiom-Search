import type { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"

import type { Source } from "../lib/types"

import { useAuth } from "../hooks/useAuth"
import { useConversations } from "../hooks/useConversations"
import { useChatStream } from "../hooks/useChatStream"

import { Navbar } from "../components/Navbar"
import { Sidebar } from "../components/Sidebar"
import { HeroSearch } from "../components/HeroSearch"
import { MessageThread } from "../components/MessageThread"
import { FollowupBar } from "../components/FollowupBar"

export function Home() {
  // ── Local UI state (must be declared before hooks that read them) ──
  const [query, setQuery] = useState("")
  const [selectedModelId, setSelectedModelId] = useState<string>("groq-llama-70b")
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<"answer" | "sources">("answer")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // ── Refs + navigation ──
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const answerScrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // ── Data + server-action hooks ──
  const { user, signOut } = useAuth()
  const {
    conversations,
    refetch: refetchConversations,
    loadConversation,
    deleteConversation,
    prepend: prependConversation,
  } = useConversations({ user })
  const {
    messages,
    isSearching,
    searchStatus,
    send,
    reset: resetChat,
    setMessages,
  } = useChatStream({
    user,
    currentConversationId,
    selectedModelId,
    refetchConversations,
    onConversationIdResolved: setCurrentConversationId,
    prependConversation,
  })

  // Auto-scroll on streaming
  useEffect(() => {
    if (answerScrollRef.current) {
      answerScrollRef.current.scrollTop = answerScrollRef.current.scrollHeight
    }
  }, [messages, isSearching])

  // ── Orchestrators (thin glue between hooks and child component handlers) ──
  const handleSend = useCallback(
    (override?: string) => send(override ?? query),
    [send, query],
  )

  const handleSelectConversation = useCallback(
    async (id: string) => {
      const loaded = await loadConversation(id)
      if (loaded) {
        setMessages(loaded)
        setCurrentConversationId(id)
      }
    },
    [loadConversation, setMessages],
  )

  const handleDeleteConversation = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      await deleteConversation(id)
      if (currentConversationId === id) {
        setCurrentConversationId(null)
        resetChat()
      }
    },
    [deleteConversation, currentConversationId, resetChat],
  )

  const handleNewSearch = useCallback(() => {
    setCurrentConversationId(null)
    resetChat()
    setQuery("")
  }, [resetChat])

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSignOut = useCallback(async () => {
    await signOut()
    setCurrentConversationId(null)
    resetChat()
    localStorage.removeItem("axiom_guest_conversations")
  }, [signOut, resetChat])

  // ── Derived ──
  const currentSources: Source[] = messages
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
              onSearch={handleSend}
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
            onSearch={() => handleSend()}
          />
        )}
      </div>
    </div>
  )
}

export default Home
