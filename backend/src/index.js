require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware — patient registration may include consent signatures and profile photos
const BODY_PARSER_LIMIT = '15mb';
app.use(cors());
app.use(bodyParser.json({ limit: BODY_PARSER_LIMIT }));
app.use(bodyParser.urlencoded({ extended: true, limit: BODY_PARSER_LIMIT }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'HMS API Documentation',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/api', require('./routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request payload is too large. Try removing large attachments or use smaller images.',
    });
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'A record with this value already exists',
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
    });
  }

  const status = err.statusCode || err.status || 500;
  if (status < 500) {
    return res.status(status).json({
      success: false,
      message: err.message || 'Request failed',
      error: err.message || 'Request failed',
    });
  }

  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;

