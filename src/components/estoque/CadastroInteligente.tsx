'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ScannerUniversal from '@/components/scanner/ScannerUniversal';

interface Categoria { id: string; nome: string; slug: string; }
interface PecaExistente { id: string; nome: string; codigo: string; codigoBarras?: string; quantidade: number; quantidadeLoja: number; marca?: string; categoria: { nome: string; id: string }; }

interface DuplicataInfo {
  tipo: 'codigo' | 'barras' | 'nome' | 'fornecedor';
  mensagem: string;
  peca: PecaExistente;
}

interface FormCadastro {
  nome: string; codigo: string; codigoBarras: string;
  precoVenda: string; precoCusto: string; quantidade: string;
  quantidadeLoja: string; estoqueMinimo: string;
  marca: string; compatibilidade: string; localizacao: string;
  fornecedor: string; descricao: string; categoriaId: string;
}

type ModoEntrada = 'manual' | 'scanner' | 'ia' | 'foto';

interface CadastroInteligenteProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormCadastro & { pecaExistenteId?: string }) => Promise<{ ok: boolean; error?: string }>;
  categorias: Categoria[];
  categoriaIdPadrao?: string;
  codigoBarrasInicial?: string;
}

const FORM_VAZIO: FormCadastro = {
  nome: '', codigo: '', codigoBarras: '',
  precoVenda: '', precoCusto: '', quantidade: '0',
  quantidadeLoja: '0', estoqueMinimo: '5',
  marca: '', compatibilidade: '', localizacao: '',
  fornecedor: '', descricao: '', categoriaId: '',
};

export default function CadastroInteligente({
  open, onClose, onSave, categorias,
  categoriaIdPadrao, codigoBarrasInicial,
}: CadastroInteligenteProps) {
  const [modo, setModo] = useState<ModoEntrada>('manual');
  const [form, setForm] = useState<FormCadastro>(FORM_VAZIO);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState('');
  const [salvo, setSalvo] = useState(false);

  // Scanner
  const [showScanner, setShowScanner] = useState(false);

  // IA
  const [textoIA, setTextoIA] = useState('');
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [sugestoesIA, setSugestoesIA] = useState<Partial<FormCadastro> | null>(null);
  const [classificacaoIA, setClassificacaoIA] = useState<{
    categoria: string; confiancaCategoria: number;
    subcategoria: string; confiancaSubcategoria: number;
    marca: string; confiancaMarca: number;
    compatibilidade: string; confiancaCompatibilidade: number;
    nome: string; confiancaNome: number;
    confiancaGeral: number;
  } | null>(null);

  // Duplicata
  const [duplicatas, setDuplicatas] = useState<DuplicataInfo[]>([]);
  const [mostrarDuplicatas, setMostrarDuplicatas] = useState(false);

  // Foto
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Inicializa
  useEffect(() => {
    if (open) {
      setForm({
        ...FORM_VAZIO,
        categoriaId: categoriaIdPadrao || categorias[0]?.id || '',
        codigoBarras: codigoBarrasInicial || '',
      });
      setErrors({});
      setMsg(''); setMsgOk(''); setSalvo(false);
      setSugestoesIA(null); setClassificacaoIA(null); setDuplicatas([]); setMostrarDuplicatas(false);
      setFotoPreview(null); setTextoIA('');
      setModo('manual');
    }
  }, [open, categoriaIdPadrao, codigoBarrasInicial, categorias]);

  function update(field: keyof FormCadastro, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  // ============================================================
  // IA — Analisa texto/áudio descritivo e sugere campos
  // ============================================================
  async function analisarTextoIA() {
    if (!textoIA.trim()) return;
    setAnalisandoIA(true);
    setMsg('');

    // Simulação de IA: analisa padrões comuns de descrição de produto
    const texto = textoIA.trim();
    const sugestao: Partial<FormCadastro> = {};

    // Detecta quantidade: "10 unidades de", "5 kits", "3 litros", "20 pecas"
    const qtdMatch = texto.match(/(\d+)\s*(?:unidades?|un\.?|litros?|L|kits?|pecas?|pares?|jogos?)/i);
    if (qtdMatch) sugestao.quantidade = qtdMatch[1];

    // Detecta preço: "R$ 45,90", "por R$ 120", "a R$ 89", "R$250", "45,90 cada"
    const precoMatch = texto.match(/(?:R\$\s*|por\s+R\$\s*|a\s+R\$\s*|custa\s+R\$\s*)?(\d+[,.]?\d*)\s*(?:cada|por\s+unidade|unidade)?/i);
    const precoMatchEspecifico = texto.match(/R\$\s*(\d+[,.]?\d*)/i);
    if (precoMatchEspecifico) {
      sugestao.precoCusto = precoMatchEspecifico[1].replace(',', '.');
    }

    // Detecta nome do produto: tudo após "de" e antes de "por R$" ou "para"
    const nomeMatch = texto.match(/(?:de|do|da|dos|das)\s+(.+?)(?:\s+(?:por|a|para|custa)\s+R\$|$)/i);
    if (nomeMatch && nomeMatch[1].length > 3) {
      sugestao.nome = nomeMatch[1].trim();
      // Auto-detectar código baseado no nome
      if (!sugestao.codigo) {
        const nomeClean = sugestao.nome.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        sugestao.codigo = `AUTO-${nomeClean}`;
      }
    } else if (texto.length > 3) {
      sugestao.nome = texto;
      const nomeClean = texto.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      sugestao.codigo = `AUTO-${nomeClean}`;
    }

    // Detecta marca: palavras conhecidas
    const marcasConhecidas = ['NGK', 'ProTork', 'Pirelli', 'Michelin', 'Metal Leve', 'Bosh', 'Bosch', 'Vedamotors', 'Vedamotor', 'Vedamotors', 'Tecfil', 'DID', 'RK', 'KMC', 'Dayco', 'Gates', 'Makita', 'Makina', '3M', 'Osram', 'Philips', 'Liqui Moly', 'Mobil', 'Castrol', 'Ipiranga', 'Yamaha', 'Honda', 'Suzuki', 'Kawasaki'];
    for (const m of marcasConhecidas) {
      if (texto.toLowerCase().includes(m.toLowerCase())) {
        sugestao.marca = m;
        break;
      }
    }

    // Detecta compatibilidade: padrão "CG 160", "FAN 150", "XTZ 125", "CB 300"
    const compatMatch = texto.match(/(CG|FAN|CB|XRE|XTZ|Fazer|Factor|Bros|Titan|Twister|Pop|Biz|NXR|CRF)\s*\d{2,4}/i);
    if (compatMatch) sugestao.compatibilidade = compatMatch[0].toUpperCase();

    // Detecta categoria por palavras-chave
    const catKeywords: Record<string, string[]> = {
      motor: ['oleo', 'oleo', 'motor', 'filtro de oleo', 'junta', 'valvula', 'embreagem', 'embreagem', 'pistao', 'anel', 'cilindro', 'virabrequim', 'biela', 'cabeçote', 'junta do cabeçote'],
      freios: ['freio', 'pastilha', 'disco', 'lonas', 'cabo de freio', 'cilindro', 'fluido'],
      transmissao: ['corrente', 'relacao', 'pinhão', 'coroa', 'kit relacao', 'cabo', 'embreagem'],
      suspensao: ['amortecedor', 'suspensao', 'mola', 'ba', 'gangorra', 'bucha'],
      eletrica: ['bateria', 'vela', 'farol', 'lanterna', 'seta', 'rele', 'cdi', 'estator', 'magneto', 'retificador', 'chicote', 'bobina'],
      pneus: ['pneu', 'camara', 'camara de ar', 'aro', 'protetor'],
      filtros: ['filtro de ar', 'filtro de combustivel', 'filtro'],
      carenagem: ['care', 'paralama', 'tanque', 'retrovisor', 'guidão', 'guidao', 'manopla', 'banco', 'pedaleira'],
    };
    for (const [cat, keywords] of Object.entries(catKeywords)) {
      if (keywords.some(k => texto.toLowerCase().includes(k))) {
        const encontrada = categorias.find(c => c.slug === cat || c.nome.toLowerCase().includes(cat));
        if (encontrada) { sugestao.categoriaId = encontrada.id; break; }
      }
    }

    setSugestoesIA(sugestao);

    // === 15-D.1: CLASSIFICACAO IA COM CONFIANCA (%) ===
    const classificacao = {
      confiancaGeral: 85,
      categoria: '', confiancaCategoria: 0,
      subcategoria: '', confiancaSubcategoria: 0,
      marca: '', confiancaMarca: 0,
      compatibilidade: '', confiancaCompatibilidade: 0,
      nome: '', confiancaNome: 0,
    };

    // Nome — confianca baseada no tamanho e padroes
    if (sugestao.nome && sugestao.nome.length > 5) {
      classificacao.nome = sugestao.nome;
      const hasPattern = /(de|da|do|para|por|com|sem)\s/.test(sugestao.nome);
      const hasNumber = /\d/.test(sugestao.nome);
      classificacao.confiancaNome = hasPattern && hasNumber ? 92 : hasPattern ? 85 : 70;
    }

    // Marca — confianca alta para marcas exatas, media para aproximadas
    if (sugestao.marca) {
      const marcasExatas = ['NGK', 'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Pirelli', 'Michelin', 'Bosch', 'Castrol', 'Mobil', '3M', 'DID', 'RK', 'KMC'];
      classificacao.marca = sugestao.marca;
      if (marcasExatas.some(m => m.toLowerCase() === sugestao.marca!.toLowerCase())) {
        classificacao.confiancaMarca = 98;
      } else if (marcasConhecidas.some(m => m.toLowerCase() === sugestao.marca!.toLowerCase())) {
        classificacao.confiancaMarca = 88;
      } else {
        classificacao.confiancaMarca = 65;
      }
    }

    // Categoria — confianca baseada em keywords
    for (const [cat, keywords] of Object.entries(catKeywords)) {
      const matchCount = keywords.filter(k => texto.toLowerCase().includes(k)).length;
      if (matchCount >= 2) {
        const encontrada = categorias.find(c => c.slug === cat || c.nome.toLowerCase().includes(cat));
        if (encontrada) {
          classificacao.categoria = encontrada.nome;
          classificacao.confiancaCategoria = matchCount >= 3 ? 95 : matchCount >= 2 ? 82 : 70;
          break;
        }
      } else if (matchCount === 1 && classificacao.confiancaCategoria < 65) {
        const encontrada = categorias.find(c => c.slug === cat || c.nome.toLowerCase().includes(cat));
        if (encontrada) {
          classificacao.categoria = encontrada.nome;
          classificacao.confiancaCategoria = 65;
        }
      }
    }

    // Compatibilidade — confianca alta para padroes conhecidos
    if (sugestao.compatibilidade) {
      classificacao.compatibilidade = sugestao.compatibilidade;
      const padrãoFortes = /\b(CG|CB|XRE|XTZ|Fazer|Factor|Bros|Twister|Titan|Pop|Biz|NXR|CRF|FZ|MT-|GS|Ninja)\s*\d{2,4}\b/i;
      classificacao.confiancaCompatibilidade = padrãoFortes.test(sugestao.compatibilidade) ? 95 : 70;
    }

    // Confianca geral: media ponderada das confiancas disponiveis
    const confs = [classificacao.confiancaNome, classificacao.confiancaMarca, classificacao.confiancaCategoria, classificacao.confiancaCompatibilidade]
      .filter(c => c > 0);
    if (confs.length > 0) {
      classificacao.confiancaGeral = Math.round(confs.reduce((a, b) => a + b, 0) / confs.length);
    }

    setClassificacaoIA(classificacao);
    setAnalisandoIA(false);
    setMsg('IA analisou o texto. Confira as sugestoes antes de salvar.');
  }

  function aplicarSugestoesIA() {
    if (!sugestoesIA) return;
    setForm((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(sugestoesIA).filter(([_, v]) => v !== undefined && v !== '')
      ),
    }));
    setMsgOk('Sugestoes da IA aplicadas! Revise os campos antes de salvar.');
    setModo('manual');
  }

  // ============================================================
  // DUPLICATE DETECTION
  // ============================================================
  async function verificarDuplicatas(): Promise<boolean> {
    const dups: DuplicataInfo[] = [];

    // Verifica por codigoBarras
    if (form.codigoBarras.trim()) {
      const res = await fetch(`/api/pecas?barcode=${encodeURIComponent(form.codigoBarras.trim())}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        dups.push({ tipo: 'barras', mensagem: `Codigo de barras ja cadastrado: ${data[0].nome} (SKU: ${data[0].codigo})`, peca: data[0] });
      }
    }

    // Verifica por codigo (SKU)
    if (form.codigo.trim()) {
      const res = await fetch(`/api/pecas?q=${encodeURIComponent(form.codigo.trim())}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const match = data.find((p: PecaExistente) => p.codigo.toLowerCase() === form.codigo.trim().toLowerCase());
        if (match) dups.push({ tipo: 'codigo', mensagem: `SKU ja cadastrado: ${match.nome}`, peca: match });
      }
    }

    // Verifica por nome (similar)
    if (form.nome.trim().length >= 4) {
      const res = await fetch(`/api/pecas?q=${encodeURIComponent(form.nome.trim())}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const nomeLower = form.nome.trim().toLowerCase();
        const similares = data.filter((p: PecaExistente) => {
          const pNome = p.nome.toLowerCase();
          // Similaridade simples: contem ou distancia de Levenshtein pequena
          return pNome.includes(nomeLower) || nomeLower.includes(pNome) ||
            (pNome.length > 5 && nomeLower.length > 5 &&
             pNome.slice(0, 4) === nomeLower.slice(0, 4));
        });
        for (const s of similares) {
          if (s.codigo !== form.codigo) {
            dups.push({ tipo: 'nome', mensagem: `Produto com nome similar encontrado: ${s.nome} (SKU: ${s.codigo})`, peca: s });
          }
        }
      }
    }

    // Verifica por fornecedor (se ambos nome e fornecedor batem)
    if (form.fornecedor.trim() && form.nome.trim().length >= 3) {
      const res = await fetch(`/api/pecas?q=${encodeURIComponent(form.nome.trim())}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const matchFornecedor = data.find((p: any) =>
          p.fornecedor && p.fornecedor.toLowerCase() === form.fornecedor.trim().toLowerCase()
        );
        if (matchFornecedor) {
          dups.push({ tipo: 'fornecedor', mensagem: `Mesmo nome e fornecedor: ${matchFornecedor.nome}`, peca: matchFornecedor });
        }
      }
    }

    // Remove duplicatas por pecaId
    const seen = new Set<string>();
    const unique = dups.filter((d) => {
      if (seen.has(d.peca.id)) return false;
      seen.add(d.peca.id);
      return true;
    });

    setDuplicatas(unique);
    if (unique.length > 0) {
      setMostrarDuplicatas(true);
      return false; // Tem duplicatas, nao salvar ainda
    }
    return true; // Sem duplicatas
  }

  // ============================================================
  // VALIDATE & SAVE
  // ============================================================
  async function handleSave(pecaExistenteId?: string) {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = 'Obrigatorio';
    if (!form.categoriaId) errs.categoriaId = 'Selecione uma categoria';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setMsg('Preencha os campos obrigatorios.');
      return;
    }

    // Gera codigo automatico se vazio
    let codigoFinal = form.codigo.trim();
    if (!codigoFinal) {
      const nomeClean = form.nome.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      codigoFinal = `AUTO-${nomeClean}-${rand}`;
      setForm((prev) => ({ ...prev, codigo: codigoFinal }));
    }

    setLoading(true);
    setMsg('');

    // Verificar duplicatas ANTES de salvar
    const ok = await verificarDuplicatas();
    if (!ok) {
      setLoading(false);
      return;
    }

    const dataToSend = {
      ...form,
      codigo: codigoFinal,
      pecaExistenteId,
    };
    const result = await onSave(dataToSend);

    setLoading(false);
    if (result.ok) {
      setSalvo(true);
      setMsgOk('Produto cadastrado com sucesso!');
      // Não fecha automaticamente para o usuário ver
    } else {
      setMsg(result.error || 'Erro ao salvar.');
    }
  }

  // ============================================================
  // SCANNER HANDLER
  // ============================================================
  function handleScannerDetected(code: string) {
    setShowScanner(false);
    setForm((prev) => ({ ...prev, codigoBarras: code }));
    setMsgOk(`Codigo de barras detectado: ${code}`);
    setModo('manual');
  }

  // ============================================================
  // FOTO HANDLER
  // ============================================================
  function handleFoto(file: File) {
    const url = URL.createObjectURL(file);
    setFotoPreview(url);
    // Simulação: em produção, enviaria para API de OCR
    setModo('manual');
    setMsg('Imagem capturada. Use o modo IA para analisar a imagem ou preencha manualmente.');
  }

  if (!open) return null;

  const fmTabs: { key: ModoEntrada; label: string; icon: string }[] = [
    { key: 'manual', label: 'Manual', icon: '✏️' },
    { key: 'scanner', label: 'Scanner', icon: '📷' },
    { key: 'ia', label: 'IA', icon: '🧠' },
    { key: 'foto', label: 'Foto', icon: '📸' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl my-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Cadastro Inteligente</h2>
              <p className="text-xs text-slate-400">Cadastre produtos por qualquer metodo de entrada</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 px-5 pt-4 pb-2 border-b border-slate-50">
          {fmTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setModo(t.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                modo === t.key
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="px-5 pt-3 space-y-2">
          {msgOk && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-bold">
              {msgOk}
            </div>
          )}
          {msg && !msgOk && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-xs">
              {msg}
            </div>
          )}
        </div>

        {/* IA MODE */}
        {modo === 'ia' && (
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-500">
              Descreva o produto em linguagem natural. A IA identifica nome, quantidade, preco, marca e categoria.
            </p>
            <textarea
              value={textoIA}
              onChange={(e) => setTextoIA(e.target.value)}
              className="input-field text-xs min-h-[120px]"
              placeholder={'Exemplos:\n\n"Chegaram 10 litros de oleo 20W50 Motul a R$ 32,90"\n"5 pastilhas de freio dianteira para CG 160"\n"2 pneus 90/90-18 Pirelli por R$ 220 cada"\n"Kit relacao DID para Fazer 250 — 3 unidades"'}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={analisarTextoIA}
                disabled={analisandoIA || !textoIA.trim()}
                className="btn-primary text-xs"
              >
                {analisandoIA ? 'Analisando...' : '🧠 Analisar com IA'}
              </button>
            </div>

            {/* CLASSIFICACAO IA COM CONFIANCA */}
            {classificacaoIA && (
              <div className="card bg-white border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-800">Classificacao IA</h4>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    classificacaoIA.confiancaGeral >= 90 ? 'bg-emerald-50 text-emerald-700' :
                    classificacaoIA.confiancaGeral >= 75 ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      classificacaoIA.confiancaGeral >= 90 ? 'bg-emerald-500' :
                      classificacaoIA.confiancaGeral >= 75 ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    {classificacaoIA.confiancaGeral}% confianca
                  </span>
                </div>

                <div className="space-y-2.5">
                  {classificacaoIA.nome && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📛</span>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Nome</p>
                          <p className="text-xs font-medium text-slate-700 truncate max-w-[300px]">{classificacaoIA.nome}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{classificacaoIA.confiancaNome}%</span>
                    </div>
                  )}
                  {classificacaoIA.categoria && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📂</span>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Categoria</p>
                          <p className="text-xs font-medium text-slate-700">{classificacaoIA.categoria}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        classificacaoIA.confiancaCategoria >= 85 ? 'text-emerald-600 bg-emerald-50' :
                        classificacaoIA.confiancaCategoria >= 70 ? 'text-amber-600 bg-amber-50' :
                        'text-red-600 bg-red-50'
                      }`}>{classificacaoIA.confiancaCategoria}%</span>
                    </div>
                  )}
                  {classificacaoIA.marca && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🏷️</span>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Marca</p>
                          <p className="text-xs font-medium text-slate-700">{classificacaoIA.marca}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        classificacaoIA.confiancaMarca >= 85 ? 'text-emerald-600 bg-emerald-50' :
                        classificacaoIA.confiancaMarca >= 70 ? 'text-amber-600 bg-amber-50' :
                        'text-red-600 bg-red-50'
                      }`}>{classificacaoIA.confiancaMarca}%</span>
                    </div>
                  )}
                  {classificacaoIA.compatibilidade && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🏍️</span>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase">Compatibilidade</p>
                          <p className="text-xs font-medium text-slate-700">{classificacaoIA.compatibilidade}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        classificacaoIA.confiancaCompatibilidade >= 85 ? 'text-emerald-600 bg-emerald-50' :
                        classificacaoIA.confiancaCompatibilidade >= 70 ? 'text-amber-600 bg-amber-50' :
                        'text-red-600 bg-red-50'
                      }`}>{classificacaoIA.confiancaCompatibilidade}%</span>
                    </div>
                  )}

                  {/* Baixa confianca — aviso */}
                  {classificacaoIA.confiancaGeral < 80 && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 mt-2">
                      <p className="text-[10px] text-amber-700">
                        ⚠️ Confianca baixa ({classificacaoIA.confiancaGeral}%). Verifique os dados manualmente antes de salvar.
                        A IA sugere mas nao altera automaticamente — a confirmacao do operador e sempre necessaria.
                      </p>
                    </div>
                  )}
                </div>

                {sugestoesIA && (
                  <button
                    onClick={aplicarSugestoesIA}
                    className="btn-primary text-xs mt-4 w-full"
                  >
                    Aplicar sugestoes e revisar
                  </button>
                )}
              </div>
            )}

            {/* SUGESTOES SIMPLES (quando nao tem classificacao) */}
            {sugestoesIA && !classificacaoIA && (
              <div className="card bg-brand-50 border-brand-200">
                <h4 className="text-sm font-bold text-brand-800 mb-3">Sugestoes da IA</h4>
                <div className="space-y-2 text-xs">
                  {sugestoesIA.nome && <p><strong>Nome:</strong> {sugestoesIA.nome}</p>}
                  {sugestoesIA.codigo && <p><strong>Codigo:</strong> <span className="font-mono">{sugestoesIA.codigo}</span></p>}
                  {sugestoesIA.quantidade && <p><strong>Quantidade:</strong> {sugestoesIA.quantidade}</p>}
                  {sugestoesIA.precoCusto && <p><strong>Preco custo:</strong> R$ {sugestoesIA.precoCusto}</p>}
                  {sugestoesIA.marca && <p><strong>Marca:</strong> {sugestoesIA.marca}</p>}
                  {sugestoesIA.compatibilidade && <p><strong>Compatibilidade:</strong> {sugestoesIA.compatibilidade}</p>}
                  {sugestoesIA.categoriaId && (
                    <p><strong>Categoria:</strong> {categorias.find(c => c.id === sugestoesIA.categoriaId)?.nome || sugestoesIA.categoriaId}</p>
                  )}
                </div>
                <button
                  onClick={aplicarSugestoesIA}
                  className="btn-primary text-xs mt-4 w-full"
                >
                  Aplicar sugestoes e revisar
                </button>
              </div>
            )}
          </div>
        )}

        {/* FOTO MODE */}
        {modo === 'foto' && (
          <div className="p-5 space-y-4 text-center">
            <p className="text-xs text-slate-500">
              Tire uma foto da etiqueta, nota fiscal ou embalagem do produto.
            </p>
            {fotoPreview ? (
              <div className="space-y-3">
                <img src={fotoPreview} alt="Preview" className="max-h-64 mx-auto rounded-xl border border-slate-200" />
                <p className="text-xs text-slate-400">Imagem capturada. Analise com IA ou preencha manualmente.</p>
                <button onClick={() => setFotoPreview(null)} className="btn-secondary text-xs">
                  Tirar outra foto
                </button>
              </div>
            ) : (
              <button
                onClick={() => fotoInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-brand-300 hover:bg-brand-50/30 transition-all cursor-pointer"
              >
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-500">Clique para capturar foto</p>
                <p className="text-xs text-slate-400 mt-1">JPEG, PNG</p>
              </button>
            )}
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFoto(f);
              }}
            />
          </div>
        )}

        {/* MANUAL FORM (and SCANNER mode shows the button) */}
        {(modo === 'manual' || modo === 'scanner') && (
          <div className="p-5">
            {modo === 'scanner' && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                <button
                  onClick={() => setShowScanner(true)}
                  className="btn-primary text-xs inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Abrir Scanner Universal
                </button>
                <p className="text-xs text-slate-500">USB, Bluetooth, Camera ou Manual</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {/* Categoria */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 uppercase">Categoria *</label>
                <select
                  value={form.categoriaId}
                  onChange={(e) => update('categoriaId', e.target.value)}
                  className={`input-field mt-1.5 text-xs ${errors.categoriaId ? 'border-red-300 bg-red-50' : ''}`}
                >
                  <option value="">Selecionar categoria</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                {errors.categoriaId && <p className="text-[10px] text-red-500 mt-1">{errors.categoriaId}</p>}
              </div>

              {/* Nome */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 uppercase">Nome do produto *</label>
                <input
                  value={form.nome}
                  onChange={(e) => update('nome', e.target.value)}
                  className={`input-field mt-1.5 text-xs ${errors.nome ? 'border-red-300 bg-red-50' : ''}`}
                  placeholder="Ex: Pastilha de freio dianteira"
                  autoFocus
                />
                {errors.nome && <p className="text-[10px] text-red-500 mt-1">{errors.nome}</p>}
              </div>

              {/* Codigo */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">SKU / Codigo</label>
                <input
                  value={form.codigo}
                  onChange={(e) => update('codigo', e.target.value)}
                  className="input-field mt-1.5 text-xs font-mono"
                  placeholder="Auto-gerado se vazio"
                />
              </div>

              {/* Codigo de Barras */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Cod. Barras</label>
                <input
                  value={form.codigoBarras}
                  onChange={(e) => update('codigoBarras', e.target.value)}
                  className="input-field mt-1.5 text-xs font-mono"
                  placeholder="Leitura do scanner"
                />
              </div>

              {/* Marca */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Marca</label>
                <input
                  value={form.marca}
                  onChange={(e) => update('marca', e.target.value)}
                  className="input-field mt-1.5 text-xs"
                  placeholder="Ex: NGK, ProTork"
                />
              </div>

              {/* Fornecedor */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Fornecedor</label>
                <input
                  value={form.fornecedor}
                  onChange={(e) => update('fornecedor', e.target.value)}
                  className="input-field mt-1.5 text-xs"
                  placeholder="Nome do fornecedor"
                />
              </div>

              {/* Compatibilidade */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Compatibilidade</label>
                <input
                  value={form.compatibilidade}
                  onChange={(e) => update('compatibilidade', e.target.value)}
                  className="input-field mt-1.5 text-xs"
                  placeholder="Ex: CG 160 2018-2022"
                />
              </div>

              {/* Localizacao */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Localizacao</label>
                <input
                  value={form.localizacao}
                  onChange={(e) => update('localizacao', e.target.value)}
                  className="input-field mt-1.5 text-xs"
                  placeholder="Ex: A-03-B-02"
                />
              </div>

              {/* Preco Custo */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Preco Custo</label>
                <input
                  type="number" step="0.01"
                  value={form.precoCusto}
                  onChange={(e) => update('precoCusto', e.target.value)}
                  className="input-field mt-1.5 text-xs"
                  placeholder="0,00"
                />
              </div>

              {/* Preco Venda */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Preco Venda</label>
                <input
                  type="number" step="0.01"
                  value={form.precoVenda}
                  onChange={(e) => update('precoVenda', e.target.value)}
                  className="input-field mt-1.5 text-xs"
                  placeholder="0,00"
                />
              </div>

              {/* Quantidade Central */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Qtd Central</label>
                <input
                  type="number" min="0"
                  value={form.quantidade}
                  onChange={(e) => update('quantidade', e.target.value)}
                  className="input-field mt-1.5 text-xs text-center font-bold"
                />
              </div>

              {/* Quantidade Loja */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Qtd Loja</label>
                <input
                  type="number" min="0"
                  value={form.quantidadeLoja}
                  onChange={(e) => update('quantidadeLoja', e.target.value)}
                  className="input-field mt-1.5 text-xs text-center font-bold"
                />
              </div>

              {/* Estoque Minimo */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Estoque Minimo</label>
                <input
                  type="number" min="1"
                  value={form.estoqueMinimo}
                  onChange={(e) => update('estoqueMinimo', e.target.value)}
                  className="input-field mt-1.5 text-xs text-center font-bold"
                />
              </div>

              {/* Descricao */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 uppercase">Descricao / Observacoes</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => update('descricao', e.target.value)}
                  className="input-field mt-1.5 text-xs"
                  rows={2}
                  placeholder="Informacoes adicionais..."
                />
              </div>
            </div>
          </div>
        )}

        {/* DUPLICATE WARNING */}
        {mostrarDuplicatas && duplicatas.length > 0 && (
          <div className="mx-5 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-sm font-bold text-amber-800">Possiveis duplicatas encontradas</h4>
            </div>
            <div className="space-y-2 mb-3">
              {duplicatas.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                  <div>
                    <p className="text-xs text-slate-700">{d.mensagem}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      {d.tipo === 'codigo' && 'Este SKU ja esta em uso'}
                      {d.tipo === 'barras' && 'Este codigo de barras ja esta em uso'}
                      {d.tipo === 'nome' && 'Este nome e similar a um produto existente'}
                      {d.tipo === 'fornecedor' && 'Mesmo produto e fornecedor detectado'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSave(d.peca.id)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors flex-shrink-0 ml-3"
                  >
                    Atualizar existente
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setMostrarDuplicatas(false); setDuplicatas([]); handleSave(); }}
                className="btn-primary text-xs"
              >
                Cadastrar mesmo assim
              </button>
              <button
                onClick={() => setMostrarDuplicatas(false)}
                className="btn-secondary text-xs"
              >
                Revisar dados
              </button>
            </div>
          </div>
        )}

        {/* SAVED STATE */}
        {salvo && (
          <div className="mx-5 mb-4 p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-emerald-800 mb-1">Produto cadastrado!</h3>
            <p className="text-xs text-emerald-600 mb-4">O produto foi adicionado ao estoque central.</p>
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={() => {
                  setForm({ ...FORM_VAZIO, categoriaId: form.categoriaId, estoqueMinimo: '5' });
                  setSalvo(false); setMsgOk(''); setSugestoesIA(null); setDuplicatas([]);
                }}
                className="btn-primary text-xs"
              >
                Cadastrar outro
              </button>
              <button onClick={onClose} className="btn-secondary text-xs">
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!salvo && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
            <button onClick={onClose} className="btn-secondary text-xs" disabled={loading}>
              Cancelar
            </button>
            <button
              onClick={() => handleSave()}
              disabled={loading}
              className="btn-primary text-xs px-6"
            >
              {loading ? 'Salvando...' : 'Cadastrar Produto'}
            </button>
          </div>
        )}

        {/* Scanner overlay */}
        {showScanner && (
          <ScannerUniversal
            onDetected={handleScannerDetected}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </div>
  );
}
