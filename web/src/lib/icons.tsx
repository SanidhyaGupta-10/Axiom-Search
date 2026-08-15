import React from 'react';

// ─── Dragon + Axiom Medallion Emblem ───
export const AxiomEmblem = ({ className = "w-6 h-6" }: { className?: string }) => (
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

    {/* Cardinal Compass Points */}
    <g stroke="url(#medallionRim)" strokeWidth="1.5" strokeLinecap="round">
      <line x1="50" y1="2" x2="50" y2="6" />
      <line x1="50" y1="94" x2="50" y2="98" />
      <line x1="2" y1="50" x2="6" y2="50" />
      <line x1="94" y1="50" x2="98" y2="50" />
    </g>
  </svg>
);

export const SparkleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
);

export const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/>
    <polyline points="5 12 12 5 19 12"/>
  </svg>
);

export const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

export const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

export const HistoryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

export const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

export const PanelLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);
