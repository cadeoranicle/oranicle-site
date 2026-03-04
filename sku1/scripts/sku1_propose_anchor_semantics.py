#!/usr/bin/env python3
"""
Propose anchor semantics for a canonical PCA.

Inputs (per canonical folder):
- pca_scores.parquet: must include columns ['C1','C2'] and ideally a join key (provider-month id).
- anchors.json OR anchors.authoritative.json: provides anchor DATA coords.
- A features parquet (wide table): numeric columns of the original feature space used to build PCA.

Output:
- pca_geometry_C1_C2.semantics.json  (machine proposal)
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import pyarrow.parquet as pq


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_anchors(canon_dir: Path) -> tuple[dict, str]:
    auth = canon_dir / "pca_geometry_C1_C2.anchors.authoritative.json"
    prop = canon_dir / "pca_geometry_C1_C2.anchors.json"
    path = auth if auth.exists() else prop
    if not path.exists():
        raise FileNotFoundError(f"Missing anchors file: {auth} (or {prop})")
    return json.loads(path.read_text()), path.name


def pick_numeric_columns(df: pd.DataFrame, exclude: set[str]) -> list[str]:
    cols = []
    for c in df.columns:
        if c in exclude:
            continue
        if pd.api.types.is_numeric_dtype(df[c]):
            cols.append(c)
    return cols


def zstats(local: pd.DataFrame, global_mean: pd.Series, global_std: pd.Series) -> pd.DataFrame:
    # avoid divide-by-zero
    std = global_std.replace(0, np.nan)
    delta = local.mean(numeric_only=True) - global_mean
    delta_z = (delta / std).replace([np.inf, -np.inf], np.nan).fillna(0.0)
    delta_pct = (delta / global_mean.replace(0, np.nan) * 100.0).replace([np.inf, -np.inf], np.nan).fillna(0.0)
    out = pd.DataFrame({"delta_z": delta_z, "delta_pct": delta_pct})
    out.index.name = "feature"
    return out.reset_index()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--canon-id", required=True)
    ap.add_argument("--canonicals-root", default="public/canonicals")
    ap.add_argument("--scores", default="pca_scores.parquet", help="PCA score parquet inside canonical build dir")
    ap.add_argument("--features", required=True, help="FEATURES parquet path (absolute or relative to repo)")
    ap.add_argument("--out", default="pca_geometry_C1_C2.semantics.json")
    ap.add_argument("--k", type=int, default=2000, help="Neighborhood size per anchor (nearest points)")
    ap.add_argument("--topn", type=int, default=12, help="Top features to report per anchor")
    args = ap.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    canon_dir = repo_root / args.canonicals_root / args.canon_id

    anchors_obj, anchors_src = load_anchors(canon_dir)
    anchors = anchors_obj["anchors_data"]

    # scores parquet location:
    scores_path = canon_dir / args.scores
    if not scores_path.exists():
        # if scores were stored elsewhere, allow absolute path
        scores_path = Path(args.scores)
    if not scores_path.exists():
        raise FileNotFoundError(f"Missing PCA scores parquet: {scores_path}")

    # features parquet location:
    feat_path = Path(args.features)
    if not feat_path.is_absolute():
        feat_path = repo_root / feat_path
    if not feat_path.exists():
        raise FileNotFoundError(f"Missing features parquet: {feat_path}")

    df_scores = pq.read_table(scores_path).to_pandas()
    if "C1" not in df_scores.columns or "C2" not in df_scores.columns:
        raise ValueError("pca_scores.parquet must contain columns C1 and C2")

    df_feat = pq.read_table(feat_path).to_pandas()

    # Join strategy:
    # If you have a stable join key (recommended), set it here.
    # Otherwise we fall back to "row alignment" (works only if both were built in same row order).
    join_key_candidates = ["provider_month_id", "row_id", "id", "key"]
    join_key = next((k for k in join_key_candidates if k in df_scores.columns and k in df_feat.columns), None)

    if join_key:
        df = df_scores[[join_key, "C1", "C2"]].merge(df_feat, on=join_key, how="inner")
    else:
        # fallback: align by row order
        if len(df_scores) != len(df_feat):
            raise ValueError(
                "No join key found, and row counts differ between scores and features. "
                "Add a join key column to both tables (recommended)."
            )
        df = pd.concat([df_scores[["C1", "C2"]].reset_index(drop=True), df_feat.reset_index(drop=True)], axis=1)

    # choose numeric feature columns (exclude PCA columns)
    exclude = {"C1", "C2"}
    if join_key:
        exclude.add(join_key)
    feat_cols = pick_numeric_columns(df, exclude)
    if not feat_cols:
        raise ValueError("No numeric feature columns found in features table.")

    global_mean = df[feat_cols].mean()
    global_std = df[feat_cols].std(ddof=0).replace(0, np.nan)

    X = df[["C1", "C2"]].to_numpy(dtype=float)

    def nearest_k(anchor_x: float, anchor_y: float, k: int) -> pd.DataFrame:
        a = np.array([anchor_x, anchor_y], dtype=float)
        d2 = np.sum((X - a) ** 2, axis=1)
        idx = np.argpartition(d2, kth=min(k, len(d2) - 1))[:k]
        return df.iloc[idx]

    output = {
        "canonical_id": args.canon_id,
        "generated_at_utc": utc_now(),
        "source": {
            "anchors_used": anchors_src,
            "pca_scores": str(scores_path.name),
            "features_table": str(feat_path),
            "neighborhood_k": args.k,
        },
        "anchors": {},
    }

    # Small default labels (can later be overridden by your authoritative semantics UI)
    default_labels = {
        "Core": ("Dense core", "Typical provider-month signature (modal region)."),
        "Constraint": ("Lower envelope", "Hard floor region (boundary behavior)."),
        "Freedom": ("Upper variance", "Expanding variance / high-intensity tail behavior."),
        "VoidOrOutlier": ("Sparse/void", "Low-density region (missing quadrant / outlier edge)."),
    }

    for key, a in anchors.items():
        local = nearest_k(a["x"], a["y"], args.k)
        stats = zstats(local[feat_cols], global_mean, global_std)

        # pick top features by absolute z shift
        stats["abs_z"] = stats["delta_z"].abs()
        top = stats.sort_values("abs_z", ascending=False).head(args.topn)

        label, summary = default_labels.get(key, (key, ""))
        top_features = []
        for _, r in top.iterrows():
            direction = "higher" if r["delta_z"] > 0 else ("lower" if r["delta_z"] < 0 else "near_mean")
            top_features.append(
                {
                    "feature": str(r["feature"]),
                    "direction": direction,
                    "delta_z": float(r["delta_z"]),
                    "delta_pct": float(r["delta_pct"]),
                }
            )

        output["anchors"][key] = {
            "label": label,
            "summary": summary,
            "top_features": top_features,
        }

    out_path = canon_dir / args.out
    out_path.write_text(json.dumps(output, indent=2))
    print(f"✅ WROTE: {out_path}")


if __name__ == "__main__":
    main()