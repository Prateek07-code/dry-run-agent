import psycopg2
from src.db.fork_engine import get_connection, test_plan_in_fork

def get_row_count():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM old_sessions;")
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return count

if __name__ == "__main__":
    print(f"Initial row count in 'old_sessions': {get_row_count()}")

    # Plan A: Hard delete (Should fail hard rules due to active dependency)
    plan_a_queries = ["DELETE FROM old_sessions;"]
    result_a = test_plan_in_fork("Plan_A", plan_a_queries)
    print("\nResult Plan A (Hard Delete):", result_a)
    print(f"Row count after testing Plan A: {get_row_count()} (Must remain 100)")

    # Plan B: Safe deletion with dependency release
    plan_b_queries = [
        "UPDATE dependent_jobs SET active = FALSE WHERE target_table = 'old_sessions';",
        "DELETE FROM old_sessions WHERE created_at < NOW() - INTERVAL '30 days';"
    ]
    result_b = test_plan_in_fork("Plan_B", plan_b_queries)
    print("\nResult Plan B (Archive/Safe Delete):", result_b)
    print(f"Row count after testing Plan B: {get_row_count()} (Must remain 100)")