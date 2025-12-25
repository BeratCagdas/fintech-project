# analytics/test_snapshot.py (yeni dosya)
import requests
from config.mongo import get_mongo_db

# İlk user'ı al
db = get_mongo_db()
user = db.users.find_one()

if user:
    user_id = str(user['_id'])
    print(f"Testing snapshot for user: {user_id}")
    
    # Snapshot oluştur
    response = requests.post('http://localhost:8000/api/snapshot/create', json={
        'user_id': user_id,
        'month': '2025-12'
    })
    
    print("Status Code:", response.status_code)
    print("Response:", response.json())
else:
    print("❌ No user found in MongoDB")