-- Script SQL para criação das tabelas da API de Pedidos

-- Tabela: Order (Pedidos)
CREATE TABLE IF NOT EXISTS "Order" (
    orderId      TEXT PRIMARY KEY NOT NULL,
    value        REAL NOT NULL,
    creationDate TEXT NOT NULL
);

-- Tabela: Items (Itens do Pedido)
-- Relacionamento 1:N com Order via chave estrangeira
CREATE TABLE IF NOT EXISTS Items (
    orderId   TEXT    NOT NULL,
    productId INTEGER NOT NULL,
    quantity  INTEGER NOT NULL,
    price     REAL    NOT NULL,
    FOREIGN KEY (orderId) REFERENCES "Order"(orderId) ON DELETE CASCADE
);
