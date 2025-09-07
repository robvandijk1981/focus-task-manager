#!/usr/bin/env python3
import sqlite3
import psycopg2
import hashlib
from urllib.parse import urlparse

def migrate_sqlite_to_postgres():
    """Migrate data from SQLite to PostgreSQL"""
    
    # SQLite connection
    sqlite_conn = sqlite3.connect('task_manager.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # PostgreSQL connection
    postgres_url = 'postgresql://postgres:ZDcFOVhNMCnLhFNKMGUimBFwddGaVnNC@ballast.proxy.rlwy.net:21042/railway'
    parsed = urlparse(postgres_url)
    postgres_conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port,
        database=parsed.path[1:],
        user=parsed.username,
        password=parsed.password
    )
    postgres_cursor = postgres_conn.cursor()
    
    print("🔄 Starting migration from SQLite to PostgreSQL...")
    
    # Create tables in PostgreSQL
    print("📋 Creating tables in PostgreSQL...")
    
    postgres_cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    postgres_cursor.execute('''
        CREATE TABLE IF NOT EXISTS tracks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#3B82F6',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    postgres_cursor.execute('''
        CREATE TABLE IF NOT EXISTS goals (
            id SERIAL PRIMARY KEY,
            track_id INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            target_value INTEGER DEFAULT 1,
            current_value INTEGER DEFAULT 0,
            unit VARCHAR(50) DEFAULT 'times',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (track_id) REFERENCES tracks (id)
        )
    ''')
    
    postgres_cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            goal_id INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (goal_id) REFERENCES goals (id)
        )
    ''')
    
    # Migrate users
    print("👤 Migrating users...")
    sqlite_cursor.execute('SELECT * FROM users')
    users = sqlite_cursor.fetchall()
    
    for user in users:
        try:
            postgres_cursor.execute(
                'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (%s, %s, %s, %s, %s)',
                user
            )
            print(f"✅ Migrated user: {user[2]} ({user[1]})")
        except Exception as e:
            print(f"⚠️ User already exists or error: {e}")
    
    # Migrate tracks
    print("🎯 Migrating tracks...")
    sqlite_cursor.execute('SELECT * FROM tracks')
    tracks = sqlite_cursor.fetchall()
    
    for track in tracks:
        try:
            postgres_cursor.execute(
                'INSERT INTO tracks (id, user_id, name, description, color, created_at) VALUES (%s, %s, %s, %s, %s, %s)',
                track
            )
            print(f"✅ Migrated track: {track[2]}")
        except Exception as e:
            print(f"⚠️ Track already exists or error: {e}")
    
    # Migrate goals
    print("🎯 Migrating goals...")
    sqlite_cursor.execute('SELECT * FROM goals')
    goals = sqlite_cursor.fetchall()
    
    for goal in goals:
        try:
            postgres_cursor.execute(
                'INSERT INTO goals (id, track_id, title, description, target_value, current_value, unit, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
                goal
            )
            print(f"✅ Migrated goal: {goal[2]}")
        except Exception as e:
            print(f"⚠️ Goal already exists or error: {e}")
    
    # Migrate tasks
    print("📝 Migrating tasks...")
    sqlite_cursor.execute('SELECT * FROM tasks')
    tasks = sqlite_cursor.fetchall()
    
    for task in tasks:
        try:
            # Convert SQLite boolean (0/1) to PostgreSQL boolean
            completed = bool(task[4]) if len(task) > 4 else False
            postgres_cursor.execute(
                'INSERT INTO tasks (id, goal_id, title, description, completed, created_at) VALUES (%s, %s, %s, %s, %s, %s)',
                (task[0], task[1], task[2], task[3], completed, task[5])
            )
            print(f"✅ Migrated task: {task[2]}")
        except Exception as e:
            print(f"⚠️ Task already exists or error: {e}")
    
    # Commit changes
    try:
        postgres_conn.commit()
        print("✅ Changes committed to PostgreSQL")
    except Exception as e:
        print(f"❌ Error committing changes: {e}")
        postgres_conn.rollback()
        return
    
    # Verify migration
    print("\n🔍 Verifying migration...")
    try:
        postgres_cursor.execute('SELECT COUNT(*) FROM users')
        user_count = postgres_cursor.fetchone()[0]
        print(f"Users in PostgreSQL: {user_count}")
        
        postgres_cursor.execute('SELECT COUNT(*) FROM tracks')
        track_count = postgres_cursor.fetchone()[0]
        print(f"Tracks in PostgreSQL: {track_count}")
        
        postgres_cursor.execute('SELECT COUNT(*) FROM goals')
        goal_count = postgres_cursor.fetchone()[0]
        print(f"Goals in PostgreSQL: {goal_count}")
        
        postgres_cursor.execute('SELECT COUNT(*) FROM tasks')
        task_count = postgres_cursor.fetchone()[0]
        print(f"Tasks in PostgreSQL: {task_count}")
    except Exception as e:
        print(f"❌ Error verifying migration: {e}")
    
    # Close connections
    sqlite_conn.close()
    postgres_conn.close()
    
    print("\n🎉 Migration completed successfully!")
    print("Now your app will use PostgreSQL with all the existing data!")

if __name__ == "__main__":
    migrate_sqlite_to_postgres()
