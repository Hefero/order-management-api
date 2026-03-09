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

## 🔐 Autenticação JWT

A API utiliza **JSON Web Tokens (JWT)** para proteger endpoints que realizam alterações no banco de dados.

### Fluxo de Autenticação:
1.  **Obter Token**: Realize uma requisição `POST` para `/login`.
2.  **Utilizar Token**: Em todas as requisições protegidas, envie o token no cabeçalho (Header) da seguinte forma:
    *   **Key**: `Authorization`
    *   **Value**: `Bearer <SEU_TOKEN_AQUI>`

---

## 📋 CRUD de Pedidos (Endpoints)

Abaixo estão detalhados todos os endpoints disponíveis na API:

### 1. Autenticação
*   **POST** `/login`
    *   **Descrição**: Gera um token de acesso válido por 2 horas.
    *   **Resposta**: `{ "token": "eyJhbG..." }`

### 2. Criar Novo Pedido (Obrigatório)
*   **POST** `/order`
    *   **Autenticação**: Requer JWT (Bearer Token).
    *   **Descrição**: Recebe o JSON no formato legado e realiza o **Mapping** para o banco SQL.
    *   **Exemplo de Body (Entrada)**:
        ```json
        { 
            "numeroPedido": "v10089015vdb-01", 
            "valorTotal": 10000, 
            "dataCriacao": "2023-07-19T12:24:11.529Z",  
            "items": [{ "idItem": "2434", "quantidadeItem": 1, "valorItem": 1000 }] 
        }
        ```

### 3. Obter Dados do Pedido (Obrigatório)
*   **GET** `/order/:orderId`
    *   **Exemplo**: `http://localhost:3000/order/v10089015vdb-01`
    *   **Descrição**: Retorna os detalhes de um pedido específico e seus itens.

### 4. Listar Todos os Pedidos (Opcional)
*   **GET** `/order/list`
    *   **Parâmetros (Query)**: `page` (padrão 1), `limit` (padrão 10).
    *   **Descrição**: Retorna uma lista paginada de todos os pedidos registrados.

### 5. Atualizar Pedido (Opcional)
*   **PUT** `/order/:orderId`
    *   **Autenticação**: Requer JWT (Bearer Token).
    *   **Descrição**: Atualiza os dados de um pedido existente.
    *   **Exemplo de Body**: `{ "value": 15000, "items": [...] }`

### 6. Deletar Pedido (Opcional)
*   **DELETE** `/order/:orderId`
    *   **Autenticação**: Requer JWT (Bearer Token).
    *   **Descrição**: Remove permanentemente um pedido e seus itens do banco de dados.

---

## 📋 Transformação de Dados (Mapping)

A API realiza a transformação automática do JSON de entrada para o esquema do banco de dados:

| Campo de Entrada | Campo de Saída (SQL) | Tipo de Transformação |
| :--- | :--- | :--- |
| `numeroPedido` | `orderId` | Mapeamento direto de String |
| `valorTotal` | `value` | Mapeamento direto de Number |
| `dataCriacao` | `creationDate` | Conversão para ISO 8601 (Date) |
| `items[].idItem` | `items[].productId` | Conversão de String para Integer |
| `items[].quantidadeItem` | `items[].quantity` | Mapeamento direto de Integer |
| `items[].valorItem` | `items[].price` | Mapeamento direto de Number |

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
