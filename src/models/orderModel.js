/**
 * Model de Order: encapsula todas as operações SQL relacionadas a pedidos.
 * Prepared statements são compilados uma única vez no carregamento do módulo.
 */

const db = require('../config/database');

// ─── Prepared statements ──────────────────────────────────────────────────────

const stmts = {
  insertOrder: db.prepare(`
    INSERT INTO "Order" (orderId, value, creationDate)
    VALUES (@orderId, @value, @creationDate)
  `),
  insertItem: db.prepare(`
    INSERT INTO Items (orderId, productId, quantity, price)
    VALUES (@orderId, @productId, @quantity, @price)
  `),
  findOrder: db.prepare(`SELECT * FROM "Order" WHERE orderId = ?`),
  findItems: db.prepare(`SELECT productId, quantity, price FROM Items WHERE orderId = ?`),
  countOrders: db.prepare(`SELECT COUNT(*) AS count FROM "Order"`),
  listOrders: db.prepare(`SELECT * FROM "Order" ORDER BY creationDate DESC LIMIT ? OFFSET ?`),
  updateOrder: db.prepare(`
    UPDATE "Order" SET value = @value, creationDate = @creationDate WHERE orderId = @orderId
  `),
  deleteItems: db.prepare(`DELETE FROM Items WHERE orderId = ?`),
  deleteOrder: db.prepare(`DELETE FROM "Order" WHERE orderId = ?`),
};

// ─── Funções públicas ──────────────────────────────────────────────────────────

/**
 * Insere um novo pedido e seus itens (transação atômica).
 * @param {Object} order
 * @param {Array}  items
 * @returns {{ order: Object, items: Array }}
 */
function createOrder(order, items) {
  db.transaction(() => {
    stmts.insertOrder.run(order);
    items.forEach((item) => stmts.insertItem.run(item));
  })();
  return findOrderById(order.orderId);
}

/**
 * Busca um pedido pelo orderId, incluindo seus itens.
 * @param {string} orderId
 * @returns {{ order: Object, items: Array }|null}
 */
function findOrderById(orderId) {
  const order = stmts.findOrder.get(orderId);
  if (!order) return null;
  return { order, items: stmts.findItems.all(orderId) };
}

/**
 * Retorna pedidos com paginação e total de registros.
 * @param {number} limit
 * @param {number} offset
 * @returns {{ total: number, results: Array }}
 */
function findAllOrders(limit = 10, offset = 0) {
  const { count } = stmts.countOrders.get();
  const orders = stmts.listOrders.all(limit, offset);
  const results = orders.map((order) => ({
    order,
    items: stmts.findItems.all(order.orderId),
  }));
  return { total: count, results };
}

/**
 * Atualiza um pedido existente e substitui seus itens (transação atômica).
 * @param {string} orderId
 * @param {Object} newOrder
 * @param {Array}  newItems
 * @returns {{ order: Object, items: Array }|null}
 */
function updateOrder(orderId, newOrder, newItems) {
  if (!stmts.findOrder.get(orderId)) return null;
  db.transaction(() => {
    stmts.updateOrder.run({ orderId, value: newOrder.value, creationDate: newOrder.creationDate });
    stmts.deleteItems.run(orderId);
    newItems.forEach((item) => stmts.insertItem.run({ ...item, orderId }));
  })();
  return findOrderById(orderId);
}

/**
 * Remove um pedido e seus itens (via ON DELETE CASCADE).
 * @param {string} orderId
 * @returns {boolean}
 */
function deleteOrder(orderId) {
  return stmts.deleteOrder.run(orderId).changes > 0;
}

module.exports = { createOrder, findOrderById, findAllOrders, updateOrder, deleteOrder };
