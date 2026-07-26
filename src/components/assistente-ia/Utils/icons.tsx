import React from 'react';

export function IconeCategoria({ slug, className }: { slug: string; className?: string }) {
  const cls = className || 'w-3.5 h-3.5';
  const p: Record<string, React.ReactNode> = {
    motor:        <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>,
    freios:       (<><circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/></>),
    suspensao:    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v18M18 3v18M3 9h6M3 15h6M15 9h6M15 15h6"/>,
    eletrica:     <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
    transmissao:  (<><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2M3 12h2m14 0h2"/></>),
    escapamento:  <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8M8 5h8l-2 4H10L8 5z"/>,
    carenagem:    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7a2 2 0 012-2h14a2 2 0 012 2M3 7l5 5m8 0l5-5"/>,
    lubrificantes:<path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>,
    acessorios:   <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v18l7-5 7 5V3a2 2 0 00-2-2H7a2 2 0 00-2 2z"/>,
    capacetes:    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10a4 4 0 100 8 4 4 0 000-8z"/>,
    pneus:        (<><circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v6m0 8v6M2 12h6m8 0h6"/></>),
    rolamentos:   (<><circle cx="12" cy="12" r="7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="5" r="1.5" strokeLinecap="round" strokeLinejoin="round"/></>),
    cabos:        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6c0-1.1.9-2 2-2h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0c0-1.1.9-2 2-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"/>,
    filtros:      <path strokeLinecap="round" strokeLinejoin="round" d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>,
    outros:       <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>,
  };
  return (<svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">{p[slug] || p.outros}</svg>);
}
