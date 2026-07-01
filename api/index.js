// Vercel serverless function: routes all /api/* requests to Express
let app;
try {
  app = require('../server/src/index');
} catch(e) {
  app = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'App failed to load', message: e.message, stack: e.stack }));
  };
}
module.exports = app;
