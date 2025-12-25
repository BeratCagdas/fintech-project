# Python 3.11 slim imajını kullan
FROM python:3.11-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Gerekli sistem paketlerini yükle (PostgreSQL için)
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Requirements dosyasını kopyala ve bağımlılıkları yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm uygulama dosyalarını kopyala
COPY . .

# Port 8000'i aç
EXPOSE 8000

# Uygulamayı başlat
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
