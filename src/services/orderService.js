
const orderModel = require('../models/orderModel');

async function createOrder(data){
  return orderModel.createOrder(data);
}

async function listOrders(){
  return orderModel.listOrders();
}

async function getOrder(id){
  return orderModel.getOrderById(id);
}

async function updateOrder(id,data){
  return orderModel.updateOrder(id,data);
}

async function deleteOrder(id){
  return orderModel.deleteOrder(id);
}

module.exports={
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  deleteOrder
}
