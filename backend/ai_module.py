import subprocess
import psycopg2
import pandas as pd
import json
import re
import os

# ==============================
# 🔥 SAFE DB CONNECTION
# ==============================
conn = psycopg2.connect(
    database="postgres",
    user="postgres",
    password="1029",
    host="localhost",
    port="5432"
)
cursor = conn.cursor()

# ==============================
# 🔥 CLEAN SQL OUTPUT
# ==============================
def clean_sql_output(raw_output):
    raw_output = re.sub(r'\x1B\[[0-?]*[ -/]*[@-~]', '', raw_output)
    raw_output = re.sub(r"```sql|```", "", raw_output, flags=re.IGNORECASE)

    match = re.search(r"(SELECT .*?;)", raw_output, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip()

    return raw_output.strip()

# ==============================
# 🔥 SAFE CSV LOADING
# ==============================
def load_csv_to_db(file_path, table_name):
    try:
        print("DEBUG PATH:", file_path)
        print("CURRENT DIR:", os.getcwd())

        # 🔥 FIX PATH (ABSOLUTE)
        file_path = os.path.abspath(file_path)

        print("ABS PATH:", file_path)
        print("FILE EXISTS:", os.path.exists(file_path))

        if not os.path.exists(file_path):
            print("❌ FILE NOT FOUND - SKIPPING")
            return

        df = pd.read_csv(file_path)

        if df.empty:
            print("⚠️ CSV EMPTY")
            return

        # 🔥 AUTO TYPE DETECTION
        col_defs = []
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                col_defs.append(f'"{col}" NUMERIC')
            else:
                col_defs.append(f'"{col}" TEXT')

        cursor.execute(f'DROP TABLE IF EXISTS "{table_name}";')
        cursor.execute(f'CREATE TABLE "{table_name}" ({", ".join(col_defs)});')

        # 🔥 INSERT DATA
        for _, row in df.iterrows():
            values = [None if pd.isna(v) else v for v in row]
            placeholders = ", ".join(["%s"] * len(values))

            cursor.execute(
                f'INSERT INTO "{table_name}" VALUES ({placeholders});',
                values
            )

        conn.commit()
        print(f"✅ Loaded table: {table_name}")

    except Exception as e:
        print("❌ CSV LOAD ERROR:", str(e))


# ==============================
# 🔥 CREATE TABLE FROM SCHEMA
# ==============================
def create_tables_from_schema(tables):
    for table in tables:
        name = table.get("name", "").strip()
        cols = table.get("columns", [])

        if not name or not cols:
            continue

        col_defs = ", ".join([f'"{col.strip()}" TEXT' for col in cols])

        try:
            cursor.execute(f'DROP TABLE IF EXISTS "{name}";')
            cursor.execute(f'CREATE TABLE "{name}" ({col_defs});')
        except Exception as e:
            print("❌ TABLE CREATE ERROR:", e)

    conn.commit()


# ==============================
# 🔥 BUILD SCHEMA
# ==============================
def build_schema(tables):
    schema = ""
    for table in tables:
        schema += f"{table['name']}({', '.join(table['columns'])})\n"
    return schema


# ==============================
# 🔥 DETECT TABLE
# ==============================
def detect_table(query, tables):
    if not tables:
        return None

    query = query.lower()

    for table in tables:
        if table["name"].lower() in query:
            return table["name"]

    return tables[0]["name"]


# ==============================
# 🔥 FIX WRONG TABLE NAMES
# ==============================
def fix_table_name(sql, tables):
    valid_tables = [t["name"] for t in tables]

    for t in valid_tables:
        sql = re.sub(r"\busers\b|\bpeople\b|\bdata\b", t, sql, flags=re.IGNORECASE)

    return sql


# ==============================
# 🔥 GENERATE SQL
# ==============================
def generate_sql(user_query, schema):
    prompt = f"""
Return ONLY SQL query.

Tables:
{schema}

Question:
{user_query}
"""

    result = subprocess.run(
        ["ollama", "run", "llama3"],
        input=prompt,
        text=True,
        capture_output=True
    )

    return clean_sql_output(result.stdout)


# ==============================
# 🔥 EXECUTE SQL
# ==============================
def execute_sql(sql):
    try:
        cursor.execute(sql)
        return cursor.fetchall()
    except Exception as e:
        return f"Error: {e}"


# ==============================
# 🔥 EXPLAIN SQL
# ==============================
def explain_sql(sql):
    try:
        result = subprocess.run(
            ["ollama", "run", "llama3"],
            input=f"Explain this SQL in 2 lines:\n{sql}",
            text=True,
            capture_output=True
        )
        return result.stdout.strip()
    except:
        return "Explanation unavailable"


# ==============================
# 🔥 MAIN PIPELINE
# ==============================
def ai_pipeline(tables, query):
    schema = build_schema(tables)
    table = detect_table(query, tables)

    if not table:
        return "No table", [], "Upload CSV or define table"

    q = query.lower()

    if "count" in q:
        sql = f'SELECT COUNT(*) FROM "{table}";'

    elif "age" in q and ("above" in q or "greater" in q):
        num = re.findall(r'\d+', q)

        if num:
            age = num[0]
            if "name" in q:
                sql = f'SELECT name FROM "{table}" WHERE age::int > {age};'
            else:
                sql = f'SELECT * FROM "{table}" WHERE age::int > {age};'
        else:
            sql = f'SELECT * FROM "{table}";'

    else:
        sql = generate_sql(query, schema)
        sql = fix_table_name(sql, tables)

    result = execute_sql(sql)
    explanation = explain_sql(sql)

    return sql, result, explanation


# ==============================
# 🔥 MAIN RUNNER
# ==============================
if __name__ == "__main__":
    try:
        with open("input.json", "r") as f:
            data = json.load(f)

        query = data.get("query", "")
        tables = data.get("tables", [])
        csv_files = data.get("csv_files", [])

        # 🔥 AUTO TABLE FROM CSV
        if not tables and csv_files:
            tables = [{"name": f["name"], "columns": []} for f in csv_files]

        # 🔥 LOAD CSV
        for file in csv_files:
            load_csv_to_db(file["path"], file["name"])

        # 🔥 STRUCTURE MODE
        if not csv_files:
            create_tables_from_schema(tables)

        sql, result, explanation = ai_pipeline(tables, query)

        print("SQL_START")
        print(sql)
        print("SQL_END")

        print("RESULT_START")
        print(result)
        print("RESULT_END")

        print("EXPLANATION_START")
        print(explanation)
        print("EXPLANATION_END")

    except Exception as e:
        print("FATAL ERROR:", str(e))