import { Suspense } from 'react';
import CatalogoContent from './CatalogoContent';

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3F6FB] flex items-center justify-center"><div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <CatalogoContent />
    </Suspense>
  );
}
