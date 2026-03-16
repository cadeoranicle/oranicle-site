import json
import random
from pathlib import Path

# ----------------------------
# Paths
# ----------------------------

CANONICAL_SRC = Path(
"/Users/rajeevbalgovind/oranicle-staging/public/southeast_region/"
"southeast_provider_behavior_canonical_3d.json"
)

OUTPUT_PROVIDER_DIR = Path(
"/Users/rajeevbalgovind/oranicle-staging/public/southeast_region/southeast_region_providers"
)
OUTPUT_PROVIDER_DIR.mkdir(parents=True, exist_ok=True)

INDEX_OUTPUT = OUTPUT_PROVIDER_DIR / "southeast_provider_index.json"

SAMPLE_COUNT = 6


# ----------------------------
# Load canonical geometry
# ----------------------------

print("Loading canonical JSON...")

with open(CANONICAL_SRC) as f:
    canonical = json.load(f)

points = canonical["points"]

print("Total canonical points:", len(points))


# ----------------------------
# Extract unique NPIs
# ----------------------------

unique_npis = list({p["provider_npi"] for p in points})

print("Unique providers:", len(unique_npis))


# ----------------------------
# Random sample
# ----------------------------

sample_npis = random.sample(unique_npis, SAMPLE_COUNT)

print("Selected NPIs:")
for n in sample_npis:
    print(" ", n)


# ----------------------------
# Generate provider JSONs
# ----------------------------

provider_index = []

for npi in sample_npis:

    provider_points = [
        p for p in points if str(p["provider_npi"]) == str(npi)
    ]

    provider_json = {
        "provider_npi": npi,
        "region": "southeast",
        "point_count": len(provider_points),
        "positions": provider_points
    }

    outfile = OUTPUT_PROVIDER_DIR / f"provider_position_{npi}_3D.json"

    with open(outfile, "w") as f:
        json.dump(provider_json, f)

    provider_index.append({
        "provider_npi": npi,
        "file": f"providers/provider_position_{npi}_3D.json",
        "region": "southeast"
    })

    print("Created:", outfile)


# ----------------------------
# Write provider index
# ----------------------------

index_payload = {
    "region": "southeast",
    "provider_count": len(provider_index),
    "providers": provider_index
}

with open(INDEX_OUTPUT, "w") as f:
    json.dump(index_payload, f)

print("\nCreated provider index:", INDEX_OUTPUT)

print("\nDONE")