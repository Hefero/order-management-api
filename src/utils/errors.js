/**
 * Erros de domínio da aplicação.
 * Permite distinguir erros esperados (validação) de erros internos (500).
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

module.exports = { ValidationError };
