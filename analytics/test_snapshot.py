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
    # Anomaly senaryosu: Eğlence kategorisinde ani artış (10000 TL)
    payload = {
        'userId': user_id,
        'month': '2025-03',
        'year': 2025,
        'monthName': 'Mart',
        'income': 50000,
        'expenses': 15000,
        'savings': 35000,
        'cumulativeSavings': 100000,
        'variableExpenses': [
            {'name': 'Netflix', 'amount': 200, 'category': 'eglence'},
            {'name': 'Sinema', 'amount': 500, 'category': 'eglence'},
            {'name': 'Tatil', 'amount': 10000, 'category': 'eglence'} # ANOMALİ!
        ],
        'fixedExpenses': [
            {'name': 'Kira', 'amount': 4000, 'category': 'kira', 'isRecurring': True}
        ]
    }
    
    response = requests.post('http://localhost:8000/api/calculate-monthly-snapshot', json=payload)
    
    print("Status Code:", response.status_code)
    print("Response:", response.json())
else:
    print("❌ No user found in MongoDB")