#!/usr/bin/env python3
"""
Test database connection script
This script tests if we can connect to the PostgreSQL database
"""

import os
import sys

def test_connection():
    """Test database connection"""
    try:
        import psycopg2
        from psycopg2 import OperationalError
        
        # Try common connection strings
        connection_strings = [
            os.getenv("DATABASE_URL", ""),
            "postgresql://postgres:postgres@localhost:5432/referconnect",
            "postgresql://localhost:5432/referconnect",
        ]
        
        print("🔍 Testing database connection...")
        print("")
        
        for db_url in connection_strings:
            if not db_url:
                continue
                
            # Extract connection details
            try:
                # Simple parsing - in production, use urllib.parse
                if "@" in db_url:
                    parts = db_url.split("@")
                    auth = parts[0].split("://")[1]
                    if ":" in auth:
                        user, password = auth.split(":")
                    else:
                        user = auth
                        password = ""
                    host_port_db = parts[1]
                    if "/" in host_port_db:
                        host_port, database = host_port_db.split("/", 1)
                    else:
                        host_port = host_port_db
                        database = "referconnect"
                    if ":" in host_port:
                        host, port = host_port.split(":")
                    else:
                        host = host_port
                        port = "5432"
                else:
                    # Simple format: postgresql://localhost:5432/referconnect
                    parts = db_url.replace("postgresql://", "").split("/")
                    if len(parts) == 2:
                        host_port = parts[0]
                        database = parts[1]
                        if ":" in host_port:
                            host, port = host_port.split(":")
                        else:
                            host = host_port
                            port = "5432"
                        user = "postgres"
                        password = ""
                    else:
                        continue
                
                print(f"Trying: postgresql://{user}:***@{host}:{port}/{database}")
                
                conn = psycopg2.connect(
                    host=host,
                    port=port,
                    database=database,
                    user=user,
                    password=password
                )
                
                # Test query
                cursor = conn.cursor()
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                cursor.close()
                conn.close()
                
                print(f"✅ Connection successful!")
                print(f"   PostgreSQL version: {version[0]}")
                print(f"   Database: {database}")
                print("")
                return True
                
            except OperationalError as e:
                print(f"❌ Connection failed: {e}")
                print("")
                continue
            except Exception as e:
                print(f"❌ Error: {e}")
                print("")
                continue
        
        print("❌ All connection attempts failed.")
        print("")
        print("Please check:")
        print("1. PostgreSQL is running")
        print("2. Database 'referconnect' exists")
        print("3. User has access to the database")
        print("4. Update DATABASE_URL in backend/.env file")
        return False
        
    except ImportError:
        print("❌ psycopg2 not installed. Please install it:")
        print("   pip install psycopg2-binary")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)


