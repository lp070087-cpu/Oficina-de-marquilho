'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EstoqueAssistentePage() {
  const router = useRouter();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">ASSISTENTE IA</h1>
        <p className="text-sm text-slate-500 mt-0.5">Consultas, sugestoes e alertas do estoque</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F1A2E] via-[#1a2d4a] to-[#1e3a5f] p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"/>
        <div className="relative z-10">
          <h2 className="text-lg font-bold mb-3">Assistente de Estoque</h2>
          <p className="text-sm text-white/70 max-w-2xl mb-4">
            Consulte produtos, verifique estoque critico e produtos parados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { titulo:'Estoque Critico', desc:'Produtos abaixo do estoque minimo', acao:'Ver criticos', href:'/dono/estoque' },
          { titulo:'Produtos Parados', desc:'Itens sem movimentacao', acao:'Ver parados', href:'/estoque/relatorios' },
          { titulo:'Sugerir Compras', desc:'Baseado no historico de saidas', acao:'Ver sugestoes', href:'/estoque/central' },
        ].map((c,i)=>(
          <button key={i} onClick={()=>router.push(c.href)} className="card text-left hover:border-brand-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
              <span className="text-brand-600 font-bold text-sm">{i+1}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">{c.titulo}</h3>
            <p className="text-xs text-slate-500 mb-3">{c.desc}</p>
            <span className="text-xs text-brand-600 font-bold">{c.acao}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
