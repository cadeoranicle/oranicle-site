#!/usr/bin/env python3
import argparse, json
from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scores", required=True, help="pca_scores.parquet path")
    ap.add_argument("--out-png", required=True, help="pca_geometry_C1_C2.png path")
    ap.add_argument(
        "--out-axes", required=True, help="pca_geometry_C1_C2.axes.json path"
    )
    ap.add_argument("--dpi", type=int, default=180)
    ap.add_argument("--max-points", type=int, default=120_000)
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()

    scores_path = Path(args.scores)
    out_png = Path(args.out_png)
    out_axes = Path(args.out_axes)

    assert scores_path.exists(), f"Missing scores parquet: {scores_path}"

    df = pd.read_parquet(scores_path, columns=["C1", "C2"])
    if len(df) == 0:
        raise ValueError("scores parquet has 0 rows")

    # deterministic downsample (head) so output is stable run-to-run
    if len(df) > args.max_points:
        df = df.head(args.max_points)

    # limits from percentiles (stable, robust)
    x_min, x_max = df["C1"].quantile(0.01), df["C1"].quantile(0.99)
    y_min, y_max = df["C2"].quantile(0.01), df["C2"].quantile(0.99)

    # --- FIGURE ---
    fig = plt.figure(figsize=(8.0, 5.6), dpi=args.dpi)
    ax = fig.add_axes([0.10, 0.12, 0.80, 0.78])  # fixed axes box (deterministic)

    ax.scatter(df["C1"], df["C2"], s=2, alpha=0.25, linewidths=0)

    ax.set_xlim(float(x_min), float(x_max))
    ax.set_ylim(float(y_min), float(y_max))

    ax.set_xlabel("C1")
    ax.set_ylabel("C2")
    ax.grid(True, alpha=0.15)

    # Force draw so we can read pixel geometry
    fig.canvas.draw()

    # Matplotlib gives bbox in display pixels, origin at bottom-left.
    bbox = ax.get_window_extent().bounds  # (x0, y0, w, h) in pixels
    x0, y0, w, h = bbox

    fig_w_px = int(round(fig.bbox.width))
    fig_h_px = int(round(fig.bbox.height))

    left = int(round(x0))
    right = int(round(x0 + w))

    # Convert y (bottom-left origin) -> image coords (top-left origin)
    # matplotlib: y0 is distance from bottom
    top = int(round(fig_h_px - (y0 + h)))
    bottom = int(round(fig_h_px - y0))

    axes_json = {
        "png": str(out_png.name),
        "dpi": int(args.dpi),
        "png_size_px": [fig_w_px, fig_h_px],
        # IMPORTANT: [left, top, right, bottom] in IMAGE pixel coordinates (top-left origin)
        "axes_bbox_px": [left, top, right, bottom],
        "xlim": [float(ax.get_xlim()[0]), float(ax.get_xlim()[1])],
        "ylim": [float(ax.get_ylim()[0]), float(ax.get_ylim()[1])],
    }

    out_png.parent.mkdir(parents=True, exist_ok=True)
    out_axes.parent.mkdir(parents=True, exist_ok=True)

    fig.savefig(out_png, dpi=args.dpi, facecolor="white")
    plt.close(fig)

    out_axes.write_text(json.dumps(axes_json, indent=2))
    if args.debug:
        print("scores_path:", scores_path.resolve())
        print("out_png:", out_png.resolve())
        print("out_axes:", out_axes.resolve())
        print("png_size_px:", axes_json["png_size_px"])
        print("axes_bbox_px [L,T,R,B]:", axes_json["axes_bbox_px"])
        print("xlim:", axes_json["xlim"], "ylim:", axes_json["ylim"])

    print("✅ WROTE:", out_png.resolve())
    print("✅ WROTE:", out_axes.resolve())


if __name__ == "__main__":
    main()
