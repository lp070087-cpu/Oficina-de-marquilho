// Testes HTTP contra o servidor local (branch Neon de teste). Uso:
//   node scripts/test-codigo-whatsapp.cjs <tokens.json> [http://127.0.0.1:3017]
// Recusa rodar fora de localhost. Cria pedidos de teste só no banco apontado pelo servidor local
// e os cancela ao final. NUNCA apontar o servidor local para o banco oficial.
const fs = require('fs');
const tokens = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const base = process.argv[3] || 'http://127.0.0.1:3017';
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base)) throw new Error('Somente localhost');
let ok = 0, falhas = 0;
const t = (nome, cond, extra = '') => { if (cond) { ok++; console.log('  ✓', nome); } else { falhas++; console.log('  ✗', nome, extra); } };
async function req(quem, path, init = {}) {
  const r = await fetch(base + path, { ...init, redirect: 'manual', headers: { ...(init.headers || {}), 'Content-Type': 'application/json', ...(quem ? { Cookie: `token=${tokens[quem]}` } : {}) } });
  let body = null; try { body = await r.json(); } catch {}
  return { status: r.status, body };
}
const PUT = (quem, path, body) => req(quem, path, { method: 'PUT', body: JSON.stringify(body) });
const POST = (quem, path, body) => req(quem, path, { method: 'POST', body: JSON.stringify(body) });

(async () => {
  console.log('Catálogo / categorias');
  const a = await req('venda', '/api/pecas/busca?q=&offset=0&limite=48');
  t('48 produtos na primeira página', a.body?.itens?.length === 48, a.status);
  t('total geral = soma das categorias', a.body.totalGeral === a.body.categorias.reduce((s, c) => s + c.total, 0), `${a.body.totalGeral}`);
  t('categorias reais com contagem', a.body.categorias.length > 5 && a.body.categorias.every(c => c.id && c.nome && c.total > 0), a.body.categorias.map(c => c.nome).join(','));
  const b = await req('venda', '/api/pecas/busca?q=&offset=48&limite=48');
  t('segunda página sem repetir', b.body.itens.length === 48 && b.body.itens.every(p => !a.body.itens.some(x => x.id === p.id)));
  const lista = [...a.body.itens, ...b.body.itens];
  t('ordenação: mais vendidos primeiro', lista.every((p, i) => i === 0 || lista[i - 1].vendidosRecentes > p.vendidosRecentes || (lista[i - 1].vendidosRecentes === p.vendidosRecentes && lista[i - 1].vendidosTotal >= p.vendidosTotal)));
  const cat = a.body.categorias[0];
  const c = await req('venda', `/api/pecas/busca?q=&categoria=${cat.id}&offset=0&limite=48`);
  t(`filtro categoria "${cat.nome}" total = ${cat.total}`, c.body.total === cat.total, `${c.body.total}`);
  const todos = [...c.body.itens]; let prox = c.body.proximo;
  while (prox !== null) { const n = await req('venda', `/api/pecas/busca?q=&categoria=${cat.id}&offset=${prox}&limite=48`); todos.push(...n.body.itens); prox = n.body.proximo; }
  t('paginação percorre toda a categoria sem repetir', todos.length === cat.total && new Set(todos.map(p => p.id)).size === cat.total);
  const termo = a.body.itens[0].nome.split(/\s+/)[0];
  const d = await req('venda', `/api/pecas/busca?q=${encodeURIComponent(termo)}&offset=0&limite=48`);
  const catBusca = d.body.categorias[0];
  const e = await req('venda', `/api/pecas/busca?q=${encodeURIComponent(termo)}&categoria=${catBusca.id}&offset=0&limite=48`);
  t(`pesquisa "${termo}" dentro da categoria "${catBusca.nome}"`, e.body.total === catBusca.total && e.body.total <= d.body.total);
  const sku = a.body.itens[1].codigo;
  const f = await req('venda', `/api/pecas/busca?q=${encodeURIComponent(sku)}&offset=0&limite=48`);
  t(`pesquisa por SKU ${sku}`, f.body.itens[0]?.codigo === sku);
  t('busca exige login', (await req(null, '/api/pecas/busca?q=')).status !== 200);

  console.log('Pedidos simultâneos');
  const peca = lista.find(p => p.quantidadeLoja > 3 && Number(p.precoVenda) > 0);
  const N = 8;
  const novo = () => POST('venda', '/api/pedidos', { tipo: 'VENDA', itens: [{ pecaId: peca.id, quantidade: 1 }], clienteNome: 'TESTE AUTOMATIZADO' });
  const criados = await Promise.all(Array.from({ length: N }, novo));
  t(`${N} pedidos criados em paralelo`, criados.every(r => r.status === 201), criados.map(r => r.status + (r.body?.error || '')).join(','));
  const nums = criados.map(r => r.body?.codigoNumero);
  t('códigos únicos', new Set(nums).size === N, nums.join(','));
  t('códigos >= 6700 no formato N-MP', nums.every(n => n >= 6700) && criados.every(r => r.body.codigo === `${r.body.codigoNumero}-MP`), criados.map(r => r.body?.codigo).join(','));
  const um = criados[0].body;

  console.log('Busca de códigos no Caixa');
  for (const q of [`${um.codigoNumero}-MP`, `${um.codigoNumero}mp`, `Pedido ${um.codigoNumero}-MP`]) {
    const r = await req('caixa', `/api/pedidos?codigo=${encodeURIComponent(q)}`);
    t(`"${q}" localiza o pedido`, r.body?.[0]?.id === um.id && r.body.length === 1, JSON.stringify(r.body?.map?.(p => p.codigo)));
  }
  // Últimos dígitos (6709, 709, 09): pode haver mais de um; o caixa escolhe na lista.
  const sufixo = String(um.codigoNumero).slice(-1);
  const pr = await req('caixa', `/api/pedidos?codigo=${sufixo}`);
  t(`último dígito "${sufixo}" lista vários para seleção`, Array.isArray(pr.body) && pr.body.length > 1 && pr.body.some(p => p.id === um.id));
  for (const q of [String(um.codigoNumero).slice(-3), String(um.codigoNumero).slice(-2)]) t(`últimos dígitos "${q}" localizam o pedido`, (await req('caixa', `/api/pedidos?codigo=${q}`)).body?.some?.(p => p.id === um.id));
  const exato = await req('caixa', `/api/pedidos?codigo=${um.codigoNumero}`);
  t('número exato aparece primeiro', exato.body?.[0]?.id === um.id);
  for (const q of ['MP-000058', '58-MP0000', 'MP58']) {
    const r = await req('caixa', `/api/pedidos?codigo=${q}`);
    t(`código antigo "${q}" localiza o pedido nº 58`, r.body?.[0]?.numero === 58 && r.body[0].codigo === '58-MP0000', JSON.stringify(r.body?.map?.(p => p.codigo)));
  }
  t('código inválido → 400', (await req('caixa', '/api/pedidos?codigo=XYZ')).status === 400);
  t('cancelamento do pedido de teste', (await PUT('venda', '/api/pedidos', { id: criados[1].body.id, status: 'CANCELADO' })).status === 200);
  const depois = await novo();
  t('código de cancelado não é reutilizado', depois.body.codigoNumero > Math.max(...nums), depois.body.codigo);
  for (const r of [...criados.filter((_, i) => i !== 1), depois]) await PUT('venda', '/api/pedidos', { id: r.body.id, status: 'CANCELADO' });

  console.log('WhatsApp da Oficina');
  t('Caixa não altera config', (await PUT('caixa', '/api/configuracoes/whatsapp', {})).status === 403);
  t('Atendente não altera config', (await PUT('venda', '/api/configuracoes/whatsapp', {})).status === 403);
  t('Atendente não lê config', (await req('venda', '/api/configuracoes/whatsapp')).status === 403);
  t('Estoque não lê config', (await req('estoque', '/api/configuracoes/whatsapp')).status === 403);
  t('Sem login não lê config', (await req(null, '/api/configuracoes/whatsapp')).status !== 200);
  const base0 = { nomeExibicao: 'Marquinho Moto Peças', ativo: true, mensagem: 'Olá! Aqui é da {nomeExibicao}. Segue o comprovante referente ao seu pedido {codigoPedido}: {linkComprovante}. Obrigado pela preferência!' };
  for (const n of ['81999998888', '+55 (10) 99999-8888', '+55 81 8999-8888 8', 'abc']) {
    t(`número inválido "${n}" recusado`, (await PUT('dono', '/api/configuracoes/whatsapp', { ...base0, numero: n })).status === 400);
  }
  t('mensagem sem {linkComprovante} recusada', (await PUT('dono', '/api/configuracoes/whatsapp', { ...base0, numero: '+5581999998888', mensagem: 'Olá, segue o comprovante' })).status === 400);
  const salvo = await PUT('dono', '/api/configuracoes/whatsapp', { ...base0, numero: '+55 (81) 99999-8888' });
  t('DONA cadastra número', salvo.status === 200 && salvo.body.numero === '5581999998888' && salvo.body.numeroFormatado === '+55 (81) 99999-8888', JSON.stringify(salvo.body));
  const editado = await PUT('dono', '/api/configuracoes/whatsapp', { ...base0, numero: '5581988887777', nomeExibicao: 'Oficina Marquinho' });
  t('DONA altera número e nome', editado.body.numero === '5581988887777' && editado.body.nomeExibicao === 'Oficina Marquinho' && editado.body.atualizadoPor === 'Dono');
  const vis = await req('caixa', '/api/configuracoes/whatsapp');
  t('Caixa vê só ativo/nome/número', vis.status === 200 && vis.body.ativo === true && vis.body.mensagem === undefined);

  console.log('Comprovante com novo código');
  const pago = await req('caixa', '/api/pedidos?status=PAGO');
  const vendaPaga = pago.body.find(p => p.venda?.status === 'PAGA');
  if (vendaPaga) {
    const l = await POST('caixa', '/api/comprovantes/link', { vendaId: vendaPaga.venda.id, telefone: '81 98888-7777' });
    t('link usa mensagem configurada e código do pedido', l.status === 200 && l.body.mensagem.startsWith('Olá! Aqui é da Oficina Marquinho') && l.body.mensagem.includes(vendaPaga.codigo) && l.body.mensagem.includes(l.body.url), l.body?.mensagem);
    t('wa.me com telefone do cliente', l.body.whatsappUrl.startsWith('https://wa.me/5581988887777?text='));
    const pub = await fetch(l.body.url); const html = await pub.text();
    t('comprovante público abre pelo token', pub.status === 200 && html.includes(vendaPaga.codigo));
    const falso = await fetch(base + '/comprovante/token-invalido');
    t('token inválido não abre comprovante', falso.status !== 200 || !(await falso.text()).includes('PAGO'));
    t('Atendente não gera link', (await POST('venda', '/api/comprovantes/link', { vendaId: vendaPaga.venda.id })).status === 403);
    await PUT('dono', '/api/configuracoes/whatsapp', { ...base0, numero: '5581988887777', ativo: false });
    t('envio desativado bloqueia link', (await POST('caixa', '/api/comprovantes/link', { vendaId: vendaPaga.venda.id })).status === 403);
    await PUT('dono', '/api/configuracoes/whatsapp', { ...base0, numero: '5581988887777', ativo: true });
  } else t('existe venda paga para testar comprovante', false);
  console.log(`\n${ok} ok, ${falhas} falha(s)`);
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
