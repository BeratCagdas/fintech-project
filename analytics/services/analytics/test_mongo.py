from config.mongo import get_mongo_db

db = get_mongo_db()

print("MongoDB connected successfully")
print("Collections:", db.list_collection_names())