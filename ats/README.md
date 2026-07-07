# ATS CV Analyzer

An API for extracting text from PDF resumes and predicting Applicant Tracking System (ATS) scores using an NLP-based **MiniLM** model.

API documentation: [SwaggerHub — ATS Predictor API](https://app.swaggerhub.com/apis-docs/student-8c9/ats-predictor-api/1.0.0?view=uiDocs)

---

## Project Architecture

```text
ats/
├── flaskApi/              # REST API (Flask + Flasgger)
│   ├── app.py             #   Entry point: routes, parsing, serving
│   └── requirements.txt   #   API dependencies
├── Modelling/             # Model training & inference
│   ├── predictor.py       #   ATSPredictor: load model, predict
│   ├── regression_head.py #   MLP regression head (384→128→64→1)
│   ├── train_minilm_regressor.py  #   Training script
│   ├── models/
│   │   └── minilm_regressor.pkl   #   Model bundle (pickle)
│   └── __init__.py
├── Preprocessing/         # NLP text preprocessing
│   ├── text_preprocessing.py  #   Case folding, tokenization, stopword removal, stemming
│   ├── clean_dataset.py       #   CSV cleaner: add *_clean columns to the dataset
│   └── __init__.py
├── notebooks/             # Experiment & training notebooks
│   ├── ats_scanning_model_experiment.ipynb
│   └── models/
│       └── minilm_regressor.pkl
├── dataset/               # Dataset (CSV)
├── Dockerfile             # Docker build
└── requirements.txt       # Global dependencies
```

### Data Flow

```text
┌───────────┐     ┌────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  CV PDF   │────▶│  PDF → text    │────▶│  Preprocessing   │────▶│  MiniLM      │
│ (upload)  │     │  (pypdf)       │     │  (case fold,     │     │  embed       │
└───────────┘     │                │     │   tokenize,      │     │  (384-dim)   │
                  │                │     │   stopword,      │     └──────┬───────┘
                  │                │     │   stem)          │            │
                  └────────────────┘     └─────────────────┘            ▼
                                                               ┌──────────────┐
                                                               │  MLP Head    │
                                                               │  384→128→64→1│
                                                               └──────┬───────┘
                                                                      ▼
                                                               ┌──────────────┐
                                                               │  ATS Score   │
                                                               │  (float 0-100)│
                                                               └──────────────┘
```

### Model

- **Embedder**: `paraphrase-multilingual-MiniLM-L12-v2` (SentenceTransformers) — frozen, not retrained.
- **Regression Head**: 3-layer MLP (`384 → 128 → 64 → 1`) with ReLU + Dropout.
- **Output**: ATS score ranging from 0 to 100.
- The model is saved as a pickle bundle containing: `embedding_model`, `input_dim`, `hidden_dim`, `model_state_dict`.

### Preprocessing

Textual preprocessing pipeline (consistent with the experiment notebooks):

1. **Case folding** — converting text to lowercase.
2. **Remove punctuation** — keeping only `[a-zA-Z0-9+#.]`.
3. **Tokenize** — using regex `[a-zA-Z0-9+#]+`.
4. **Remove stopwords** — English stopwords + 1-character tokens.
5. **Stemming** — simple suffix stripping (`ing`, `ly`, `ment`, etc.).

---

## API Endpoints

| Method | Endpoint              | Description                                |
|--------|-----------------------|--------------------------------------------|
| `GET`  | `/api/v1/ats/health`  | Check API & model health status            |
| `GET`  | `/api/v1/ats/model`   | Model metadata (name, version, architecture)|
| `POST` | `/api/v1/ats/analyze` | Upload CV PDF + skills + job summary → ATS score |

Swagger UI is available at `/apidocs/` when the server is running.

See [SwaggerHub](https://app.swaggerhub.com/apis-docs/student-8c9/ats-predictor-api/1.0.0?view=uiDocs) for complete request/response specifications.

---

## Running the Project

### Prerequisites

- Python 3.11+
- ~3 GB of disk space (for SentenceTransformer model cache)

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Dataset preprocessing (optional)

```bash
python Preprocessing/clean_dataset.py \
  --input dataset/dataset_merged_full.csv \
  --output dataset/dataset_merged_clean.csv \
  --chunksize 1000
```

### 3. Model training (optional)

```bash
python Modelling/train_minilm_regressor.py \
  --data dataset/dataset_merged_clean.csv \
  --model-output Modelling/models/minilm_regressor.pkl \
  --epochs 50 \
  --batch-size 64 \
  --lr 1e-3 \
  --device cpu
```

For a quick sanity check, append `--max-rows 500` to the command.

### 4. Running the API

```bash
python flaskApi/app.py
```

The server runs at `http://0.0.0.0:5000`. Swagger UI is available at `http://0.0.0.0:5000/apidocs/`.

### 5. Docker

```bash
docker build -t ats-api .
docker run -p 5000:5000 ats-api
```

---

## Notes

- The model is loaded once during startup (lazy loading, upon the first request to `/health`).
- CV file size is limited to **10 MB**.
- Only **PDF** files are accepted.
- The pretrained MiniLM model will be automatically downloaded from the HuggingFace Hub on the first run (~500 MB, saved in `~/.cache/huggingface`).