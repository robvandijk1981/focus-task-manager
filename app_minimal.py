#!/usr/bin/env python3
"""Minimal Flask app for testing Railway deployment"""

from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({
        'message': 'Hello from Railway!',
        'port': os.environ.get('PORT', 'not_set'),
        'status': 'working'
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Minimal app is working'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

