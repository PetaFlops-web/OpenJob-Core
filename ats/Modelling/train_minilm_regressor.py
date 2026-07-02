from __future__ import annotations

import argparse
import os
import pickle
import random
import sys
from pathlib import Path
from typing import Any

# Allow running as a script from repo root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sentence_transformers import SentenceTransformer
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from torch.utils.data import DataLoader, TensorDataset
from Modelling.regression_head import RegressionHead

EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
RANDOM_STATE = 42  # matches notebook


def _set_seed() -> None:
    torch.manual_seed(RANDOM_STATE)
    random.seed(RANDOM_STATE)
    np.random.seed(RANDOM_STATE)


def _load_data(path: Path, max_rows: int = 0) -> pd.DataFrame:
    if max_rows > 0:
        raw = pd.read_csv(path, nrows=max_rows)
    else:
        raw = pd.read_csv(path)

    if "combined_clean" not in raw.columns:
        raise KeyError("CSV must contain 'combined_clean' column. Run Preprocessing/clean_dataset.py first.")
    if "ats_score" not in raw.columns:
        raise KeyError("CSV must contain 'ats_score' column.")

    return raw


def train(
    data_path: Path,
    model_output: Path,
    epochs: int,
    batch_size: int,
    lr: float,
    max_rows: int,
    device_str: str,
) -> dict[str, Any]:
    """Train the regression head and return metrics."""

    device = torch.device(device_str if torch.cuda.is_available() else "cpu")
    _set_seed()

    # ── Load & embed ──────────────────────────────────────────
    print(f"Loading data from {data_path}")
    df = _load_data(data_path, max_rows)
    print(f"  rows  = {len(df)}")
    print(f"  mean  = {df['ats_score'].mean():.2f}")
    print(f"  std   = {df['ats_score'].std():.2f}")

    embedder = SentenceTransformer(EMBEDDING_MODEL, device=str(device))
    texts = df["combined_clean"].tolist()
    print(f"Embedding {len(texts)} texts with {EMBEDDING_MODEL} ...")
    embeddings = embedder.encode(texts, batch_size=batch_size, show_progress_bar=True, convert_to_numpy=True)

    # ── Tensors & split ───────────────────────────────────────
    X = torch.tensor(embeddings, dtype=torch.float32)
    y = torch.tensor(df["ats_score"].values, dtype=torch.float32).unsqueeze(1)

    n_test = int(0.2 * len(X))
    indices = torch.randperm(len(X))
    train_idx, test_idx = indices[n_test:], indices[:n_test]

    X_train, X_test = X[train_idx].to(device), X[test_idx].to(device)
    y_train, y_test = y[train_idx].to(device), y[test_idx].to(device)

    train_dataset = TensorDataset(X_train, y_train)
    test_dataset = TensorDataset(X_test, y_test)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    # ── Model ─────────────────────────────────────────────────
    input_dim = embeddings.shape[1]
    model = RegressionHead(input_dim=input_dim, hidden_dim=128).to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)

    # ── Training loop ─────────────────────────────────────────
    train_losses: list[float] = []
    test_losses: list[float] = []
    all_preds: list[float] = []
    all_targets: list[float] = []

    print(f"Training {epochs} epochs (device={device}) ...")
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0.0
        for batch_X, batch_y in train_loader:
            optimizer.zero_grad()
            loss = criterion(model(batch_X), batch_y)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item() * batch_X.size(0)
        train_losses.append(epoch_loss / len(train_dataset))

        model.eval()
        test_loss = 0.0
        epoch_preds: list[float] = []
        epoch_targets: list[float] = []
        with torch.no_grad():
            for batch_X, batch_y in test_loader:
                pred = model(batch_X)
                loss = criterion(pred, batch_y)
                test_loss += loss.item() * batch_X.size(0)
                epoch_preds.extend(pred.squeeze().tolist())
                epoch_targets.extend(batch_y.squeeze().tolist())
        test_losses.append(test_loss / len(test_dataset))

        if (epoch + 1) % 10 == 0:
            print(f"  Epoch {epoch + 1:3d}/{epochs} | Train Loss: {train_losses[-1]:.4f} | Test Loss: {test_losses[-1]:.4f}")

        all_preds = epoch_preds
        all_targets = epoch_targets

    # ── Metrics ───────────────────────────────────────────────
    mae = float(mean_absolute_error(all_targets, all_preds))
    rmse = float(root_mean_squared_error(all_targets, all_preds))
    print(f"  Final: MAE={mae:.2f} | RMSE={rmse:.2f}")

    # ── Save model ────────────────────────────────────────────
    model_output.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "model_state_dict": {k: v.cpu() for k, v in model.state_dict().items()},
        "input_dim": int(input_dim),
        "hidden_dim": 128,
        "activation": "ReLU",
        "dropout_p": [0.2, 0.1],
        "output_dim": 1,
        # metadata
        "embedding_model": EMBEDDING_MODEL,
        "embedding_dim": int(input_dim),
        "head_architecture": "MLP(384->128->64->1)",
        "optimizer": f"AdamW(lr={lr}, weight_decay=1e-4)",
        "epochs": epochs,
        "train_loss": float(train_losses[-1]),
        "test_loss": float(test_losses[-1]),
        "mae": mae,
        "rmse": rmse,
    }
    with open(model_output, "wb") as f:
        pickle.dump(bundle, f)

    size_kb = os.path.getsize(model_output) / 1024
    print(f"Saved → {model_output} ({size_kb:.0f} KB)")

    return {"mae": mae, "rmse": rmse, "trainsize": len(X_train), "testsize": len(X_test)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train MiniLM regression head for ATS scoring.")
    parser.add_argument(
        "--data",
        type=Path,
        default=Path("dataset/dataset_merged_clean.csv"),
        help="Cleaned dataset CSV path.",
    )
    parser.add_argument(
        "--model-output",
        type=Path,
        default=Path("Modelling/models/minilm_regressor.pkl"),
        help="Output path for the trained model (pickle).",
    )
    parser.add_argument("--epochs", type=int, default=50, help="Training epochs.")
    parser.add_argument("--batch-size", type=int, default=64, help="Batch size for embedding and training.")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate for AdamW.")
    parser.add_argument("--max-rows", type=int, default=0, help="Limit rows for a quick sanity-check run.")
    parser.add_argument("--device", type=str, default="cpu", choices=["cpu", "cuda"], help="Device to run on.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    train(
        data_path=args.data,
        model_output=args.model_output,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        max_rows=args.max_rows,
        device_str=args.device,
    )


if __name__ == "__main__":
    main()
