const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { sequelize, Order, Item } = require('./database');

// Mock do app para testes sem iniciar o servidor real
const app = express();
app.use(bodyParser.json());
const SECRET_KEY = 'test_secret';

// Re-implementar rotas básicas para teste unitário/integração isolado
// (Em um cenário real, exportaríamos o app do index.js)

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/login', (req, res) => {
  const token = jwt.sign({ id: 1 }, SECRET_KEY);
  res.json({ token });
});

app.post('/order', authenticateToken, async (req, res) => {
  try {
    const { numeroPedido, valorTotal, dataCriacao, items } = req.body;
    const order = await Order.create({
      orderId: numeroPedido,
      value: valorTotal,
      creationDate: new Date(dataCriacao).toISOString()
    });
    const mappedItems = items.map(item => ({
      orderId: order.orderId,
      productId: parseInt(item.idItem),
      quantity: item.quantidadeItem,
      price: item.valorItem
    }));
    await Item.bulkCreate(mappedItems);
    res.status(201).json({ message: 'Sucesso', orderId: order.orderId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/order/:id', async (req, res) => {
  const order = await Order.findByPk(req.params.id, { include: [{ model: Item, as: 'items' }] });
  if (!order) return res.sendStatus(404);
  res.json(order);
});

describe('Order API Tests', () => {
  let token;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const res = await request(app).post('/login');
    token = res.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('Deve criar um novo pedido com sucesso', async () => {
    const res = await request(app)
      .post('/order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        numeroPedido: "TEST-001",
        valorTotal: 500,
        dataCriacao: "2023-01-01T10:00:00Z",
        items: [
          { idItem: "101", quantidadeItem: 2, valorItem: 250 }
        ]
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.orderId).toEqual("TEST-001");
  });

  test('Deve retornar 401 ao tentar criar sem token', async () => {
    const res = await request(app)
      .post('/order')
      .send({ numeroPedido: "FAIL" });
    
    expect(res.statusCode).toEqual(401);
  });

  test('Deve buscar um pedido existente', async () => {
    const res = await request(app).get('/order/TEST-001');
    expect(res.statusCode).toEqual(200);
    expect(res.body.orderId).toEqual("TEST-001");
    expect(res.body.items.length).toBe(1);
  });

  test('Deve retornar 404 para pedido inexistente', async () => {
    const res = await request(app).get('/order/NON-EXISTENT');
    expect(res.statusCode).toEqual(404);
  });
});
