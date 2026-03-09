/**
 * Rotas de pedidos (Order).
 *
 * POST   /order          - Cria um novo pedido          [JWT]
 * GET    /order/list     - Lista pedidos com paginação  [pública]
 * GET    /order/:orderId - Obtém um pedido pelo ID      [pública]
 * PUT    /order/:orderId - Atualiza um pedido           [JWT]
 * DELETE /order/:orderId - Remove um pedido             [JWT]
 */

const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/auth');
const validateOrder = require('../middlewares/validateOrder');

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ItemInput:
 *       type: object
 *       required: [idItem, quantidadeItem, valorItem]
 *       properties:
 *         idItem:
 *           type: string
 *           example: "2434"
 *         quantidadeItem:
 *           type: integer
 *           example: 1
 *         valorItem:
 *           type: number
 *           example: 1000
 *     OrderInput:
 *       type: object
 *       required: [numeroPedido, valorTotal, dataCriacao, items]
 *       properties:
 *         numeroPedido:
 *           type: string
 *           example: v10089015vdb-01
 *         valorTotal:
 *           type: number
 *           example: 10000
 *         dataCriacao:
 *           type: string
 *           format: date-time
 *           example: "2023-07-19T12:24:11.5299601+00:00"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemInput'
 *     ItemOutput:
 *       type: object
 *       properties:
 *         productId:
 *           type: integer
 *           example: 2434
 *         quantity:
 *           type: integer
 *           example: 1
 *         price:
 *           type: number
 *           example: 1000
 *     OrderOutput:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *           example: v10089015vdb-01
 *         value:
 *           type: number
 *           example: 10000
 *         creationDate:
 *           type: string
 *           format: date-time
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemOutput'
 *     PagedOrders:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 42
 *         pages:
 *           type: integer
 *           example: 5
 *         currentPage:
 *           type: integer
 *           example: 1
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderOutput'
 */

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Cria um novo pedido
 *     tags: [Orders]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderOutput'
 *       400:
 *         description: Dados inválidos ou ausentes
 *       401:
 *         description: Token ausente ou inválido
 *       409:
 *         description: orderId já existe
 */
router.post('/', authenticate, validateOrder, orderController.createOrder);

/**
 * @swagger
 * /order/list:
 *   get:
 *     summary: Lista pedidos com paginação
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista paginada de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PagedOrders'
 *       401:
 *         description: Token ausente ou inválido
 */
router.get('/list', orderController.listOrders);

/**
 * @swagger
 * /order/{orderId}:
 *   get:
 *     summary: Obtém um pedido pelo ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: v10089015vdb-01
 *     responses:
 *       200:
 *         description: Dados do pedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderOutput'
 *       401:
 *         description: Token ausente ou inválido
 *       404:
 *         description: Pedido não encontrado
 *   put:
 *     summary: Atualiza um pedido existente
 *     tags: [Orders]
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
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       200:
 *         description: Pedido atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderOutput'
 *       400:
 *         description: Dados inválidos ou ausentes
 *       401:
 *         description: Token ausente ou inválido
 *       404:
 *         description: Pedido não encontrado
 *   delete:
 *     summary: Remove um pedido pelo ID
 *     tags: [Orders]
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
 *         description: Pedido removido com sucesso
 *       401:
 *         description: Token ausente ou inválido
 *       404:
 *         description: Pedido não encontrado
 */
router.get('/:orderId', orderController.getOrderById);
router.put('/:orderId', authenticate, orderController.updateOrder);
router.delete('/:orderId', authenticate, orderController.deleteOrder);

module.exports = router;
