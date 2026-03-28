const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SurveyLabs API',
      version: '1.0.0',
      description: 'Survey intelligence platform REST API',
    },
    servers: [{ url: 'http://localhost:3001' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
const swaggerServe = swaggerUi.serve;
const swaggerSetup = swaggerUi.setup(swaggerSpec);
const swaggerHtml = swaggerUi.generateHTML(swaggerSpec);

module.exports = { swaggerSpec, swaggerServe, swaggerSetup, swaggerHtml };
