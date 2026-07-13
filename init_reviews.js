const db = require('./server/src/db');
db.prepare(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    bookId TEXT, 
    customerName TEXT, 
    rating INTEGER, 
    comment TEXT, 
    orderNumber TEXT, 
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();
console.log('Reviews table created successfully.');
process.exit(0);
