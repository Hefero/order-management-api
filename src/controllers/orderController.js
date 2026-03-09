const logger = require('../utils/logger');
/**
 * Controller de pedidos: lógica de negócio e respostas HTTP para cada operação CRUD.
 */

const orderModel = require('../models/orderModel');
const { mapRequestToDb, mapDbToResponse } = require('../utils/mapper');
const { ValidationError } = require('../utils/errors');

/**
 * Retorna o status HTTP correto para um erro capturado.
 * ValidationError → 400; outros → 500.
 */
function errorResponse(res, err, defaultMsg) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: defaultMsg, details: err.message });
}

/**
 * POST /order
 * Cria um novo pedido.
 */
async function createOrder(req, res) {
  try {
    const { numeroPedido, valorTotal, dataCriacao, items } = req.body;

    if (!numeroPedido || valorTotal === undefined || !dataCriacao || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes: numeroPedido, valorTotal, dataCriacao e items (array não vazio).',
      });
    }

    if (orderModel.findOrderById(numeroPedido)) {
      return res.status(409).json({ error: `Pedido '${numeroPedido}' já existe.` });
    }

    const { order, items: mappedItems } = mapRequestToDb(req.body);
    const result = orderModel.createOrder(order, mappedItems);

    return res.status(201).json(mapDbToResponse(result.order, result.items));
  } catch (err) {
    return errorResponse(res, err, 'Erro interno ao criar pedido.');
  }
}

/**
 * GET /order/:orderId
 * Retorna os dados de um pedido pelo seu ID.
 */
async function getOrderById(req, res) {
  try {
    const result = orderModel.findOrderById(req.params.orderId);
    if (!result) {
      return res.status(404).json({ error: `Pedido '${req.params.orderId}' não encontrado.` });
    }
    return res.status(200).json(mapDbToResponse(result.order, result.items));
  } catch (err) {
    return errorResponse(res, err, 'Erro interno ao buscar pedido.');
  }
}

/**
 * GET /order/list?page=1&limit=10
 * Lista todos os pedidos com paginação.
 */
async function listOrders(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const { total, results } = orderModel.findAllOrders(limit, offset);

    return res.status(200).json({
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      orders: results.map((r) => mapDbToResponse(r.order, r.items)),
    });
  } catch (err) {
    return errorResponse(res, err, 'Erro interno ao listar pedidos.');
  }
}

/**
 * PUT /order/:orderId
 * Atualiza um pedido existente.
 */
async function updateOrder(req, res) {
  try {
    const { orderId } = req.params;
    const { valorTotal, dataCriacao, items } = req.body;

    if (valorTotal === undefined || !dataCriacao || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes: valorTotal, dataCriacao e items (array não vazio).',
      });
    }

    const { order, items: mappedItems } = mapRequestToDb({ numeroPedido: orderId, valorTotal, dataCriacao, items });
    const result = orderModel.updateOrder(orderId, order, mappedItems);

    if (!result) {
      return res.status(404).json({ error: `Pedido '${orderId}' não encontrado.` });
    }
    return res.status(200).json(mapDbToResponse(result.order, result.items));
  } catch (err) {
    return errorResponse(res, err, 'Erro interno ao atualizar pedido.');
  }
}

/**
 * DELETE /order/:orderId
 * Remove um pedido pelo ID.
 */
async function deleteOrder(req, res) {
  try {
    const { orderId } = req.params;
    if (!orderModel.deleteOrder(orderId)) {
      return res.status(404).json({ error: `Pedido '${orderId}' não encontrado.` });
    }
    return res.status(200).json({ message: `Pedido '${orderId}' removido com sucesso.` });
  } catch (err) {
    return errorResponse(res, err, 'Erro interno ao deletar pedido.');
  }
}

module.exports = { createOrder, getOrderById, listOrders, updateOrder, deleteOrder };
