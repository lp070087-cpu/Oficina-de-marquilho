import type { ScannerStatus } from '@/components/assistente-ia/Types/scanner.types';

export function corStatusScanner(status: ScannerStatus): string {
  switch (status) { case 'pronto': return 'bg-emerald-50 text-emerald-700 border-emerald-200'; case 'aguardando': return 'bg-amber-50 text-amber-700 border-amber-200'; case 'desconectado': return 'bg-slate-100 text-slate-400 border-slate-200'; }
}
export function bolinhaStatus(status: ScannerStatus): string { switch (status) { case 'pronto': return 'bg-emerald-500'; case 'aguardando': return 'bg-amber-500 animate-pulse'; case 'desconectado': return 'bg-slate-300'; } }
export function labelStatus(status: ScannerStatus): string { switch (status) { case 'pronto': return 'Pronto'; case 'aguardando': return 'Aguardando'; case 'desconectado': return 'Desconectado'; } }
