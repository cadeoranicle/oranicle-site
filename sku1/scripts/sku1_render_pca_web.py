#!/usr/bin/env python3
"""
SKU1: Web-facing PCA annotation generator (deterministic)

Goal:
- Load base PCA plot: pca_geometry_C1_C2.png
- Load axes mapping: pca_geometry_C1_C2.axes.json (xlim/ylim + axes_bbox_px)
- Load anchors: pca_geometry_C1_C2.anchors.json (anchors_data with x,y in C1,C2)
- Project anchors (C1,C2) -> pixels deterministically
- Render Point #1..#4 dots + labels
- Save: pca_web_points.png

CRITICAL SAFETY:
- We DO NOT assume axes_bbox_px ordering.
  We infer left/right/top/bottom from min/max.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def find_repo_root(start: Path) -> Path:
    """Walk upwards until we find a folder that contains 'public'."""
    p = start.resolve()
    for _ in range(10):
        if (p / "public").exists():
            return p
        p = p.parent
    raise RuntimeError("Could not locate repo root (folder containing 'public').")


def load_json(p: Path) -> dict:
    return json.loads(p.read_text(encoding="utf-8"))


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(name, size)
    except Exception:
        return ImageFont.load_default()


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--canon-id", default="ORANICLE_TRISTATE_CANONICAL_V1")
    ap.add_argument(
        "--repo-root",
        default=None,
        help="Optional path to repo root (defaults to auto-detect).",
    )
    ap.add_argument(
        "--src",
        default="pca_geometry_C1_C2.png",
        help="Base plot PNG filename inside public/canonicals/<canon-id>/",
    )
    ap.add_argument(
        "--axes",
        default="pca_geometry_C1_C2.axes.json",
        help="Axes JSON filename inside public/canonicals/<canon-id>/",
    )
    ap.add_argument(
        "--anchors",
        default="pca_geometry_C1_C2.anchors.json",
        help="Anchors JSON filename inside public/canonicals/<canon-id>/",
    )
    ap.add_argument(
        "--out",
        default="pca_web_points.png",
        help="Output PNG filename inside public/canonicals/<canon-id>/",
    )
    ap.add_argument("--dot-radius", type=int, default=5)
    ap.add_argument("--label-dx", type=int, default=10)
    ap.add_argument("--label-dy", type=int, default=-14)
    ap.add_argument("--debug", action="store_true", help="Print projection debug lines.")
    args = ap.parse_args()

    # --- Resolve paths
    script_dir = Path(__file__).resolve().parent
    repo_root = Path(args.repo_root).expanduser().resolve() if args.repo_root else find_repo_root(script_dir)
    canon_dir = repo_root / "public" / "canonicals" / args.canon_id

    src_png = canon_dir / args.src
    axes_json = canon_dir / args.axes
    anchors_json = canon_dir / args.anchors
    out_png = canon_dir / args.out

    for p in (src_png, axes_json, anchors_json):
        if not p.exists():
            raise FileNotFoundError(f"Missing required file: {p}")

    # --- Load metadata
    meta = load_json(axes_json)

    # REQUIRED keys
    bbox = meta["axes_bbox_px"]  # may be in ANY order historically
    xlim = meta["xlim"]
    ylim = meta["ylim"]

    if not (isinstance(bbox, list) and len(bbox) == 4):
        raise ValueError(f"axes_bbox_px must be list of 4 numbers, got: {bbox}")

    x0, y0, x1, y1 = map(float, bbox)

    # ORDER-INDEPENDENT bbox inference (THIS IS THE KEY FIX)
    ax_left = int(min(x0, x1))
    ax_right = int(max(x0, x1))
    ax_top = int(min(y0, y1))
    ax_bottom = int(max(y0, y1))

    xmin, xmax = map(float, xlim)
    ymin, ymax = map(float, ylim)

    # --- Load anchors
    anch = load_json(anchors_json)
    anchors = anch.get("anchors_data", anch)  # supports both schemas

    # map canonical anchor names -> Point labels (keeps your narrative ordering)
    name_to_point = {
        "Constraint": "Point #1",
        "Freedom": "Point #2",
        "VoidOrOutlier": "Point #3",
        "Core": "Point #4",
    }

    # --- Open image
    img = Image.open(src_png).convert("RGBA")
    W, H = img.size
    draw = ImageDraw.Draw(img)

    # --- Fonts
    bold_font = load_font("Arial Bold.ttf", 18)
    small_font = load_font("Arial.ttf", 14)

    def clamp_label(px: float, py: float, text: str, pad: int = 6) -> tuple[float, float]:
        bb = draw.textbbox((0, 0), text, font=bold_font)
        tw = bb[2] - bb[0]
        th = bb[3] - bb[1]
        px2 = clamp(px, ax_left + pad, ax_right - tw - pad)
        py2 = clamp(py, ax_top + pad, ax_bottom - th - pad)
        return px2, py2

    def c12_to_px(c1: float, c2: float) -> tuple[float, float]:
        # normalize in data-space
        tx = (c1 - xmin) / (xmax - xmin) if xmax != xmin else 0.5
        ty = (c2 - ymin) / (ymax - ymin) if ymax != ymin else 0.5

        tx = clamp(tx, 0.0, 1.0)
        ty = clamp(ty, 0.0, 1.0)

        # map into pixel bbox; y increases downward in image
        px = ax_left + tx * (ax_right - ax_left)
        py = ax_bottom - ty * (ax_bottom - ax_top)
        return px, py

    # --- Draw dots + labels
    r = int(args.dot_radius)

    if args.debug:
        print("repo_root:", repo_root)
        print("canon_dir:", canon_dir)
        print("src_png:", src_png)
        print("axes_json:", axes_json)
        print("anchors_json:", anchors_json)
        print("out_png:", out_png)
        print("axes_bbox_px raw:", bbox)
        print("axes bbox inferred L,R,T,B:", ax_left, ax_right, ax_top, ax_bottom)
        print("xlim:", (xmin, xmax), "ylim:", (ymin, ymax))

    for name, v in anchors.items():
        if name not in name_to_point:
            continue

        # anchors use x,y for C1,C2
        c1 = float(v["x"])
        c2 = float(v["y"])
        label = name_to_point[name]

        px, py = c12_to_px(c1, c2)

        # dot
        draw.ellipse([px - r, py - r, px + r, py + r], fill=(0, 0, 0, 255))

        # label
        lx, ly = clamp_label(px + args.label_dx, py + args.label_dy, label)
        draw.text((lx, ly), label, font=bold_font, fill=(0, 0, 0, 255))

        if args.debug:
            print(f"{label}  name={name:12s}  c1={c1: .4f} c2={c2: .4f}  -> px={px: .1f} py={py: .1f}")

    # --- Timestamp stamp (bottom-right)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    stamp = f"Generated: {ts}"
    bb = draw.textbbox((0, 0), stamp, font=small_font)
    tw = bb[2] - bb[0]
    th = bb[3] - bb[1]
    sx = W - tw - 16
    sy = H - th - 16
    draw.rectangle([sx - 6, sy - 4, sx + tw + 6, sy + th + 4], fill=(255, 255, 255, 220))
    draw.text((sx, sy), stamp, font=small_font, fill=(80, 80, 80, 255))

    out_png.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_png, "PNG")
    print("✅ wrote:", out_png, "bytes:", out_png.stat().st_size)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())