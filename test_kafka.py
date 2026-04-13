# test_kafka.py - Quick connectivity test
from kafka import KafkaProducer
import json

def test_kafka():
    try:
        producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        producer.send('test-topic', {'test': 'Hello Kafka!'})
        producer.flush()
        print("✅ Kafka is working!")
        return True
    except Exception as e:
        print(f"❌ Kafka error: {e}")
        print("\nMake sure Kafka is running:")
        print("  cd C:\\kafka")
        print("  bin\\windows\\kafka-server-start.bat config\\server.properties")
        return False

if __name__ == "__main__":
    test_kafka()
