from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import sqlite3
import hashlib
import jwt
import datetime
import os
from functools import wraps
import psycopg2
from urllib.parse import urlparse

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)
app.config['SECRET_KEY'] = 'your-secret-key-change-this'

# Database setup
def get_database_url():
    """Get database URL - ALWAYS use PostgreSQL on Railway"""
    # ALWAYS use PostgreSQL on Railway (no fallback to SQLite)
    railway_postgres = 'postgresql://postgres:ZDcFOVhNMCnLhFNKMGUimBFwddGaVnNC@ballast.proxy.rlwy.net:21042/railway'
    
    # Check if we're running locally (no PORT environment variable)
    if not os.environ.get('PORT'):
        # Local development - use SQLite
        url = os.environ.get('DATABASE_URL', 'sqlite:///task_manager.db')
        print(f"DEBUG: Local development, using SQLite: {url[:20]}...")
        return url
    else:
        # Railway deployment - ALWAYS use PostgreSQL
        print(f"DEBUG: Railway deployment (PORT={os.environ.get('PORT')}), using PostgreSQL: {railway_postgres[:30]}...")
        return railway_postgres

def get_db_connection():
    """Get database connection - PostgreSQL on Railway, SQLite locally"""
    database_url = get_database_url()
    
    if database_url.startswith('postgresql://'):
        try:
            # Parse PostgreSQL URL
            parsed = urlparse(database_url)
            conn = psycopg2.connect(
                host=parsed.hostname,
                port=parsed.port,
                database=parsed.path[1:],  # Remove leading slash
                user=parsed.username,
                password=parsed.password
            )
            return conn
        except Exception as e:
            print(f"ERROR: PostgreSQL connection failed: {e}")
            print("Falling back to SQLite...")
            # Fallback to SQLite if PostgreSQL fails
            conn = sqlite3.connect('task_manager.db')
            conn.row_factory = sqlite3.Row
            return conn
    else:
        # Fallback to SQLite for local development
        conn = sqlite3.connect('task_manager.db')
        conn.row_factory = sqlite3.Row
        return conn

def is_postgres():
    """Check if we're using PostgreSQL"""
    return get_database_url().startswith('postgresql://')

def execute_query(conn, query, params=None):
    """Execute a query with proper cursor handling for both SQLite and PostgreSQL"""
    cursor = conn.cursor()
    try:
        if params:
            # Convert SQLite ? parameters to PostgreSQL %s parameters if needed
            if is_postgres() and '?' in query:
                query = query.replace('?', '%s')
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor
    except Exception as e:
        cursor.close()
        raise e

def convert_to_dict(row, columns):
    """Convert database row to dictionary for both PostgreSQL and SQLite"""
    if is_postgres():
        # PostgreSQL returns tuples, convert to dict using column names
        return dict(zip(columns, row))
    else:
        # SQLite returns Row objects, convert to dict
        return dict(row)

def init_db():
    """Initialize database with tables and sample data"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create tables (compatible with both PostgreSQL and SQLite)
    if is_postgres():
        # PostgreSQL syntax
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
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
        
        cursor.execute('''
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
        
        cursor.execute('''
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
    else:
        # SQLite syntax
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tracks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT DEFAULT '#3B82F6',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                track_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                target_value INTEGER DEFAULT 1,
                current_value INTEGER DEFAULT 0,
                unit TEXT DEFAULT 'times',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (track_id) REFERENCES goals (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (goal_id) REFERENCES goals (id)
            )
        ''')
    
    # Check if Rob van Dijk exists
    if is_postgres():
        cursor.execute('SELECT id FROM users WHERE email = %s', ('rob.vandijk@example.com',))
    else:
        cursor.execute('SELECT id FROM users WHERE email = ?', ('rob.vandijk@example.com',))
    
    if not cursor.fetchone():
        # Create Rob van Dijk user
        password_hash = hashlib.sha256('password123'.encode()).hexdigest()
        
        if is_postgres():
            cursor.execute(
                'INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s)',
                ('rob.vandijk@example.com', password_hash, 'Rob van Dijk')
            )
        else:
            cursor.execute(
                'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
                ('rob.vandijk@example.com', password_hash, 'Rob van Dijk')
            )
        
        user_id = cursor.lastrowid
        
        # Create sample tracks, goals, and tasks
        tracks_data = [
            ('Morning Routine', 'Daily morning activities', '#10B981'),
            ('Exercise & Health', 'Physical fitness and wellness', '#EF4444'),
            ('Work Productivity', 'Professional tasks and goals', '#3B82F6'),
            ('Learning & Growth', 'Personal development', '#8B5CF6'),
            ('Social Connections', 'Relationships and networking', '#F59E0B'),
            ('Creative Projects', 'Artistic and creative pursuits', '#EC4899'),
            ('Evening Wind-down', 'End of day routines', '#6366F1')
        ]
        
        for track_name, track_desc, track_color in tracks_data:
            if is_postgres():
                cursor.execute(
                    'INSERT INTO tracks (user_id, name, description, color) VALUES (%s, %s, %s, %s)',
                    (user_id, track_name, track_desc, track_color)
                )
            else:
                cursor.execute(
                    'INSERT INTO tracks (user_id, name, description, color) VALUES (?, ?, ?, ?)',
                    (user_id, track_name, track_desc, track_color)
                )
            track_id = cursor.lastrowid
            
            # Add sample goals and tasks for each track
            if track_name == 'Morning Routine':
                if is_postgres():
                    cursor.execute(
                        'INSERT INTO goals (track_id, title, description, target_value, unit) VALUES (%s, %s, %s, %s, %s)',
                        (track_id, 'Wake up early', 'Consistent 6 AM wake-up time', 7, 'days per week')
                    )
                else:
                    cursor.execute(
                        'INSERT INTO goals (track_id, title, description, target_value, unit) VALUES (?, ?, ?, ?, ?)',
                        (track_id, 'Wake up early', 'Consistent 6 AM wake-up time', 7, 'days per week')
                    )
                goal_id = cursor.lastrowid
                tasks = [
                    ('Set alarm for 6 AM', 'Use consistent alarm time'),
                    ('Get out of bed immediately', 'No snoozing allowed'),
                    ('Drink water first thing', 'Hydrate upon waking')
                ]
                for task_title, task_desc in tasks:
                    if is_postgres():
                        cursor.execute(
                            'INSERT INTO tasks (goal_id, title, description) VALUES (%s, %s, %s)',
                            (goal_id, task_title, task_desc)
                        )
                    else:
                        cursor.execute(
                            'INSERT INTO tasks (goal_id, title, description) VALUES (?, ?, ?)',
                            (goal_id, task_title, task_desc)
                        )
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

def token_required(f):
    """Decorator for routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_user_id, *args, **kwargs)
    return decorated

# API Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    conn = get_db_connection()
    if is_postgres():
        cursor = execute_query(conn, 'SELECT * FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()
        cursor.close()
    else:
        cursor = execute_query(conn, 'SELECT * FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        cursor.close()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    # Handle both PostgreSQL tuples and SQLite Row objects for password check
    if is_postgres():
        user_password_hash = user[2]  # password_hash is the 3rd column (index 2)
    else:
        user_password_hash = user['password_hash']
    
    if user_password_hash != password_hash:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Handle both PostgreSQL tuples and SQLite Row objects for JWT
    if is_postgres():
        user_id = user[0]
        user_email = user[1]
    else:
        user_id = user['id']
        user_email = user['email']
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user_id,
        'email': user_email,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    # Handle both PostgreSQL tuples and SQLite Row objects
    if is_postgres():
        user_dict = {
            'id': user[0],      # id
            'email': user[1],   # email
            'name': user[3]     # name (column 3, not 2)
        }
    else:
        user_dict = {
            'id': user['id'],
            'email': user['email'],
            'name': user['name']
        }
    
    return jsonify({
        'token': token,
        'user': user_dict
    })

@app.route('/api/tracks', methods=['GET'])
@token_required
def get_tracks(current_user_id):
    """Get all tracks for the current user"""
    conn = get_db_connection()
    if is_postgres():
        cursor = execute_query(conn, 'SELECT * FROM tracks WHERE user_id = %s ORDER BY created_at', (current_user_id,))
        tracks = cursor.fetchall()
        cursor.close()
    else:
        cursor = execute_query(conn, 'SELECT * FROM tracks WHERE user_id = ? ORDER BY created_at', (current_user_id,))
        tracks = cursor.fetchall()
        cursor.close()
    conn.close()
    
    # Convert tracks to dictionaries
    track_columns = ['id', 'user_id', 'name', 'description', 'color', 'created_at']
    return jsonify([convert_to_dict(track, track_columns) for track in tracks])

@app.route('/api/tracks', methods=['POST'])
@token_required
def create_track(current_user_id):
    """Create a new track"""
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    color = data.get('color', '#3B82F6')
    
    if not name:
        return jsonify({'error': 'Track name is required'}), 400
    
    conn = get_db_connection()
    if is_postgres():
        cursor = execute_query(conn, 
            'INSERT INTO tracks (user_id, name, description, color) VALUES (%s, %s, %s, %s) RETURNING id',
            (current_user_id, name, description, color)
        )
        track_id = cursor.fetchone()[0]
        cursor.close()
    else:
        cursor = execute_query(conn,
            'INSERT INTO tracks (user_id, name, description, color) VALUES (?, ?, ?, ?)',
            (current_user_id, name, description, color)
        )
        track_id = cursor.lastrowid
        cursor.close()
    conn.commit()
    
    if is_postgres():
        cursor = execute_query(conn, 'SELECT * FROM tracks WHERE id = %s', (track_id,))
        track = cursor.fetchone()
        cursor.close()
    else:
        cursor = execute_query(conn, 'SELECT * FROM tracks WHERE id = ?', (track_id,))
        track = cursor.fetchone()
        cursor.close()
    conn.close()
    
    # Convert track to dictionary
    track_columns = ['id', 'user_id', 'name', 'description', 'color', 'created_at']
    return jsonify(convert_to_dict(track, track_columns)), 201

@app.route('/api/goals', methods=['GET'])
@token_required
def get_goals(current_user_id):
    """Get goals for a specific track"""
    track_id = request.args.get('track_id')
    if not track_id:
        return jsonify({'error': 'track_id parameter required'}), 400
    
    conn = get_db_connection()
    # Verify track belongs to user
    if is_postgres():
        track = conn.execute(
            'SELECT * FROM tracks WHERE id = %s AND user_id = %s',
            (track_id, current_user_id)
        ).fetchone()
    else:
        track = conn.execute(
            'SELECT * FROM tracks WHERE id = ? AND user_id = ?',
            (track_id, current_user_id)
        ).fetchone()
    
    if not track:
        conn.close()
        return jsonify({'error': 'Track not found'}), 404
    
    if is_postgres():
        goals = conn.execute(
            'SELECT * FROM goals WHERE track_id = %s ORDER BY created_at',
            (track_id,)
        ).fetchall()
    else:
        goals = conn.execute(
            'SELECT * FROM goals WHERE track_id = ? ORDER BY created_at',
            (track_id,)
        ).fetchall()
    conn.close()
    
    return jsonify([dict(goal) for goal in goals])

@app.route('/api/tasks', methods=['GET'])
@token_required
def get_tasks(current_user_id):
    """Get tasks for a specific goal"""
    goal_id = request.args.get('goal_id')
    if not goal_id:
        return jsonify({'error': 'goal_id parameter required'}), 400
    
    conn = get_db_connection()
    # Verify goal belongs to user (through track)
    if is_postgres():
        goal = conn.execute('''
            SELECT g.* FROM goals g
            JOIN tracks t ON g.track_id = t.id
            WHERE g.id = %s AND t.user_id = %s
        ''', (goal_id, current_user_id)).fetchone()
    else:
        goal = conn.execute('''
            SELECT g.* FROM goals g
            JOIN tracks t ON g.track_id = t.id
            WHERE g.id = ? AND t.user_id = ?
        ''', (goal_id, current_user_id)).fetchone()
    
    if not goal:
        conn.close()
        return jsonify({'error': 'Goal not found'}), 404
    
    if is_postgres():
        tasks = conn.execute(
            'SELECT * FROM tasks WHERE goal_id = %s ORDER BY created_at',
            (goal_id,)
        ).fetchall()
    else:
        tasks = conn.execute(
            'SELECT * FROM tasks WHERE goal_id = ? ORDER BY created_at',
            (goal_id,)
        ).fetchall()
    conn.close()
    
    return jsonify([dict(task) for task in tasks])

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        cursor.fetchone()  # Consume the result
        
        # Check database type
        database_type = "PostgreSQL" if is_postgres() else "SQLite"
        
        # Get the actual database URL being used
        db_url = get_database_url()
        db_url_short = db_url[:30] + "..." if len(db_url) > 30 else db_url
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'database_type': database_type,
            'database_url': db_url_short,
            'port_env': os.environ.get('PORT', 'not_set'),
            'timestamp': datetime.datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
        }), 500

@app.route('/api/test-db', methods=['GET'])
def test_db():
    """Test database endpoint to debug cursor issues"""
    try:
        conn = get_db_connection()
        
        # Test 1: Simple query
        cursor = execute_query(conn, 'SELECT 1 as test')
        result1 = cursor.fetchone()
        cursor.close()
        
        # Test 2: Query with parameters
        cursor = execute_query(conn, 'SELECT COUNT(*) as user_count FROM users')
        result2 = cursor.fetchone()
        cursor.close()
        
        # Test 3: Query with WHERE clause
        cursor = execute_query(conn, 'SELECT email FROM users LIMIT 1')
        result3 = cursor.fetchone()
        cursor.close()
        
        # Test 4: Get user data structure
        cursor = execute_query(conn, 'SELECT * FROM users WHERE email = %s', ('rob.vandijk@example.com',))
        result4 = cursor.fetchone()
        cursor.close()
        
        # Test 5: Get tracks for user ID 1
        cursor = execute_query(conn, 'SELECT * FROM tracks WHERE user_id = 1 ORDER BY id')
        result5 = cursor.fetchall()
        cursor.close()
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'test1': list(result1) if result1 else None,
            'test2': list(result2) if result2 else None,
            'test3': list(result3) if result3 else None,
            'test4': list(result4) if result4 else None,
            'test5': [list(track) for track in result5] if result5 else None,
            'database_type': "PostgreSQL" if is_postgres() else "SQLite"
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'database_type': "PostgreSQL" if is_postgres() else "SQLite"
        }), 500

# Frontend Routes
@app.route('/')
def serve_frontend():
    """Serve the main React app"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    """Serve static files or fallback to React app for client-side routing"""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        # Fallback to React app for client-side routing
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Initialize database on startup
    init_db()
    
    # Get port from environment variable (for cloud deployment) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Run the app
    app.run(host='0.0.0.0', port=port, debug=False)
