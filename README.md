# Order Management API

Esta é uma API simples desenvolvida em Node.js para gerenciar pedidos, com suporte a mapeamento de dados, banco de dados SQL (SQLite), autenticação JWT e documentação Swagger.

## Tecnologias Utilizadas

- **Node.js** & **Express**
- **Sequelize** (ORM) & **SQLite** (Banco de Dados)
- **JWT** (Autenticação)
- **Swagger** (Documentação)

## Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd order-management-api
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor:
   ```bash
   node index.js
   ```

O servidor estará rodando em `http://localhost:3000`.

## Endpoints

### Autenticação
- `POST /login`: Gera um token JWT para ser usado nos endpoints protegidos.

### Pedidos
- `POST /order`: Cria um novo pedido (Requer JWT).
- `GET /order/:orderId`: Obtém detalhes de um pedido específico.
- `GET /order/list`: Lista todos os pedidos.
- `PUT /order/:orderId`: Atualiza um pedido (Requer JWT).
- `DELETE /order/:orderId`: Remove um pedido (Requer JWT).

## Documentação

A documentação interativa da API (Swagger) pode ser acessada em:
`http://localhost:3000/api-docs`

## Exemplo de Request (Criação)

```bash
curl --location 'http://localhost:3000/order' \
--header 'Authorization: Bearer <SEU_TOKEN>' \
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
