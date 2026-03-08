# Order Management API

API REST desenvolvida em Node.js para gerenciamento de pedidos, com suporte a mapeamento de dados, banco de dados SQL (SQLite), autenticação JWT e documentação Swagger.

## 🚀 Funcionalidades

- **Criação de Pedidos**: Recebe um JSON de entrada e realiza a transformação dos dados (mapping) para o formato do banco.
- **Leitura de Pedidos**: Consulta por ID ou listagem completa.
- **Atualização e Exclusão**: Gerenciamento completo do ciclo de vida do pedido.
- **Autenticação JWT**: Proteção de endpoints sensíveis.
- **Documentação Swagger**: Interface interativa para testes da API.

## 🛠️ Tecnologias

- **Node.js** & **Express**
- **Sequelize** (ORM) & **SQLite** (Banco de Dados SQL)
- **JWT** (jsonwebtoken)
- **Swagger** (swagger-ui-express)

## 📋 Mapeamento de Dados (Data Transformation)

A API realiza a transformação automática do JSON de entrada para o esquema do banco de dados:

| JSON de Entrada | Banco de Dados (SQL) |
| :--- | :--- |
| `numeroPedido` | `orderId` |
| `valorTotal` | `value` |
| `dataCriacao` | `creationDate` |
| `items[].idItem` | `items[].productId` |
| `items[].quantidadeItem` | `items[].quantity` |
| `items[].valorItem` | `items[].price` |

## 🗄️ Estrutura do Banco de Dados (SQL)

O script para criação manual das tabelas está disponível no arquivo `schema.sql`:

```sql
CREATE TABLE Orders (
    orderId TEXT PRIMARY KEY NOT NULL,
    value REAL NOT NULL,
    creationDate TEXT NOT NULL
);

CREATE TABLE Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (orderId) REFERENCES Orders(orderId) ON DELETE CASCADE
);
```

## 🚀 Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Iniciar o servidor**:
   ```bash
   node index.js
   ```

3. **Acessar Documentação**:
   Abra `http://localhost:3000/api-docs` no seu navegador.

4. **Acessar Front-end**:
   Abra `http://localhost:3000` no seu navegador para gerenciar os pedidos visualmente.

## 🧪 Testes Automatizados

Para garantir a qualidade e robustez da API, foram implementados testes de integração usando **Jest** e **Supertest**.

Para rodar os testes:
```bash
npm test
```

## 🔐 Autenticação

Para utilizar os endpoints de **Criar**, **Atualizar** ou **Deletar**, você deve:
1. Fazer uma requisição `POST` para `/login`.
2. Copiar o `token` retornado.
3. Incluir no Header das requisições: `Authorization: Bearer <SEU_TOKEN>`.

## 🧪 Exemplo de Request (Criação)

```bash
curl --location 'http://localhost:3000/order' \
--header 'Authorization: Bearer <TOKEN>' \
--header 'Content-Type: application/json' \
--data '{
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
}'
```
