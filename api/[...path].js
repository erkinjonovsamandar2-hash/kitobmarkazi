// Vercel catch-all: routes all /api/* requests to Express
// Wrap in try-catch to surface module loading errors
let app;
try {
  app = require('../server/src/index');
} catch(e) {
  // If Express app fails to load, return the error
  app = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      error: 'App failed to load', 
      message: e.message,
      stack: e.stack 
    }));
  };
}
module.exports = app;
