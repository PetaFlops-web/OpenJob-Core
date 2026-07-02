from __future__ import annotations
import argparse
from pathlib import Path
import pandas as pd
try:
    from Preprocessing.text_preprocessing import build_combined_text, preprocess_text
except ModuleNotFoundError: 
    from text_preprocessing import build_combined_text, preprocess_text


DEFAULT_INPUT = Path("dataset/dataset_merged_full.csv")
DEFAULT_OUTPUT = Path("dataset/dataset_merged_clean.csv")
TEXT_COLUMNS = ("resume_text", "job_summary", "job_skills", "combined_text")
CLEAN_COLUMN_MAP = {
    "resume_text": "resume_clean",
    "job_summary": "job_summary_clean",
    "job_skills": "job_skills_clean",
    "combined_text": "combined_clean",
}


def _ensure_combined_text(frame: pd.DataFrame) -> pd.Series:
    """Return raw combined_text, creating it from resume/job_summary when needed."""
    if "combined_text" in frame.columns:
        return frame["combined_text"].fillna("")
    if {"resume_text", "job_summary"}.issubset(frame.columns):
        return frame.apply(
            lambda row: build_combined_text(row.get("resume_text"), row.get("job_summary")),
            axis=1,
        )
    raise ValueError("Dataset must contain `combined_text` or both `resume_text` and `job_summary`.")


def clean_frame(frame: pd.DataFrame) -> pd.DataFrame:
    """Add cleaned text columns to a DataFrame without dropping raw columns."""
    cleaned = frame.copy()

    for raw_column in TEXT_COLUMNS:
        clean_column = CLEAN_COLUMN_MAP[raw_column]
        if raw_column == "combined_text":
            source = _ensure_combined_text(cleaned)
            if raw_column not in cleaned.columns:
                cleaned[raw_column] = source
        elif raw_column not in cleaned.columns:
            cleaned[clean_column] = ""
            continue
        else:
            source = cleaned[raw_column].fillna("")

        cleaned[clean_column] = source.map(preprocess_text)

    return cleaned


def clean_csv(input_path: Path, output_path: Path, chunksize: int) -> None:
    """Clean a CSV file incrementally and write a new cleaned CSV."""
    if chunksize <= 0:
        raise ValueError("chunksize must be greater than 0.")
    if not input_path.exists():
        raise FileNotFoundError(f"Input dataset not found: {input_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    rows_written = 0
    for chunk_index, chunk in enumerate(pd.read_csv(input_path, chunksize=chunksize)):
        cleaned = clean_frame(chunk)
        cleaned.to_csv(
            output_path,
            mode="w" if chunk_index == 0 else "a",
            header=chunk_index == 0,
            index=False,
        )
        rows_written += len(cleaned)
        print(f"chunk={chunk_index + 1} rows_written={rows_written}")

    print(f"Clean dataset saved -> {output_path}")
    print(f"Total rows: {rows_written}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clean ATS dataset using notebook preprocessing rules.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Raw merged dataset CSV path.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Cleaned dataset CSV output path.")
    parser.add_argument("--chunksize", type=int, default=1000, help="Rows per processing chunk.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    clean_csv(args.input, args.output, args.chunksize)


if __name__ == "__main__":
    main()
