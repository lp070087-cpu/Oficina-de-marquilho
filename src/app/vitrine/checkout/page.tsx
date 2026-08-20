'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getClienteVitrine } from '@/lib/vitrine-session';
import { DADOS_OFICINA } from '@/lib/empresa';

const fm = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CartItem { peca: any; quantidade: number; }

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cliente, setCliente] = useState<any>(null);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [observacoes, setObservacoes] = useState('');
  const [cupom, setCupom] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Retirada
  const [retiradaNome, setRetiradaNome] = useState('');
  const [retiradaTelefone, setRetiradaTelefone] = useState('');
  const [retiradaDocumento, setRetiradaDocumento] = useState('');
  const [usarMeusDados, setUsarMeusDados] = useState(true);

  useEffect(() => {
    const s = sessionStorage.getItem('marquinho-cart');
    if (s) setCart(JSON.parse(s));
    // Cupom aplicado no carrinho (sessão) — persiste para o checkout
    const cp = sessionStorage.getItem('marquinho-cupom');
    if (cp) { try { setCupomAplicado(JSON.parse(cp)); } catch { /* */ } }
    const cd = getClienteVitrine();
    if (!cd) { router.push('/vitrine/login?redirect=/vitrine/checkout'); return; }
    setCliente(cd);
    setRetiradaNome(cd.nome || '');
    setRetiradaTelefone(cd.telefone || '');
  }, [router]);

  // Preço público oficial (item 6): precoVitrine > precoOferta > precoVenda.
  // O servidor recalcula o preço no fechamento (item 12) — isto é apenas o resumo exibido.
  const precoItem = (peca: any) => {
    const pv = peca?.precoVitrine != null ? Number(peca.precoVitrine) : NaN;
    if (Number.isFinite(pv) && pv > 0) return pv;
    if (peca?.oferta && peca.precoOferta && Number(peca.precoOferta) < Number(peca.precoVenda)) return Number(peca.precoOferta);
    return Number(peca?.precoVenda) || 0;
  };
  const subtotal = cart.reduce((s, i) => s + precoItem(i.peca) * i.quantidade, 0);
  const descontoCupom = cupomAplicado
    ? cupomAplicado.tipo === 'PERCENTUAL' ? subtotal * (Number(cupomAplicado.valor) / 100) : Number(cupomAplicado.valor)
    : 0;
  const total = Math.max(0, subtotal - descontoCupom);

  async function aplicarCupom() {
    if (!cupom) return;
    try {
      const r = await fetch(`/api/vitrine/cupons?codigo=${encodeURIComponent(cupom)}`);
      // A rota /api/vitrine/cupons retorna um ARRAY (lista) — não { cupons: [] }.
      if (r.ok) {
        const data = await r.json();
        const lista = Array.isArray(data) ? data : data?.cupons || [];
        if (lista.length > 0) {
          setCupomAplicado(lista[0]);
          setMsg('');
        } else {
          setMsg('Cupom inválido ou expirado.');
          setCupomAplicado(null);
        }
      } else {
        setMsg('Erro ao consultar o cupom.');
        setCupomAplicado(null);
      }
    } catch {
      setMsg('Erro de conexão ao consultar o cupom.');
      setCupomAplicado(null);
    }
  }

  async function finalizar() {
    if (!retiradaNome.trim() || !retiradaTelefone.trim()) {
      setMsg('Preencha os dados de quem irá retirar.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const r = await fetch('/api/vitrine/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cliente.token}` },
        body: JSON.stringify({
          itens: cart.map(i => ({ pecaId: i.peca.id, quantidade: i.quantidade })),
          formaPagamento,
          observacoes,
          cupomCodigo: cupomAplicado?.codigo || null,
          retiradaNome: usarMeusDados ? cliente.nome : retiradaNome,
          retiradaTelefone: usarMeusDados ? cliente.telefone : retiradaTelefone,
          retiradaDocumento: usarMeusDados ? null : (retiradaDocumento || null),
        }),
      });
      if (r.ok) {
        const pedido = await r.json();
        sessionStorage.removeItem('marquinho-cart');
        sessionStorage.removeItem('marquinho-cupom');
        setCupomAplicado(null);
        setMsg(`Pedido #${pedido.numero} realizado com sucesso!`);
        setTimeout(() => router.push(`/vitrine/perfil?pedido=${pedido.numero}`), 1500);
      } else {
        const e = await r.json();
        setMsg(e.error || 'Erro ao finalizar pedido.');
      }
    } catch { setMsg('Erro de conexão.'); }
    setLoading(false);
  }

  if (!cliente) return null;

  return (
    <div className="min-h-screen bg-[#F3F6FB]">
      <header className="bg-[#0D1117] text-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.push('/vitrine/carrinho')} className="text-slate-400 hover:text-white text-sm">← Carrinho</button>
          <span className="font-extrabold text-sm">Checkout</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-extrabold text-slate-800 mb-6">Finalizar Pedido</h1>
        {msg && (
          <div className={`px-4 py-3 rounded-lg text-xs mb-4 font-medium ${
            msg.includes('sucesso') || msg.includes('realizado') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{msg}</div>
        )}

        {/* Resumo */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Resumo do Pedido</h2>
          {cart.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 text-xs">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">{item.peca.nome}</p>
                <p className="text-slate-400">Qtd: {item.quantidade}</p>
              </div>
              <span className="font-bold ml-2">{fm(precoItem(item.peca) * item.quantidade)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200">
            <span className="text-sm font-bold text-slate-500">Total</span>
            <span className="text-lg font-extrabold text-slate-800">{fm(total)}</span>
          </div>
          {descontoCupom > 0 && (
            <p className="text-xs text-emerald-600 mt-1">Desconto do cupom: -{fm(descontoCupom)}</p>
          )}
        </div>

        {/* ENTREGA — DESABILITADA (FASE 15-H.2) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Forma de Entrega</h2>

          {/* Retirada na Loja — ÚNICA OPÇÃO */}
          <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-brand-600 bg-brand-50/30">
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">✓ Retirada na Loja</p>
              <p className="text-xs text-slate-500">{DADOS_OFICINA.endereco} — {DADOS_OFICINA.cidade}</p>
              <p className="text-xs text-slate-400 mt-0.5">{DADOS_OFICINA.horario}</p>
            </div>
          </div>
        </div>

        {/* Quem irá retirar? */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700">Quem irá retirar?</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={usarMeusDados} onChange={e => setUsarMeusDados(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-[11px] text-slate-500">Eu mesmo</span>
            </label>
          </div>
          {!usarMeusDados && (
            <div className="space-y-2">
              <input placeholder="Nome completo de quem irá retirar" value={retiradaNome}
                onChange={e => setRetiradaNome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Telefone / WhatsApp" value={retiradaTelefone}
                  onChange={e => setRetiradaTelefone(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500" />
                <input placeholder="Documento (opcional)" value={retiradaDocumento}
                  onChange={e => setRetiradaDocumento(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500" />
              </div>
            </div>
          )}
          {usarMeusDados && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
              <p className="font-medium">{cliente.nome}</p>
              <p className="text-slate-400">{cliente.telefone}</p>
            </div>
          )}
        </div>

        {/* Pagamento */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Forma de Pagamento</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'PIX', label: '⚡ PIX', desc: 'Pagamento instantâneo' },
              { key: 'CARTAO_CREDITO', label: '💳 Crédito', desc: 'Na retirada' },
              { key: 'CARTAO_DEBITO', label: '💳 Débito', desc: 'Na retirada' },
              { key: 'DINHEIRO', label: '💰 Dinheiro', desc: 'Na retirada' },
            ].map(f => (
              <button key={f.key} onClick={() => setFormaPagamento(f.key)}
                className={`px-4 py-3 rounded-lg text-xs font-bold transition-all flex-1 min-w-[120px] ${
                  formaPagamento === f.key
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}>
                <p>{f.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cupom */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Cupom de Desconto</h2>
          <div className="flex flex-wrap gap-2">
            <input value={cupom} onChange={e => setCupom(e.target.value.toUpperCase())} placeholder="CÓDIGO DO CUPOM"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs uppercase focus:outline-none focus:border-brand-500" />
            <button onClick={aplicarCupom}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">
              Aplicar
            </button>
          </div>
          {cupomAplicado && (
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              ✓ Cupom {cupomAplicado.codigo} aplicado!
              {cupomAplicado.tipo === 'PERCENTUAL' ? ` (${cupomAplicado.valor}% off)` : ` (-${fm(Number(cupomAplicado.valor))})`}
            </p>
          )}
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-2">Observações</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500 resize-none"
            rows={2} placeholder="Alguma observação para o pedido?" />
        </div>

        {/* Tempo de separação */}
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl text-xs">
          <svg className="w-4 h-4 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span className="text-brand-800">Separação em até <strong>2 horas</strong> após confirmação do pedido.</span>
        </div>

        <button onClick={finalizar} disabled={loading || cart.length === 0}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-extrabold uppercase tracking-wider transition-colors shadow-lg">
          {loading ? 'Finalizando...' : `Finalizar Pedido — ${fm(total)}`}
        </button>

        <p className="text-center text-[11px] text-slate-400 mt-3">
          Ao finalizar, você concorda com nossos termos. Retirada somente na loja.
        </p>
      </div>
    </div>
  );
}
