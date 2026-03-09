const path = require('path');
const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');

const routesDir = path.join(__dirname, '..', 'routes');
const controllersDir = path.join(__dirname, '..', 'controllers');

const apis = [
  ...fs.readdirSync(routesDir).filter((f) => f.endsWith('.js')).map((f) => path.join(routesDir, f)),
  ...fs.readdirSync(controllersDir).filter((f) => f.endsWith('.js')).map((f) => path.join(controllersDir, f)),
];

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'HMS API Documentation',
      version: '1.0.0',
      description: 'Hospital Management System API Documentation',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis,
};

const swaggerSpec = swaggerJsdoc(options);

// Swagger UI rejects specs that have both "swagger" and "openapi" - keep only openapi
if (swaggerSpec.openapi && swaggerSpec.swagger) {
  delete swaggerSpec.swagger;
}

module.exports = swaggerSpec;



