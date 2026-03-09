/**
 * Testes de integração da Order API.
 * Jest + Supertest — cobre CRUD, mapeamento, autenticação e tratamento de erros.
 *
 * Convenção de nomenclatura dos pedidos de teste: prefixo "TEST-"
 * O afterAll garante limpeza mesmo que testes falhem no meio do caminho.
 */

const request = require('supertest');
const app = require('./server');
const db  = require('./src/config/database');

let token = '';

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  const res = await request(app).post('/login');
  token = res.body.token;
});

afterAll(() => {
  db.prepare(`DELETE FROM "Order" WHERE orderId LIKE 'TEST-%'`).run();
  db.close();
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe('POST /login', () => {
  test('retorna token JWT', async () => {
    const res = await request(app).post('/login');
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(10);
  });
});

describe('POST /auth/token', () => {
  test('retorna token com credenciais válidas', async () => {
    const res = await request(app)
      .post('/auth/token')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  test('retorna 401 com credenciais inválidas', async () => {
    const res = await request(app)
      .post('/auth/token')
      .send({ username: 'admin', password: 'errada' });
    expect(res.statusCode).toBe(401);
  });
});

// ─── POST /order ──────────────────────────────────────────────────────────────

describe('POST /order', () => {
  test('cria pedido e valida mapeamento completo', async () => {
    const res = await request(app)
      .post('/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        numeroPedido: 'TEST-001',
        valorTotal: 5000,
        dataCriacao: '2023-07-19T12:24:11.529Z',
        items: [{ idItem: '100', quantidadeItem: 2, valorItem: 2500 }],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.orderId).toBe('TEST-001');
    expect(res.body.value).toBe(5000);
    expect(res.body.creationDate).toBe('2023-07-19T12:24:11.529Z');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toEqual({ productId: 100, quantity: 2, price: 2500 });
    expect(res.body.items[0].id).toBeUndefined();
    expect(res.body.items[0].orderId).toBeUndefined();
  });

  test('retorna 401 sem token', async () => {
    const res = await request(app).post('/order').send({ numeroPedido: 'X' });
    expect(res.statusCode).toBe(401);
  });

  test('retorna 400 para body sem items', async () => {
    const res = await request(app)
      .post('/order')
      .set('Authorization', `Bearer ${token}`)
      .send({ numeroPedido: 'TEST-BAD', valorTotal: 1, dataCriacao: '2023-01-01T00:00:00Z' });
    expect(res.statusCode).toBe(400);
  });

  test('retorna 400 para data inválida', async () => {
    const res = await request(app)
      .post('/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        numeroPedido: 'TEST-BADDATE',
        valorTotal: 100,
        dataCriacao: 'data-invalida',
        items: [{ idItem: '1', quantidadeItem: 1, valorItem: 100 }],
      });
    expect(res.statusCode).toBe(400);
  });

  test('retorna 400 para idItem não numérico', async () => {
    const res = await request(app)
      .post('/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        numeroPedido: 'TEST-BADITEM',
        valorTotal: 100,
        dataCriacao: '2023-01-01T00:00:00Z',
        items: [{ idItem: 'abc', quantidadeItem: 1, valorItem: 100 }],
      });
    expect(res.statusCode).toBe(400);
  });

  test('retorna 409 para orderId duplicado', async () => {
    const res = await request(app)
      .post('/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        numeroPedido: 'TEST-001',
        valorTotal: 1,
        dataCriacao: '2023-01-01T00:00:00Z',
        items: [{ idItem: '1', quantidadeItem: 1, valorItem: 1 }],
      });
    expect(res.statusCode).toBe(409);
  });
});

// ─── GET /order/:orderId ──────────────────────────────────────────────────────

describe('GET /order/:orderId', () => {
  test('retorna pedido com itens', async () => {
    const res = await request(app)
      .get('/order/TEST-001')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.orderId).toBe('TEST-001');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(1);
  });

  test('retorna 404 para pedido inexistente', async () => {
    const res = await request(app)
      .get('/order/TEST-INEXISTENTE')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});

// ─── GET /order/list ──────────────────────────────────────────────────────────

describe('GET /order/list', () => {
  test('retorna estrutura paginada correta', async () => {
    const res = await request(app)
      .get('/order/list?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.pages).toBe('number');
    expect(res.body.currentPage).toBe(1);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  test('pedido criado aparece na listagem', async () => {
    const res = await request(app)
      .get('/order/list?page=1&limit=100')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.orders.some((o) => o.orderId === 'TEST-001')).toBe(true);
  });
});

// ─── PUT /order/:orderId ──────────────────────────────────────────────────────

describe('PUT /order/:orderId', () => {
  test('atualiza valor e itens do pedido', async () => {
    const res = await request(app)
      .put('/order/TEST-001')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal: 9999,
        dataCriacao: '2024-01-01T10:00:00.000Z',
        items: [{ idItem: '200', quantidadeItem: 3, valorItem: 3333 }],
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.value).toBe(9999);
    expect(res.body.items[0]).toEqual({ productId: 200, quantity: 3, price: 3333 });
  });

  test('retorna 400 para body inválido na atualização', async () => {
    const res = await request(app)
      .put('/order/TEST-001')
      .set('Authorization', `Bearer ${token}`)
      .send({ valorTotal: 1 });
    expect(res.statusCode).toBe(400);
  });

  test('retorna 404 ao atualizar pedido inexistente', async () => {
    const res = await request(app)
      .put('/order/TEST-INEXISTENTE')
      .set('Authorization', `Bearer ${token}`)
      .send({
        valorTotal: 1,
        dataCriacao: '2024-01-01T00:00:00.000Z',
        items: [{ idItem: '1', quantidadeItem: 1, valorItem: 1 }],
      });
    expect(res.statusCode).toBe(404);
  });
});

// ─── DELETE /order/:orderId ───────────────────────────────────────────────────

describe('DELETE /order/:orderId', () => {
  test('exclui o pedido', async () => {
    const res = await request(app)
      .delete('/order/TEST-001')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/TEST-001/);
  });

  test('pedido não existe mais após exclusão', async () => {
    const res = await request(app)
      .get('/order/TEST-001')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  test('retorna 404 ao excluir pedido inexistente', async () => {
    const res = await request(app)
      .delete('/order/TEST-INEXISTENTE')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
