'use client';

import { useEffect } from 'react';

export default function EntradaPwa() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname !== '/' || url.searchParams.has('app')) return;

    // Instalações antigas ainda podem abrir o endereço anterior do manifest.
    const ios = navigator as Navigator & { standalone?: boolean };
    if (!window.matchMedia('(display-mode: standalone)').matches && !ios.standalone) return;

    url.searchParams.set('app', 'marquinho');
    window.location.replace(url);
  }, []);

  return null;
}
