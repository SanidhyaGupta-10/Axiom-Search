import React from 'react';
import Markdown from 'react-markdown';
import { GlobeIcon, AxiomEmblem, CopyIcon, CheckIcon } from '../lib/icons';
import type { Message } from '../lib/types';
import { getDomain } from '../lib/constants';

interface MessageThreadProps {
  messages: Message[];
  isSearching: boolean;
  searchStatus: string;
  copiedIndex: number | null;
  onCopy: (text: string, idx: number) => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  isSearching,
  searchStatus,
  copiedIndex,
  onCopy,
}) => {
  return (
    <div className="conversation-thread-view">
      {messages.map((msg, idx) => (
        <div key={idx} className={`message-block ${msg.role}`}>
          {msg.role === 'user' ? (
            <div className="user-query-heading">
              <h2>{msg.content}</h2>
            </div>
          ) : (
            <div className="assistant-response-container">
              {/* Sources Section */}
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
                      onClick={() => onCopy(msg.content, idx)}
                    >
                      {copiedIndex === idx ? <CheckIcon /> : <CopyIcon />}
                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
