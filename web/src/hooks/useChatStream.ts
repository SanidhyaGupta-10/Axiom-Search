import { useCallback, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { User } from "@supabase/supabase-js"

import { BACKEND_URL } from "../lib/config"
import { AVAILABLE_MODELS } from "../lib/constants"
import { createClient } from "../lib/supabase/client"
import type { ConversationItem, Message, Source } from "../lib/types"

const supabase = createClient()

const SOURCES_DELIMITER = "\n------SOURCES-------\n"

export interface UseChatStreamArgs {
  user: User | null
  currentConversationId: string | null
  selectedModelId: string
  refetchConversations: () => Promise<void>
  onConversationIdResolved: (id: string) => void
  prependConversation: (item: ConversationItem) => void
}

export interface UseChatStreamReturn {
  messages: Message[]
  isSearching: boolean
  searchStatus: string
  send: (overrideQuery?: string) => Promise<void>
  reset: () => void
  setMessages: Dispatch<SetStateAction<Message[]>>
}

export function useChatStream({
  user,
  currentConversationId,
  selectedModelId,
  refetchConversations,
  onConversationIdResolved,
  prependConversation,
}: UseChatStreamArgs): UseChatStreamReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchStatus, setSearchStatus] = useState("")

  const send = useCallback(
    async (overrideQuery?: string) => {
      const searchQuery = overrideQuery
      if (!searchQuery || !searchQuery.trim() || isSearching) return

      const userMessage: Message = { role: "user", content: searchQuery }
      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setIsSearching(true)
      setSearchStatus("Searching live web...")

      const modelConfig =
        AVAILABLE_MODELS.find(m => m.id === selectedModelId) ?? AVAILABLE_MODELS[0]!

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
              clientHistory: messages.map(m => ({ role: m.role, content: m.content })),
            }
          : {
              query: searchQuery,
              provider: modelConfig.provider,
              model: modelConfig.model,
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
          onConversationIdResolved(headerConvId)

          // Optimistic sidebar insert
          const newThreadItem: ConversationItem = {
            id: headerConvId,
            title:
              searchQuery.length > 50
                ? searchQuery.slice(0, 47) + "..."
                : searchQuery,
          }
          prependConversation(newThreadItem)
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
            if (accumulated.includes(SOURCES_DELIMITER)) {
              const parts = accumulated.split(SOURCES_DELIMITER)
              const textContent = parts[0] ?? ""
              const metaJson = parts[1] ?? ""
              let parsedSources: Source[] = []

              try {
                if (metaJson) {
                  const parsed = JSON.parse(metaJson)
                  if (parsed.sources) parsedSources = parsed.sources
                  if (parsed.conversationId && !currentConversationId) {
                    activeConversationId = parsed.conversationId
                    onConversationIdResolved(parsed.conversationId)
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
              if (!user && activeConversationId) {
                localStorage.setItem(
                  `axiom_guest_messages_${activeConversationId}`,
                  JSON.stringify(updatedMessages),
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

        if (user) refetchConversations()
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
    },
    [
      messages,
      isSearching,
      user,
      currentConversationId,
      selectedModelId,
      refetchConversations,
      onConversationIdResolved,
      prependConversation,
    ],
  )

  const reset = useCallback(() => {
    setMessages([])
    setIsSearching(false)
    setSearchStatus("")
  }, [])

  return { messages, isSearching, searchStatus, send, reset, setMessages }
}
