import { useCallback, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import axios from "axios"

import { BACKEND_URL } from "../lib/config"
import { createClient } from "../lib/supabase/client"
import type { ConversationItem, Message } from "../lib/types"

const supabase = createClient()

const GUEST_CONVERSATIONS_KEY = "axiom_guest_conversations"
const GUEST_MESSAGES_KEY_PREFIX = "axiom_guest_messages_"

export interface UseConversationsArgs {
  user: User | null
}

export interface UseConversationsReturn {
  conversations: ConversationItem[]
  refetch: () => Promise<void>
  loadConversation: (id: string) => Promise<Message[] | null>
  deleteConversation: (id: string) => Promise<void>
  prepend: (item: ConversationItem) => void
}

export function useConversations({ user }: UseConversationsArgs): UseConversationsReturn {
  const [conversations, setConversations] = useState<ConversationItem[]>([])

  const refetch = useCallback(async () => {
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
      const saved = localStorage.getItem(GUEST_CONVERSATIONS_KEY)
      if (saved) {
        setConversations(JSON.parse(saved))
      }
    } catch {}
  }, [])

  useEffect(() => {
    refetch()
  }, [user, refetch])

  const prepend = useCallback(
    (item: ConversationItem) => {
      setConversations(prev => {
        const exists = prev.some(c => c.id === item.id)
        const updated = exists ? prev : [item, ...prev]
        if (!user) {
          localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(updated))
        }
        return updated
      })
    },
    [user],
  )

  const loadConversation = useCallback(
    async (id: string): Promise<Message[] | null> => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          const res = await axios.get(`${BACKEND_URL}/conversations/${id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })

          const conv = res.data?.conversation || res.data
          if (conv && conv.messages) {
            return conv.messages.map((m: any) => ({
              role: m.role.toLowerCase() === "user" ? "user" : "assistant",
              content: m.content,
              sources: m.sources
                ? typeof m.sources === "string"
                  ? JSON.parse(m.sources)
                  : m.sources
                : [],
            }))
          }
        }
      } catch (err) {
        console.error("Failed to load thread from server:", err)
      }

      // Guest fallback from localStorage
      try {
        const stored = localStorage.getItem(`${GUEST_MESSAGES_KEY_PREFIX}${id}`)
        if (stored) {
          return JSON.parse(stored)
        }
      } catch {}

      return null
    },
    [],
  )

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          await axios.delete(`${BACKEND_URL}/conversations/${id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
        }
      } catch (err) {
        console.error("Failed to delete conversation on server:", err)
      }

      setConversations(prev => {
        const updated = prev.filter(c => c.id !== id)
        if (!user) {
          localStorage.setItem(GUEST_CONVERSATIONS_KEY, JSON.stringify(updated))
          localStorage.removeItem(`${GUEST_MESSAGES_KEY_PREFIX}${id}`)
        }
        return updated
      })
    },
    [user],
  )

  return { conversations, refetch, loadConversation, deleteConversation, prepend }
}
