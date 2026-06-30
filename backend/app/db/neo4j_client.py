from neo4j import GraphDatabase
import os
from dotenv import load_dotenv

load_dotenv()

URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")

_driver = None
_connection_error = None

def get_driver():
    global _driver, _connection_error
    if _connection_error:
        raise Exception(_connection_error)
    if _driver is None:
        try:
            _driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
        except Exception as e:
            _connection_error = str(e)
            raise
    return _driver


def run_query(query, params=None):
    try:
        with get_driver().session() as session:
            result = session.run(query, params or {})
            return [record for record in result]
    except Exception as e:
        raise Exception(f"Neo4j query error: {e}")
