/**
 * Ponto de entrada da aplicação.
 * Configura o Express, middlewares globais, rotas e Swagger.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

const authRoutes = require('./src/routes/authRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jitterbit_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

// ─── Middlewares globais ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.get("/health",(req,res)=>res.json({status:"ok",service:"order-api"}));

// ─── Frontend estático (public/) ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Documentação Swagger ─────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Rota de login simplificado (usada pelo front-end) ────────────────────────
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Gera um token JWT de acesso (sem credenciais - para uso do front-end)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */
app.post('/login', (req, res) => {
  const token = jwt.sign({ username: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return res.status(200).json({ token });
});

// ─── Rotas ────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/order', orderRoutes);

// ─── Handler de rotas não encontradas ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ─── Handler global de erros ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno inesperado.', details: err.message });
});

// ─── Inicialização do servidor ────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Front-end:    http://localhost:${PORT}`);
    console.log(`Swagger:      http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
