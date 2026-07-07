'use client';

import { useState, useEffect } from 'react';

interface Categoria { id: string; nome: string; slug: string; }

// Mapa de palavras-chave para auto-detectar categoria
const DETECTOR_CATEGORIA: Record<string, string> = {
  // Motor
  'pistao|pistão|anel|segmento|junta|cabecote|cabeçote|valvula|válvula|bomba dagua|bomba dágua|retentor|bronzina|cilindro|carburador|bico injetor|corrente comando|tensionador|guia corrente|motor': 'motor',
  // Freios
  'pastilha|disco freio|disco de freio|cabo freio|cabo de freio|cilindro mestre|pinça|pinca|fluido freio|fluido de freio|lona freio|lona de freio|tubo freio|sensor abs|pedal freio|manete freio|reservatorio freio': 'freios',
  // Eletrica
  'bateria|vela|ignição|ignicao|cachimbo|estator|modulo igni|ecu|bobina|regulador|retificador|lampada|lâmpada|farol led|chave seta|interruptor|chicote|motor partida|eletric': 'eletrica',
  // Suspensao
  'amortecedor|bucha|mola|suspens|biela|balança|balanca|rolamento caixa|garfo|oleo suspens|óleo suspens|suspensao': 'suspensao',
  // Transmissao
  'kit relação|kit relacao|corrente|pinhão|pinhao|coroa|cabo embreagem|disco embreagem|mola embreagem|manete embreagem|pedal cambio|protetor corrente|guia corrente|cubo roda|embreagem|transmiss': 'transmissao',
  // Carroceria
  'paralamas|paralama|tanque|carene|carena|suporte placa|rabeta|carenagem|viseira|bolha|defletor|grade proteção|grade protecao|alforge|bau|baú|carroceria': 'carroceria',
  // Rodas e Pneus
  'pneu|camara|câmara|aro|raios|raio|rolamento roda|eixo|bico camara|protetor camara|calota|roda': 'rodas-e-pneus',
  // Oleos e Fluidos
  'oleo|óleo|liquido arrefecimento|líquido arrefecimento|spray lubrif|graxa|limpa carburador|lava contato|desengripante|wd-40|aditivo|oleo freio|óleo freio|fluido': 'oleos-e-fluidos',
  // Escapamento
  'escapamento|silenciador|abracadeira escap|abracadeira|coletor escape|coletor escap|ponteira escape|parafuso coletor|protetor escape|junta coletor': 'escapamento',
  // Acessorios
  'retrovisor|manopla|seta|pisca|capa banco|banco|guidão|guidao|pedaleira|cavalete|alarme|trava disco|mata cachorro|bolha capacete|suporte celular|buzina|lanterna|farol|capacete|acessor': 'acessorios',
  // Filtros
  'filtro oleo|filtro de oleo|filtro de óleo|filtro ar|filtro de ar|filtro combustivel|filtro combustível|elemento filtro|filtro cvt|filtro transmiss': 'filtros',
  // Cabos e Comandos
  'cabo acelerador|cabo embreagem|cabo freio|cabo velocimetro|cabo velocímetro|cabo afogador|manopla|cabo|comando': 'cabos-e-comandos',
};

// Subcategorias auto-detect
const DETECTOR_SUBCATEGORIA: Record<string, string[]> = {
  motor: ['Pistao', 'Anel de segmento', 'Junta do cabecote', 'Corrente de comando', 'Valvula', 'Bomba dAgua', 'Retentor', 'Bronzina', 'Cabecote', 'Carburador', 'Bico injetor', 'Cilindro', 'Guia de corrente', 'Tensionador'],
  freios: ['Pastilhas', 'Discos', 'Cabos de freio', 'Cilindros', 'Pincas', 'Fluido de freio', 'Lonas', 'Tubos', 'Sensores', 'Pedais', 'Manetes', 'Reservatorios'],
  eletrica: ['Baterias', 'Velas', 'Cachimbos', 'Estator', 'Modulos', 'ECU', 'Bobinas', 'Reguladores', 'Lampadas', 'Interruptores', 'Chicotes', 'Motor de partida'],
  suspensao: ['Amortecedores', 'Buchas', 'Retentores', 'Molas', 'Bielas', 'Balancas', 'Oleo suspensao', 'Rolamentos', 'Garfos'],
  transmissao: ['Kit de relacao', 'Correntes', 'Pinhoes', 'Coroas', 'Cabos embreagem', 'Discos embreagem', 'Molas embreagem', 'Manetes', 'Pedais', 'Protetores', 'Guias', 'Cubos'],
  carroceria: ['Paralamas', 'Tanques', 'Carenes', 'Suportes', 'Rabetas', 'Carenagens', 'Viseiras', 'Grades', 'Alforges', 'Baus', 'Protetores', 'Defletores', 'Suportes farol'],
  'rodas-e-pneus': ['Pneus', 'Camaras', 'Aros', 'Raios', 'Cubos', 'Rolamentos', 'Eixos', 'Bicos', 'Protetores', 'Calotas'],
  'oleos-e-fluidos': ['Oleo motor', 'Oleo transmissao', 'Oleo suspensao', 'Arrefecimento', 'Lubrificantes', 'Limpeza', 'Penetrantes', 'Aditivos', 'Fluido freio'],
  escapamento: ['Escapamento completo', 'Silenciadores', 'Abracadeiras', 'Juntas', 'Protetores', 'Coletores', 'Ponteiras', 'Parafusos'],
  acessorios: ['Retrovisores', 'Manoplas', 'Setas', 'Bancos', 'Guidoes', 'Pedaleiras', 'Cavaletes', 'Alarmes', 'Seguranca', 'Cabos acelerador', 'Protetores', 'Capacetes', 'Suportes', 'Buzinas', 'Lanternas', 'Farois', 'Manoplas'],
  filtros: ['Filtro de oleo', 'Filtro de ar', 'Filtro combustivel', 'Filtro CVT', 'Elemento filtrante'],
  'cabos-e-comandos': ['Cabos acelerador', 'Cabos embreagem', 'Cabos freio', 'Cabos velocimetro', 'Cabos afogador', 'Manoplas'],
};

function detectarCategoria(nome: string): string {
  const n = nome.toLowerCase();
  for (const [keywords, slug] of Object.entries(DETECTOR_CATEGORIA)) {
    for (const kw of keywords.split('|')) {
      if (n.includes(kw)) return slug;
    }
  }
  return 'acessorios';
}

function detectarSubcategoria(nome: string, catSlug: string): string {
  const n = nome.toLowerCase();
  const subs = DETECTOR_SUBCATEGORIA[catSlug] || [];
  for (const sub of subs) {
    if (n.includes(sub.toLowerCase())) return sub;
  }
  return '';
}

function detectarMarca(nome: string): string {
  const n = nome.toLowerCase();
  const marcas: Record<string, string> = {
    'protork': 'ProTork', 'pro tork': 'ProTork', 'honda genuino': 'Honda Genuino', 'honda': 'Honda',
    'yamaha': 'Yamaha', 'yamalube': 'Yamaha', 'ngk': 'NGK', 'moura': 'Moura', 'heliar': 'Heliar',
    'pirelli': 'Pirelli', 'michelin': 'Michelin', 'metzeler': 'Metzeler', 'levorin': 'Levorin',
    'mahle': 'Mahle', 'riken': 'Riken', 'vedamotors': 'Vedamotors', 'kmc': 'KMC', 'did': 'DID',
    'trw': 'TRW', 'bosch': 'Bosch', 'mitsubishi': 'Mitsubishi', 'sabo': 'Sabó', 'sabó': 'Sabó',
    'skf': 'SKF', 'cofap': 'Cofap', 'cobreq': 'Cobreq', 'potenza': 'Potenza', 'duratec': 'Duratec',
    'nissin': 'Nissin', 'keihin': 'Keihin', 'mobil': 'Mobil', 'motul': 'Motul', 'ipiranga': 'Ipiranga',
    'philips': 'Philips', 'osram': 'Osram', 'varga': 'Varga', 'vaz': 'Vaz', 'ebc': 'EBC',
    'marchon': 'Marchon', 'metal leve': 'Metal Leve', 'motoplastic': 'MotoPlastic', 'wurth': 'Wurth',
    'givi': 'Givi', 'magoo': 'Magoo', 'posi': 'Pósitron', 'arteb': 'Arteb', 'turtle': 'Turtle Wax',
    'paraflu': 'Paraflu', 'fras-le': 'Fras-le', 'showa': 'Showa',
  };
  for (const [kw, marca] of Object.entries(marcas)) {
    if (n.includes(kw)) return marca;
  }
  return '';
}

export default function ImportarPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catDefault, setCatDefault] = useState('');
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState<{ criados: number; atualizados: number; erros: string[]; totalProcessado: number } | null>(null);
  const [previa, setPrevia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [formato, setFormato] = useState<'tab' | 'csv'>('tab');

  useEffect(() => { fetch('/api/categorias').then(r => r.json()).then(setCategorias); }, []);

  function parseTexto(): any[] {
    if (!texto.trim()) return [];
    const lines = texto.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];

    if (formato === 'csv') {
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/["']/g, ''));
      const codigoIdx = headers.findIndex(h => h === 'codigo' || h === 'cod' || h === 'ref' || h === 'referencia' || h === 'sku');
      const nomeIdx = headers.findIndex(h => h === 'nome' || h === 'descricao' || h === 'desc' || h === 'produto');
      const precoIdx = headers.findIndex(h => h === 'preco' || h === 'precovenda' || h === 'venda' || h === 'valor');
      const custoIdx = headers.findIndex(h => h === 'custo' || h === 'precocusto');
      const qtdIdx = headers.findIndex(h => h === 'quantidade' || h === 'qtd' || h === 'estoque' || h === 'saldo');
      return lines.slice(1).map(l => {
        const cols = l.split(',').map(c => c.trim().replace(/["']/g, ''));
        return {
          codigo: codigoIdx >= 0 ? cols[codigoIdx] : '',
          nome: nomeIdx >= 0 ? cols[nomeIdx] : '',
          precoVenda: precoIdx >= 0 ? cols[precoIdx]?.replace(/[R$\s]/g, '') : '',
          precoCusto: custoIdx >= 0 ? cols[custoIdx]?.replace(/[R$\s]/g, '') : '',
          quantidade: qtdIdx >= 0 ? cols[qtdIdx] : '',
        };
      });
    }

    return lines.map(l => {
      const cols = l.split('\t');
      if (cols.length >= 2) {
        return {
          codigo: cols[0]?.trim(),
          nome: cols[1]?.trim(),
          precoVenda: cols[2]?.replace(/[R$\s]/g, '')?.trim(),
          precoCusto: cols[3]?.replace(/[R$\s]/g, '')?.trim(),
          quantidade: cols[4]?.trim(),
        };
      }
      return { codigo: '', nome: l.trim(), precoVenda: '', precoCusto: '', quantidade: '' };
    });
  }

  function analisar() {
    const linhas = parseTexto();
    if (linhas.length === 0) { setMsg('Nenhum dado valido encontrado.'); return; }
    const cmap: Record<string, string> = {};
    categorias.forEach(c => { cmap[c.slug] = c.id; });
    const categoriasMap = cmap;

    const enriquecida = linhas.map(l => {
      const nome = l.nome || '';
      const catSlug = detectarCategoria(nome);
      const subcat = detectarSubcategoria(nome, catSlug);
      const marca = detectarMarca(nome);
      return {
        ...l,
        categoriaSlug: catSlug,
        subcategoria: subcat,
        marca,
        categoriaId: categoriasMap[catSlug] || (catDefault || categorias[0]?.id),
      };
    });

    setPrevia(enriquecida);
    setMsg('');
  }

  async function importar() {
    const linhas = previa.length > 0 ? previa : parseTexto().map(l => {
      const nome = l.nome || '';
      const catSlug = detectarCategoria(nome);
      const subcat = detectarSubcategoria(nome, catSlug);
      const marca = detectarMarca(nome);
      return { ...l, subcategoria: subcat, marca, categoriaId: '' };
    });

    if (linhas.length === 0) { setMsg('Nenhum dado valido encontrado.'); return; }
    if (!catDefault && !categorias[0]) { setMsg('Selecione uma categoria padrao.'); return; }

    const catMap: Record<string, string> = {};
    categorias.forEach(c => { catMap[c.slug] = c.id; });

    const final = linhas.map(l => ({
      ...l,
      categoriaId: l.categoriaId || catMap[l.categoriaSlug || ''] || catDefault || categorias[0]?.id,
    }));

    setLoading(true); setMsg(''); setResultado(null);
    try {
      const res = await fetch('/api/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linhas: final, categoriaDefaultId: catDefault || categorias[0]?.id }),
      });
      const data = await res.json();
      setResultado(data);
    } catch { setMsg('Erro ao importar.'); }
    setLoading(false);
  }

  const catSlugToNome: Record<string, string> = {};
  categorias.forEach(c => { catSlugToNome[c.slug] = c.nome; });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">IMPORTAR ESTOQUE</h1>
        <p className="text-sm text-slate-500 mt-0.5">Importador inteligente — cole dados do GSlim, Excel ou qualquer sistema</p>
      </div>

      <div className="card mb-4">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Formato</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setFormato('tab')} className={`px-3 py-1.5 rounded text-xs font-medium border ${formato==='tab'?'bg-brand-600 text-white border-brand-600':'bg-white text-slate-600 border-slate-200'}`}>Colunas (TAB)</button>
              <button onClick={() => setFormato('csv')} className={`px-3 py-1.5 rounded text-xs font-medium border ${formato==='csv'?'bg-brand-600 text-white border-brand-600':'bg-white text-slate-600 border-slate-200'}`}>CSV</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoria padrao</label>
            <select value={catDefault} onChange={e => setCatDefault(e.target.value)} className="input-field mt-1 text-xs w-44">
              <option value="">Auto-detectar</option>
              {categorias.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-2">
          {formato==='tab' ? 'Cole do Excel: CODIGO [TAB] NOME [TAB] PRECO [TAB] CUSTO [TAB] QUANTIDADE' : 'CSV com cabecalho: codigo,nome,preco,custo,quantidade'}
        </p>
        <p className="text-[11px] text-brand-600 mb-3 bg-brand-50 rounded p-2">
          <strong>Auto-deteccao:</strong> O sistema identifica automaticamente categoria, subcategoria e marca pelo nome da peca.
        </p>

        <textarea value={texto} onChange={e => setTexto(e.target.value)} className="input-field font-mono text-xs" rows={10}
          placeholder={formato==='tab'?"MT001\tPistao 52mm CG 160 ProTork\t85.00\t52.00\t8\nFR001\tPastilha de Freio Diant. CG 160\t45.90\t28.50\t20\nEL005\tVela NGK D8EA CG 160\t22.00\t12.00\t40":"codigo,nome,preco,custo,quantidade\nMT001,Pistao CG 160,85.00,52.00,8\nFR001,Pastilha Freio CG 160,45.90,28.50,20"}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={analisar} disabled={!texto.trim()} className="btn-secondary text-xs">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          Analisar / Pre-visualizar
        </button>
        <button onClick={importar} disabled={loading || !texto.trim()} className="btn-primary text-xs">
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </div>

      {msg && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs mb-4">{msg}</div>}

      {/* Preview */}
      {previa.length > 0 && (
        <div className="card mb-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Pre-visualizacao ({previa.length} itens detectados)</h3>
          <div className="overflow-auto max-h-80">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-2 px-2 font-semibold text-slate-500">Codigo</th>
                <th className="text-left py-2 px-2 font-semibold text-slate-500">Nome</th>
                <th className="text-left py-2 px-2 font-semibold text-slate-500">Categoria detectada</th>
                <th className="text-left py-2 px-2 font-semibold text-slate-500">Subcategoria</th>
                <th className="text-left py-2 px-2 font-semibold text-slate-500">Marca</th>
                <th className="text-right py-2 px-2 font-semibold text-slate-500">Preco</th>
                <th className="text-right py-2 px-2 font-semibold text-slate-500">Qtd</th>
              </tr></thead>
              <tbody>{previa.map((l, i) => (
                <tr key={i} className={`border-b border-slate-50 ${i%2===0?'bg-white':'bg-slate-50/20'}`}>
                  <td className="py-1.5 px-2 font-mono text-slate-500">{l.codigo}</td>
                  <td className="py-1.5 px-2 text-slate-700 font-medium truncate max-w-[180px]">{l.nome}</td>
                  <td className="py-1.5 px-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700">
                      {catSlugToNome[l.categoriaSlug] || 'Acessorios'}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-slate-500">{l.subcategoria || '-'}</td>
                  <td className="py-1.5 px-2 text-slate-500">{l.marca || '-'}</td>
                  <td className="py-1.5 px-2 text-right text-slate-600">{Number(l.precoVenda||0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</td>
                  <td className="py-1.5 px-2 text-right font-medium text-slate-700">{l.quantidade||0}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {resultado && (
        <div className={`border rounded-xl p-5 mb-4 ${resultado.erros.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <p className="font-bold text-slate-800">Importacao concluida!</p>
              <p className="text-xs text-slate-600">{resultado.criados} criados, {resultado.atualizados} atualizados. Total: {resultado.totalProcessado}</p>
            </div>
          </div>
          {resultado.erros.length > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-200">
              <p className="text-xs font-semibold text-amber-700 mb-1">Alguns erros:</p>
              {resultado.erros.map((e, i) => (<p key={i} className="text-[11px] text-amber-600">{e}</p>))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
