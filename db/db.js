// db.js
// services/configService.js
import dotenv from 'dotenv';
dotenv.config(); // ✅ Load environment variables first


import mysql from 'mysql2/promise';
console.log(process.env.DBNAME);

const pool = mysql.createPool({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASS,
  database: process.env.DBNAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00',
});

export default pool;
