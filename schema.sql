-- Script SQL para criação das tabelas de Pedidos e Itens

-- Tabela: Orders (Pedidos)
CREATE TABLE IF NOT EXISTS Orders (
    orderId TEXT PRIMARY KEY NOT NULL,
    value REAL NOT NULL,
    creationDate TEXT NOT NULL
);

-- Tabela: Items (Itens do Pedido)
CREATE TABLE IF NOT EXISTS Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (orderId) REFERENCES Orders(orderId) ON DELETE CASCADE
);
