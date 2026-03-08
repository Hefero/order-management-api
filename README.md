# 📦 Order Management API - Node.js & SQL

Esta é uma API REST robusta desenvolvida em **Node.js** para o gerenciamento completo de pedidos. O projeto inclui transformação de dados (mapping), persistência em banco de dados SQL, autenticação JWT, documentação interativa com Swagger, testes automatizados e um front-end simples para visualização.

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

## 🛠️ Tecnologias Utilizadas

- **Runtime**: Node.js
- **Framework**: Express.js
- **Banco de Dados**: SQLite (SQL)
- **ORM**: Sequelize
- **Segurança**: JSON Web Token (JWT)
- **Documentação**: Swagger UI & JSDoc
- **Testes**: Jest & Supertest
- **Front-end**: HTML5, JavaScript (Fetch API) e Tailwind CSS

---

## 🗄️ Configuração do Banco de Dados (SQL)

A API utiliza o **SQLite**, o que dispensa a instalação de um servidor de banco de dados externo. O banco é criado automaticamente na primeira execução.

### Estrutura das Tabelas
Se desejar criar as tabelas manualmente em outro banco SQL (como MySQL ou PostgreSQL), utilize o script `schema.sql` incluído na raiz:

```sql
-- Tabela de Pedidos
CREATE TABLE Orders (
    orderId TEXT PRIMARY KEY NOT NULL,
    value REAL NOT NULL,
    creationDate TEXT NOT NULL
);

-- Tabela de Itens (Relacionada ao Pedido)
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

## 📥 Instalação e Execução (Passo a Passo)

Siga os passos abaixo para rodar o projeto do zero em sua máquina:

### 1. Pré-requisitos
Certifique-se de ter o **Node.js** (v14 ou superior) e o **npm** instalados.

### 2. Clonar o Repositório
```bash
git clone https://github.com/Hefero/order-management-api.git
cd order-management-api
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Iniciar o Servidor
```bash
npm start
```
O servidor iniciará em `http://localhost:3000`.

---

## 🧪 Como Testar a Solução

### Opção A: Pelo Front-end (Recomendado)
1. Abra o navegador em `http://localhost:3000`.
2. Clique em **"Obter Token JWT"** para se autenticar.
3. A lista de pedidos aparecerá com suporte a **paginação** e opção de **exclusão**.

### Opção B: Pela Documentação Swagger
1. Acesse `http://localhost:3000/api-docs`.
2. Use o endpoint `/login` para gerar um token.
3. Clique em **"Authorize"** no topo da página e cole o token.
4. Teste os endpoints de criação e consulta diretamente pela interface.

### Opção C: Via Terminal (cURL)
**Criar um Pedido (Exemplo de Mapping):**
```bash
curl -X POST http://localhost:3000/order \
-H "Authorization: Bearer <SEU_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
    "numeroPedido": "v10089015vdb-01",
    "valorTotal": 10000,
    "dataCriacao": "2023-07-19T12:24:11.529Z",
    "items": [
        {
            "idItem": "2434",
            "quantidadeItem": 1,
            "valorItem": 1000
        }
    ]
}'
```

---

## 🛡️ Rodando Testes Automatizados

Para validar a integridade da API e o tratamento de erros robusto:
```bash
npm test
```
Isso executará a suíte de testes do Jest, validando autenticação, criação de pedidos e retornos de erro (404, 401, etc).

---

## 📂 Estrutura do Projeto

- `index.js`: Ponto de entrada, rotas e configurações da API.
- `database.js`: Configuração do Sequelize e modelos SQL.
- `schema.sql`: Script SQL puro para criação das tabelas.
- `api.test.js`: Testes de integração.
- `public/`: Arquivos do front-end (HTML/JS).
- `README.md`: Este guia de instruções.
