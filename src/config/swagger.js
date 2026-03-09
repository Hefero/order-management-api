
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orders API',
      version: '1.0.0',
      description: 'API para gerenciamento de pedidos (challenge técnico)'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
};

module.exports = swaggerSetup;
