# ============================================================
# AUTHORITATIVE: Web-facing PCA annotation generator (DETERMINISTIC)
# Uses axes geometry from pca_geometry_C1_C2.axes.json
# Output: pca_web_points.png
# ============================================================

from datetime import datetime
from datetime import timezone
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# -----------------------------
# Paths
# -----------------------------
ORANICLE_SITE = Path("/Users/rajeevbalgovind/oranicle-site")
CANON_ID = "ORANICLE_TRISTATE_CANONICAL_V1"
BASE = ORANICLE_SITE / f"public/canonicals/{CANON_ID}"

SRC  = BASE / "pca_geometry_C1_C2.png"
META = BASE / "pca_geometry_C1_C2.axes.json"
OUT  = BASE / "pca_web_points.png"

assert SRC.exists(), f"Missing source image: {SRC}"
assert META.exists(), f"Missing axes metadata: {META}"

# -----------------------------
# Load axes metadata
# -----------------------------
meta = json.loads(META.read_text())
ax_left, ax_bottom, ax_right, ax_top = meta["axes_bbox_px"]

print("Axes box px:", ax_left, ax_bottom, ax_right, ax_top)

# -----------------------------
# Load base image
# -----------------------------
plot = Image.open(SRC).convert("RGB")
W, H = plot.size

# Right-side narrative panel
PANEL_W = int(W * 0.55)
canvas = Image.new("RGB", (W + PANEL_W, H), "white")
canvas.paste(plot, (0, 0))
draw = ImageDraw.Draw(canvas)

# -----------------------------
# Fonts
# -----------------------------
def load_font(name, size):
    try:
        return ImageFont.truetype(name, size)
    except:
        return ImageFont.load_default()

title_font = load_font("Arial.ttf", 28)
body_font  = load_font("Arial.ttf", 18)
bold_font  = load_font("Arial Bold.ttf", 18)
small_font = load_font("Arial.ttf", 14)

# -----------------------------
# Clamp labels strictly inside axes
# -----------------------------
def clamp_to_axes(x, y, text, font, pad=6):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = max(ax_left + pad, min(x, ax_right - tw - pad))
    y = max(ax_top  + pad, min(y, ax_bottom - th - pad))
    return x, y

# -----------------------------
# Point definitions
# (measured RELATIVE TO AXES BOX)
# -----------------------------
points = {
    "Point #1": (227, 649),
    "Point #2": (804, 481),
    "Point #3": (159, 392),
    "Point #4": (469, 639),
}

# -----------------------------
# Draw points (DETERMINISTIC)
# -----------------------------
for label, (px, py) in points.items():
    r = 4

    fx = ax_left + px
    fy = ax_top  + py

    draw.ellipse([fx - r, fy - r, fx + r, fy + r], fill="black")

    lx, ly = clamp_to_axes(fx + 10, fy - 14, label, bold_font)
    draw.text((lx, ly), label, font=bold_font, fill="black")

# -----------------------------
# Right panel narrative
# -----------------------------
X0 = W + 28
Y  = 24
MAXW = PANEL_W - 48

draw.text((X0, Y), "Key structural observations", font=title_font, fill="black")
Y += 46

sections = [
    ("1. Point #1 — A sharp lower boundary",
     "There is a clear lower envelope beneath which no providers exist."),
    ("2. Point #2 — An expanding upper variance",
     "As Care Economic Intensity increases, delivery variance widens."),
    ("3. Point #3 — Absence of upper-left quadrant",
     "Large-scale care cannot persist at low economic intensity."),
    ("4. Point #4 — Dense central core",
     "Modal provider-month activity forms the canonical baseline."),
]

def draw_wrapped(text, x, y, font, max_w, gap=6):
    words = text.split()
    line = ""
    for w in words:
        test = (line + " " + w).strip()
        if draw.textlength(test, font=font) <= max_w:
            line = test
        else:
            draw.text((x, y), line, font=font, fill="black")
            y += font.size + gap
            line = w
    if line:
        draw.text((x, y), line, font=font, fill="black")
        y += font.size + gap
    return y

for head, para in sections:
    draw.text((X0, Y), head, font=bold_font, fill="black")
    Y += 24
    Y = draw_wrapped(para, X0, Y, body_font, MAXW)
    Y += 12

# -----------------------------
# Timestamp
# -----------------------------
ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
stamp = f"Generated: {ts}"

bbox = draw.textbbox((0, 0), stamp, font=small_font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

x = (W + PANEL_W) - tw - 16
y = H - th - 16

draw.rectangle([x - 6, y - 4, x + tw + 6, y + th + 4], fill="white")
draw.text((x, y), stamp, font=small_font, fill="gray")

# -----------------------------
# Save
# -----------------------------
canvas.save(OUT, "PNG")
print("✅ wrote:", OUT, "bytes:", OUT.stat().st_size)