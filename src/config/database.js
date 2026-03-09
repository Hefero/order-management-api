/**
 * Configuração e inicialização do banco de dados SQLite.
 * Cria as tabelas Order e Items caso não existam.
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const db = new Database(path.resolve(DB_PATH));

// Habilita chaves estrangeiras no SQLite
db.pragma('foreign_keys = ON');

/**
 * Cria as tabelas necessárias para a aplicação.
 */
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "Order" (
      orderId     TEXT PRIMARY KEY,
      value       REAL NOT NULL,
      creationDate TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Items (
      orderId   TEXT    NOT NULL,
      productId INTEGER NOT NULL,
      quantity  INTEGER NOT NULL,
      price     REAL    NOT NULL,
      FOREIGN KEY (orderId) REFERENCES "Order"(orderId) ON DELETE CASCADE
    );
  `);
}

initializeDatabase();

module.exports = db;
