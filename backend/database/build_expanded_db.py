"""
Repeatable SQLite Database ETL Pipeline for Medicure
===================================================
Ingests: medicine_data.csv (195,605 pharmaceutical products)
Builds:  medicine_expanded.db with B-tree indices on product_name, salt_composition, sub_category
Usage:
    python build_expanded_db.py
"""

import os
import csv
import sqlite3
import time

def build_database(csv_path=None, target_db_path=None):
    if csv_path is None:
        csv_path = os.path.join(os.path.dirname(__file__), "../../../medicine_data.csv")
    if target_db_path is None:
        target_db_path = os.path.join(os.path.dirname(__file__), "database", "medicine_expanded.db")

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Source medicine dataset not found at: {csv_path}")

    target_dir = os.path.dirname(target_db_path)
    if target_dir:
        os.makedirs(target_dir, exist_ok=True)

    print(f"Building SQLite database from {csv_path} -> {target_db_path}...")
    start_time = time.time()

    conn = sqlite3.connect(target_db_path)
    cursor = conn.cursor()

    cursor.execute("PRAGMA synchronous = OFF")
    cursor.execute("PRAGMA journal_mode = MEMORY")
    cursor.execute("PRAGMA cache_size = 100000")

    cursor.execute("DROP TABLE IF EXISTS medicines")
    cursor.execute("""
    CREATE TABLE medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sub_category TEXT,
        product_name TEXT,
        salt_composition TEXT,
        product_price TEXT,
        product_manufactured TEXT,
        medicine_desc TEXT,
        side_effects TEXT,
        drug_interactions TEXT
    )
    """)

    insert_sql = """
    INSERT INTO medicines (
        sub_category, product_name, salt_composition, product_price,
        product_manufactured, medicine_desc, side_effects, drug_interactions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """

    chunk_size = 10000
    batch = []
    total_rows = 0

    with open(csv_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        headers = next(reader)
        
        for row in reader:
            if len(row) < 8:
                row += [''] * (8 - len(row))
            batch.append(row[:8])
            total_rows += 1
            
            if len(batch) >= chunk_size:
                cursor.executemany(insert_sql, batch)
                conn.commit()
                batch = []
                if total_rows % 50000 == 0:
                    print(f"Ingested {total_rows} rows...")

        if batch:
            cursor.executemany(insert_sql, batch)
            conn.commit()

    print(f"Total rows inserted: {total_rows}")

    print("Creating search indexes for high performance...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines (product_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_medicines_salt ON medicines (salt_composition)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines (sub_category)")
    conn.commit()

    # Validation check
    cursor.execute("SELECT COUNT(*) FROM medicines")
    count = cursor.fetchone()[0]
    cursor.execute("SELECT product_name FROM medicines WHERE product_name LIKE '%Paracetamol%' LIMIT 1")
    sample = cursor.fetchone()

    conn.close()
    elapsed = time.time() - start_time
    print(f"Complete in {elapsed:.2f}s. Row count: {count}. Sample verification: {sample}")
    return count


if __name__ == "__main__":
    build_database()
