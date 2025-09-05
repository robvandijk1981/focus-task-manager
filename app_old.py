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
    """Get database URL from environment or use SQLite fallback"""
    return os.environ.get('DATABASE_URL', 'sqlite:///task_manager.db')

def get_db_connection():
    """Get database connection - PostgreSQL on Railway, SQLite locally"""
    database_url = get_database_url()
    
    if database_url.startswith('postgres://'):
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
    else:
        # Fallback to SQLite for local development
        conn = sqlite3.connect('task_manager.db')
        conn.row_factory = sqlite3.Row
        return conn

def is_postgres():
    """Check if we're using PostgreSQL"""
    return get_database_url().startswith('postgres://')

def init_db():
    """Initialize database with tables and sample data"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create tables (compatible with both PostgreSQL and SQLite)
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
    
    # Check if Rob van Dijk exists
    cursor.execute('SELECT id FROM users WHERE email = %s', ('rob.vandijk@example.com',))
    if not cursor.fetchone():
        # Create Rob van Dijk user
        password_hash = hashlib.sha256('password123'.encode()).hexdigest()
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
            cursor.execute(
                'INSERT INTO tracks (user_id, name, description, color) VALUES (?, ?, ?, ?)',
                (user_id, track_name, track_desc, track_color)
            )
            track_id = cursor.lastrowid
            
            # Add sample goals and tasks for each track
            if track_name == 'Morning Routine':
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
                    cursor.execute(
                        'INSERT INTO tasks (goal_id, title, description) VALUES (?, ?, ?)',
                        (goal_id, task_title, task_desc)
                    )
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

def get_db_connection():
    """Get database connection - PostgreSQL on Railway, SQLite locally"""
    database_url = get_database_url()
    
    if database_url.startswith('postgres://'):
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
    else:
        # Fallback to SQLite for local development
        conn = sqlite3.connect('task_manager.db')
        conn.row_factory = sqlite3.Row
        return conn

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
    user = conn.execute(
        'SELECT * FROM users WHERE email = ?', (email,)
    ).fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    if user['password_hash'] != password_hash:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user['id'],
        'email': user['email'],
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name']
        }
    })

@app.route('/api/tracks', methods=['GET'])
@token_required
def get_tracks(current_user_id):
    """Get all tracks for the current user"""
    conn = get_db_connection()
    tracks = conn.execute(
        'SELECT * FROM tracks WHERE user_id = ? ORDER BY created_at',
        (current_user_id,)
    ).fetchall()
    conn.close()
    
    return jsonify([dict(track) for track in tracks])

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
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO tracks (user_id, name, description, color) VALUES (?, ?, ?, ?)',
        (current_user_id, name, description, color)
    )
    track_id = cursor.lastrowid
    conn.commit()
    
    track = conn.execute(
        'SELECT * FROM tracks WHERE id = ?', (track_id,)
    ).fetchone()
    conn.close()
    
    return jsonify(dict(track)), 201

@app.route('/api/goals', methods=['GET'])
@token_required
def get_goals(current_user_id):
    """Get goals for a specific track"""
    track_id = request.args.get('track_id')
    if not track_id:
        return jsonify({'error': 'track_id parameter required'}), 400
    
    conn = get_db_connection()
    # Verify track belongs to user
    track = conn.execute(
        'SELECT * FROM tracks WHERE id = ? AND user_id = ?',
        (track_id, current_user_id)
    ).fetchone()
    
    if not track:
        conn.close()
        return jsonify({'error': 'Track not found'}), 404
    
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
    goal = conn.execute('''
        SELECT g.* FROM goals g
        JOIN tracks t ON g.track_id = t.id
        WHERE g.id = ? AND t.user_id = ?
    ''', (goal_id, current_user_id)).fetchone()
    
    if not goal:
        conn.close()
        return jsonify({'error': 'Goal not found'}), 404
    
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
        conn.execute('SELECT 1')
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.datetime.now().isoformat()
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

