from backend.app.db.neo4j_client import run_query

result = run_query("RETURN 'Neo4j OK' AS status")

print(result[0]["status"])