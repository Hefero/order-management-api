/**
 * Utilitário de mapeamento (mapping) de dados.
 * Transforma o payload de entrada no formato interno do banco de dados
 * e converte o formato do banco para o formato de resposta da API.
 */

const { ValidationError } = require('./errors');

/**
 * Converte o JSON recebido no body da requisição para o formato interno.
 * Lança ValidationError se algum campo obrigatório for inválido.
 * @param {Object} body - Payload da requisição
 * @returns {{ order: Object, items: Array }}
 */
function mapRequestToDb(body) {
  const { numeroPedido, valorTotal, dataCriacao, items } = body;

  const date = new Date(dataCriacao);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`dataCriacao inválida: "${dataCriacao}".`);
  }

  const order = {
    orderId: numeroPedido,
    value: valorTotal,
    creationDate: date.toISOString(),
  };

  const mappedItems = (items || []).map((item, index) => {
    const productId = parseInt(item.idItem, 10);
    if (isNaN(productId)) {
      throw new ValidationError(`Item[${index}]: idItem "${item.idItem}" não é um número válido.`);
    }
    return {
      orderId: numeroPedido,
      productId,
      quantity: item.quantidadeItem,
      price: item.valorItem,
    };
  });

  return { order, items: mappedItems };
}

/**
 * Converte os dados do banco de dados para o formato de resposta da API.
 * @param {Object} order - Linha da tabela Order
 * @param {Array}  items - Linhas da tabela Items relacionadas ao pedido
 * @returns {Object}
 */
function mapDbToResponse(order, items) {
  return {
    orderId: order.orderId,
    value: order.value,
    creationDate: order.creationDate,
    items: (items || []).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}

module.exports = { mapRequestToDb, mapDbToResponse };
