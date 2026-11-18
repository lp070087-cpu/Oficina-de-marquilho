import path from 'node:path';
import sharp from 'sharp';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ size: '192' }, { size: '512' }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  if (size !== '192' && size !== '512') return new Response(null, { status: 404 });

  const pixels = Number(size);
  const icon = await sharp(path.join(process.cwd(), 'public', 'icon-512.png'))
    .resize(pixels, pixels, { fit: 'contain', background: '#0F1A2E' })
    .png()
    .toBuffer();

  return new Response(new Uint8Array(icon), {
    headers: { 'Content-Type': 'image/png' },
  });
}
