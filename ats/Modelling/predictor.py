"""Inference utilities for the MiniLM ATS scoring model.

Usage:
    from Modelling import ATSPredictor

    predictor = ATSPredictor("Modelling/models/minilm_regressor.pkl")
    score = predictor.predict_skills_job(
        candidate_skills="Python, FastAPI, PostgreSQL",
        job_summary="Backend engineer with Python experience",
    )
"""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import Iterable

import torch
from sentence_transformers import SentenceTransformer

from Modelling.regression_head import RegressionHead
from Preprocessing import preprocess_resume_job, preprocess_skills_job, preprocess_text


class ATSPredictor:
    """Load a saved MiniLM regression-head bundle and predict ATS scores."""

    def __init__(self, model_path: str | Path = "Modelling/models/minilm_regressor.pkl", device: str = "cpu") -> None:
        self.model_path = Path(model_path)
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model file not found: {self.model_path}")

        self.device = torch.device(device if torch.cuda.is_available() or device == "cpu" else "cpu")
        with open(self.model_path, "rb") as f:
            self.bundle = pickle.load(f)

        self.embedder = SentenceTransformer(self.bundle["embedding_model"], device=str(self.device))
        self.model = RegressionHead(
            input_dim=self.bundle["input_dim"],
            hidden_dim=self.bundle["hidden_dim"],
        ).to(self.device)
        self.model.load_state_dict(self.bundle["model_state_dict"])
        self.model.eval()

    def predict_clean(self, clean_text: str) -> float:
        """Predict ATS score from already-preprocessed `combined_clean` text."""
        return self.predict_clean_batch([clean_text])[0]

    def predict_clean_batch(self, clean_texts: Iterable[str], batch_size: int = 64) -> list[float]:
        """Predict ATS scores from already-preprocessed texts."""
        texts = list(clean_texts)
        if not texts:
            return []

        emb = self.embedder.encode(texts, convert_to_tensor=True, batch_size=batch_size).to(self.device)
        with torch.no_grad():
            pred = self.model(emb).squeeze(-1).detach().cpu().tolist()
        if isinstance(pred, float):
            return [pred]
        return [float(score) for score in pred]

    def predict_text(self, text: object) -> float:
        """Preprocess one text field and predict its score."""
        return self.predict_clean(preprocess_text(text))

    def predict_resume_job(self, resume_text: object, job_summary: object) -> float:
        """Predict ATS score from raw resume text + raw job summary."""
        return self.predict_clean(preprocess_resume_job(resume_text, job_summary))

    def predict_resume_skills_job(self, resume_text: object, candidate_skills: object, job_summary: object) -> float:
        """Predict ATS score from raw resume + raw candidate skills + raw job summary."""
        left = str(resume_text) if resume_text is not None else ''
        sk = str(candidate_skills) if candidate_skills is not None else ''
        right = str(job_summary) if job_summary is not None else ''
        combined = preprocess_text(left + '\nSkills: ' + sk + ' [SEP] ' + right)
        return self.predict_clean(combined)

    def predict_skills_job(self, candidate_skills: object, job_summary: object) -> float:
        """Predict ATS score from raw candidate skills + raw job summary."""
        return self.predict_clean(preprocess_skills_job(candidate_skills, job_summary))

    @property
    def metadata(self) -> dict[str, object]:
        """Return model metadata without tensor weights."""
        skip = {"model_state_dict"}
        return {key: value for key, value in self.bundle.items() if key not in skip}
