import React from 'react';
import { AxiomEmblem, GlobeIcon, ArrowUpIcon } from '../lib/icons';
import { AVAILABLE_MODELS, SUGGESTIONS } from '../lib/constants';

interface HeroSearchProps {
  textareaRef: React.Ref<HTMLTextAreaElement>;
  query: string;
  setQuery: (q: string) => void;
  selectedModelId: string;
  setSelectedModelId: (m: string) => void;
  isSearching: boolean;
  onSearch: (overrideQuery?: string) => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  textareaRef,
  query,
  setQuery,
  selectedModelId,
  setSelectedModelId,
  isSearching,
  onSearch,
}) => {
  return (
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
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSearch();
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
            onClick={() => onSearch()}
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>

      {/* Suggestions Grid */}
      <div className="hero-suggestions-grid">
        {SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            className="suggestion-card"
            onClick={() => {
              setQuery(suggestion);
              onSearch(suggestion);
            }}
          >
            <span className="suggestion-text">{suggestion}</span>
            <ArrowUpIcon />
          </button>
        ))}
      </div>
    </div>
  );
};
