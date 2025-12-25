import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_pg_connection():
    # Önce DATABASE_URL'i kontrol et (Render için)
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        return psycopg2.connect(database_url)
    else:
        # Yoksa ayrı ayrı değişkenleri kullan (local geliştirme için)
        return psycopg2.connect(
            host=os.getenv("PG_HOST"),
            port=os.getenv("PG_PORT"),
            database=os.getenv("PG_DATABASE"),
            user=os.getenv("PG_USER"),
            password=os.getenv("PG_PASSWORD")
        )
