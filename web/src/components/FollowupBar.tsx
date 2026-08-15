import React from 'react';
import { ArrowUpIcon } from '../lib/icons';
import { AVAILABLE_MODELS } from '../lib/constants';

interface FollowupBarProps {
  textareaRef: React.Ref<HTMLTextAreaElement>;
  query: string;
  setQuery: (q: string) => void;
  selectedModelId: string;
  setSelectedModelId: (m: string) => void;
  isSearching: boolean;
  onSearch: () => void;
}

export const FollowupBar: React.FC<FollowupBarProps> = ({
  textareaRef,
  query,
  setQuery,
  selectedModelId,
  setSelectedModelId,
  isSearching,
  onSearch,
}) => {
  return (
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
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSearch();
            }
          }}
          autoFocus
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
            onClick={onSearch}
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    </div>
  );
};
