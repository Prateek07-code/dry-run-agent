import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

load_dotenv()

def create_database_if_not_exists():
    # Connect to the default 'postgres' database to issue the CREATE DATABASE command
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname="postgres",
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres")
    )
    # CREATE DATABASE cannot run inside a transaction block, so we set autocommit
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"CREATE DATABASE {os.getenv('DB_NAME', 'dry_run_db')};")
        print("Created database 'dry_run_db'.")
    except psycopg2.errors.DuplicateDatabase:
        pass # Database already exists, which is fine
    finally:
        cursor.close()
        conn.close()

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "dry_run_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres")
    )

def setup_database():
    # 1. Create the database first
    create_database_if_not_exists()
    
    # 2. Connect to the new database and build the schema
    conn = get_connection()
    conn.autocommit = True
    cursor = conn.cursor()

    # Create target table: old_sessions
    cursor.execute("""
        DROP TABLE IF EXISTS dependent_jobs CASCADE;
        DROP TABLE IF EXISTS old_sessions CASCADE;

        CREATE TABLE old_sessions (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            session_token VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Populate old_sessions with mock data
    cursor.execute("""
        INSERT INTO old_sessions (user_id, session_token)
        SELECT g, MD5(RANDOM()::TEXT)
        FROM generate_series(1, 100) g;
    """)

    # Create dependency metadata table (simulating nightly_report_job reading from old_sessions)
    cursor.execute("""
        CREATE TABLE dependent_jobs (
            id SERIAL PRIMARY KEY,
            job_name VARCHAR(100) NOT NULL,
            target_table VARCHAR(100) NOT NULL,
            active BOOLEAN DEFAULT TRUE
        );

        INSERT INTO dependent_jobs (job_name, target_table, active)
        VALUES ('nightly_report_job', 'old_sessions', TRUE);
    """)

    cursor.close()
    conn.close()
    print("Database initialized successfully with 100 rows in 'old_sessions' and active 'nightly_report_job'.")

if __name__ == "__main__":
    setup_database()