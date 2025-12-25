// backend/src/db.js
import pg from 'pg';
import dotenv from 'dotenv';

// .env dosyasındaki değişkenleri yükle
dotenv.config();

// Bağlantı Havuzu (Pool) Oluştur
// Pool, veritabanı bağlantılarını yönetir ve performansı artırır.
const { Pool } = pg;

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Bağlantı hatası olursa konsola bas
pool.on('error', (err) => {
  console.error('Beklenmeyen PostgreSQL hatası:', err);
  process.exit(-1);
});

// Sorgu atmak için kullanacağımız fonksiyon
export const get_pg_connection = () => {
  return pool;
};

// Eğer tek seferlik sorgu atacaksan direkt bunu da kullanabilirsin (export default)
export default pool;