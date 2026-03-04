#!/usr/bin/env python3
"""
Deterministic web image generator:
- reads PCA scores (data coords)
- plots scatter in matplotlib (data coords)
- overlays anchor points + labels (data coords)
- outputs ONE canonical PNG used by SKU1

This eliminates PNG overlay drift completely.
"""

import argparse
import json
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

CANON_ID = "ORANICLE_TRISTATE_CANONICAL_V1"


def load_anchors(anchors_path: Path):
    anch_json = json.loads(anchors_path.read_text())
    anchors = anch_json.get("anchors_data", anch_json)

    # Map anchor names -> Point labels (keep your narrative ordering)
    name_to_point = {
        "Constraint": "Point #1",
        "Freedom": "Point #2",
        "VoidOrOutlier": "Point #3",
        "Core": "Point #4",
    }

    out = []
    for name, v in anchors.items():
        if name not in name_to_point:
            continue
        out.append(
            {
                "name": name,
                "label": name_to_point[name],
                "c1": float(v["x"]),
                "c2": float(v["y"]),
            }
        )
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-root", default=str(Path.cwd()))
    ap.add_argument("--canon-id", default=CANON_ID)
    ap.add_argument("--scores", default="pca_scores.parquet")
    ap.add_argument("--anchors", default="pca_geometry_C1_C2.anchors.json")
    ap.add_argument("--out", default="pca_web_points.png")
    ap.add_argument("--max-points", type=int, default=120000)  # keep it fast
    ap.add_argument("--dpi", type=int, default=160)
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()

    repo_root = Path(args.repo_root).expanduser().resolve()
    canon_dir = repo_root / "public" / "canonicals" / args.canon_id

    scores_path = canon_dir / args.scores
    anchors_path = canon_dir / args.anchors
    out_path = canon_dir / args.out

    if args.debug:
        print("repo_root:", repo_root)
        print("canon_dir:", canon_dir)
        print("scores_path:", scores_path)
        print("anchors_path:", anchors_path)
        print("out_path:", out_path)

    assert scores_path.exists(), f"Missing scores parquet: {scores_path}"
    assert anchors_path.exists(), f"Missing anchors json: {anchors_path}"

    df = pd.read_parquet(scores_path)
    # Expect columns: c1, c2 (or C1,C2). Support both.
    if "c1" in df.columns and "c2" in df.columns:
        xcol, ycol = "c1", "c2"
    elif "C1" in df.columns and "C2" in df.columns:
        xcol, ycol = "C1", "C2"
    else:
        raise RuntimeError(
            f"Scores parquet must contain (c1,c2) or (C1,C2). Found: {list(df.columns)[:30]}"
        )

    # Downsample deterministically (head) to keep speed stable
    if len(df) > args.max_points:
        df = df.head(args.max_points)

    anchors = load_anchors(anchors_path)

    # Axis limits: use full score distribution (stable) + small padding
    xmin, xmax = df[xcol].min(), df[xcol].max()
    ymin, ymax = df[ycol].min(), df[ycol].max()

    # add padding
    xpad = (xmax - xmin) * 0.02
    ypad = (ymax - ymin) * 0.02
    xmin, xmax = xmin - xpad, xmax + xpad
    ymin, ymax = ymin - ypad, ymax + ypad

    if args.debug:
        print("xlim:", (xmin, xmax), "ylim:", (ymin, ymax))
        for a in anchors:
            print(a["label"], a["name"], "->", a["c1"], a["c2"])

    # Figure size chosen to match your layout feel; tune once and freeze
    fig = plt.figure(figsize=(11.5, 6.8), dpi=args.dpi)
    ax = fig.add_subplot(111)

    ax.scatter(df[xcol], df[ycol], s=4, alpha=0.25)  # no explicit colors requested

    ax.set_title("Tri-State Provider Behaviour Manifold)")
    ax.set_xlabel("X-Axis — Care Economic Intensity")
    ax.set_ylabel("Y-Axis — Utilization Structure Variation")
    ax.grid(True, alpha=0.25)

    ax.set_xlim(xmin, xmax)
    ax.set_ylim(ymin, ymax)

    # Draw anchors
    for a in anchors:
        ax.scatter([a["c1"]], [a["c2"]], s=35)
        ax.text(a["c1"], a["c2"], " " + a["label"], fontsize=9, va="center")

    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, format="png")
    plt.close(fig)

    print("✅ wrote:", out_path, "bytes:", out_path.stat().st_size)


if __name__ == "__main__":
    main()
