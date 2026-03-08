const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { sequelize, Order, Item } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'sua_chave_secreta_aqui'; // Em produção, use variáveis de ambiente

app.use(cors());
app.use(bodyParser.json());

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order Management API',
      version: '1.0.0',
      description: 'API para gerenciamento de pedidos com mapeamento de dados e banco de dados SQL',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./index.js'], // Caminho para as anotações
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware de Autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
};

// Endpoint para gerar token (Simulação de Login)
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Gera um token JWT para autenticação
 *     responses:
 *       200:
 *         description: Token gerado com sucesso
 */
app.post('/login', (req, res) => {
  const user = { id: 1, username: 'admin' };
  const token = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// Função de mapeamento para transformar o JSON de entrada no formato do banco
const mapOrderInput = (data) => {
  return {
    orderId: data.numeroPedido,
    value: data.valorTotal,
    creationDate: new Date(data.dataCriacao).toISOString(),
    items: data.items.map(item => ({
      productId: parseInt(item.idItem),
      quantity: item.quantidadeItem,
      price: item.valorItem
    }))
  };
};

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Cria um novo pedido
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numeroPedido:
 *                 type: string
 *               valorTotal:
 *                 type: number
 *               dataCriacao:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     idItem:
 *                       type: string
 *                     quantidadeItem:
 *                       type: number
 *                     valorItem:
 *                       type: number
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 */
app.post('/order', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const mappedData = mapOrderInput(req.body);
    
    const order = await Order.create({
      orderId: mappedData.orderId,
      value: mappedData.value,
      creationDate: mappedData.creationDate
    }, { transaction });

    const items = mappedData.items.map(item => ({
      ...item,
      orderId: order.orderId
    }));
    
    await Item.bulkCreate(items, { transaction });

    await transaction.commit();
    
    res.status(201).json({
      message: 'Pedido criado com sucesso',
      order: {
        ...order.toJSON(),
        items
      }
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(400).json({ error: 'Erro ao criar pedido', details: error.message });
  }
});

/**
 * @swagger
 * /order/{orderId}:
 *   get:
 *     summary: Obtém os dados de um pedido pelo ID
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do pedido
 *       404:
 *         description: Pedido não encontrado
 */
app.get('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { orderId: req.params.orderId },
      include: [{ model: Item, as: 'items' }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedido', details: error.message });
  }
});

/**
 * @swagger
 * /order/list:
 *   get:
 *     summary: Lista todos os pedidos
 *     responses:
 *       200:
 *         description: Lista de pedidos
 */
app.get('/order/list', async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: Item, as: 'items' }]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar pedidos', details: error.message });
  }
});

/**
 * @swagger
 * /order/{orderId}:
 *   put:
 *     summary: Atualiza um pedido existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 */
app.put('/order/:orderId', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const updateData = req.body;
    
    await order.update({
      value: updateData.value || order.value,
      creationDate: updateData.creationDate || order.creationDate
    }, { transaction });

    if (updateData.items) {
      await Item.destroy({ where: { orderId }, transaction });
      const newItems = updateData.items.map(item => ({
        ...item,
        orderId
      }));
      await Item.bulkCreate(newItems, { transaction });
    }

    await transaction.commit();
    
    const updatedOrder = await Order.findOne({
      where: { orderId },
      include: [{ model: Item, as: 'items' }]
    });

    res.json({ message: 'Pedido atualizado com sucesso', order: updatedOrder });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(400).json({ error: 'Erro ao atualizar pedido', details: error.message });
  }
});

/**
 * @swagger
 * /order/{orderId}:
 *   delete:
 *     summary: Deleta um pedido
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido deletado com sucesso
 */
app.delete('/order/:orderId', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    
    await Item.destroy({ where: { orderId }, transaction });
    const deleted = await Order.destroy({ where: { orderId }, transaction });

    if (!deleted) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    await transaction.commit();
    res.json({ message: 'Pedido deletado com sucesso' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: 'Erro ao deletar pedido', details: error.message });
  }
});

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Documentação Swagger disponível em http://localhost:${PORT}/api-docs`);
  });
});
