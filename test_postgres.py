#!/usr/bin/env python3
import psycopg2
from urllib.parse import urlparse

# Test PostgreSQL connection directly
def test_postgres_connection():
    try:
        # Your Railway PostgreSQL connection string
        postgres_url = 'postgresql://postgres:ZDcFOVhNMCnLhFNKMGUimBFwddGaVnNC@ballast.proxy.rlwy.net:21042/railway'
        
        # Parse the URL
        parsed = urlparse(postgres_url)
        
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],  # Remove leading slash
            user=parsed.username,
            password=parsed.password
        )
        
        # Test the connection
        cursor = conn.cursor()
        cursor.execute('SELECT version();')
        version = cursor.fetchone()
        
        print(f"✅ PostgreSQL connection successful!")
        print(f"Database version: {version[0]}")
        
        # Test creating a table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS test_table (
                id SERIAL PRIMARY KEY,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert test data
        cursor.execute('INSERT INTO test_table (message) VALUES (%s)', ('Hello from test script!',))
        conn.commit()
        
        # Read test data
        cursor.execute('SELECT * FROM test_table ORDER BY created_at DESC LIMIT 1')
        result = cursor.fetchone()
        
        print(f"✅ Test data inserted and retrieved: {result}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False

if __name__ == "__main__":
    test_postgres_connection()

