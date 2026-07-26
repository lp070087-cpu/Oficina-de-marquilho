'use client';
import { useMemo } from 'react';

interface Sugestao { label: string; comando: string; icon: string; match: string; }

export function obterSugestoes(texto: string): Sugestao[] {
  if (!texto || texto.trim().length < 1) return [];
  const t = texto.toLowerCase().trim();
  const todas: Sugestao[] = [
    { label: 'Alterar preço', comando: 'Alterar preco de ', icon: '💰', match: 'alterar preço preco valor mudar trocar atualizar custa atualize' },
    { label: 'Atualizar valor', comando: 'Atualize o valor de ', icon: '💲', match: 'atualizar valor preco preço custa' },
    { label: 'Ajustar quantidade', comando: 'Trocar quantidade de ', icon: '🔢', match: 'quantidade qtd ajustar trocar mudar estoque alterar' },
    { label: 'Cadastrar produto', comando: 'Adicionar ', icon: '➕', match: 'adicionar cadastrar criar incluir novo produto peça dar entrada' },
    { label: 'Cadastro Inteligente', comando: 'Abrir cadastro inteligente', icon: '🧠', match: 'cadastro inteligente ficha completo detalhado' },
    { label: 'Buscar peça', comando: 'Buscar ', icon: '🔍', match: 'buscar pesquisar procurar achar encontrar localizar onde ver consultar mostrar tem me ache' },
    { label: 'Consultar código', comando: 'Buscar codigo de barras ', icon: '📷', match: 'codigo cod barras ean gtin sku' },
    { label: 'Estoque baixo', comando: 'Mostrar produtos com estoque baixo', icon: '⚠️', match: 'baixo acabando pouco critico reposição minimo' },
    { label: 'Sem estoque', comando: 'Mostrar produtos sem estoque', icon: '🚫', match: 'sem estoque zerado zerada faltando esgotado vazio acabou' },
    { label: 'Mais vendidos', comando: 'Mostrar produtos mais vendidos', icon: '🔥', match: 'vendidos ranking top vendas saiu mais relatorio' },
    { label: 'Produtos parados', comando: 'Mostrar produtos parados', icon: '⏸️', match: 'parados parado encalhado sem movimento parada quais estao' },
    { label: 'Ajuda', comando: 'Ajuda', icon: '❓', match: 'ajuda help comandos como oque que faz' },
  ];
  const pontuadas = todas.map(s => {
    let score = 0;
    const palavras = s.match.split(' ');
    for (const p of palavras) { if (t.includes(p)) score += p.length >= 3 ? 3 : 1; }
    for (const p of palavras) { if (t.startsWith(p)) score += 2; }
    return { ...s, score };
  });
  return pontuadas.filter(s => (s as any).score > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 6);
}

export function useSugestoes(input: string) {
  return useMemo(() => obterSugestoes(input), [input]);
}
