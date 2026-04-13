# dashboard.py - Generate simple dashboard
import os
import pandas as pd
import plotly.express as px
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB
client = MongoClient(os.getenv('MONGODB_URI'))
db = client.get_database()
collection = db['streaming_data']

# Load data
print("📊 Loading data...")
data = list(collection.find())
df = pd.DataFrame(data)

if df.empty:
    print("No data found. Run app.py first to collect some data!")
    exit()

print(f"Loaded {len(df)} records")

# Create dashboard
fig = px.pie(df, names='type', title='Data Distribution')
fig.write_html('dashboard.html')
print("✅ Dashboard created: dashboard.html")

# Show rating trends if available
feedback_df = df[df['type'] == 'feedback']
if not feedback_df.empty:
    fig2 = px.bar(feedback_df, x='rating', title='Rating Distribution')
    fig2.write_html('ratings.html')
    print("✅ Ratings chart created: ratings.html")
