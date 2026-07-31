'use client';

import { useState, useEffect, useCallback } from 'react';

interface SessaoCaixa {
  id: string;
  caixaId: string;
  status: string;
  operador: string;
  saldoInicial: number;
  saldoFinal: number;
  saldoDinheiro: number;
  totalVendas: number;
  totalEntradas: number;
  totalSaidas: number;
  totalSangrias: number;
  totalSuprimentos: number;
  abertoEm: string;
  fechadoEm?: string;
  observacoes?: string;
  movimentacoes: any[];
}

interface CaixaData {
  caixaAberto: boolean;
  sessaoAberta: boolean;
  caixa?: {
    id: string;
    status: string;
    createdAt: string;
  };
  sessao?: SessaoCaixa;
  resumoHoje: {
    totalVendas: number;
    qtdVendas: number;
    porTipo: Record<string, number>;
  };
}

export default function CaixaPDV() {
  const [data, setData] = useState<CaixaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msgOk, setMsgOk] = useState('');

  // Form
  const [modal, setModal] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/caixa');
      setData(await res.json());
    } catch {
      setErro('Erro ao carregar dados do caixa');
    }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleAction(acao: string) {
    setSalvando(true);
    setErro('');
    setMsgOk('');
    try {
      const body: any = { acao };
      if (acao === 'ABRIR_SESSAO' || acao === 'SANGRIA' || acao === 'SUPRIMENTO') {
        body.valor = valor;
      }
      if (acao !== 'ABRIR_CAIXA' && acao !== 'ABRIR_SESSAO') {
        body.descricao = descricao || undefined;
      }

      const res = await fetch('/api/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.error) { setErro(d.error); }
      else {
        const labels: Record<string, string> = {
          ABRIR_CAIXA: 'Caixa aberto com sucesso!',
          ABRIR_SESSAO: 'Sessao de caixa iniciada!',
          FECHAR_SESSAO: 'Sessao de caixa encerrada!',
          FECHAR_CAIXA: 'Caixa fechado com sucesso!',
          SANGRIA: 'Sangria registrada!',
          SUPRIMENTO: 'Suprimento registrado!',
        };
        setMsgOk(labels[acao] || `${acao} realizado com sucesso!`);
        setModal('');
        setValor('');
        setDescricao('');
        carregar();
      }
    } catch {
      setErro('Erro ao executar operacao');
    }
    setSalvando(false);
  }

  const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtData = (d: string) => new Date(d).toLocaleString('pt-BR');
  const fmtHora = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const tipoLabel: Record<string, string> = {
    ABERTURA: 'Abertura', FECHAMENTO: 'Fechamento', SANGRIA: 'Sangria',
    SUPRIMENTO: 'Suprimento', VENDA_DINHEIRO: 'Venda Dinheiro', VENDA_PIX: 'Venda PIX',
    VENDA_CARTAO: 'Venda Cartao', OS_DINHEIRO: 'OS Dinheiro', OS_PIX: 'OS PIX',
  };

  if (loading) {
    return <div className="flex items-center gap-3 p-6"><div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/><p className="text-xs text-slate-400">Carregando...</p></div>;
  }

  return (
    <div className="space-y-4">
      {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-medium">{erro}</div>}
      {msgOk && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold">{msgOk}</div>}

      {/* Status Caixa + Sessao */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${data?.caixaAberto ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {data?.caixaAberto ? 'Caixa Aberto' : 'Caixa Fechado'}
              </h3>
              {data?.sessao && (
                <p className="text-[10px] text-slate-400">
                  Operador: {data.sessao.operador} · Aberto {fmtData(data.sessao.abertoEm)}
                </p>
              )}
            </div>
          </div>

          {!data?.caixaAberto ? (
            <button onClick={() => setModal('ABRIR_CAIXA')} className="btn-primary text-xs px-4 py-2">
              Abrir Caixa
            </button>
          ) : !data?.sessaoAberta ? (
            <button onClick={() => { setModal('ABRIR_SESSAO'); setValor(''); }} className="btn-primary text-xs px-4 py-2">
              Iniciar Sessao
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => { setModal('SANGRIA'); setValor(''); setDescricao(''); }} className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-semibold">
                Sangria
              </button>
              <button onClick={() => { setModal('SUPRIMENTO'); setValor(''); setDescricao(''); }} className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-semibold">
                Suprimento
              </button>
              <button onClick={() => { setModal('FECHAR_SESSAO'); setDescricao(''); }} className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-semibold">
                Fechar Sessao
              </button>
              <button onClick={() => { setModal('FECHAR_CAIXA'); setDescricao(''); }} className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 font-semibold">
                Fechar Caixa
              </button>
            </div>
          )}
        </div>

        {/* Indicadores da sessao */}
        {data?.sessao && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Saldo Inicial', value: fm(Number(data.sessao.saldoInicial)), color: 'text-slate-600' },
              { label: 'Saldo Dinheiro', value: fm(Number(data.sessao.saldoDinheiro)), color: 'text-emerald-600' },
              { label: 'Total Vendas', value: fm(Number(data.sessao.totalVendas)), color: 'text-blue-600' },
              { label: 'Sangrias', value: fm(Number(data.sessao.totalSangrias)), color: 'text-amber-600' },
              { label: 'Suprimentos', value: fm(Number(data.sessao.totalSuprimentos)), color: 'text-sky-600' },
              { label: 'Entradas', value: fm(Number(data.sessao.totalEntradas)), color: 'text-teal-600' },
              { label: 'Saidas', value: fm(Number(data.sessao.totalSaidas)), color: 'text-red-500' },
              { label: 'Status', value: data.sessao.status, color: data.sessao.status === 'ABERTA' ? 'text-emerald-600' : 'text-slate-500' },
            ].map((k, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-400 uppercase mb-0.5">{k.label}</p>
                <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumo Hoje */}
      {data?.resumoHoje && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Resumo Hoje</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase">Vendas</p>
              <p className="text-xl font-bold text-slate-800">{data.resumoHoje.qtdVendas}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase">Total</p>
              <p className="text-xl font-bold text-emerald-600">{fm(data.resumoHoje.totalVendas)}</p>
            </div>
          </div>

          {Object.keys(data.resumoHoje.porTipo).length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase mb-1">Por forma de pagamento</p>
              {Object.entries(data.resumoHoje.porTipo).map(([tipo, val]) => (
                <div key={tipo} className="flex justify-between text-xs p-2 rounded bg-slate-50">
                  <span className="text-slate-600">{tipoLabel[tipo] || tipo}</span>
                  <span className="font-bold text-slate-800">{fm(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Movimentacoes da sessao */}
      {data?.sessao?.movimentacoes && data.sessao.movimentacoes.length > 0 && (
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-800">Movimentacoes da Sessao</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {data.sessao.movimentacoes.map((m: any, i: number) => {
              const isEntrada = ['ABERTURA', 'SUPRIMENTO', 'VENDA_DINHEIRO', 'VENDA_PIX', 'VENDA_CARTAO', 'OS_DINHEIRO', 'OS_PIX'].includes(m.tipo);
              const isSaida = ['SANGRIA', 'FECHAMENTO'].includes(m.tipo);
              return (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 last:border-0 text-xs">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      isEntrada ? 'bg-emerald-50 text-emerald-600' : isSaida ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                    }`}>{tipoLabel[m.tipo] || m.tipo}</span>
                    {m.descricao && <span className="text-slate-500 ml-1.5 truncate">{m.descricao}</span>}
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="text-slate-400">{m.createdAt ? fmtHora(m.createdAt) : ''}</span>
                    <span className={`font-bold ${isEntrada ? 'text-emerald-600' : isSaida ? 'text-red-600' : 'text-slate-600'}`}>
                      {isSaida ? '−' : '+'} {fm(Number(m.valor))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de acao */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setModal('')}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
            <h3 className="text-base font-bold text-slate-800 mb-4">
              {modal === 'ABRIR_CAIXA' ? 'Abrir Caixa' :
               modal === 'ABRIR_SESSAO' ? 'Iniciar Sessao de Caixa' :
               modal === 'FECHAR_SESSAO' ? 'Fechar Sessao' :
               modal === 'FECHAR_CAIXA' ? 'Fechar Caixa' :
               modal === 'SANGRIA' ? 'Sangria' : 'Suprimento'}
            </h3>

            {(modal === 'ABRIR_SESSAO' || modal === 'SANGRIA' || modal === 'SUPRIMENTO') && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">
                    {modal === 'ABRIR_SESSAO' ? 'Saldo Inicial *' : 'Valor *'}
                  </label>
                  <input type="number" step="0.01" min="0" value={valor} onChange={e => setValor(e.target.value)}
                    className="input-field mt-1 text-sm font-bold" placeholder="0,00" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Descricao</label>
                  <input value={descricao} onChange={e => setDescricao(e.target.value)} className="input-field mt-1 text-xs" />
                </div>
              </div>
            )}

            {(modal === 'FECHAR_SESSAO' || modal === 'FECHAR_CAIXA') && (
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Observacoes</label>
                <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
                  className="input-field mt-1 text-xs" rows={3} placeholder="Observacoes..." />
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
              <button onClick={() => setModal('')} className="btn-secondary text-xs flex-1">Cancelar</button>
              <button onClick={() => handleAction(modal)} disabled={salvando}
                className="btn-primary text-xs flex-1 disabled:opacity-50">
                {salvando ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
