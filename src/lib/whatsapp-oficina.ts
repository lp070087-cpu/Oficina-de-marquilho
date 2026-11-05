// WhatsApp da Oficina — definido pela DONA e gravado em ConfiguracaoVitrine (chave/valor, mesmo
// padrão do parcelamento do Caixa; leitura dessa tabela é restrita à DONA). Sem credenciais aqui:
// a integração oficial (WhatsApp Business Platform) continua por variáveis de ambiente no servidor.
import prisma from '@/lib/prisma';
import { CHAVE_WHATSAPP, WHATSAPP_PADRAO, validarConfigWhatsApp, type ConfigWhatsApp } from './whatsapp-regras';
export * from './whatsapp-regras';

export async function lerWhatsApp(db: Pick<typeof prisma, 'configuracaoVitrine'> = prisma): Promise<ConfigWhatsApp & { configurado: boolean }> {
  const linha = await db.configuracaoVitrine.findUnique({ where: { chave: CHAVE_WHATSAPP } });
  if (!linha) return { ...WHATSAPP_PADRAO, configurado: false };
  try {
    const salvo = JSON.parse(linha.valor);
    const { config } = validarConfigWhatsApp(salvo);
    if (!config) return { ...WHATSAPP_PADRAO, configurado: false };
    return { ...config, atualizadoPor: salvo.atualizadoPor ?? null, atualizadoEm: salvo.atualizadoEm ?? null, configurado: true };
  } catch { return { ...WHATSAPP_PADRAO, configurado: false }; }
}
