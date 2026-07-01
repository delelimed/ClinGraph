"""
deploy.py - Comando unico: build + sync Neo4j + deploy Modal

Uso:
    python deploy.py              # Build + Sync + Deploy
    python deploy.py --no-sync    # Build + Deploy (skip sync)
    python deploy.py --no-build   # Sync + Deploy (skip build)
    python deploy.py --sync-only  # Solo sync Neo4j
    python deploy.py --deploy-only # Solo deploy Modal
"""

import subprocess
import sys
import os

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")


def run(cmd, cwd=None, check=True):
    print(f"\n>>> {cmd}")
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    result = subprocess.run(cmd, shell=True, cwd=cwd or ROOT_DIR, env=env)
    if check and result.returncode != 0:
        print(f"[ERRORE] Comando fallito con codice {result.returncode}")
        sys.exit(1)
    return result.returncode == 0


def build_frontend():
    print("=" * 60)
    print("BUILD FRONTEND")
    print("=" * 60)
    run("npm run build", cwd=FRONTEND_DIR)
    print("[OK] Frontend build completato.")


def sync_neo4j():
    print("=" * 60)
    print("SYNC NEO4J")
    print("=" * 60)
    run(f"{sys.executable} -m backend.app.scripts.sync_patologie", cwd=ROOT_DIR)
    print("[OK] Sync Neo4j completato.")


def deploy_modal():
    print("=" * 60)
    print("DEPLOY MODAL")
    print("=" * 60)
    run(f"{sys.executable} -m modal deploy main.py", cwd=ROOT_DIR)
    print("[OK] Deploy Modal completato.")


def main():
    args = set(sys.argv[1:])
    no_sync = "--no-sync" in args
    no_build = "--no-build" in args
    sync_only = "--sync-only" in args
    deploy_only = "--deploy-only" in args

    if sync_only:
        sync_neo4j()
        return

    if deploy_only:
        deploy_modal()
        return

    if not no_build:
        build_frontend()

    if not no_sync:
        sync_neo4j()

    deploy_modal()

    print("\n" + "=" * 60)
    print("DEPLOY COMPLETATO CON SUCCESSO")
    print("=" * 60)


if __name__ == "__main__":
    main()
