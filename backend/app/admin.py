"""
admin.py - Backend di amministrazione ClinGraph

Solo autenticazione, gestione utenti, gestione proposte/richieste,
e utilita' di deploy (sync, upload MD, export ZIP, changelog).
La modifica dei contenuti avviene SOLO via file MD e nuovi deploy.
"""

import os
import json
import hashlib
import secrets
import datetime
import io
import zipfile
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import yaml

# ============================================================
# CONFIG
# ============================================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATOLOGIE_DIR = os.path.join(BASE_DIR, "data", "patologie")
PROCEDURE_DIAGNOSTICHE_DIR = os.path.join(BASE_DIR, "data", "procedure_diagnostiche")
CHANGELOG_FILE = os.path.join(BASE_DIR, "data", "changelog.json")
USERS_FILE = os.path.join(BASE_DIR, "data", "admin_users.json")
SUGGERIMENTI_FILE = os.path.join(BASE_DIR, "data", "suggerimenti.json")

router = APIRouter(prefix="/admin", tags=["admin"])

# ============================================================
# MODELS
# ============================================================
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    username: str
    role: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "contributor"

class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None


# ============================================================
# AUTH HELPERS
# ============================================================
def _load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    default = {
        "admin": {
            "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
            "role": "admin"
        }
    }
    _save_users(default)
    return default

def _save_users(users):
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

_active_tokens = {}
TOKENS_FILE = os.path.join(BASE_DIR, "data", "active_tokens.json")

def _load_tokens():
    global _active_tokens
    if os.path.exists(TOKENS_FILE):
        try:
            with open(TOKENS_FILE, "r", encoding="utf-8") as f:
                _active_tokens = json.load(f)
        except Exception:
            _active_tokens = {}

def _save_tokens():
    os.makedirs(os.path.dirname(TOKENS_FILE), exist_ok=True)
    with open(TOKENS_FILE, "w", encoding="utf-8") as f:
        json.dump(_active_tokens, f, indent=2, ensure_ascii=False)

def _create_token(username: str) -> str:
    token = secrets.token_hex(32)
    _active_tokens[token] = {
        "username": username,
        "created": datetime.datetime.now().isoformat()
    }
    _save_tokens()
    return token

def _verify_token(token: str) -> str:
    if token in _active_tokens:
        return _active_tokens[token]["username"]
    return None

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def require_admin(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token mancante")
    token = authorization.replace("Bearer ", "")
    username = _verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Token non valido o scaduto")
    return username

# Load persisted tokens on startup
_load_tokens()


# ============================================================
# CHANGELOG HELPERS
# ============================================================
def _load_changelog():
    if os.path.exists(CHANGELOG_FILE):
        with open(CHANGELOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def _save_changelog(entries):
    os.makedirs(os.path.dirname(CHANGELOG_FILE), exist_ok=True)
    with open(CHANGELOG_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)

def _log_change(action: str, target: str, username: str, details: dict = None):
    changelog = _load_changelog()
    entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "action": action,
        "target": target,
        "username": username,
        "details": details or {}
    }
    changelog.insert(0, entry)
    _save_changelog(changelog[:500])


# ============================================================
# FILE HELPERS
# ============================================================
def _md_filename(nome: str) -> str:
    return nome.lower().strip().replace(" ", "_").replace("'", "") + ".md"

def _read_md(filepath: str) -> dict:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    if not content.startswith("---"):
        return {"body": content}
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {"body": content}
    try:
        metadata = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        metadata = {}
    metadata["body"] = parts[2].strip()
    return metadata

def _read_procedura_md(filepath: str) -> dict:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    if not content.startswith("---"):
        return {}
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}
    try:
        metadata = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        metadata = {}
    return metadata


# ============================================================
# AUTH ENDPOINTS
# ============================================================
@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    users = _load_users()
    user = users.get(req.username)
    if not user or user["password_hash"] != _hash_password(req.password):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    token = _create_token(req.username)
    role = user.get("role", "contributor")
    return LoginResponse(token=token, username=req.username, role=role)

@router.post("/logout")
def logout(authorization: str = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "")
        _active_tokens.pop(token, None)
        _save_tokens()
    return {"status": "ok"}


# ============================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================
def _get_user_role(username: str) -> str:
    users = _load_users()
    user = users.get(username)
    return user.get("role", "contributor") if user else "contributor"

def _require_admin_role(username: str):
    role = _get_user_role(username)
    if role != "admin":
        raise HTTPException(status_code=403, detail="Solo gli amministratori possono eseguire questa operazione")

@router.get("/users")
def list_users(username: str = Depends(require_admin)):
    _require_admin_role(username)
    users = _load_users()
    return {"users": [{"username": u, "role": v.get("role", "contributor")} for u, v in users.items()]}

@router.post("/users")
def create_user(req: UserCreate, username: str = Depends(require_admin)):
    _require_admin_role(username)
    users = _load_users()
    if req.username in users:
        raise HTTPException(status_code=409, detail=f"Utente '{req.username}' gia' esistente")
    if req.role not in ("admin", "contributor"):
        raise HTTPException(status_code=400, detail="Ruolo non valido. Usa 'admin' o 'contributor'")
    users[req.username] = {
        "password_hash": _hash_password(req.password),
        "role": req.role,
    }
    _save_users(users)
    _log_change("CREATE_USER", req.username, username, {"role": req.role})
    return {"status": "created", "username": req.username, "role": req.role}

@router.put("/users/{target_username}")
def update_user(target_username: str, req: UserUpdate, username: str = Depends(require_admin)):
    _require_admin_role(username)
    users = _load_users()
    if target_username not in users:
        raise HTTPException(status_code=404, detail=f"Utente '{target_username}' non trovato")
    if req.password:
        users[target_username]["password_hash"] = _hash_password(req.password)
    if req.role:
        if req.role not in ("admin", "contributor"):
            raise HTTPException(status_code=400, detail="Ruolo non valido. Usa 'admin' o 'contributor'")
        users[target_username]["role"] = req.role
    _save_users(users)
    _log_change("UPDATE_USER", target_username, username, {"role": users[target_username].get("role")})
    return {"status": "updated", "username": target_username, "role": users[target_username].get("role")}

@router.delete("/users/{target_username}")
def delete_user(target_username: str, username: str = Depends(require_admin)):
    _require_admin_role(username)
    users = _load_users()
    if target_username not in users:
        raise HTTPException(status_code=404, detail=f"Utente '{target_username}' non trovato")
    if target_username == "admin":
        raise HTTPException(status_code=400, detail="Non puoi cancellare l'utente admin principale")
    if target_username == username:
        raise HTTPException(status_code=400, detail="Non puoi cancellare te stesso")
    del users[target_username]
    _save_users(users)
    _log_change("DELETE_USER", target_username, username, {})
    return {"status": "deleted", "username": target_username}


# ============================================================
# SUGGERIMENTI (PROPOSTE/RICHIESTE) - Solo gestione stato
# ============================================================
def _load_suggerimenti():
    if os.path.exists(SUGGERIMENTI_FILE):
        with open(SUGGERIMENTI_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def _save_suggerimenti(entries):
    os.makedirs(os.path.dirname(SUGGERIMENTI_FILE), exist_ok=True)
    with open(SUGGERIMENTI_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)

@router.get("/suggerimenti")
def list_suggerimenti(authorization: str = Header(None)):
    _verify_auth(authorization)
    suggerimenti = _load_suggerimenti()
    return {"suggerimenti": suggerimenti, "total": len(suggerimenti)}

@router.post("/suggerimenti")
def crea_suggerimento(data: dict, authorization: str = Header(None)):
    username = None
    if authorization:
        try:
            username = _verify_auth(authorization)
        except Exception:
            pass
    
    dati = data.get("dati", {})
    
    if not username:
        nome = dati.get("nome_autore", "").strip()
        email = dati.get("email_autore", "").strip()
        if not nome or not email:
            raise HTTPException(status_code=400, detail="Per gli utenti non registrati sono obbligatori nome ed email")
        username = f"{nome} <{email}> (ospite)"
    
    suggerimenti = _load_suggerimenti()
    entry = {
        "id": len(suggerimenti) + 1,
        "tipo": data.get("tipo", "modifica"),
        "target": data.get("target", ""),
        "dati": dati,
        "autore": username,
        "stato": "pending",
        "timestamp": datetime.datetime.now().isoformat(),
        "note_admin": "",
    }
    suggerimenti.insert(0, entry)
    _save_suggerimenti(suggerimenti[:500])
    return {"status": "created", "id": entry["id"]}

@router.put("/suggerimenti/{suggerimento_id}")
def aggiorna_suggerimento(suggerimento_id: int, data: dict, authorization: str = Header(None)):
    username = _verify_auth(authorization)
    _require_admin_role(username)
    suggerimenti = _load_suggerimenti()
    for s in suggerimenti:
        if s["id"] == suggerimento_id:
            s["stato"] = data.get("stato", s["stato"])
            s["note_admin"] = data.get("note_admin", "")
            s["approvato_da"] = username
            s["data_approvazione"] = datetime.datetime.now().isoformat()
            _save_suggerimenti(suggerimenti)
            _log_change(f"RICHIESTA_{s['stato'].upper()}", s.get("target", ""), username, {"tipo": s["tipo"]})
            return {"status": "ok"}
    raise HTTPException(status_code=404, detail="Suggerimento non trovato")

@router.delete("/suggerimenti/{suggerimento_id}")
def elimina_suggerimento(suggerimento_id: int, authorization: str = Header(None)):
    username = _verify_auth(authorization)
    _require_admin_role(username)
    suggerimenti = _load_suggerimenti()
    for i, s in enumerate(suggerimenti):
        if s["id"] == suggerimento_id:
            suggerimenti.pop(i)
            _save_suggerimenti(suggerimenti)
            _log_change("RICHIESTA_ELIMINATA", s.get("target", ""), username, {"tipo": s["tipo"]})
            return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Suggerimento non trovato")

def _verify_auth(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token mancante")
    token = authorization.replace("Bearer ", "")
    username = _verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Token non valido")
    return username


# ============================================================
# SYNC ENDPOINT
# ============================================================
@router.post("/sync")
def trigger_sync(username: str = Depends(require_admin)):
    try:
        from backend.app.scripts.sync_patologie import generate_csv
        rows = generate_csv()
        _log_change("SYNC", "ALL", username, {"rows_generated": rows})
        # Try Neo4j import but don't fail if it's not available
        try:
            from backend.app.scripts.sync_patologie import import_neo4j
            import_neo4j()
        except Exception as neo_err:
            print(f"[INFO] Neo4j import skipped: {neo_err}")
        return {"status": "ok", "rows": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore sync: {str(e)}")

@router.post("/rebuild-db")
def rebuild_database(username: str = Depends(require_admin)):
    try:
        from backend.app.scripts.sync_patologie import generate_csv, import_neo4j
        rows = generate_csv()
        import_neo4j()
        _log_change("REBUILD_DB", "ALL", username, {"rows_generated": rows})
        return {"status": "ok", "rows": rows, "message": f"Database ricostruito: {rows} righe importate"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore rebuild: {str(e)}")


# ============================================================
# UPLOAD MD FILES
# ============================================================
from fastapi import UploadFile, File

def _get_ambito_dir(ambito: str) -> str:
    dirname = ambito.lower().strip()
    mapping = {
        "cardiologia": "cardiologia",
        "pneumologia": "pneumologia",
        "gastroenterologia": "gastroenterologia",
        "endocrinologia": "endocrinologia",
        "neurologia": "neurologia",
        "ortopedia": "ortopedia",
        "dermatologia": "dermatologia",
        "urologia": "urologia",
        "ginecologia": "ginecologia",
        "medicina interna": "medicina_interna",
    }
    dir_name = mapping.get(dirname, dirname.replace(" ", "_"))
    return os.path.join(PATOLOGIE_DIR, dir_name)

def _get_procedura_ambito_dir(ambito: str) -> str:
    dirname = ambito.lower().strip()
    mapping = {
        "cardiologia": "cardiologia",
        "pneumologia": "pneumologia",
        "gastroenterologia": "gastroenterologia",
        "endocrinologia": "endocrinologia",
        "neurologia": "neurologia",
        "ortopedia": "ortopedia",
        "dermatologia": "dermatologia",
        "urologia": "urologia",
        "ginecologia": "ginecologia",
        "medicina interna": "medicina_interna",
    }
    dir_name = mapping.get(dirname, dirname.replace(" ", "_"))
    return os.path.join(PROCEDURE_DIAGNOSTICHE_DIR, dir_name)

@router.post("/upload-md")
async def upload_md_file(
    file: UploadFile = File(...),
    tipo: str = "patologie",
    ambito: str = "",
    username: str = Depends(require_admin)
):
    """Upload a .md file for pathologies or diagnostic procedures."""
    if not file.filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="Solo file .md sono accettati")
    content = await file.read()
    text = content.decode("utf-8")
    
    if tipo == "patologie":
        if not ambito:
            ambito = "generica"
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                try:
                    meta = yaml.safe_load(parts[1]) or {}
                    ambito = meta.get("ambito", ambito)
                except Exception:
                    pass
        dir_path = _get_ambito_dir(ambito)
        os.makedirs(dir_path, exist_ok=True)
        filepath = os.path.join(dir_path, file.filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(text)
        _log_change("UPLOAD_MD", file.filename, username, {"tipo": "patologia", "ambito": ambito})
    elif tipo == "procedure":
        if not ambito:
            ambito = "generica"
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                try:
                    meta = yaml.safe_load(parts[1]) or {}
                    ambito = meta.get("ambito", ambito)
                except Exception:
                    pass
        dir_path = _get_procedura_ambito_dir(ambito)
        os.makedirs(dir_path, exist_ok=True)
        filepath = os.path.join(dir_path, file.filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(text)
        _log_change("UPLOAD_MD", file.filename, username, {"tipo": "procedura", "ambito": ambito})
    else:
        raise HTTPException(status_code=400, detail="Tipo non valido. Usa 'patologie' o 'procedure'")
    
    return {"status": "ok", "file": file.filename, "ambito": ambito}


# ============================================================
# EXPORT ZIP
# ============================================================
@router.get("/export-zip")
def export_zip(username: str = Depends(require_admin)):
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        if os.path.exists(PATOLOGIE_DIR):
            for root, dirs, files in os.walk(PATOLOGIE_DIR):
                for fname in files:
                    if fname.endswith(".md"):
                        filepath = os.path.join(root, fname)
                        arcname = os.path.join("patologie", os.path.relpath(filepath, PATOLOGIE_DIR))
                        zf.write(filepath, arcname)
        if os.path.exists(PROCEDURE_DIAGNOSTICHE_DIR):
            for root, dirs, files in os.walk(PROCEDURE_DIAGNOSTICHE_DIR):
                for fname in files:
                    if fname.endswith(".md"):
                        filepath = os.path.join(root, fname)
                        arcname = os.path.join("procedure_diagnostiche", os.path.relpath(filepath, PROCEDURE_DIAGNOSTICHE_DIR))
                        zf.write(filepath, arcname)
    zip_buffer.seek(0)
    _log_change("EXPORT_ZIP", "ALL", username, {})
    return StreamingResponse(zip_buffer, media_type="application/zip",
                             headers={"Content-Disposition": "attachment; filename=clingraph_export.zip"})


# ============================================================
# CHANGELOG ENDPOINT
# ============================================================
@router.get("/changelog")
def get_changelog(limit: int = 100):
    changelog = _load_changelog()
    return {"entries": changelog[:limit], "total": len(changelog)}


# ============================================================
# CHANGELOG MD UPLOAD
# ============================================================
CHANGELOG_MD_FILE = os.path.join(BASE_DIR, "data", "changelog.md")

@router.get("/changelog-md")
def get_changelog_md():
    """Ritorna il contenuto del changelog.md pubblico."""
    if os.path.exists(CHANGELOG_MD_FILE):
        with open(CHANGELOG_MD_FILE, "r", encoding="utf-8") as f:
            return {"content": f.read()}
    return {"content": ""}

@router.post("/upload-changelog-md")
async def upload_changelog_md(
    file: UploadFile = File(...),
    username: str = Depends(require_admin)
):
    """Upload a changelog.md file to update the public changelog."""
    if not file.filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="Solo file .md sono accettati")
    content = await file.read()
    text = content.decode("utf-8")
    os.makedirs(os.path.dirname(CHANGELOG_MD_FILE), exist_ok=True)
    with open(CHANGELOG_MD_FILE, "w", encoding="utf-8") as f:
        f.write(text)
    _log_change("UPLOAD_CHANGELOG_MD", file.filename, username, {})
    return {"status": "ok", "file": file.filename}


# ============================================================
# LIST / DELETE PROCEDURE MDs
# ============================================================
@router.get("/procedure-list")
def list_procedure_files():
    """Ritorna tutti i file MD delle procedure con percorso e nome."""
    procedure = []
    if os.path.exists(PROCEDURE_DIAGNOSTICHE_DIR):
        for root, dirs, files in os.walk(PROCEDURE_DIAGNOSTICHE_DIR):
            for fname in sorted(files):
                if not fname.endswith(".md"):
                    continue
                filepath = os.path.join(root, fname)
                rel_path = os.path.relpath(filepath, PROCEDURE_DIAGNOSTICHE_DIR)
                data = _read_procedura_md(filepath)
                procedure.append({
                    "nome": data.get("nome", fname.replace(".md", "")),
                    "ambito": data.get("ambito", ""),
                    "file": rel_path,
                    "filename": fname,
                })
    return {"procedure": procedure, "total": len(procedure)}

@router.delete("/procedure-md/{ambito}/{filename}")
def delete_procedura_md(ambito: str, filename: str, username: str = Depends(require_admin)):
    """Cancella un file MD di una procedura."""
    dir_name = ambito.lower().strip().replace(" ", "_")
    filepath = os.path.join(PROCEDURE_DIAGNOSTICHE_DIR, dir_name, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File non trovato")
    os.remove(filepath)
    # Try to remove empty directory
    dirpath = os.path.dirname(filepath)
    if os.path.isdir(dirpath) and not os.listdir(dirpath):
        os.rmdir(dirpath)
    _log_change("DELETE_PROCEDURA_MD", filename, username, {"ambito": ambito})
    return {"status": "deleted", "file": filename}


# ============================================================
# LIST / DELETE PATHOLOGY MDs
# ============================================================
@router.get("/patologie-list")
def list_patologie_files():
    """Ritorna tutti i file MD delle patologie."""
    patologie = []
    if os.path.exists(PATOLOGIE_DIR):
        for root, dirs, files in os.walk(PATOLOGIE_DIR):
            for fname in sorted(files):
                if not fname.endswith(".md"):
                    continue
                filepath = os.path.join(root, fname)
                rel_path = os.path.relpath(filepath, PATOLOGIE_DIR)
                data = _read_md(filepath)
                patologie.append({
                    "nome": data.get("nome", fname.replace(".md", "").replace("_", " ").title()),
                    "ambito": data.get("ambito", os.path.basename(root)),
                    "file": rel_path,
                    "filename": fname,
                })
    return {"patologie": patologie, "total": len(patologie)}

@router.delete("/patologie-md/{ambito}/{filename}")
def delete_patologia_md(ambito: str, filename: str, username: str = Depends(require_admin)):
    """Cancella un file MD di una patologia."""
    dir_name = ambito.lower().strip().replace(" ", "_")
    filepath = os.path.join(PATOLOGIE_DIR, dir_name, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File non trovato")
    os.remove(filepath)
    dirpath = os.path.dirname(filepath)
    if os.path.isdir(dirpath) and not os.listdir(dirpath):
        os.rmdir(dirpath)
    _log_change("DELETE_PATOLOGIA_MD", filename, username, {"ambito": ambito})
    return {"status": "deleted", "file": filename}


# ============================================================
# LIST PATHOLOGY FOLDERS
# ============================================================
@router.get("/ambiti-list")
def list_ambiti():
    """Ritorna le cartelle degli ambiti disponibili per patologie e procedure."""
    patologie_ambiti = []
    procedure_ambiti = []
    if os.path.exists(PATOLOGIE_DIR):
        for d in sorted(os.listdir(PATOLOGIE_DIR)):
            if os.path.isdir(os.path.join(PATOLOGIE_DIR, d)):
                patologie_ambiti.append(d)
    if os.path.exists(PROCEDURE_DIAGNOSTICHE_DIR):
        for d in sorted(os.listdir(PROCEDURE_DIAGNOSTICHE_DIR)):
            if os.path.isdir(os.path.join(PROCEDURE_DIAGNOSTICHE_DIR, d)):
                procedure_ambiti.append(d)
    return {"patologie": patologie_ambiti, "procedure": procedure_ambiti}
