import type { ParsedCommand, InterpretationTrace } from '@/components/assistente-ia/Types/assistente.types';
import { INTENT_STYLES } from './constants';

export function converterNumerosExtenso(texto: string): string {
  const mapa: Record<string, string> = {
    'zero': '0', 'um': '1', 'uma': '1', 'dois': '2', 'duas': '2',
    'três': '3', 'tres': '3', 'quatro': '4', 'cinco': '5',
    'seis': '6', 'sete': '7', 'oito': '8', 'nove': '9',
    'dez': '10', 'onze': '11', 'doze': '12', 'treze': '13',
    'quatorze': '14', 'catorze': '14', 'quinze': '15',
    'vinte': '20', 'trinta': '30', 'quarenta': '40',
    'cinquenta': '50', 'sessenta': '60', 'setenta': '70',
    'oitenta': '80', 'noventa': '90', 'cem': '100', 'cento': '100',
  };
  let result = texto;
  result = result.replace(/vinte e (\w+)/gi, (_m: string, u: string) => String(20 + (parseInt(mapa[u.toLowerCase()]) || 0)));
  result = result.replace(/trinta e (\w+)/gi, (_m: string, u: string) => String(30 + (parseInt(mapa[u.toLowerCase()]) || 0)));
  result = result.replace(/quarenta e (\w+)/gi, (_m: string, u: string) => String(40 + (parseInt(mapa[u.toLowerCase()]) || 0)));
  result = result.replace(/cinquenta e (\w+)/gi, (_m: string, u: string) => String(50 + (parseInt(mapa[u.toLowerCase()]) || 0)));
  result = result.replace(/sessenta e (\w+)/gi, (_m: string, u: string) => String(60 + (parseInt(mapa[u.toLowerCase()]) || 0)));
  result = result.replace(/setenta e (\w+)/gi, (_m: string, u: string) => String(70 + (parseInt(mapa[u.toLowerCase()]) || 0)));
  result = result.replace(/oitenta e (\w+)/gi, (_m: string, u: string) => String(80 + (parseInt(mapa[u.toLowerCase()]) || 0)));
  result = result.replace(/noventa e (\w+)/gi, (_m: string, u: string) => String(90 + (parseInt(mapa[u.toLowerCase()]) || 0)));
  for (const [extenso, digito] of Object.entries(mapa)) {
    const regex = new RegExp(`\\b${extenso}\\b`, 'gi');
    result = result.replace(regex, digito);
  }
  return result;
}

export function parseComando(texto: string): ParsedCommand {
  const t = converterNumerosExtenso(texto.toLowerCase().trim());
  const base = { raw: texto, confianca: 50, matchedPattern: 'fallback' };

  // --- ADICIONAR ---
  const addPatterns = [
    /(?:adicionar|cadastrar|criar|incluir|dar entrada em?|registrar entrada de?|chegou|chegaram|cadastre)\s+(\d+)\s*(?:unidades?|un\.?|litros?|l|kits?|pecas?|peças?|itens?)?\s*(?:de\s+)?(.+)/i,
    /(?:adicionar|cadastrar|criar|incluir)\s+(?:nov[oa]s?\s+)?(?:produto|peca|peça|item)\s+(.+)/i,
    /(?:quero|preciso|vou)\s+(?:adicionar|cadastrar|criar)\s+(\d+)\s*(?:unidades?|un\.?|litros?|l)?\s*(?:de\s+)?(.+)/i,
    /(?:cadastre|adicione|crie|inclua|cadastra)\s+(?:o\s+)?(?:produto|a\s+peca|a\s+peça|um\s+novo)\s+(.+)/i,
  ];
  for (let i = 0; i < addPatterns.length; i++) {
    const m = t.match(addPatterns[i]);
    if (m) {
      const qtd = parseInt(m[1]) || 1;
      const nome = (m[2] || m[1] || '').trim();
      return { ...base, intent: 'adicionar', quantidade: qtd, produto: nome, confianca: i === 0 ? 98 : i === 1 ? 88 : 85, matchedPattern: `add_pattern_${i}` };
    }
  }

  // --- ALTERAR PREÇO ---
  const precoPatterns = [
    /(?:alterar|mudar|trocar|ajustar|atualizar|modificar)\s+(?:o\s+)?(?:preco|preço|valor)\s+(?:de|do|da|d'|d"?\s*)?(.+?)\s+(?:para|por)\s+(?:R\$?\s*)?(\d+[.,]?\d*)/i,
    /(?:altere|mude|troque|ajuste|atualize|muda)\s+(?:o\s+)?(?:preco|preço|valor)\s+(?:de|do|da|d'|d"?\s*)?(.+?)\s+(?:para|por)\s+(?:R\$?\s*)?(\d+[.,]?\d*)/i,
    /(?:esse|este|o|a)\s+(?:produto|item|peca|peça|filtro)\s+(.+?)\s+(?:agora|passou\s+a|vai)\s+(?:custa|custar)\s+(?:R\$?\s*)?(\d+[.,]?\d*)/i,
    /(.+?)\s+(?:agora|passou\s+a|vai|deveria)\s+(?:custa|custar|ser)\s+(?:R\$?\s*)?(\d+[.,]?\d*)/i,
    /(?:quero|preciso|vou)\s+(?:alterar|mudar|trocar)\s+(?:o\s+)?(?:preco|preço|valor)\s+(?:de|do|da|d'|d"?\s*)?(.+?)\s+(?:para|por)\s+(?:R\$?\s*)?(\d+[.,]?\d*)/i,
    /(?:preco|preço|valor)\s+(?:de|do|da|d'|d"?\s*)?(.+?)\s+(?:novo|atualizado|corrigido).*?(?:R\$?\s*)?(\d+[.,]?\d*)/i,
    /(?:mud[ao]|altera|troca|ajusta|atualiza)\s+(?:o\s+)?(?:preco|preço|valor)\s+(?:do|da|de)\s+(.+?)\s+(?:para|por|pra)\s+(?:R\$?\s*)?(\d+[.,]?\d*)/i,
  ];
  for (let i = 0; i < precoPatterns.length; i++) {
    const m = t.match(precoPatterns[i]);
    if (m) return { ...base, intent: 'alterar_preco', produto: m[1].trim(), preco: parseFloat(m[2].replace(',', '.')), confianca: i === 0 ? 98 : i <= 3 ? 92 : 86, matchedPattern: `preco_pattern_${i}` };
  }

  // --- ALTERAR QUANTIDADE ---
  const qtdPatterns = [
    /(?:trocar|alterar|mudar|ajustar|atualizar|corrigir|modificar)\s+(?:a\s+)?(?:quantidade|estoque|qtd)\s+(?:de|do|da|d'|d"?\s*)?(.+?)\s+(?:para|por)\s+(\d+)/i,
    /(?:troque|altere|mude|ajuste|atualize|corrija|troca|muda)\s+(?:a\s+)?(?:quantidade|estoque|qtd)\s+(?:de|do|da|d'|d"?\s*)?(.+?)\s+(?:para|por)\s+(\d+)/i,
    /(?:agora tem|tem agora|passou a ter|ficou com)\s+(\d+)\s*(?:unidades?|un\.?|pecas?|peças?|itens?)\s+(?:de\s+)?(.+)/i,
    /(?:quero|preciso|vou)\s+(?:alterar|mudar|trocar)\s+(?:a\s+)?(?:quantidade|estoque|qtd)\s+(?:de|do|da|d'|d"?\s*)?(.+?)\s+(?:para|por)\s+(\d+)/i,
    /(?:estoque|quantidade)\s+(?:de|do|da|d'|d"?\s*)?(.+?)\s+(?:atualizado|corrigido|novo).*?(\d+)/i,
  ];
  for (let i = 0; i < qtdPatterns.length; i++) {
    const m = t.match(qtdPatterns[i]);
    if (m) return { ...base, intent: 'alterar_qtd', produto: i === 2 ? m[2].trim() : m[1].trim(), quantidade: i === 2 ? parseInt(m[1]) : parseInt(m[2]), confianca: i === 0 ? 98 : i <= 2 ? 92 : 86, matchedPattern: `qtd_pattern_${i}` };
  }

  // --- INTENTS DE ESTOQUE / RELATÓRIO ---
  if (/(?:mostrar|ver|listar|exibir|quais|consulte|mostra|ve|lista|exibe)\s+(?:pecas|produtos|itens)\s+(?:com\s+)?(?:estoque\s+)?baix[oa]/i.test(t) || /estoque\s+baixo/i.test(t) || /(?:produtos|pecas|itens)\s+(?:acabando|no\s+fim|critic[oa]s)/i.test(t) || /(?:abaixo\s+do\s+minimo|nivel\s+critico|precisa\s+repor|reposicao|reposição|ta\s+acabando|tá\s+acabando)/i.test(t)) { return { ...base, intent: 'mostrar_baixo', confianca: 96, matchedPattern: 'baixo' }; }
  if (/(?:mostrar|ver|listar|exibir|quais|mostra|ve|lista)\s+(?:pecas|produtos|itens)\s+(?:sem|zerad[oa]s?|com\s+estoque\s+zero|esgotad[oa]s?)/i.test(t) || /sem\s+estoque/i.test(t) || /zerad[oa]s/i.test(t) || /(?:produtos|pecas|itens)\s+(?:faltando|esgotad[oa]s?|zerad[oa]s?|acabou|acabaram)/i.test(t) || /(?:esse\s+)?produto\s+acabou/i.test(t)) { return { ...base, intent: 'mostrar_zerado', confianca: 96, matchedPattern: 'zerado' }; }
  if (/(?:mais\s+vendidos|produtos\s+mais\s+vendidos|top\s+vendas|ranking|o\s+que\s+mais\s+vendeu?|mostra\s+os\s+mais\s+vendidos)/i.test(t) || /(?:relatorio|relatório)\s+(?:de\s+)?(?:vendas|saidas|saídas)/i.test(t) || /(?:gerar|gerar\s+relatorio|relatorio|relatório|gera\s+relatorio)\s*(?:de\s+vendas)?$/i.test(t)) { return { ...base, intent: 'mostrar_vendidos', confianca: 96, matchedPattern: 'vendidos' }; }
  if (/(?:parados|sem\s+movimentacao|sem\s+movimentação|encalhados|sem\s+saida|sem\s+saída)/i.test(t) || /(?:estoque\s+parado|produtos\s+parados|nao\s+vende|não\s+vende|quais\s+(?:estao|estão)\s+parados)/i.test(t)) { return { ...base, intent: 'mostrar_parados', confianca: 96, matchedPattern: 'parados' }; }

  // --- BUSCA ---
  const buscaExplicita = t.match(/(?:buscar|pesquisar|procurar|achar|encontrar|mostrar|ver|consultar|localizar|busca|pesquisa|procura|acha|encontra|mostra|ve|consulta|onde\s+(?:esta|está|fica|tá|ta)|me\s+(?:mostre|ache|encontre|de|mostra|acha)|tem\s+(?:o\s+)?|quero\s+(?:ver|encontrar|saber\s+de))\s+(.+)/i);
  if (buscaExplicita) return { ...base, intent: 'buscar', produto: buscaExplicita[1].trim(), confianca: 92, matchedPattern: 'busca_explicita' };
  const buscaDireta = t.match(/^(?:me\s+)?(?:mostra|procura|busca|pesquisa|ache|encontra|tem)\s+(.+)/i);
  if (buscaDireta) return { ...base, intent: 'buscar', produto: buscaDireta[1].trim(), confianca: 90, matchedPattern: 'busca_direta' };
  const codigoMatch = t.match(/(?:codigo|código)\s+(?:de\s+)?(?:barras\s+)?(\d{8,14})/i);
  if (codigoMatch) return { ...base, intent: 'buscar', produto: codigoMatch[1], confianca: 98, matchedPattern: 'codigo_barras' };
  if (/abre?\s+(?:o\s+)?scanner/i.test(t)) { return { ...base, intent: 'ajudar', confianca: 92, matchedPattern: 'abrir_scanner' }; }
  if (/(?:ajuda|help|oque|o que|como|comandos|o\s+que\s+voce\s+faz|o\s+que\s+você\s+faz|como\s+(?:usar|funciona|te\s+ajudar)|me\s+ajud[ae])/i.test(t) && t.length < 50) { return { ...base, intent: 'ajudar', confianca: 94, matchedPattern: 'ajuda' }; }
  if (t.length > 3) return { ...base, intent: 'buscar', produto: texto, confianca: 60, matchedPattern: 'fallback_busca' };
  return { ...base, intent: 'desconhecido', confianca: 30, matchedPattern: 'desconhecido' };
}

export function gerarTrace(parsed: ParsedCommand, frase: string, sucesso: boolean, resumo: string): InterpretationTrace {
  const style = INTENT_STYLES[parsed.intent] || INTENT_STYLES.desconhecido;
  const params: string[] = [];
  if (parsed.produto) params.push(`Produto: "${parsed.produto}"`);
  if (parsed.quantidade) params.push(`Qtd: ${parsed.quantidade}`);
  if (parsed.preco) params.push(`Preço: R$ ${parsed.preco.toFixed(2).replace('.', ',')}`);
  return {
    frase: frase.length > 70 ? frase.slice(0, 67) + '...' : frase,
    intent: parsed.intent, intentLabel: style.label,
    acao: style.icon + ' ' + style.label, confianca: parsed.confianca,
    params, sucesso,
    resumo: resumo.length > 80 ? resumo.slice(0, 77) + '...' : resumo,
    icon: style.icon,
  };
}

export function corConfianca(v: number): string { if (v >= 90) return 'bg-emerald-500'; if (v >= 75) return 'bg-lime-500'; if (v >= 60) return 'bg-amber-500'; if (v >= 40) return 'bg-orange-500'; return 'bg-red-500'; }
export function textoConfianca(v: number): string { if (v >= 90) return 'text-emerald-600'; if (v >= 75) return 'text-lime-600'; if (v >= 60) return 'text-amber-600'; return 'text-red-600'; }
