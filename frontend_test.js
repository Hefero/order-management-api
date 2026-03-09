/**
 * frontend_test.js
 * Testes de integração "caixa-preta" contra o servidor rodando em localhost:3000.
 * Execute com: node frontend_test.js
 * Pré-requisito: servidor deve estar rodando (npm start).
 */

const http = require('http');

const BASE = 'http://localhost:3000';
let pass = 0;
let fail = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const url  = new URL(path, BASE);
    const opts = {
      hostname: url.hostname,
      port:     url.port || 3000,
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data  ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    if (data) r.write(data);
    r.end();
  });
}

function getHtml(path) {
  return new Promise((resolve) => {
    http.get(`${BASE}${path}`, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', (e) => resolve({ status: 0, body: e.message }));
  });
}

function check(label, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    pass++;
  } else {
    console.log(`  FAIL  ${label}`);
    console.log(`        -> ${JSON.stringify(detail)}`);
    fail++;
  }
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

// ─── Suíte de testes ──────────────────────────────────────────────────────────

async function run() {
  const ORDER_ID = `FE-TEST-${Date.now()}`;
  let token = '';

  section('1. Frontend estático');
  const fe = await getHtml('/');
  check('GET / retorna 200',            fe.status === 200,            fe.status);
  check('HTML contém título',           fe.body.includes('Gestão de Pedidos'), 'título não encontrado');
  check('HTML carrega Tailwind',        fe.body.includes('tailwindcss'),        'tailwind não encontrado');
  check('HTML carrega Font Awesome',    fe.body.includes('font-awesome'),       'font-awesome não encontrado');
  check('HTML tem formulário de pedido',fe.body.includes('order-form'),         'form não encontrado');

  const docs = await getHtml('/api-docs/');
  check('GET /api-docs/ acessível',     docs.status === 200,                    docs.status);

  section('2. Autenticação');
  const loginRes = await req('POST', '/login', {});
  check('POST /login retorna 200',                loginRes.status === 200,              loginRes.body);
  check('POST /login retorna token string',       typeof loginRes.body.token === 'string', loginRes.body);
  token = loginRes.body.token;

  const authRes = await req('POST', '/auth/token', { username: 'admin', password: 'admin123' });
  check('POST /auth/token retorna 200',           authRes.status === 200,               authRes.body);
  check('POST /auth/token retorna token',         typeof authRes.body.token === 'string', authRes.body);

  const badAuth = await req('POST', '/auth/token', { username: 'x', password: 'y' });
  check('POST /auth/token credenciais erradas → 401', badAuth.status === 401,           badAuth.body);

  section('3. Criar pedido');
  const created = await req('POST', '/order', {
    numeroPedido: ORDER_ID,
    valorTotal:   15000,
    dataCriacao:  '2024-03-08T10:00:00.000Z',
    items: [
      { idItem: '101', quantidadeItem: 2, valorItem: 5000 },
      { idItem: '202', quantidadeItem: 1, valorItem: 5000 },
    ],
  }, token);
  check('POST /order → 201',                         created.status === 201,          created.body);
  check('mapping: numeroPedido → orderId',           created.body.orderId === ORDER_ID, created.body.orderId);
  check('mapping: valorTotal → value',               created.body.value === 15000,    created.body.value);
  check('mapping: dataCriacao → creationDate ISO',   created.body.creationDate === '2024-03-08T10:00:00.000Z', created.body.creationDate);
  check('mapping: 2 itens criados',                  created.body.items?.length === 2, created.body.items);
  check('mapping: idItem → productId (número)',      created.body.items?.[0].productId === 101, created.body.items?.[0]);
  check('mapping: quantidadeItem → quantity',        created.body.items?.[0].quantity === 2,    created.body.items?.[0]);
  check('mapping: valorItem → price',                created.body.items?.[0].price === 5000,    created.body.items?.[0]);
  check('resposta não expõe coluna id',              created.body.items?.[0].id === undefined,  created.body.items?.[0]);
  check('resposta não expõe orderId nos itens',      created.body.items?.[0].orderId === undefined, created.body.items?.[0]);

  const noAuth = await req('POST', '/order', { numeroPedido: 'X' });
  check('POST /order sem token → 401',     noAuth.status === 401,  noAuth.body);

  const badBody = await req('POST', '/order', { numeroPedido: 'X', valorTotal: 1 }, token);
  check('POST /order body inválido → 400', badBody.status === 400, badBody.body);

  const badDate = await req('POST', '/order', {
    numeroPedido: 'FE-BADDATE', valorTotal: 1, dataCriacao: 'invalida',
    items: [{ idItem: '1', quantidadeItem: 1, valorItem: 1 }],
  }, token);
  check('POST /order data inválida → 400', badDate.status === 400, badDate.body);

  const dup = await req('POST', '/order', {
    numeroPedido: ORDER_ID, valorTotal: 1, dataCriacao: '2024-01-01T00:00:00Z',
    items: [{ idItem: '1', quantidadeItem: 1, valorItem: 1 }],
  }, token);
  check('POST /order duplicado → 409',     dup.status === 409,     dup.body);

  section('4. Buscar pedido');
  const found = await req('GET', `/order/${ORDER_ID}`, null, token);
  check('GET /order/:id → 200',              found.status === 200, found.body);
  check('GET retorna orderId correto',       found.body.orderId === ORDER_ID, found.body.orderId);
  check('GET retorna array de itens',        Array.isArray(found.body.items), found.body.items);
  check('GET itens sem campo id',            found.body.items?.[0]?.id === undefined, found.body.items?.[0]);

  const notFound = await req('GET', '/order/FE-INEXISTENTE', null, token);
  check('GET pedido inexistente → 404',      notFound.status === 404, notFound.body);

  section('5. Listar com paginação');
  const list = await req('GET', '/order/list?page=1&limit=5', null, token);
  check('GET /order/list → 200',             list.status === 200,               list.body);
  check('lista retorna campo total',         typeof list.body.total === 'number', list.body);
  check('lista retorna campo pages',         typeof list.body.pages === 'number', list.body);
  check('lista retorna currentPage = 1',     list.body.currentPage === 1,         list.body.currentPage);
  check('lista retorna array orders',        Array.isArray(list.body.orders),     list.body.orders);
  check('pedido criado aparece na lista',    list.body.orders.some((o) => o.orderId === ORDER_ID), 'não encontrado');

  section('6. Atualizar pedido');
  const updated = await req('PUT', `/order/${ORDER_ID}`, {
    valorTotal:  9999,
    dataCriacao: '2024-06-01T08:00:00.000Z',
    items: [{ idItem: '303', quantidadeItem: 3, valorItem: 3333 }],
  }, token);
  check('PUT /order/:id → 200',              updated.status === 200,  updated.body);
  check('PUT valor atualizado',              updated.body.value === 9999, updated.body.value);
  check('PUT itens substituídos',            updated.body.items?.[0].productId === 303, updated.body.items?.[0]);
  check('PUT apenas 1 item após update',     updated.body.items?.length === 1, updated.body.items);

  const badUpdate = await req('PUT', `/order/${ORDER_ID}`, { valorTotal: 1 }, token);
  check('PUT body inválido → 400',           badUpdate.status === 400, badUpdate.body);

  const notFoundUpdate = await req('PUT', '/order/FE-INEXISTENTE', {
    valorTotal: 1, dataCriacao: '2024-01-01T00:00:00Z',
    items: [{ idItem: '1', quantidadeItem: 1, valorItem: 1 }],
  }, token);
  check('PUT pedido inexistente → 404',      notFoundUpdate.status === 404, notFoundUpdate.body);

  section('7. Deletar pedido');
  const deleted = await req('DELETE', `/order/${ORDER_ID}`, null, token);
  check('DELETE /order/:id → 200',           deleted.status === 200, deleted.body);
  check('DELETE resposta menciona orderId',  deleted.body.message?.includes(ORDER_ID), deleted.body.message);

  const gone = await req('GET', `/order/${ORDER_ID}`, null, token);
  check('pedido não existe mais (404)',       gone.status === 404, gone.body);

  const notFoundDelete = await req('DELETE', '/order/FE-INEXISTENTE', null, token);
  check('DELETE inexistente → 404',          notFoundDelete.status === 404, notFoundDelete.body);

  // ─── Resultado final ─────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  const total = pass + fail;
  console.log(`Resultado: ${pass}/${total} aprovados${fail > 0 ? `, ${fail} reprovados` : ' — tudo OK'}`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
