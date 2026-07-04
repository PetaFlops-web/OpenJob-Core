from __future__ import annotations

import io
import sys
from pathlib import Path
from typing import Any

# Ensure project root is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from flask import Flask, jsonify, request

from Modelling import ATSPredictor


_MODEL_PATH = Path("Modelling/models/minilm_regressor.pkl")
_MAX_CV_BYTES = 10 * 1024 * 1024  # 10 MB

app = Flask(__name__)


def _ok(data: dict[str, Any], code: int = 200) -> tuple[Any, int]:
    return jsonify({"success": True, "data": data}), code


def _err(message: str, code: int = 400) -> tuple[Any, int]:
    return jsonify({"success": False, "error": message}), code



def _extract_pdf_text(file_bytes: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        from PyPDF2 import PdfReader 

    reader = PdfReader(io.BytesIO(file_bytes))
    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n".join(pages)


_predictor: ATSPredictor | None = None


def _get_predictor() -> ATSPredictor:
    global _predictor
    if _predictor is None:
        _predictor = ATSPredictor(str(_MODEL_PATH))
    return _predictor


# Endpoints
@app.route("/api/v1/ats/health")
def health():
    try:
        _get_predictor()
        return _ok({"message": "ATS service is running"})
    except Exception as exc:
        return _err(f"Model failed to load: {exc}", 500)


@app.route("/api/v1/ats/model")
def model():
    predictor = _get_predictor()
    return _ok(predictor.metadata)


@app.route("/api/v1/ats/analyze", methods=["POST"])
def analyze():
    if "cv" not in request.files:
        return _err("No file uploaded. Field name: 'cv'", 400)

    file = request.files["cv"]
    filename = (file.filename or "").lower()

    if not filename.endswith(".pdf"):
        return _err("Only PDF files are accepted", 415)

    # read CV, enforce size limit
    raw = file.read()
    if len(raw) > _MAX_CV_BYTES:
        return _err(f"File exceeds maximum size of {_MAX_CV_BYTES // (1024 * 1024)} MB", 413)

    try:
        cv_text = _extract_pdf_text(raw)
    except Exception:
        return _err("Failed to extract text from PDF. Is the file a valid PDF?", 422)

    if not cv_text.strip():
        return _err("No readable text found in PDF", 422)


    if request.content_type and "application/json" in request.content_type:
        payload = request.get_json(silent=True) or {}
        skills = (payload.get("skills") or "").strip()
        job_summary = (payload.get("job_summary") or "").strip()
    else:
        skills = (request.form.get("skills") or "").strip()
        job_summary = (request.form.get("job_summary") or "").strip()

    # predict
    predictor = _get_predictor()
    try:
        if skills:
            score = predictor.predict_resume_skills_job(cv_text, skills, job_summary)
        elif job_summary:
            score = predictor.predict_resume_job(cv_text, job_summary)
        else:
            score = predictor.predict_text(cv_text)
    except Exception as exc:
        return _err(f"Prediction failed: {exc}", 500)

    return _ok({
        "ats_score": round(score, 2),
        "cv_chars": len(cv_text),
        "skills_chars": len(skills),
        "job_summary_chars": len(job_summary),
    })


if __name__ == "__main__":
    print(f"Loading model from {_MODEL_PATH.resolve()} ...")
    _get_predictor()
    print("Model ready. Listening on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
