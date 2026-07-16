'use client';

import { useState, useEffect } from 'react';
import { analisarTextoCopiado, LinhaExtraida, DocumentoExtraido } from '@/lib/ocr-parser';
import { classificarProduto, normalizarCategoria } from '@/lib/classificador';

interface Categoria { id: string; nome: string; slug: string; }

export default function ImportarPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catDefault, setCatDefault] = useState('');
  const [texto, setTexto] = useState('');
  const [formato, setFormato] = useState<'tab'|'csv'|'ocr'>('tab');
  const [previa, setPrevia] = useState<LinhaExtraida[]>([]);
  const [resultado, setResultado] = useState<{criados:number;atualizados:number;erros:string[];totalProcessado:number}|null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [cabecalho, setCabecalho] = useState<Partial<DocumentoExtraido>>({});

  useEffect(() => { fetch('/api/categorias').then(r=>r.json()).then(setCategorias); }, []);

  const catMap: Record<string, string> = {};
  categorias.forEach(c => { catMap[c.slug] = c.id; });

  function parseCSV(): LinhaExtraida[] {
    if (!texto.trim()) return [];
    const lines = texto.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/["']/g, ''));
    const codigoIdx = headers.findIndex(h => h==='codigo'||h==='cod'||h==='ref'||h==='sku');
    const nomeIdx = headers.findIndex(h => h==='nome'||h==='descricao'||h==='desc'||h==='produto');
    const qtdIdx = headers.findIndex(h => h==='quantidade'||h==='qtd'||h==='estoque'||h==='saldo');
    const precoIdx = headers.findIndex(h => h==='preco'||h==='precovenda'||h==='venda'||h==='valor');
    const custoIdx = headers.findIndex(h => h==='custo'||h==='precocusto');
    const unIdx = headers.findIndex(h => h==='unidade'||h==='un'||h==='und');
    return lines.slice(1).map(l => {
      const cols = l.split(',').map(c => c.trim().replace(/["']/g, ''));
      return {
        codigo: codigoIdx>=0 ? cols[codigoIdx] : '',
        nome: nomeIdx>=0 ? cols[nomeIdx] : '',
        quantidade: qtdIdx>=0 ? cols[qtdIdx] : '',
        unidade: unIdx>=0 ? cols[unIdx] : 'UN',
        precoUnitario: precoIdx>=0 ? cols[precoIdx]?.replace(/[R$\s]/g,'') : '',
        precoTotal: custoIdx>=0 ? cols[custoIdx]?.replace(/[R$\s]/g,'') : '',
      };
    });
  }

  function parseTab(): LinhaExtraida[] {
    return texto.trim().split('\n').filter(l=>l.trim()).map(l => {
      const cols = l.split('\t');
      return {
        codigo: cols[0]?.trim()||'',
        nome: cols[1]?.trim()||'',
        quantidade: cols[4]?.trim()||'',
        unidade: cols[3]?.trim()||'UN',
        precoUnitario: cols[2]?.replace(/[R$\s]/g,'')?.trim()||'',
        precoTotal: cols[5]?.replace(/[R$\s]/g,'')?.trim()||'',
      };
    });
  }

  async function analisar() {
    if (!texto.trim()) { setMsg('Nenhum dado encontrado.'); return; }
    setMsg('');

    let linhas: LinhaExtraida[];
    if (formato === 'ocr') {
      const parsed = analisarTextoCopiado(texto);
      linhas = parsed.produtos;
      setCabecalho({ fornecedor: parsed.fornecedor, dataEmissao: parsed.data });
      if (linhas.length === 0) {
        // Fallback: tenta parse como tab
        linhas = parseTab();
        if (linhas.length === 0) linhas = parseCSV();
      }
    } else if (formato === 'csv') {
      linhas = parseCSV();
    } else {
      linhas = parseTab();
    }

    if (linhas.length === 0) { setMsg('Nenhum dado valido. Verifique o formato.'); return; }

    const enriquecida = linhas.map(l => {
      const nome = l.nome || '';
      const classificacao = classificarProduto(nome, undefined, undefined);
      const catSlug = normalizarCategoria(classificacao.categoria).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      return {
        ...l,
        categoriaDetectada: classificacao.categoria,
        subcategoria: classificacao.subcategoria,
        confianca: classificacao.confianca,
        categoriaId: catMap[catSlug] || catDefault || categorias[0]?.id,
      };
    });

    setPrevia(enriquecida);
  }

  async function importar() {
    const linhas = previa.map(l => ({
      codigo: l.codigo,
      nome: l.nome,
      precoVenda: parseFloat(l.precoUnitario) || 0,
      precoCusto: parseFloat(l.precoTotal) || 0,
      quantidade: parseInt(l.quantidade) || 0,
      categoriaId: l.categoriaId || catDefault || categorias[0]?.id,
      subcategoria: l.subcategoria || '',
    }));

    setLoading(true); setMsg('');
    try {
      const res = await fetch('/api/importar', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ linhas, categoriaDefaultId: catDefault || categorias[0]?.id }),
      });
      const data = await res.json();
      setResultado(data);
      if (data.erros.length === 0) { setTexto(''); setPrevia([]); }
    } catch { setMsg('Erro ao importar.'); }
    setLoading(false);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg('Processando imagem... (para resultados mais precisos, cole o texto do documento)');
    // Draw image to canvas for visual inspection
    const reader = new FileReader();
    reader.onload = () => {
      setMsg('Imagem carregada. Cole o texto do documento no campo acima ou use a digitacao manual.');
      // Switch to OCR mode
      setFormato('ocr');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">IMPORTAR ESTOQUE</h1>
      <p className="text-sm text-slate-500 mb-6">Cole dados, escaneie documentos ou faca upload de imagens</p>

      {/* Format selector */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={()=>setFormato('tab')} className={`px-3 py-1.5 rounded text-xs font-medium border ${formato==='tab'?'bg-brand-600 text-white border-brand-600':'bg-white text-slate-600 border-slate-200'}`}>
          📋 Colunas / TAB
        </button>
        <button onClick={()=>setFormato('csv')} className={`px-3 py-1.5 rounded text-xs font-medium border ${formato==='csv'?'bg-brand-600 text-white border-brand-600':'bg-white text-slate-600 border-slate-200'}`}>
          📊 CSV
        </button>
        <button onClick={()=>setFormato('ocr')} className={`px-3 py-1.5 rounded text-xs font-medium border ${formato==='ocr'?'bg-brand-600 text-white border-brand-600':'bg-white text-slate-600 border-slate-200'}`}>
          🔍 OCR Inteligente
        </button>
        <div className="flex-1"/>
        <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          📷 Upload imagem
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleImageUpload}/>
        </label>
        <select value={catDefault} onChange={e=>setCatDefault(e.target.value)} className="input-field w-40 text-xs">
          <option value="">Categoria padrao</option>
          {categorias.map(c=>(<option key={c.id} value={c.id}>{c.nome}</option>))}
        </select>
      </div>

      {/* Cabecalho extraido */}
      {cabecalho.fornecedor && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-xs flex items-center gap-4 flex-wrap">
          {cabecalho.fornecedor && <span><strong>Fornecedor:</strong> {cabecalho.fornecedor}</span>}
          {cabecalho.dataEmissao && <span><strong>Data:</strong> {cabecalho.dataEmissao}</span>}
          {cabecalho.numeroNF && <span><strong>NF:</strong> {cabecalho.numeroNF}</span>}
        </div>
      )}

      {/* Textarea */}
      <div className="card mb-4">
        <textarea value={texto} onChange={e=>setTexto(e.target.value)}
          className="input-field font-mono text-xs" rows={12}
          placeholder={
            formato==='ocr'
              ? 'Cole o texto do documento aqui...\n\nO sistema tenta detectar:\n• Código do produto\n• Descrição\n• Quantidade\n• Preço\n• Fornecedor\n• Dados da NF'
              : formato==='csv'
              ? 'codigo,nome,preco,custo,quantidade\nCB001,Pastilha Freio CG 160,45.90,28.50,20'
              : 'CB001\tPastilha de Freio\t45.90\t28.50\t20\nCB002\tCabo de Embreagem\t32.00\t18.90\t15'
          }
        />
        <p className="text-[10px] text-slate-400 mt-2">
          Formato {formato==='ocr'?'OCR':formato==='csv'?'CSV':'TAB'}: {formato==='ocr'?'Analise automatica de qualquer padrao':formato==='csv'?'codigo, nome, preco, custo, quantidade':'CODIGO [TAB] NOME [TAB] PRECO [TAB] CUSTO [TAB] QUANTIDADE'}
        </p>
      </div>

      {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={analisar} disabled={!texto.trim()} className="btn-secondary text-xs">🔍 Analisar / Pre-visualizar</button>
        <button onClick={importar} disabled={loading || previa.length===0} className="btn-primary text-xs">{loading?'Importando...':'Importar tudo'}</button>
      </div>

      {/* Preview */}
      {previa.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Pre-visualizacao ({previa.length} itens)</h3>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50/60 sticky top-0">
                <th className="text-left py-2 px-2 font-semibold text-slate-500">Codigo</th>
                <th className="text-left py-2 px-2 font-semibold text-slate-500">Nome</th>
                <th className="text-center py-2 px-2 font-semibold text-slate-500">Qtd</th>
                <th className="text-right py-2 px-2 font-semibold text-slate-500">Preco</th>
                <th className="text-left py-2 px-2 font-semibold text-slate-500">Categoria</th>
                <th className="text-center py-2 px-2 font-semibold text-slate-500">Conf.</th>
              </tr></thead>
              <tbody>{previa.map((l,i)=>(
                <tr key={i} className={`border-b border-slate-50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}>
                  <td className="py-1.5 px-2 font-mono text-slate-500">{l.codigo}</td>
                  <td className="py-1.5 px-2 text-slate-700 font-medium truncate max-w-[250px]">{l.nome}</td>
                  <td className="py-1.5 px-2 text-center font-bold">{l.quantidade}</td>
                  <td className="py-1.5 px-2 text-right text-slate-600">{Number(l.precoUnitario||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                  <td className="py-1.5 px-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${l.confianca&&l.confianca>=60?'bg-brand-50 text-brand-700':l.confianca&&l.confianca>=30?'bg-amber-50 text-amber-700':'bg-slate-50 text-slate-500'}`}>
                      {l.categoriaDetectada||'Revisar'}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`text-[10px] font-bold ${l.confianca&&l.confianca>=60?'text-emerald-600':l.confianca&&l.confianca>=30?'text-amber-600':'text-red-400'}`}>
                      {l.confianca||0}%
                    </span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {resultado && (
        <div className={`border rounded-xl p-5 mt-4 ${resultado.erros.length>0?'bg-amber-50 border-amber-200':'bg-emerald-50 border-emerald-200'}`}>
          <p className="font-bold text-slate-800 mb-1">Importacao concluida!</p>
          <p className="text-xs text-slate-600">{resultado.criados} criados, {resultado.atualizados} atualizados. Total: {resultado.totalProcessado}</p>
          {resultado.erros.length>0&&(<div className="mt-2 pt-2 border-t border-amber-200">{resultado.erros.map((e,i)=>(<p key={i} className="text-[11px] text-amber-600">{e}</p>))}</div>)}
        </div>
      )}
    </div>
  );
}
