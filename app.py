#Complete interactive data streamer
import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Import dependencies
try:
    from kafka import KafkaProducer
    from pymongo import MongoClient
    import pandas as pd
    import plotly.express as px
    print("✅ Dependencies loaded")
except ImportError as e:
    print(f"❌ Missing: {e}")
    print("Run: pip install -r requirements.txt")
    exit(1)

# Configuration
MONGO_URI = os.getenv('MONGODB_URI')
KAFKA_BROKER = os.getenv('KAFKA_BROKER', 'localhost:9092')

class DataStreamer:
    def __init__(self):
        print("\n" + "="*50)
        print("🚀 DATA STREAMER")
        print("="*50)
        
        # Connect MongoDB
        try:
            self.mongo = MongoClient(MONGO_URI)
            self.db = self.mongo.get_database()
            self.collection = self.db['streaming_data']
            print("✅ MongoDB connected")
        except Exception as e:
            print(f"❌ MongoDB error: {e}")
            self.mongo = None
        
        # Connect Kafka
        try:
            self.kafka = KafkaProducer(
                bootstrap_servers=[KAFKA_BROKER],
                value_serializer=lambda x: json.dumps(x, default=str).encode('utf-8')
            )
            print(f"✅ Kafka connected to {KAFKA_BROKER}")
        except Exception as e:
            print(f"⚠️ Kafka error: {e}")
            self.kafka = None
        
        self.session_id = str(uuid.uuid4())[:8]
        print(f"📱 Session: {self.session_id}")
        print("="*50 + "\n")
    
    def save(self, data):
        """Save to both Kafka and MongoDB"""
        data['session_id'] = self.session_id
        data['timestamp'] = datetime.now().isoformat()
        
        # To Kafka
        if self.kafka:
            try:
                self.kafka.send('user-input', value=data)
                self.kafka.flush()
                print("   📤 Sent to Kafka")
            except Exception as e:
                print(f"   ⚠️ Kafka failed: {e}")
        
        # To MongoDB
        if self.mongo:
            try:
                result = self.collection.insert_one(data)
                print(f"   💾 Saved to MongoDB")
                return result.inserted_id
            except Exception as e:
                print(f"   ❌ MongoDB failed: {e}")
        
        return None
    
    def run(self):
        print("Simple Data Collection\n")
        
        # Get user info
        name = input("Your name: ")
        email = input("Your email: ")
        
        # Save user
        user_data = {
            'type': 'user',
            'name': name,
            'email': email,
            'user_id': str(uuid.uuid4())
        }
        self.save(user_data)
        
        # Get feedback
        print("\n" + "-"*30)
        rating = input("Rating (1-5): ")
        comment = input("Your feedback: ")
        
        # Save feedback
        feedback_data = {
            'type': 'feedback',
            'rating': int(rating),
            'comment': comment,
            'user_id': user_data['user_id']
        }
        self.save(feedback_data)
        
        print("\n" + "="*50)
        print("✅ Data streamed successfully!")
        print("="*50)

if __name__ == "__main__":
    streamer = DataStreamer()
    streamer.run()
