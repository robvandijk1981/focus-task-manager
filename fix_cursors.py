#!/usr/bin/env python3
"""Script to fix all conn.execute() calls to use proper cursor handling"""

import re

def fix_cursor_calls(content):
    """Fix all conn.execute() calls to use proper cursor handling"""
    
    # Pattern to match conn.execute() calls
    pattern = r'(\s+)(\w+) = conn\.execute\(\s*([^)]+)\s*\)\.fetchone\(\)'
    
    def replace_fetchone(match):
        indent = match.group(1)
        var_name = match.group(2)
        query = match.group(3)
        
        return f"""{indent}cursor = execute_query(conn, {query})
{indent}{var_name} = cursor.fetchone()
{indent}cursor.close()"""
    
    # Replace fetchone() calls
    content = re.sub(pattern, replace_fetchone, content)
    
    # Pattern to match conn.execute() calls with fetchall()
    pattern2 = r'(\s+)(\w+) = conn\.execute\(\s*([^)]+)\s*\)\.fetchall\(\)'
    
    def replace_fetchall(match):
        indent = match.group(1)
        var_name = match.group(2)
        query = match.group(3)
        
        return f"""{indent}cursor = execute_query(conn, {query})
{indent}{var_name} = cursor.fetchall()
{indent}cursor.close()"""
    
    # Replace fetchall() calls
    content = re.sub(pattern2, replace_fetchall, content)
    
    return content

if __name__ == "__main__":
    # Read the file
    with open('app.py', 'r') as f:
        content = f.read()
    
    # Fix the cursor calls
    fixed_content = fix_cursor_calls(content)
    
    # Write back
    with open('app.py', 'w') as f:
        f.write(fixed_content)
    
    print("Fixed cursor calls in app.py")

