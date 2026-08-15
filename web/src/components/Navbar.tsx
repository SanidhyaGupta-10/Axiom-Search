import React from 'react';
import { PanelLeftIcon, SparkleIcon, GlobeIcon, ShareIcon } from '../lib/icons';
import type { Source } from '../lib/types';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  hasMessages: boolean;
  activeTab: 'answer' | 'sources';
  setActiveTab: (tab: 'answer' | 'sources') => void;
  currentSources: Source[];
  onShare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  hasMessages,
  activeTab,
  setActiveTab,
  currentSources,
  onShare,
}) => {
  return (
    <header className="axiom-topbar">
      <div className="topbar-left">
        {!sidebarOpen && (
          <button
            className="icon-btn"
            onClick={() => setSidebarOpen(true)}
            title="Expand sidebar"
          >
            <PanelLeftIcon />
          </button>
        )}

        {hasMessages && (
          <div className="topbar-tabs">
            <button
              className={`tab-btn ${activeTab === 'answer' ? 'active' : ''}`}
              onClick={() => setActiveTab('answer')}
            >
              <SparkleIcon />
              <span>Answer</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
              onClick={() => setActiveTab('sources')}
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
        <button className="topbar-action-btn" onClick={onShare}>
          <ShareIcon />
          <span>Share</span>
        </button>
      </div>
    </header>
  );
};
