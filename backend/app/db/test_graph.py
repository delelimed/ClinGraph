from backend.app.db.neo4j_client import run_query

result = run_query("""
MATCH (p:Patologia)-[:HA_SINTOMO]->(s:Sintomo)
RETURN p.nome AS patologia, collect(s.nome) AS sintomi
""")

for r in result:
    print(r["patologia"], "->", r["sintomi"])