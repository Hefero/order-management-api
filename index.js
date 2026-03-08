const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { sequelize, Order, Item } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order Management API',
      version: '1.1.0',
      description: 'API robusta para gerenciamento de pedidos com mapeamento de dados, autenticação JWT e banco de dados SQL.',
      contact: {
        name: 'Suporte API',
        email: 'suporte@exemplo.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor Local'
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
      schemas: {
        OrderInput: {
          type: 'object',
          required: ['numeroPedido', 'valorTotal', 'dataCriacao', 'items'],
          properties: {
            numeroPedido: { type: 'string', example: 'v10089015vdb-01' },
            valorTotal: { type: 'number', example: 10000 },
            dataCriacao: { type: 'string', format: 'date-time', example: '2023-07-19T12:24:11.529Z' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['idItem', 'quantidadeItem', 'valorItem'],
                properties: {
                  idItem: { type: 'string', example: '2434' },
                  quantidadeItem: { type: 'integer', example: 1 },
                  valorItem: { type: 'number', example: 1000 }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    },
  },
  apis: ['./index.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware de Autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Não autorizado', 
      message: 'Token de autenticação ausente. Por favor, realize o login para obter acesso.' 
    });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Acesso proibido', 
        message: 'O token fornecido é inválido ou expirou. Por favor, faça login novamente.' 
      });
    }
    req.user = user;
    next();
  });
};

// Função de mapeamento para transformar o JSON de entrada no formato do banco (Data Transformation)
const mapOrderInput = (data) => {
  if (!data.numeroPedido || !data.items || !Array.isArray(data.items)) {
    throw new Error('Dados de entrada incompletos: numeroPedido e items são obrigatórios.');
  }

  return {
    orderId: data.numeroPedido,
    value: data.valorTotal,
    creationDate: new Date(data.dataCriacao).toISOString(),
    items: data.items.map(item => {
      if (!item.idItem || item.quantidadeItem === undefined || item.valorItem === undefined) {
        throw new Error('Cada item deve conter idItem, quantidadeItem e valorItem.');
      }
      return {
        productId: parseInt(item.idItem),
        quantity: item.quantidadeItem,
        price: item.valorItem
      };
    })
  };
};

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Gera um token JWT para autenticação
 *     tags: [Autenticação]
 *     responses:
 *       200:
 *         description: Token gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: 'string' }
 */
app.post('/login', (req, res) => {
  try {
    const user = { id: 1, username: 'admin' };
    const token = jwt.sign(user, SECRET_KEY, { expiresIn: '2h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno', message: 'Não foi possível gerar o token de acesso.' });
  }
});

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Cria um novo pedido com mapeamento de dados
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       400:
 *         description: Dados de entrada inválidos
 *       401:
 *         description: Não autorizado
 */
app.post('/order', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const mappedData = mapOrderInput(req.body);
    
    // Verificar se o pedido já existe
    const existingOrder = await Order.findByPk(mappedData.orderId);
    if (existingOrder) {
      await transaction.rollback();
      return res.status(409).json({ 
        error: 'Conflito', 
        message: `Já existe um pedido com o número ${mappedData.orderId}.` 
      });
    }

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
      order: { ...order.toJSON(), items }
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(400).json({ 
      error: 'Erro de validação', 
      message: 'Os dados fornecidos são inválidos.',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /order/list:
 *   get:
 *     summary: Lista todos os pedidos com paginação
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: 'integer', default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: 'integer', default: 10 }
 *     responses:
 *       200:
 *         description: Lista de pedidos retornada com sucesso
 */
app.get('/order/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      include: [{ model: Item, as: 'items' }],
      limit,
      offset,
      distinct: true,
      order: [['creationDate', 'DESC']]
    });

    res.status(200).json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      orders: rows
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno', 
      message: 'Ocorreu um erro ao listar os pedidos.',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /order/{orderId}:
 *   get:
 *     summary: Obtém os detalhes de um pedido específico
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Detalhes do pedido
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
      return res.status(404).json({ 
        error: 'Não encontrado', 
        message: `O pedido com o número ${req.params.orderId} não foi localizado.` 
      });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno', 
      message: 'Erro ao buscar os detalhes do pedido.',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /order/{orderId}:
 *   put:
 *     summary: Atualiza um pedido existente
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: 'string' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value: { type: 'number' }
 *               items: { type: 'array', items: { type: 'object' } }
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 *       404:
 *         description: Pedido não encontrado
 */
app.put('/order/:orderId', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ 
        error: 'Não encontrado', 
        message: `Não é possível atualizar um pedido inexistente (${orderId}).` 
      });
    }

    const updateData = req.body;
    
    await order.update({
      value: updateData.value !== undefined ? updateData.value : order.value,
      creationDate: updateData.creationDate || order.creationDate
    }, { transaction });

    if (updateData.items && Array.isArray(updateData.items)) {
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

    res.status(200).json({ message: 'Pedido atualizado com sucesso', order: updatedOrder });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(400).json({ 
      error: 'Erro na atualização', 
      message: 'Não foi possível processar a atualização do pedido.',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /order/{orderId}:
 *   delete:
 *     summary: Remove um pedido do sistema
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: 'string' }
 *     responses:
 *       200:
 *         description: Pedido removido com sucesso
 *       404:
 *         description: Pedido não encontrado
 */
app.delete('/order/:orderId', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    
    // O SQLite com Sequelize configurado com CASCADE deletaria os itens, 
    // mas fazemos explicitamente para garantir robustez.
    await Item.destroy({ where: { orderId }, transaction });
    const deleted = await Order.destroy({ where: { orderId }, transaction });

    if (!deleted) {
      await transaction.rollback();
      return res.status(404).json({ 
        error: 'Não encontrado', 
        message: `O pedido ${orderId} não existe e não pode ser removido.` 
      });
    }

    await transaction.commit();
    res.status(200).json({ message: `Pedido ${orderId} removido com sucesso.` });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ 
      error: 'Erro na remoção', 
      message: 'Ocorreu um erro ao tentar excluir o pedido.',
      details: error.message 
    });
  }
});

// Inicialização do Banco e Servidor
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`📖 Documentação Swagger: http://localhost:${PORT}/api-docs`);
  });
}).catch(err => {
  console.error('❌ Erro ao sincronizar o banco de dados:', err);
});
