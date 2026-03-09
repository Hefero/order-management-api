
const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/auth');
const validateOrder = require('../middlewares/validateOrder');

/**
 * Regras de autenticação:
 * - GET /order/list      -> pública
 * - GET /order/:orderId  -> pública
 * - POST /order          -> autenticada
 * - PUT /order/:orderId  -> autenticada
 * - DELETE /order/:orderId -> autenticada
 */

const router = express.Router();

// pública
router.get('/list', orderController.listOrders);
router.get('/:orderId', orderController.getOrderById);

// protegidas
router.post('/', authenticate, validateOrder, orderController.createOrder);
router.put('/:orderId', authenticate, orderController.updateOrder);
router.delete('/:orderId', authenticate, orderController.deleteOrder);

module.exports = router;
