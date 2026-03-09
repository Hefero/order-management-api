/**
 * frontend_test.js
 *
 * Testes end-to-end (caixa-preta) contra servidor rodando.
 *
 * Execute:
 * node frontend_test.js
 *
 * Pré-requisito:
 * npm start
 */

const http = require("http");

const BASE_URL = "http://localhost:3000";

let passed = 0;
let failed = 0;

function logSection(title) {
  console.log(`\n=== ${title} ===`);
}

function pass(name) {
  console.log(`PASS  ${name}`);
  passed++;
}

function fail(name, detail) {
  console.log(`FAIL  ${name}`);
  if (detail) console.log("      ", detail);
  failed++;
}

function assert(name, condition, detail = null) {
  if (condition) pass(name);
  else fail(name, detail);
}

function request(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (payload) {
      options.headers["Content-Length"] = Buffer.byteLength(payload);
    }

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        let parsed = data;

        try {
          parsed = JSON.parse(data);
        } catch (_) {}

        resolve({
          status: res.statusCode,
          body: parsed,
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        status: 0,
        body: { error: err.message },
      });
    });

    if (payload) req.write(payload);
    req.end();
  });
}

function getHTML(path) {
  return new Promise((resolve) => {
    http
      .get(BASE_URL + path, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: data,
          });
        });
      })
      .on("error", (err) => {
        resolve({
          status: 0,
          body: err.message,
        });
      });
  });
}

async function runTests() {
  const ORDER_ID = `FE-${Date.now()}`;
  let token;

  /*
  =================================
  FRONTEND
  =================================
  */

  logSection("Frontend");

  const home = await getHTML("/");

  assert("GET / retorna 200", home.status === 200, home.status);
  assert("HTML contém título", home.body.includes("Gestão de Pedidos"));
  assert("HTML carrega Tailwind", home.body.includes("tailwind"));
  assert("HTML contém formulário", home.body.includes("order-form"));

  const docs = await getHTML("/api-docs/");
  assert("Swagger acessível", docs.status === 200);

  /*
  =================================
  AUTENTICAÇÃO
  =================================
  */

  logSection("Autenticação");

  const login = await request("POST", "/login");

  assert("POST /login retorna 200", login.status === 200);
  assert("Token retornado", typeof login.body.token === "string");

  token = login.body.token;

  const auth = await request("POST", "/auth/token", {
    username: "admin",
    password: "admin123",
  });

  assert("POST /auth/token retorna 200", auth.status === 200);
  assert("Token JWT válido", typeof auth.body.token === "string");

  /*
  =================================
  CRIAR PEDIDO
  =================================
  */

  logSection("Criar Pedido");

  const create = await request(
    "POST",
    "/order",
    {
      numeroPedido: ORDER_ID,
      valorTotal: 10000,
      dataCriacao: "2024-03-08T10:00:00.000Z",
      items: [
        { idItem: "101", quantidadeItem: 2, valorItem: 5000 },
        { idItem: "202", quantidadeItem: 1, valorItem: 5000 },
      ],
    },
    token
  );

  assert("POST /order → 201", create.status === 201);

  assert("Mapping numeroPedido → orderId", create.body.orderId === ORDER_ID);

  assert("Mapping valorTotal → value", create.body.value === 10000);

  assert("Itens criados", Array.isArray(create.body.items));

  /*
  =================================
  BUSCAR PEDIDO
  =================================
  */

  logSection("Buscar Pedido");

  const getOrder = await request("GET", `/order/${ORDER_ID}`, null, token);

  assert("GET /order/:id → 200", getOrder.status === 200);

  assert(
    "Retorna orderId correto",
    getOrder.body.orderId === ORDER_ID
  );

  /*
  =================================
  LISTAGEM
  =================================
  */

  logSection("Listagem");

  const list = await request(
    "GET",
    "/order/list?page=1&limit=5",
    null,
    token
  );

  assert("GET /order/list → 200", list.status === 200);

  assert("Lista retorna array", Array.isArray(list.body.orders));

  /*
  =================================
  UPDATE
  =================================
  */

  logSection("Atualizar Pedido");

  const update = await request(
    "PUT",
    `/order/${ORDER_ID}`,
    {
      valorTotal: 9999,
      dataCriacao: "2024-06-01T00:00:00Z",
      items: [{ idItem: "999", quantidadeItem: 1, valorItem: 9999 }],
    },
    token
  );

  assert("PUT /order/:id → 200", update.status === 200);

  assert("Valor atualizado", update.body.value === 9999);

  /*
  =================================
  DELETE
  =================================
  */

  logSection("Deletar Pedido");

  const del = await request("DELETE", `/order/${ORDER_ID}`, null, token);

  assert("DELETE → 200", del.status === 200);

  const checkGone = await request("GET", `/order/${ORDER_ID}`, null, token);

  assert("Pedido removido (404)", checkGone.status === 404);

  /*
  =================================
  RESULTADO FINAL
  =================================
  */

  const total = passed + failed;

  console.log("\n-----------------------------");
  console.log(`Resultado: ${passed}/${total} passaram`);

  if (failed > 0) {
    console.log(`${failed} testes falharam`);
    process.exit(1);
  } else {
    console.log("Todos os testes passaram");
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});