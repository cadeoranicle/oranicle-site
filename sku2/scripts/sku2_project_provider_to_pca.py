#!/usr/bin/env python3
"""
Project a provider feature vector into canonical PCA space (C1, C2).

Inputs:
- provider_vector_<NPI>.json (created by build_provider_vector.py)
- public/canonicals/<CANON_ID>/pca_geometry_C1_C2.axes.json  (canonical PCA metadata)

Output:
- sku2/artifacts/provider_position_<NPI>.json
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Tuple

import numpy as np


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _as_float_array(x):
    return np.asarray(x, dtype=float)


def _extract_provider_vector(provider_json: dict) -> Dict[str, float]:
    """
    provider_json["vector"] is expected to be a list of dicts like:
      {"feature": "...", "mean": ..., ...}
    We use the 'mean' as the provider's representative value.
    """
    vec = provider_json.get("vector")
    if not isinstance(vec, list) or not vec:
        raise ValueError("provider_vector JSON missing non-empty 'vector' list.")

    out = {}
    for r in vec:
        if not isinstance(r, dict):
            continue
        f = r.get("feature")
        if not f:
            continue
        # prefer mean; fallback to median if needed
        if "mean" in r and r["mean"] is not None:
            out[str(f)] = float(r["mean"])
        elif "median" in r and r["median"] is not None:
            out[str(f)] = float(r["median"])
    if not out:
        raise ValueError("Could not extract any feature values from provider 'vector'.")
    return out


def _try_parse_axes_schema(
    axes: dict,
) -> Tuple[list[str], np.ndarray, np.ndarray, Dict[str, np.ndarray]]:
    """
    Returns: (features, mean, std, components)
      components: {"C1": weights, "C2": weights}
    Supports a few likely schemas.

    If parsing fails, raises ValueError with guidance.
    """
    # ----- Schema A (common): dict with explicit arrays -----
    # {
    #   "features": [...],
    #   "mean": [...],
    #   "std": [...],
    #   "components": {"C1":[...], "C2":[...], ...}
    # }
    if isinstance(axes.get("features"), list) and isinstance(
        axes.get("components"), dict
    ):
        feats = axes["features"]
        comps = axes["components"]
        if "C1" in comps and "C2" in comps:
            mean = axes.get("mean")
            std = axes.get("std")
            if mean is None or std is None:
                raise ValueError(
                    "axes.json has features/components but missing mean/std arrays."
                )
            return (
                feats,
                _as_float_array(mean),
                _as_float_array(std),
                {
                    "C1": _as_float_array(comps["C1"]),
                    "C2": _as_float_array(comps["C2"]),
                },
            )

    # ----- Schema B: feature stats as dicts + loadings as dicts -----
    # {
    #   "mean": {"f1":..., "f2":...},
    #   "std":  {"f1":..., "f2":...},
    #   "loadings": {"C1":{"f1":..., ...}, "C2":{...}}
    # }
    if isinstance(axes.get("mean"), dict) and isinstance(axes.get("std"), dict):
        mean_d = axes["mean"]
        std_d = axes["std"]
        # loadings container might be named "loadings" or "components"
        loadings = axes.get("loadings") or axes.get("components")
        if (
            isinstance(loadings, dict)
            and isinstance(loadings.get("C1"), dict)
            and isinstance(loadings.get("C2"), dict)
        ):
            feats = list(mean_d.keys())
            # enforce deterministic feature order
            feats = sorted(feats)
            mean = _as_float_array([mean_d[f] for f in feats])
            std = _as_float_array([std_d.get(f, 1.0) for f in feats])
            c1 = _as_float_array([loadings["C1"].get(f, 0.0) for f in feats])
            c2 = _as_float_array([loadings["C2"].get(f, 0.0) for f in feats])
            return feats, mean, std, {"C1": c1, "C2": c2}

    # ----- Schema C: top-level "axes" list -----
    # {
    #   "features":[...],
    #   "mean":[...],
    #   "std":[...],
    #   "axes":[ {"name":"C1","weights":[...]}, {"name":"C2","weights":[...]} ]
    # }
    if isinstance(axes.get("features"), list) and isinstance(axes.get("axes"), list):
        feats = axes["features"]
        mean = axes.get("mean")
        std = axes.get("std")
        if mean is None or std is None:
            raise ValueError("axes.json has features/axes but missing mean/std arrays.")
        axes_list = axes["axes"]
        c1 = next((a for a in axes_list if a.get("name") == "C1"), None)
        c2 = next((a for a in axes_list if a.get("name") == "C2"), None)
        if (
            c1
            and c2
            and isinstance(c1.get("weights"), list)
            and isinstance(c2.get("weights"), list)
        ):
            return (
                feats,
                _as_float_array(mean),
                _as_float_array(std),
                {
                    "C1": _as_float_array(c1["weights"]),
                    "C2": _as_float_array(c2["weights"]),
                },
            )

    # If we get here, we couldn't parse it.
    top_keys = sorted(list(axes.keys()))
    raise ValueError(
        "Could not parse axes.json schema. "
        f"Top-level keys are: {top_keys}\n\n"
        "Expected one of these patterns:\n"
        "A) {features:[], mean:[], std:[], components:{C1:[], C2:[]}}\n"
        "B) {mean:{f:..}, std:{f:..}, loadings:{C1:{f:..}, C2:{f:..}}}\n"
        "C) {features:[], mean:[], std:[], axes:[{name:C1, weights:[]}, {name:C2, weights:[]}]}\n\n"
        "Tip: run: python -c 'import json;print(json.load(open(\"...axes.json\")).keys())'"
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--canon-id", required=True)
    ap.add_argument(
        "--provider-vector", required=True, help="Path to provider_vector_<NPI>.json"
    )
    ap.add_argument(
        "--repo-root", default=".", help="Path to repo root (where public/ lives)"
    )
    ap.add_argument("--out-dir", default="sku2/artifacts")
    args = ap.parse_args()

    repo_root = Path(args.repo_root).resolve()
    canon_dir = repo_root / "public" / "canonicals" / args.canon_id
    axes_path = canon_dir / "pca_geometry_C1_C2.axes.json"
    if not axes_path.exists():
        raise FileNotFoundError(f"Missing axes.json: {axes_path}")

    provider_path = Path(args.provider_vector)
    if not provider_path.is_absolute():
        provider_path = repo_root / provider_path
    if not provider_path.exists():
        raise FileNotFoundError(f"Missing provider vector JSON: {provider_path}")

    provider_json = json.loads(provider_path.read_text())
    provider_vals = _extract_provider_vector(provider_json)

    axes = json.loads(axes_path.read_text())
    feats, mean, std, comps = _try_parse_axes_schema(axes)

    # Build aligned vector in canonical feature order
    missing = [f for f in feats if f not in provider_vals]
    if missing:
        raise ValueError(
            "Provider vector is missing required features for this canonical axes.json.\n"
            f"Missing: {missing}\n"
            f"Provider has: {sorted(provider_vals.keys())}\n"
            "Fix: ensure build_provider_vector.py is using the SAME feature set as canonical."
        )

    v = _as_float_array([provider_vals[f] for f in feats])

    # Standardize using canonical mean/std
    std_safe = np.where(std == 0, 1.0, std)
    z = (v - mean) / std_safe

    c1 = float(np.dot(z, comps["C1"]))
    c2 = float(np.dot(z, comps["C2"]))

    out = {
        "npi": provider_json.get("npi"),
        "canonical_id": args.canon_id,
        "generated_at_utc": utc_now(),
        "months_count": provider_json.get("months_count"),
        "month_min": provider_json.get("month_min"),
        "month_max": provider_json.get("month_max"),
        "features_used": feats,
        "C1": c1,
        "C2": c2,
    }

    out_dir = repo_root / args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    npi = out["npi"] or "UNKNOWN_NPI"
    out_path = out_dir / f"provider_position_{npi}.json"
    out_path.write_text(json.dumps(out, indent=2))

    print("✅ WROTE:", out_path)
    print("✅ POSITION:", {"C1": c1, "C2": c2})


if __name__ == "__main__":
    main()
