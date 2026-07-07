# ATS CV Analyzer

API untuk mengekstraksi teks dari CV berformat PDF dan memprediksi skor ATS (_Applicant Tracking System_) menggunakan model **MiniLM** berbasis NLP.

API documentation: [SwaggerHub — ATS Predictor API](https://app.swaggerhub.com/apis-docs/student-8c9/ats-predictor-api/1.0.0?view=uiDocs)

---

## Arsitektur Proyek

```
ats/
├── flaskApi/              # REST API (Flask + Flasgger)
│   ├── app.py             #   Entry point: routes, parsing, serving
│   └── requirements.txt   #   Dependensi API
├── Modelling/             # Model training & inference
│   ├── predictor.py       #   ATSPredictor: load model, predict
│   ├── regression_head.py #   MLP regression head (384→128→64→1)
│   ├── train_minilm_regressor.py  #   Training script
│   ├── models/
│   │   └── minilm_regressor.pkl   #   Model bundle (pickle)
│   └── __init__.py
├── Preprocessing/         # NLP text preprocessing
│   ├── text_preprocessing.py  #   Case folding, tokenization, stopword removal, stemming
│   ├── clean_dataset.py       #   CSV cleaner: add kolom *_clean ke dataset
│   └── __init__.py
├── notebooks/             # Eksperimen & training notebook
│   ├── ats_scanning_model_experiment.ipynb
│   └── models/
│       └── minilm_regressor.pkl
├── dataset/               # Dataset (CSV)
├── Dockerfile             # Docker build
└── requirements.txt       # Dependensi global
```

### Alur Data

```
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

- **Embedder**: `paraphrase-multilingual-MiniLM-L12-v2` (SentenceTransformers) — frozen, tidak dilatih ulang.
- **Regression Head**: MLP 3-layer (`384 → 128 → 64 → 1`) dengan ReLU + Dropout.
- **Output**: skor ATS dalam rentang 0–100.
- Model disimpan sebagai pickle bundle yang berisi: `embedding_model`, `input_dim`, `hidden_dim`, `model_state_dict`.

### Preprocessing

Pipeline preprocessing tekstual (konsisten dengan notebook eksperimen):

1. **Case folding** — lowercase
2. **Remove punctuation** — hanya menyisakan `[a-zA-Z0-9+#.]`
3. **Tokenize** — regex `[a-zA-Z0-9+#]+`
4. **Remove stopwords** — English stopwords + token 1 karakter
5. **Stemming** — suffix stripping sederhana (`ing`, `ly`, `ment`, dll.)

---

## API Endpoints

| Method | Endpoint              | Deskripsi                                  |
|--------|-----------------------|--------------------------------------------|
| `GET`  | `/api/v1/ats/health`  | Cek status API & model                     |
| `GET`  | `/api/v1/ats/model`   | Metadata model (nama, versi, arsitektur)   |
| `POST` | `/api/v1/ats/analyze` | Upload CV PDF + skills + job summary → skor ATS |

Swagger UI tersedia di `/apidocs/` saat server berjalan.

Lihat [SwaggerHub](https://app.swaggerhub.com/apis-docs/student-8c9/ats-predictor-api/1.0.0?view=uiDocs) untuk spesifikasi lengkap request/response.

---

## Menjalankan Proyek

### Prasyarat

- Python 3.11+
- Disk ~3 GB (untuk cache model SentenceTransformer)

### 1. Install dependensi

```bash
pip install -r requirements.txt
```

### 2. Preprocessing dataset (opsional)

```bash
python Preprocessing/clean_dataset.py \
  --input dataset/dataset_merged_full.csv \
  --output dataset/dataset_merged_clean.csv \
  --chunksize 1000
```

### 3. Training model (opsional)

```bash
python Modelling/train_minilm_regressor.py \
  --data dataset/dataset_merged_clean.csv \
  --model-output Modelling/models/minilm_regressor.pkl \
  --epochs 50 \
  --batch-size 64 \
  --lr 1e-3 \
  --device cpu
```

Untuk _sanity check_ cepat, tambahkan `--max-rows 500`.

### 4. Menjalankan API

```bash
python flaskApi/app.py
```

Server berjalan di `http://0.0.0.0:5000`. Swagger UI di `http://0.0.0.0:5000/apidocs/`.

### 5. Docker

```bash
docker build -t ats-api .
docker run -p 5000:5000 ats-api
```

---

## Catatan

- Model di-load sekali saat startup (lazy, pada request pertama ke `/health`).
- Ukuran file CV dibatasi **10 MB**.
- Hanya file **PDF** yang diterima.
- Pretrained MiniLM akan otomatis diunduh dari HuggingFace Hub saat pertama kali dijalankan (~500 MB, disimpan di `~/.cache/huggingface`).
