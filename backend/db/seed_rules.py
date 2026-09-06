"""
Seeds the categories, rules, and category_rules tables from backend/rules.json.

Run this once against your real Postgres database after applying sih_schema.sql
and before testing /check-compliance:

    cd backend
    python db/seed_rules.py

Safe to re-run — it checks for existing rows before inserting, so it won't
create duplicates.
"""

import json
import os
import sys

import psycopg2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings  # noqa: E402

RULES_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "rules.json"
)

# rules.json keys -> the exact category names detect_category() in
# app/services/compliance.py produces. These MUST match exactly (case-insensitive)
# or get_category_id() will never find the category and every check on that
# category will fail.
CATEGORY_NAME_MAP = {
    "pharma": "Pharma",
    "cosmetic": "Cosmetics",
    "food": "Packaged Items",
}

# Categories detect_category() can produce that have no rule definitions yet
# in rules.json. We still create the category row so category lookup doesn't
# fail outright, but scans in these categories will hit "no active rules
# found" until someone writes rules for them.
CATEGORIES_WITHOUT_RULES_YET = ["Household", "Stationery", "Electronics"]


def get_or_create_category(cursor, category_name):
    cursor.execute(
        "SELECT category_id FROM categories WHERE LOWER(category_name) = LOWER(%s)",
        (category_name,),
    )
    row = cursor.fetchone()
    if row:
        return row[0]

    cursor.execute(
        "INSERT INTO categories (category_name) VALUES (%s) RETURNING category_id",
        (category_name,),
    )
    category_id = cursor.fetchone()[0]
    print(f"  [created category] {category_name} (id={category_id})")
    return category_id


def get_or_create_rule(cursor, rule_code, rule_title, description, rule_config):
    cursor.execute("SELECT rule_id FROM rules WHERE rule_code = %s", (rule_code,))
    row = cursor.fetchone()
    if row:
        return row[0]

    cursor.execute(
        """
        INSERT INTO rules (rule_code, rule_title, description, rule_config, active)
        VALUES (%s, %s, %s, %s, TRUE)
        RETURNING rule_id
        """,
        (rule_code, rule_title, description, json.dumps(rule_config)),
    )
    rule_id = cursor.fetchone()[0]
    print(f"    [created rule] {rule_code} (id={rule_id})")
    return rule_id


def link_category_rule(cursor, category_id, rule_id):
    cursor.execute(
        "SELECT 1 FROM category_rules WHERE category_id = %s AND rule_id = %s",
        (category_id, rule_id),
    )
    if cursor.fetchone():
        return

    cursor.execute(
        "INSERT INTO category_rules (category_id, rule_id) VALUES (%s, %s)",
        (category_id, rule_id),
    )


def main():
    with open(RULES_JSON_PATH, "r", encoding="utf-8") as f:
        rules_data = json.load(f)

    connection = psycopg2.connect(settings.database_url)
    cursor = connection.cursor()

    try:
        for json_key, category_name in CATEGORY_NAME_MAP.items():
            if json_key not in rules_data:
                print(f"[skip] '{json_key}' not found in rules.json")
                continue

            print(f"Category: {category_name} (from '{json_key}')")
            category_id = get_or_create_category(cursor, category_name)

            required_fields = rules_data[json_key].get("required_fields", [])
            for rule_def in required_fields:
                rule_code = rule_def["rule_id"]
                field = rule_def["field"]
                description = rule_def.get("description", "")
                severity = rule_def.get("severity", "MEDIUM")
                rule_title = f"{field.replace('_', ' ').title()} check"
                rule_config = {"field": field, "severity": severity}

                rule_id = get_or_create_rule(
                    cursor, rule_code, rule_title, description, rule_config
                )
                link_category_rule(cursor, category_id, rule_id)

        for category_name in CATEGORIES_WITHOUT_RULES_YET:
            print(f"Category: {category_name} (no rules defined yet)")
            get_or_create_category(cursor, category_name)

        connection.commit()
        print("\n[OK] Seeding complete.")

    except Exception as error:
        connection.rollback()
        print(f"\n[ERROR] Seeding failed: {error}")
        raise

    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    main()
