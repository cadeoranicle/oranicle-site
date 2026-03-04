#!/usr/bin/env python3

import argparse
import json
from pathlib import Path
from datetime import datetime, timezone

import pandas as pd


def main():

    parser = argparse.ArgumentParser()
    parser.add_argument("--scores", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--canon-id", default="ORANICLE_TRISTATE_CANONICAL_V1")
    parser.add_argument("--debug", action="store_true")

    args = parser.parse_args()

    scores_path = Path(args.scores)
    out_path = Path(args.out)

    if not scores_path.exists():
        raise RuntimeError(f"Missing scores parquet: {scores_path}")

    df = pd.read_parquet(scores_path, columns=["C1", "C2"])

    c1 = df["C1"]
    c2 = df["C2"]

    anchors = {
        "Core": {
            "x": float(c1.quantile(0.50)),
            "y": float(c2.quantile(0.50)),
            "reason": "autogen_quantiles",
        },
        "Constraint": {
            "x": float(c1.quantile(0.95)),
            "y": float(c2.quantile(0.05)),
            "reason": "autogen_quantiles",
        },
        "Freedom": {
            "x": float(c1.quantile(0.95)),
            "y": float(c2.quantile(0.95)),
            "reason": "autogen_quantiles",
        },
        "VoidOrOutlier": {
            "x": float(c1.quantile(0.05)),
            "y": float(c2.quantile(0.95)),
            "reason": "autogen_quantiles",
        },
    }

    payload = {
        "canonical_id": args.canon_id,
        "approved_at_utc": datetime.now(timezone.utc).isoformat(),
        "anchors_data": anchors,
        "notes": "AUTO GENERATED FROM PCA DISTRIBUTION",
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2))

    print("\nGenerated anchors:\n")

    for name, v in anchors.items():
        print(f"{name:14} C1={v['x']:.4f}   C2={v['y']:.4f}")

    print("\nWrote anchors file:")
    print(out_path)


if __name__ == "__main__":
    main()
