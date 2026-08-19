'use client';

import { useEffect } from 'react';
import { getClienteVitrine } from '@/lib/vitrine-session';

/**
 * Componente invisível que registra a visualização de um produto e o histórico
 * de navegação do cliente logado. Inserido na página de produto (server component)
 * para alimentar os endpoints de "mais vistos" e "vistos recentemente".
 *
 * Analytics é silencioso — nunca deve quebrar a UX (os fetch têm catch).
 */
export default function RegistrarVisualizacao({ pecaId }: { pecaId: string }) {
  useEffect(() => {
    // Sessão da aba (sessionStorage 'marquinho-busca-sessao' é só um id aleatório).
    // Se não existir, gera um para agregar visualizações anônimas na mesma aba.
    let sessao = sessionStorage.getItem('marquinho-sessao');
    if (!sessao) {
      sessao = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem('marquinho-sessao', sessao);
    }

    // Busca o token do cliente (se logado) para registrar clienteId no servidor.
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const c = getClienteVitrine();
    if (c?.token) headers.Authorization = `Bearer ${c.token}`;

    // Visualização (analytics — alimenta "mais vendidos"/"recomendados")
    fetch('/api/vitrine/visualizacoes', {
      method: 'POST', headers,
      body: JSON.stringify({ pecaId, sessao, origem: 'produto' }),
    }).catch(() => { /* silencioso */ });

    // Histórico de navegação (só se logado; a rota já valida o JWT)
    if (c?.token) {
      fetch('/api/vitrine/historico', {
        method: 'POST', headers,
        body: JSON.stringify({ pecaId }),
      }).catch(() => { /* silencioso */ });
    }
  }, [pecaId]);

  return null;
}
