import React from 'react';
import { AxiomEmblem, PanelLeftIcon, PlusIcon, HistoryIcon, TrashIcon } from '../lib/icons';
import type { ConversationItem } from '../lib/types';
import type { User } from '@supabase/supabase-js';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  conversations: ConversationItem[];
  currentConversationId: string | null;
  user: User | null;
  onNewSearch: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
  onSignOut: () => void;
  onNavigateAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  conversations,
  currentConversationId,
  user,
  onNewSearch,
  onSelectConversation,
  onDeleteConversation,
  onSignOut,
  onNavigateAuth,
}) => {
  return (
    <aside className={`axiom-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
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

        <button className="new-thread-btn" onClick={onNewSearch}>
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
            {user ? 'No search history yet' : 'Sign in to sync search history'}
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              className={`thread-item-wrapper ${currentConversationId === conv.id ? 'active' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <span className="thread-title">{conv.title}</span>
              <button
                className="delete-thread-btn"
                title="Delete thread"
                onClick={e => onDeleteConversation(e, conv.id)}
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
              {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info-text">
              <span className="user-display-name">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
              <span className="user-email-sub">{user.email}</span>
            </div>
            <button className="signout-btn" onClick={onSignOut} title="Sign out">
              Sign Out
            </button>
          </div>
        ) : (
          <button className="signin-prompt-btn" onClick={onNavigateAuth}>
            Sign In to save history
          </button>
        )}
      </div>
    </aside>
  );
};
