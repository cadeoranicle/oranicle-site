#!/usr/bin/env python3
from __future__ import annotations

import argparse, json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd


def utc_now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def pick_col(df, candidates):
    for c in candidates:
        if c in df.columns:
            return c
    return None


def summarize(arr):
    arr = np.asarray(arr, dtype=float)
    arr = arr[~np.isnan(arr)]
    if arr.size == 0:
        return None
    return {
        "mean": float(np.mean(arr)),
        "median": float(np.median(arr)),
        "std": float(np.std(arr, ddof=0)),
        "p10": float(np.percentile(arr, 10)),
        "p25": float(np.percentile(arr, 25)),
        "p75": float(np.percentile(arr, 75)),
        "p90": float(np.percentile(arr, 90)),
        "min": float(np.min(arr)),
        "max": float(np.max(arr)),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--canon-id", required=True)
    ap.add_argument("--npi", required=True)
    ap.add_argument("--scores", required=True, help="Path to pca_scores.parquet")
    ap.add_argument("--out-dir", default="sku2/artifacts")
    args = ap.parse_args()

    npi = str(args.npi).strip()
    scores_path = Path(args.scores)
    if not scores_path.exists():
        raise FileNotFoundError(f"Missing scores parquet: {scores_path}")

    df = pd.read_parquet(scores_path)

    col_npi = pick_col(
        df,
        ["BILLING_PROVIDER_NPI_NUM", "NPI", "PROVIDER_NPI", "billing_provider_npi_num"],
    )
    if not col_npi:
        raise ValueError(
            f"Could not find NPI column in scores. Columns: {list(df.columns)}"
        )

    col_month = pick_col(df, ["CLAIM_FROM_MONTH", "MONTH", "claim_from_month"])
    col_c1 = pick_col(df, ["C1", "PC1", "pca_C1", "c1"])
    col_c2 = pick_col(df, ["C2", "PC2", "pca_C2", "c2"])

    if not col_c1 or not col_c2:
        raise ValueError(
            "Could not find C1/C2 columns in scores parquet.\n"
            f"Have columns: {list(df.columns)}"
        )

    dfn = df[df[col_npi].astype(str) == npi].copy()
    if dfn.empty:
        raise ValueError(f"No rows found in scores for NPI={npi}")

    # month range (if present)
    month_min = month_max = None
    if col_month:
        vals = dfn[col_month].astype(str).tolist()
        month_min = min(vals)
        month_max = max(vals)

    out = {
        "npi": npi,
        "canonical_id": args.canon_id,
        "generated_at_utc": utc_now(),
        "scores_path": str(scores_path),
        "rows": int(len(dfn)),
        "month_min": month_min,
        "month_max": month_max,
        "C1": summarize(dfn[col_c1].to_numpy()),
        "C2": summarize(dfn[col_c2].to_numpy()),
        # single “position” (use median for stability)
        "position": {
            "C1": float(np.median(dfn[col_c1].to_numpy())),
            "C2": float(np.median(dfn[col_c2].to_numpy())),
            "method": "median over provider-month rows in pca_scores.parquet",
        },
    }

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"provider_position_{npi}.json"
    out_path.write_text(json.dumps(out, indent=2))

    print("✅ rows:", len(dfn))
    print("✅ position (median):", out["position"])
    print("✅ WROTE:", out_path.resolve())


if __name__ == "__main__":
    main()
