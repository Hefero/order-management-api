# 📦 Order Management API - Node.js & SQL

Esta é uma API REST robusta desenvolvida em **Node.js** para o gerenciamento completo de pedidos. O projeto foi construído seguindo rigorosos critérios de avaliação, incluindo tratamento de erros robusto, mapeamento de dados explícito e documentação completa.

---

## 🚀 Funcionalidades Principais

- **CRUD de Pedidos**: Criar, Ler, Atualizar e Deletar pedidos.
- **Data Transformation**: Mapeamento automático de campos do JSON de entrada para o esquema do banco.
- **Autenticação JWT**: Segurança nos endpoints de escrita (POST, PUT, DELETE).
- **Banco de Dados SQL**: Persistência utilizando SQLite com Sequelize ORM.
- **Documentação Swagger**: Interface interativa para testes de API.
- **Front-end Integrado**: Painel moderno com gestão completa de pedidos e itens.
- **Testes Automatizados**: Suíte de testes de integração com Jest e Supertest.

---

## 🗄️ Modelo do Banco de Dados (SQL)

A API utiliza um banco de dados SQL (SQLite) com a seguinte modelagem relacional:

### 1. Tabela: `Orders` (Pedidos)
Armazena as informações principais do pedido.
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `orderId` | `STRING` | Chave Primária (ID do Pedido) |
| `value` | `FLOAT` | Valor total do pedido |
| `creationDate` | `DATE` | Data de criação do pedido |

### 2. Tabela: `Items` (Itens do Pedido)
Armazena os itens vinculados a cada pedido (Relacionamento 1:N).
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Chave Primária (Auto-incremento) |
| `orderId` | `STRING` | Chave Estrangeira (Referencia `Orders.orderId`) |
| `productId` | `INTEGER` | ID do produto |
| `quantity` | `INTEGER` | Quantidade do item |
| `price` | `FLOAT` | Preço unitário do item |

> **Nota**: A exclusão de um pedido (`Order`) remove automaticamente todos os seus itens (`Items`) via `ON DELETE CASCADE`.

---

## 📋 Transformação de Dados (Mapping)

A API realiza a transformação automática do JSON de entrada para o esquema do banco de dados:

| Campo de Entrada (JSON) | Campo de Saída (Banco SQL) | Tipo de Transformação |
| :--- | :--- | :--- |
| `numeroPedido` | `orderId` | Mapeamento direto de String |
| `valorTotal` | `value` | Mapeamento direto de Number |
| `dataCriacao` | `creationDate` | Conversão para ISO 8601 (Date) |
| `items[].idItem` | `items[].productId` | Conversão de String para Integer |
| `items[].quantidadeItem` | `items[].quantity` | Mapeamento direto de Integer |
| `items[].valorItem` | `items[].price` | Mapeamento direto de Number |

---

## 🔐 Autenticação JWT

A API utiliza **JSON Web Tokens (JWT)** para proteger endpoints que realizam alterações no banco de dados.

### Fluxo de Autenticação:
1.  **Obter Token**: Realize uma requisição `POST` para `/login`.
2.  **Utilizar Token**: Em todas as requisições protegidas, envie o token no cabeçalho (Header):
    *   **Key**: `Authorization`
    *   **Value**: `Bearer <SEU_TOKEN_AQUI>`

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
- **Front-end**: `http://localhost:3000` (Painel de Gestão Completo)

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
