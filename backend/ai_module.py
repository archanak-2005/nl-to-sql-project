import subprocess
import psycopg2
import pandas as pd
import json
import re

# 🔹 PostgreSQL Connection
conn = psycopg2.connect(
    database="postgres",
    user="postgres",
    password="1029",
    host="localhost",
    port="5432"
)
cursor = conn.cursor()

# ==============================
# 🔥 1. CLEAN SQL OUTPUT
# ==============================
def clean_sql_output(raw_output):
    raw_output = re.sub(r'\x1B\[[0-?]*[ -/]*[@-~]', '', raw_output)
    raw_output = re.sub(r"```sql|```", "", raw_output, flags=re.IGNORECASE)

    match = re.search(r"(SELECT .*?;)", raw_output, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip()

    return raw_output.strip()


# ==============================
# 🔥 2. LOAD CSV (AUTO TYPE FIX)
# ==============================
def load_csv_to_db(file_path, table_name):
    df = pd.read_csv(file_path)

    col_defs = []
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            col_defs.append(f"{col} NUMERIC")
        else:
            col_defs.append(f"{col} TEXT")

    cursor.execute(f'DROP TABLE IF EXISTS "{table_name}";')
    cursor.execute(f'CREATE TABLE "{table_name}" ({", ".join(col_defs)});')

    for _, row in df.iterrows():
        values = [None if pd.isna(v) else v for v in row]
        placeholders = ", ".join(["%s"] * len(values))
        cursor.execute(
            f'INSERT INTO "{table_name}" VALUES ({placeholders});',
            values
        )

    conn.commit()


# ==============================
# 🔥 3. CREATE TABLE FROM SCHEMA
# ==============================
def create_tables_from_schema(tables):
    for table in tables:
        name = table["name"].strip()

        if not name:
            continue

        cols = table["columns"]
        if not cols:
            continue

        col_defs = ", ".join([f'"{col.strip()}" TEXT' for col in cols])

        cursor.execute(f'DROP TABLE IF EXISTS "{name}";')
        cursor.execute(f'CREATE TABLE "{name}" ({col_defs});')

    conn.commit()


# ==============================
# 🔥 4. BUILD SCHEMA STRING
# ==============================
def build_schema(tables):
    schema = ""
    for table in tables:
        schema += f"{table['name']}({', '.join(table['columns'])})\n"
    return schema


# ==============================
# 🔥 5. FIND RELATIONSHIPS
# ==============================
def find_relationships(tables):
    relations = set()

    for t1 in tables:
        for t2 in tables:
            if t1 == t2:
                continue

            for col in t1['columns']:
                if col in t2['columns']:
                    relations.add(f"{t1['name']}.{col} = {t2['name']}.{col}")

    return list(relations)


# ==============================
# 🔥 6. DETECT TABLE FROM QUERY
# ==============================
def detect_table(query, tables):
    if not tables or len(tables) == 0:
        return None   # 🔥 SAFE RETURN

    query = query.lower()

    for table in tables:
        if table["name"].lower() in query:
            return table["name"]

    return tables[0]["name"]

# ==============================
# 🔥 7. FIX TABLE NAME (AI ERROR)
# ==============================
def fix_table_name(sql, tables):
    valid_tables = [t["name"] for t in tables]

    for t in valid_tables:
        sql = re.sub(r"\busers\b|\bpeople\b|\bdata\b", t, sql, flags=re.IGNORECASE)

    return sql


# ==============================
# 🔥 8. GENERATE SQL (LLM)
# ==============================
def generate_sql(user_query, schema, relations):
    prompt = f"""
You are an expert SQL generator.

STRICT RULES:
- Use ONLY given tables
- Do NOT invent tables
- Return ONLY SQL query
- No explanation
- No text
- No markdown

Tables:
{schema}

Relationships:
{relations}

User Question:
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
# 🔥 9. SAFE EXECUTION
# ==============================
def execute_sql(sql):
    try:
        cursor.execute(sql)
        rows = cursor.fetchall()
        return rows
    except Exception as e:
        return f"Error: {e}"


# ==============================
# 🔥 10. EXPLANATION
# ==============================
def explain_sql(sql):
    prompt = f"Explain this SQL in 2 simple lines:\n{sql}"

    result = subprocess.run(
        ["ollama", "run", "llama3"],
        input=prompt,
        text=True,
        capture_output=True
    )

    return result.stdout.strip()


# ==============================
# 🔥 11. MAIN INTELLIGENCE
# ==============================
def ai_pipeline(tables, query):
    schema = build_schema(tables)
    relations = find_relationships(tables)

    table = detect_table(query, tables)
    if table is None:
        return (
        "No table found",
        [],
        "Please upload a CSV file or enter table structure first."
        )
    q = query.lower()

    # ✅ COUNT
    if "count" in q:
        sql = f'SELECT COUNT(*) FROM "{table}";'

    # ✅ AGE CONDITION
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
        sql = generate_sql(query, schema, relations)
        sql = fix_table_name(sql, tables)

    result = execute_sql(sql)
    explanation = explain_sql(sql)

    return sql, result, explanation


# ==============================
# 🔥 MAIN RUNNER
# ==============================
if __name__ == "__main__":
    with open("input.json", "r") as f:
        data = json.load(f)

    query = data["query"]
    tables = data["tables"]
    csv_files = data.get("csv_files", [])
    # 🔥 AUTO CREATE TABLE INFO FROM CSV
    if (not tables or len(tables) == 0) and csv_files:
        tables = [{"name": file["name"], "columns": []} for file in csv_files]
    # CSV MODE
    for file in csv_files:
        load_csv_to_db(file["path"], file["name"])

    # STRUCTURE MODE
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