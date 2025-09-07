#!/usr/bin/env python3
"""Test script to debug Railway deployment issues"""

import os
import psycopg2
from urllib.parse import urlparse

def test_postgres_connection():
    """Test PostgreSQL connection"""
    try:
        # Use the same connection string as in the app
        railway_postgres = 'postgresql://postgres:ZDcFOVhNMCnLhFNKMGUimBFwddGaVnNC@ballast.proxy.rlwy.net:21042/railway'
        
        print(f"Testing connection to: {railway_postgres[:30]}...")
        
        parsed = urlparse(railway_postgres)
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],
            user=parsed.username,
            password=parsed.password
        )
        
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        result = cursor.fetchone()
        
        print(f"✅ PostgreSQL connection successful: {result}")
        
        # Test if tables exist
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = cursor.fetchall()
        print(f"✅ Tables found: {[table[0] for table in tables]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False

def test_imports():
    """Test if all required imports work"""
    try:
        import psycopg2
        import sqlite3
        from urllib.parse import urlparse
        from flask import Flask, request, jsonify
        from flask_cors import CORS
        import jwt
        import hashlib
        import datetime
        print("✅ All imports successful")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

if __name__ == "__main__":
    print("=== Railway Deployment Test ===")
    print(f"Python version: {os.sys.version}")
    print(f"Current directory: {os.getcwd()}")
    print(f"PORT environment: {os.environ.get('PORT', 'not_set')}")
    print()
    
    print("1. Testing imports...")
    test_imports()
    print()
    
    print("2. Testing PostgreSQL connection...")
    test_postgres_connection()
    print()
    
    print("Test completed!")

