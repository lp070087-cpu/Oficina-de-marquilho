'use client';
export type ScannerOrigem = 'usb' | 'bluetooth' | 'camera';
export type ScannerStatus = 'pronto' | 'aguardando' | 'desconectado';

export interface ScannerLeitura {
  id: string; codigo: string; horario: Date; origem: ScannerOrigem;
}

export interface ScannerDispositivo {
  tipo: ScannerOrigem; label: string; icon: string; status: ScannerStatus; cor: string;
}

export const SCANNER_DISPOSITIVOS_INICIAL: ScannerDispositivo[] = [
  { tipo: 'usb', label: 'Scanner USB', icon: '🔌', status: 'pronto', cor: 'emerald' },
  { tipo: 'bluetooth', label: 'Scanner Bluetooth', icon: '📡', status: 'pronto', cor: 'blue' },
  { tipo: 'camera', label: 'Câmera do Celular', icon: '📷', status: 'pronto', cor: 'purple' },
];
