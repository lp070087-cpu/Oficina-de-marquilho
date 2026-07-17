'use client';
// VERSÃO IA 2026
import { useState, useRef, useEffect } from 'react';

interface Message { id:string; role:'user'|'assistant'; content:string; data?:any; }

export default function AssistenteIAPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id:'1', role:'assistant', content:'Ola! Sou o assistente do Estoque Central. Posso:\n\n• Cadastrar produtos no estoque\n• Buscar pecas por nome, SKU ou codigo de barras\n• Analisar imagens de notas fiscais\n• Sugerir compras baseado no historico\n• Verificar estoque critico\n\nComo posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState<{ produtos:any[] }|null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  function addMsg(content:string, role:'user'|'assistant', data?:any) {
    setMessages(prev => [...prev, { id:Date.now().toString(), role, content, data }]);
  }

  async function processarMensagem() {
    const texto = input.trim();
    if (!texto) return;
    addMsg(texto, 'user');
    setInput('');
    setLoading(true);

    // Try to parse as a product entry
    const match = texto.match(/([A-Z0-9\-]{3,})\s+([\w\sÀ-Ú\.\,\-\/\(\)]{5,})\s+(\d+[\.,]?\d*)\s+(\d+[\.,]\d{2})/i);
    if (match) {
      const produto = { codigo: match[1], nome: match[2].trim(), quantidade: match[3], precoVenda: match[4] };
      addMsg(`Encontrei um possivel produto:\n\nCodigo: ${produto.codigo}\nNome: ${produto.nome}\nQuantidade: ${produto.quantidade}\nPreco: ${produto.precoVenda}\n\nQuer cadastrar no estoque?`, 'assistant', [produto]);
      setShowConfirm({ produtos: [produto] });
      setLoading(false);
      return;
    }

    // Buscar produto
    const p = new URLSearchParams({ q: texto });
    const res = await fetch(`/api/pecas?${p}`);
    const pecas = await res.json();

    if (Array.isArray(pecas) && pecas.length > 0) {
      const ate = Math.min(pecas.length, 5);
      let resposta = `Encontrei ${pecas.length} produto(s):\n\n`;
      for (let i=0; i<ate; i++) {
        const p = pecas[i];
        resposta += `**${p.nome}** — SKU: ${p.codigo} — Central: ${p.quantidade} — Loja: ${p.quantidadeLoja||0} — ${(Number(p.precoVenda)).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}\n`;
      }
      if (pecas.length > 5) resposta += `\n...e mais ${pecas.length-5} resultados.`;
      addMsg(resposta, 'assistant');
    } else {
      addMsg(`Nao encontrei produtos para "${texto}". Tente:\n• Nome da peca\n• SKU\n• Codigo de barras\n• Ou use "cadastrar" para novo produto.`, 'assistant');
    }
    setLoading(false);
  }

  async function confirmarCadastro() {
    if (!showConfirm) return;
    setLoading(true);
    let ok = 0;
    for (const p of showConfirm.produtos) {
      const catRes = await fetch('/api/categorias');
      const cats = await catRes.json();
      const body = { nome: p.nome, codigo: p.codigo||`IA-${Date.now()}`, precoVenda: parseFloat(p.precoVenda)||0, quantidade: parseInt(p.quantidade)||1, categoriaId: cats[0]?.id||'' };
      const res = await fetch('/api/pecas', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (res.ok) ok++;
    }
    addMsg(`${ok} produto(s) cadastrado(s) com sucesso.`, 'assistant');
    setShowConfirm(null);
    setLoading(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    addMsg(`📷 Imagem recebida: ${file.name}. Analise completa requer OCR externo. A imagem sera usada como referencia visual.`, 'assistant');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="p-4 border-b border-slate-200 bg-white flex-shrink-0">
        <h1 className="text-base font-bold text-slate-800">Assistente IA</h1>
        <p className="text-xs text-slate-400">Chat inteligente para gerenciar o estoque</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F3F6FB]">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
              m.role==='user' ? 'bg-brand-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
            }`}>
              {m.content}
              {m.data && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.data.map((p:any,i:number)=>(
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs">
                      <p className="font-bold">{p.nome}</p>
                      <p className="text-slate-500">SKU: {p.codigo} | Qtd: {p.quantidade}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showConfirm && (
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={confirmarCadastro} className="btn-primary text-xs">✅ Confirmar cadastro</button>
            <button onClick={()=>setShowConfirm(null)} className="btn-secondary text-xs">Cancelar</button>
          </div>
        </div>
      )}

      <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
        <label className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload}/>
        </label>

        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); processarMensagem(); } }}
          className="flex-1 border-0 bg-slate-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-brand-500/30 placeholder:text-slate-400"
          placeholder="Digite um produto, SKU ou comando..."
        />

        <button onClick={processarMensagem} disabled={!input.trim()} className="p-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors disabled:opacity-30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        </button>
      </div>
    </div>
  );
}
