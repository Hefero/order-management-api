# 📦 Order Management API - Node.js & SQL

Esta é uma API REST robusta desenvolvida em **Node.js** para o gerenciamento completo de pedidos. O projeto foi construído seguindo rigorosos critérios de avaliação, incluindo tratamento de erros robusto, mapeamento de dados explícito e documentação completa.

---

## 🚀 Funcionalidades Principais

- **CRUD de Pedidos**: Criar, Ler, Atualizar e Deletar pedidos.
- **Data Transformation**: Mapeamento automático de campos do JSON de entrada para o esquema do banco.
- **Autenticação JWT**: Segurança nos endpoints de escrita (POST, PUT, DELETE).
- **Banco de Dados SQL**: Persistência utilizando SQLite com Sequelize ORM.
- **Documentação Swagger**: Interface interativa para testes de API.
- **Front-end Integrado**: Painel simples com paginação para gestão de pedidos.
- **Testes Automatizados**: Suíte de testes de integração com Jest e Supertest.

---

## 📋 Transformação de Dados (Mapping)

A API foi projetada para receber dados de um sistema legado/externo e transformá-los para um formato padronizado antes de salvar no banco de dados SQL.

### 📥 JSON de Entrada (Request Body)
Este é o formato que a API espera receber no endpoint `POST /order`:

```json
{ 
    "numeroPedido": "v10089015vdb-01", 
    "valorTotal": 10000, 
    "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",  
    "items": [ 
        { 
            "idItem": "2434", 
            "quantidadeItem": 1, 
            "valorItem": 1000 
        } 
    ] 
}
```

### 📤 JSON de Saída / Banco de Dados (Mapped Data)
Após o processamento, os dados são transformados e armazenados conforme abaixo:

| Campo de Entrada | Campo de Saída (SQL) | Tipo de Transformação |
| :--- | :--- | :--- |
| `numeroPedido` | `orderId` | Mapeamento direto de String |
| `valorTotal` | `value` | Mapeamento direto de Number |
| `dataCriacao` | `creationDate` | Conversão para ISO 8601 (Date) |
| `items[].idItem` | `items[].productId` | Conversão de String para Integer |
| `items[].quantidadeItem` | `items[].quantity` | Mapeamento direto de Integer |
| `items[].valorItem` | `items[].price` | Mapeamento direto de Number |

**Resultado Final no Banco:**
```json
{
    "orderId": "v10089015vdb-01",
    "value": 10000,
    "creationDate": "2023-07-19T12:24:11.529Z",
    "items": [
        {
            "productId": 2434,
            "quantity": 1,
            "price": 1000
        }
    ]
}
```

---

## 🗄️ Estrutura do Banco de Dados (SQL)

O banco de dados é gerido pelo Sequelize (SQLite). O script `schema.sql` reflete a estrutura exata:

```sql
-- Tabela: Order
CREATE TABLE Orders (
    orderId TEXT PRIMARY KEY NOT NULL,
    value REAL NOT NULL,
    creationDate TEXT NOT NULL
);

-- Tabela: Items
CREATE TABLE Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (orderId) REFERENCES Orders(orderId) ON DELETE CASCADE
);
```

---

## 📥 Instalação e Execução

### 1. Pré-requisitos
- **Node.js** (v14+) e **npm**.

### 2. Instalação
```bash
git clone https://github.com/Hefero/order-management-api.git
cd order-management-api
npm install
```

### 3. Execução
```bash
npm start
```
- **API**: `http://localhost:3000`
- **Swagger**: `http://localhost:3000/api-docs`
- **Front-end**: `http://localhost:3000` (Painel de Gestão)

---

## 🧪 Testes e Validação

### Testes Automatizados
Para rodar a suíte de testes (Jest/Supertest) que valida o tratamento de erros e o mapping:
```bash
npm test
```

### Tratamento de Erros
A API retorna códigos HTTP semânticos:
- `201 Created`: Sucesso na criação.
- `400 Bad Request`: Dados inválidos ou incompletos.
- `401 Unauthorized`: Token JWT ausente.
- `403 Forbidden`: Token JWT inválido ou expirado.
- `404 Not Found`: Pedido não localizado.
- `409 Conflict`: Tentativa de duplicar um `orderId`.
- `500 Internal Server Error`: Erro inesperado no servidor.

---

## 📂 Estrutura do Projeto

- `index.js`: Lógica da API, Rotas e Mapping.
- `database.js`: Configuração do Sequelize e Modelos SQL.
- `schema.sql`: Script SQL para criação das tabelas.
- `api.test.js`: Testes de integração.
- `public/`: Front-end simples com paginação.
