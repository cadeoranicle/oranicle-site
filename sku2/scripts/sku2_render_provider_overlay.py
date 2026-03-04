#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def load_json(p: Path):
    return json.loads(p.read_text())


def project_to_pixel(c1: float, c2: float, axes: dict):
    """
    axes.json schema (your current one):
      - png_size_px: [W,H]
      - axes_bbox_px: [x0,y0,x1,y1]  (plot area inside the image)
      - xlim: [xmin,xmax]  (data coords)
      - ylim: [ymin,ymax]  (data coords)
    """
    x0, y0, x1, y1 = axes["axes_bbox_px"]
    xmin, xmax = axes["xlim"]
    ymin, ymax = axes["ylim"]

    # Normalize data -> [0,1]
    tx = (c1 - xmin) / (xmax - xmin) if xmax != xmin else 0.5
    ty = (c2 - ymin) / (ymax - ymin) if ymax != ymin else 0.5

    tx = clamp(tx, 0.0, 1.0)
    ty = clamp(ty, 0.0, 1.0)

    # Pixel mapping:
    # x increases left->right
    # y increases top->bottom, so invert ty
    px = x0 + tx * (x1 - x0)
    py = y1 - ty * (y1 - y0)

    return int(round(px)), int(round(py))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--canon-id", required=True)
    ap.add_argument(
        "--provider-position", required=True, help="provider_position_XXXX.json"
    )
    ap.add_argument("--out", required=True, help="output PNG path under public/")
    ap.add_argument("--label", default="Your hospital")
    ap.add_argument("--radius", type=int, default=9)
    args = ap.parse_args()

    canon_id = args.canon_id
    pos_path = Path(args.provider_position)
    out_path = Path(args.out)

    pos = load_json(pos_path)
    c1 = float(pos["position"]["C1"])
    c2 = float(pos["position"]["C2"])
    npi = str(pos.get("npi", ""))

    base_dir = Path("public") / "canonicals" / canon_id
    base_img_path = base_dir / "pca_geometry_C1_C2.png"
    axes_path = base_dir / "pca_geometry_C1_C2.axes.json"

    if not base_img_path.exists():
        raise FileNotFoundError(f"Missing base image: {base_img_path}")
    if not axes_path.exists():
        raise FileNotFoundError(f"Missing axes json: {axes_path}")

    axes = load_json(axes_path)
    img = Image.open(base_img_path).convert("RGBA")
    draw = ImageDraw.Draw(img)

    x, y = project_to_pixel(c1, c2, axes)

    r = args.radius
    ring_r = r + 7

    # Marker: ring + filled dot
    draw.ellipse(
        [x - ring_r, y - ring_r, x + ring_r, y + ring_r],
        outline=(255, 255, 255, 230),
        width=3,
    )
    draw.ellipse(
        [x - r, y - r, x + r, y + r],
        fill=(255, 215, 0, 240),
        outline=(0, 0, 0, 200),
        width=2,
    )

    # Label box
    label = f"{args.label} (NPI {npi})" if npi else args.label
    try:
        font = ImageFont.truetype("Arial.ttf", 16)
    except Exception:
        font = ImageFont.load_default()

    pad = 6
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    bx0, by0 = x + 14, y - (th // 2) - pad
    bx1, by1 = bx0 + tw + 2 * pad, by0 + th + 2 * pad

    # keep label on-image
    W, H = img.size
    if bx1 > W - 6:
        bx0 = x - 14 - (tw + 2 * pad)
        bx1 = bx0 + tw + 2 * pad
    if by0 < 6:
        by0 = 6
        by1 = by0 + th + 2 * pad
    if by1 > H - 6:
        by1 = H - 6
        by0 = by1 - (th + 2 * pad)

    draw.rounded_rectangle(
        [bx0, by0, bx1, by1],
        radius=8,
        fill=(0, 0, 0, 180),
        outline=(255, 255, 255, 90),
        width=1,
    )
    draw.text((bx0 + pad, by0 + pad), label, font=font, fill=(255, 255, 255, 235))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)
    print("✅ WROTE:", out_path.resolve())
    print("✅ provider pixel:", (x, y), "from C1,C2:", (c1, c2))


if __name__ == "__main__":
    main()
