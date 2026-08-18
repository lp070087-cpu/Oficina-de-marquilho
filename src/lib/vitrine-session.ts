/**
 * Sessão do cliente na Vitrine — helper central de leitura/escrita.
 *
 * Correção 2026-08-18 (DONA): "Manter conectado" deve REALMENTE funcionar.
 *  - checked  → grava em localStorage (persiste entre abas e reinícios do navegador)
 *  - unchecked → grava apenas em sessionStorage (expira ao fechar a aba)
 *
 * A LEITURA sempre procura primeiro em localStorage (sessão persistente) e faz
 * fallback para sessionStorage (sessão da aba), para que os dois fluxos
 * continuem funcionando sem quebrar carrinho nem sessão.
 */

export const CHAVE_CLIENTE = 'marquinho-cliente';
export const CHAVE_CARRINHO = 'marquinho-cart';

/** Lê o cliente logado, priorizando a sessão persistente (localStorage). */
export function getClienteVitrine(): any | null {
  try {
    const s = localStorage.getItem(CHAVE_CLIENTE);
    if (s) return JSON.parse(s);
  } catch { /* SSR/privacy — segue para sessionStorage */ }
  try {
    const s = sessionStorage.getItem(CHAVE_CLIENTE);
    if (s) return JSON.parse(s);
  } catch { /* nada */ }
  return null;
}

/**
 * Grava o cliente logado com FONTE ÚNICA por modo (auditoria 2026-08-18 da DONA).
 *  - persistir=true  ("Manter conectado") → SOMENTE localStorage (persiste entre abas/reinícios)
 *  - persistir=false (sem manter)         → SOMENTE sessionStorage (expira ao fechar a aba)
 * Ao trocar de modo, remove o storage do outro modo — nunca duplica a sessão.
 */
export function setClienteVitrine(dados: any, persistir: boolean): void {
  const str = JSON.stringify(dados);
  if (persistir) {
    localStorage.setItem(CHAVE_CLIENTE, str);
    try { sessionStorage.removeItem(CHAVE_CLIENTE); } catch { /* */ }
  } else {
    sessionStorage.setItem(CHAVE_CLIENTE, str);
    try { localStorage.removeItem(CHAVE_CLIENTE); } catch { /* */ }
  }
}

/** Remove a sessão do cliente dos DOIS storages (logout completo). */
export function clearClienteVitrine(): void {
  try { localStorage.removeItem(CHAVE_CLIENTE); } catch { /* */ }
  try { sessionStorage.removeItem(CHAVE_CLIENTE); } catch { /* */ }
}
