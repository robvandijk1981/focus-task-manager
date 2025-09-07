#!/usr/bin/env python3
"""Script to fix ALL remaining conn.execute() calls"""

import re

def fix_all_cursor_calls(content):
    """Fix all remaining conn.execute() calls"""
    
    # Pattern 1: Single line with fetchone()
    pattern1 = r'(\s+)(\w+) = conn\.execute\(\s*([^)]+)\s*\)\.fetchone\(\)'
    def replace1(match):
        indent = match.group(1)
        var_name = match.group(2)
        query = match.group(3)
        return f"{indent}cursor = execute_query(conn, {query})\n{indent}{var_name} = cursor.fetchone()\n{indent}cursor.close()"
    
    content = re.sub(pattern1, replace1, content)
    
    # Pattern 2: Single line with fetchall()
    pattern2 = r'(\s+)(\w+) = conn\.execute\(\s*([^)]+)\s*\)\.fetchall\(\)'
    def replace2(match):
        indent = match.group(1)
        var_name = match.group(2)
        query = match.group(3)
        return f"{indent}cursor = execute_query(conn, {query})\n{indent}{var_name} = cursor.fetchall()\n{indent}cursor.close()"
    
    content = re.sub(pattern2, replace2, content)
    
    # Pattern 3: Multi-line with fetchone()
    pattern3 = r'(\s+)(\w+) = conn\.execute\(\s*\n\s*([^)]+)\s*\n\s*\)\.fetchone\(\)'
    def replace3(match):
        indent = match.group(1)
        var_name = match.group(2)
        query = match.group(3)
        return f"{indent}cursor = execute_query(conn, {query})\n{indent}{var_name} = cursor.fetchone()\n{indent}cursor.close()"
    
    content = re.sub(pattern3, replace3, content, flags=re.MULTILINE | re.DOTALL)
    
    # Pattern 4: Multi-line with fetchall()
    pattern4 = r'(\s+)(\w+) = conn\.execute\(\s*\n\s*([^)]+)\s*\n\s*\)\.fetchall\(\)'
    def replace4(match):
        indent = match.group(1)
        var_name = match.group(2)
        query = match.group(3)
        return f"{indent}cursor = execute_query(conn, {query})\n{indent}{var_name} = cursor.fetchall()\n{indent}cursor.close()"
    
    content = re.sub(pattern4, replace4, content, flags=re.MULTILINE | re.DOTALL)
    
    return content

if __name__ == "__main__":
    # Read the file
    with open('app.py', 'r') as f:
        content = f.read()
    
    # Fix all cursor calls
    fixed_content = fix_all_cursor_calls(content)
    
    # Write back
    with open('app.py', 'w') as f:
        f.write(fixed_content)
    
    print("Fixed all cursor calls in app.py")

