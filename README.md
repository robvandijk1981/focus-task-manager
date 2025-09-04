# Single Flask App - Focus Task Manager

This is a complete, self-contained Flask application that serves both the API and frontend from a single server. This eliminates all connectivity issues between frontend and backend.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip3 install -r requirements.txt
```

### 2. Run the Application
```bash
python3 app.py
```

### 3. Access the App
Open your browser to: **http://localhost:5000**

### 4. Login
- **Email**: `rob.vandijk@example.com`
- **Password**: `password123`

## ✅ What This Solves

### Single Domain
- Frontend and API both served from `localhost:5000`
- No CORS issues
- No cross-origin problems

### No Caching Issues
- All files served from same Flask server
- No CDN caching problems
- Immediate updates when restarted

### Simplified Architecture
```
Flask App (port 5000)
├── /api/auth/login     → API endpoints
├── /api/tracks         → API endpoints
├── /api/goals          → API endpoints
├── /api/tasks          → API endpoints
├── /                   → React frontend
└── /static/*           → Frontend assets
```

## 🔧 How It Works

1. **Flask serves the React app** at the root URL (`/`)
2. **API endpoints** are available at `/api/*`
3. **Static files** (CSS, JS) served from `/static/`
4. **Client-side routing** handled by fallback to React app
5. **Database** automatically initialized with your data

## 📁 File Structure

```
single-flask-app/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── task_manager.db     # SQLite database (auto-created)
└── static/            # React frontend files
    ├── index.html
    ├── assets/
    └── ...
```

## 🎯 Benefits

- **No deployment complexity** - single file to run
- **No connectivity issues** - everything on same server
- **No caching problems** - direct file serving
- **Easy to debug** - all logs in one place
- **Simple to deploy** - just upload and run

## 🚀 Deployment Options

### Local Development
```bash
python3 app.py
```

### Production (any Python hosting)
- Upload the entire folder
- Install requirements
- Run `python3 app.py`

### Docker
```dockerfile
FROM python:3.9
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python3", "app.py"]
```

## 🔑 Pre-configured Data

The app automatically creates:
- Rob van Dijk user account
- 7 tracks with sample goals and tasks
- Complete database schema

No manual setup required!

