#!/usr/bin/env python3
"""
Build a provider feature vector from provider-month feature rows.

Input (typical):
  --features /Volumes/.../ORANICLE_TRISTATE_CANONICAL_V1/features.parquet

Output:
  sku2/artifacts/provider_vector_<NPI>.json
  sku2/artifacts/provider_vector_<NPI>.parquet

Vector strategy (simple + robust):
- For each numeric feature column (default: LOG_*):
    mean, median, std, p10, p25, p75, p90
- Also: months_count
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser()
    ap.add_argument("--npi", required=True, help="10-digit Billing Provider NPI")
    ap.add_argument(
        "--features",
        required=True,
        help="features.parquet path (provider-month wide table with LOG_* cols)",
    )
    ap.add_argument(
        "--outdir",
        default="sku2/artifacts",
        help="output directory (relative to repo root unless absolute)",
    )
    ap.add_argument(
        "--key-col",
        default="BILLING_PROVIDER_NPI_NUM",
        help="column name for billing provider npi in features table",
    )
    ap.add_argument(
        "--month-col",
        default="CLAIM_FROM_MONTH",
        help="month column name (optional, used for metadata only)",
    )
    ap.add_argument(
        "--feature-prefix",
        default="LOG_",
        help="only include numeric columns that start with this prefix",
    )
    return ap.parse_args()


def main() -> None:
    args = parse_args()

    npi = str(args.npi).strip()
    if not npi.isdigit() or len(npi) != 10:
        raise ValueError("NPI must be exactly 10 digits")

    repo_root = Path(__file__).resolve().parents[2]
    feat_path = Path(args.features)
    if not feat_path.is_absolute():
        feat_path = repo_root / feat_path
    if not feat_path.exists():
        raise FileNotFoundError(f"Missing features parquet: {feat_path}")

    outdir = Path(args.outdir)
    if not outdir.is_absolute():
        outdir = repo_root / outdir
    outdir.mkdir(parents=True, exist_ok=True)

    # Load minimally: key + month + all columns (pyarrow needs explicit list to reduce memory)
    # We'll read schema first, then select only LOG_* + keys.
    pf = pq.ParquetFile(feat_path)
    cols = pf.schema.names

    needed = [args.key_col]
    if args.month_col in cols:
        needed.append(args.month_col)

    # Select candidate feature columns
    feat_cols = []
    for c in cols:
        if c.startswith(args.feature_prefix):
            feat_cols.append(c)

    if not feat_cols:
        raise ValueError(
            f"No feature columns found with prefix '{args.feature_prefix}' in {feat_path}"
        )

    read_cols = needed + feat_cols

    table = pq.read_table(feat_path, columns=read_cols)
    df = table.to_pandas()

    if args.key_col not in df.columns:
        raise ValueError(f"Key column '{args.key_col}' not found in features table")

    df_npi = df[df[args.key_col].astype(str) == npi].copy()
    if df_npi.empty:
        raise ValueError(f"No rows found for NPI={npi} in {feat_path}")

    months_count = int(len(df_npi))

    month_min = None
    month_max = None
    if args.month_col in df_npi.columns:
        # months are strings like "2024-07" in your data; min/max works lexicographically.
        month_min = str(df_npi[args.month_col].min())
        month_max = str(df_npi[args.month_col].max())

    # Aggregate stats
    agg_rows = []
    for c in feat_cols:
        s = pd.to_numeric(df_npi[c], errors="coerce").dropna()
        if s.empty:
            continue

        agg_rows.append(
            {
                "feature": c,
                "mean": float(s.mean()),
                "median": float(s.median()),
                "std": float(s.std(ddof=0)) if len(s) > 1 else 0.0,
                "p10": float(s.quantile(0.10)),
                "p25": float(s.quantile(0.25)),
                "p75": float(s.quantile(0.75)),
                "p90": float(s.quantile(0.90)),
            }
        )

    out_df = pd.DataFrame(agg_rows).sort_values("feature").reset_index(drop=True)

    # Save parquet
    out_parq = outdir / f"provider_vector_{npi}.parquet"
    pq.write_table(pa.Table.from_pandas(out_df, preserve_index=False), out_parq)

    # Save JSON (easy to eyeball)
    out_json = outdir / f"provider_vector_{npi}.json"
    payload = {
        "npi": npi,
        "generated_at_utc": utc_now(),
        "source_features": str(feat_path),
        "months_count": months_count,
        "month_min": month_min,
        "month_max": month_max,
        "feature_prefix": args.feature_prefix,
        "vector": out_df.to_dict(orient="records"),
    }
    out_json.write_text(json.dumps(payload, indent=2))

    print("✅ NPI:", npi)
    print(
        "✅ months_count:",
        months_count,
        "month_min:",
        month_min,
        "month_max:",
        month_max,
    )
    print("✅ WROTE:", out_parq)
    print("✅ WROTE:", out_json)


if __name__ == "__main__":
    main()
