"""MiniLM-based ATS scoring — training and inference.

Usage:
    from Modelling import ATSPredictor

    predictor = ATSPredictor("Modelling/models/minilm_regressor.pkl")
    score = predictor.predict_skills_job(
        candidate_skills="Python, FastAPI, PostgreSQL",
        job_summary="Backend engineer with Python experience",
    )
"""

from Modelling.predictor import ATSPredictor
from Modelling.regression_head import RegressionHead

__all__ = ["ATSPredictor", "RegressionHead"]
