"""Regression head used by the MiniLM ATS scoring model."""

from __future__ import annotations

import torch
import torch.nn as nn


class RegressionHead(nn.Module):
    """MLP regression head matching the notebook architecture.

    Architecture: 384 -> 128 -> 64 -> 1 with ReLU + Dropout.
    The MiniLM encoder remains frozen; only this head is trained.
    """

    def __init__(self, input_dim: int = 384, hidden_dim: int = 128) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)
