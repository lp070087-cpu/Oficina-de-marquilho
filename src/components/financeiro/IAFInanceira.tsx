'use client';

import { useState } from 'react';

// IA Financeira — responde perguntas usando dados do dashboard
export default function IAFInanceira() {
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const SUGESTOES = [
    'Quanto vendemos hoje?',
    'Quanto faturou a oficina?',
    'Quanto vendemos este mês?',
    'Quanto ainda tenho para receber?',
    'Quanto preciso pagar esta semana?',
    'Qual categoria mais lucra?',
    'Como está meu fluxo de caixa?',
    'Quanto tenho disponível em caixa?',
  ];

  async function perguntar(q?: string) {
    const query = q || pergunta;
    if (!query.trim()) return;
    setLoading(true);
    setResposta('');

    try {
      // Buscar dados do dashboard como contexto
      const r = await fetch('/api/financeiro/dashboard');
      if (!r.ok) throw new Error('Erro ao carregar dados');
      const data = await r.json();

      // Responder com base nos dados
      const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      let resp = '';

      const qLower = query.toLowerCase();

      if (qLower.includes('hoje') && (qLower.includes('vende') || qLower.includes('vendeu'))) {
        resp = `Hoje (período atual), a receita total foi de **${fm(data.receitaHoje)}**.`;
      } else if (qLower.includes('oficina') && qLower.includes('fatur')) {
        resp = `A receita do período atual incluindo OS pagas é de **${fm(data.receitaMes)}**.`;
      } else if (qLower.includes('mês') && (qLower.includes('vende') || qLower.includes('vendeu'))) {
        resp = `Neste mês, a receita total é de **${fm(data.receitaMes)}** com **${data.qtdVendas} vendas** e ticket médio de **${fm(data.ticketMedio)}**.`;
      } else if (qLower.includes('receber')) {
        resp = `Você tem **${data.contasReceberQtd} contas a receber** totalizando **${fm(data.contasReceber)}**.`;
      } else if (qLower.includes('pagar') && (qLower.includes('semana') || qLower.includes('preciso'))) {
        resp = `Você tem **${data.contasPagarQtd} contas a pagar** totalizando **${fm(data.contasPagar)}**.`;
      } else if (qLower.includes('fluxo') && qLower.includes('caixa')) {
        resp = `Seu saldo atual é de **${fm(data.saldoAtual)}** e o saldo previsto (com contas a receber e pagar) é de **${fm(data.saldoPrevisto)}**.`;
      } else if (qLower.includes('caixa') || qLower.includes('disponível')) {
        resp = `Você tem **${fm(data.saldoAtual)}** disponível em caixa no período atual. O saldo previsto é de **${fm(data.saldoPrevisto)}**.`;
      } else if (qLower.includes('categoria') || qLower.includes('lucra')) {
        resp = `De acordo com os dados, a **margem de lucro líquida** do período é de **${data.margem}%**. O lucro bruto foi de **${fm(data.lucroBruto)}** e o lucro líquido de **${fm(data.lucroLiquido)}**.`;
      } else if (qLower.includes('estoque')) {
        resp = `O valor estimado em estoque é de aproximadamente **${fm(data.valorEstoque)}**.`;
      } else {
        resp = `📊 **Resumo Financeiro do ${data.periodo.tipo}:**\n\n• Receita: **${fm(data.receitaMes)}**\n• Lucro Líquido: **${fm(data.lucroLiquido)}** (${data.margem}%)\n• Contas a Receber: **${fm(data.contasReceber)}**\n• Contas a Pagar: **${fm(data.contasPagar)}**\n• Saldo Atual: **${fm(data.saldoAtual)}**\n• Ticket Médio: **${fm(data.ticketMedio)}**`;
      }

      setResposta(resp);
      setShowSuggestions(false);
    } catch {
      setResposta('Erro ao carregar dados financeiros. Tente novamente.');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-xs font-bold text-slate-700 mb-3">💬 Assistente Financeiro IA</h3>
        <div className="flex gap-2">
          <input value={pergunta} onChange={e => setPergunta(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && perguntar()}
            placeholder="Pergunte sobre finanças..."
            className="input-field flex-1 text-xs" />
          <button onClick={() => perguntar()} disabled={loading}
            className="btn-primary text-xs px-4 py-2">
            {loading ? '...' : 'Perguntar'}
          </button>
        </div>
      </div>

      {showSuggestions && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 font-medium">Sugestões:</p>
          <div className="flex flex-wrap gap-2">
            {SUGESTOES.map(s => (
              <button key={s} onClick={() => perguntar(s)}
                className="text-[11px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {resposta && (
        <div className="bg-slate-800 text-white rounded-xl p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">🤖</span>
            <p className="text-xs leading-relaxed whitespace-pre-line">{resposta}</p>
          </div>
        </div>
      )}
    </div>
  );
}
