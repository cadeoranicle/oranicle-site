#!/usr/bin/env python3
import argparse, json
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd


def q(s, p):
    return float(s.quantile(p))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scores", required=True, help="pca_scores.parquet path")
    ap.add_argument("--out", required=True, help="pca_geometry_C1_C2.anchors.json path")
    ap.add_argument("--canon-id", default="ORANICLE_TRISTATE_CANONICAL_V1")
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()

    scores_path = Path(args.scores)
    out_path = Path(args.out)
    assert scores_path.exists(), f"Missing scores: {scores_path}"

    df = pd.read_parquet(scores_path, columns=["C1", "C2"])
    if len(df) == 0:
        raise ValueError("scores parquet has 0 rows")

    c1 = df["C1"]
    c2 = df["C2"]

    # Anchors chosen to match your semantic intent:
    # Core: median center
    # Constraint: high C1, low C2 (right-bottom)
    # Freedom: high C1, high C2 (right-top)
    # VoidOrOutlier: low C1, high C2 (left-top)
    anchors_data = {
        "Core": {
            "x": q(c1, 0.50),
            "y": q(c2, 0.50),
            "reason": "autogen_quantiles",
            "quantiles": {"C1": 0.50, "C2": 0.50},
        },
        "Constraint": {
            "x": q(c1, 0.95),
            "y": q(c2, 0.05),
            "reason": "autogen_quantiles",
            "quantiles": {"C1": 0.95, "C2": 0.05},
        },
        "Freedom": {
            "x": q(c1, 0.95),
            "y": q(c2, 0.95),
            "reason": "autogen_quantiles",
            "quantiles": {"C1": 0.95, "C2": 0.95},
        },
        "VoidOrOutlier": {
            "x": q(c1, 0.05),
            "y": q(c2, 0.95),
            "reason": "autogen_quantiles",
            "quantiles": {"C1": 0.05, "C2": 0.95},
        },
    }

    payload = {
        "canonical_id": args.canon_id,
        "source_scores": str(scores_path),
        "approved_at_utc": datetime.now(timezone.utc).isoformat(),
        "anchors_data": anchors_data,
        "notes": "AUTO-GENERATED anchors from PCA score quantiles. Replace with human_adjusted later via anchor_review UI.",
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2))

    if args.debug:
        print("scores_path:", scores_path.resolve())
        print("out_path:", out_path.resolve())
        for k, v in anchors_data.items():
            print(f"{k:12s}  C1={v['x']:.4f}  C2={v['y']:.4f}  q={v['quantiles']}")

    print("✅ WROTE:", out_path.resolve())


if __name__ == "__main__":
    main()
