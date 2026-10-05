import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "dry_run_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres")
    )
    # Ensure manual transaction control (do not auto-commit)
    conn.autocommit = False
    return conn

def check_hard_rules(cursor, target_table="old_sessions"):
    """
    Hard Rule Checks:
    1. Check if active external dependencies exist for target table.
    2. Check remaining row count in target table.
    """
    # Rule 1: Check active dependent jobs
    cursor.execute("""
        SELECT job_name FROM dependent_jobs 
        WHERE target_table = %s AND active = TRUE;
    """, (target_table,))
    active_jobs = cursor.fetchall()

    if active_jobs:
        job_names = ", ".join([job[0] for job in active_jobs])
        return False, f"Active dependency conflict: '{job_names}' still reads from '{target_table}'."

    # Rule 2: Check remaining row count
    cursor.execute(f"SELECT COUNT(*) FROM {target_table};")
    count = cursor.fetchone()[0]

    if count == 0:
        return False, f"Unexpected data loss: '{target_table}' was completely emptied."

    return True, f"Hard rules passed. Table '{target_table}' clean with {count} rows remaining."


def test_plan_in_fork(plan_id: str, sql_queries: list) -> dict:
    """
    Runs sql_queries inside an isolated transaction, checks hard rules,
    and ALWAYS executes ROLLBACK so production data remains intact.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Start transaction boundary
        cursor.execute("BEGIN;")

        # Execute candidate plan steps inside transaction
        for query in sql_queries:
            cursor.execute(query)

        # Run safety evaluation inside the temporary transaction state
        passed, reason = check_hard_rules(cursor, target_table="old_sessions")

        # Force rollback to keep database clean
        cursor.execute("ROLLBACK;")
        status = "passed" if passed else "failed"

        return {
            "plan_id": plan_id,
            "status": status,
            "reason": reason
        }

    except Exception as e:
        cursor.execute("ROLLBACK;")
        return {
            "plan_id": plan_id,
            "status": "failed",
            "reason": f"Execution error during simulation: {str(e)}"
        }
    finally:
        cursor.close()
        conn.close()


def commit_winning_plan(sql_queries: list) -> dict:
    """
    Executes the validated winning plan for real and commits changes.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("BEGIN;")
        for query in sql_queries:
            cursor.execute(query)

        cursor.execute("COMMIT;")
        return {"status": "success", "message": "Winning plan successfully committed to production."}

    except Exception as e:
        cursor.execute("ROLLBACK;")
        return {"status": "error", "message": f"Commit failed: {str(e)}"}
    finally:
        cursor.close()
        conn.close()