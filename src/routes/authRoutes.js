/**
 * Rotas de autenticação.
 * POST /auth/token  - Gera um token JWT para uso nas rotas protegidas.
 */

const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'jitterbit_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * @swagger
 * /auth/token:
 *   post:
 *     summary: Gera um token JWT de acesso
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
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
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/token', (req, res) => {
  const { username, password } = req.body;

  // Credenciais fixas para demonstração (em produção, validar contra banco de dados)
  if (username !== 'admin' || password !== 'admin123') {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return res.status(200).json({ token });
});

module.exports = router;
