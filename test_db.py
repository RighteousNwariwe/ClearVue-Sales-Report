from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
#get uri from  environment file 
MONGO_URI = os.getenv('MONGODB_URI')
#test database connection
print("Testing MongoDB connection...")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
    
    db = client.get_database()
    print(f"✅ Connected to database")
    
    # List collections
    collections = db.list_collection_names()
    print(f"Collections found: {collections if collections else 'None'}")
    
    client.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
