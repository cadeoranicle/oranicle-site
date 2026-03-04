import json
from pathlib import Path
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

CANON = "ORANICLE_TRISTATE_CANONICAL_V1"

feat_path = Path("/Volumes/hcpcs_db/ceigrid_data/canonical/frozen") / CANON / "features.parquet"

out_dir = Path("/Volumes/hcpcs_db/ceigrid_data/canonical/frozen") / CANON
out_dir.mkdir(parents=True, exist_ok=True)

print("Loading features...")
df = pd.read_parquet(feat_path)

# feature columns
feature_cols = [c for c in df.columns if c.startswith("LOG_")]

print("Feature columns:", feature_cols)

X = df[feature_cols].values

# standardize
scaler = StandardScaler()
Xs = scaler.fit_transform(X)

print("Running PCA...")
pca = PCA(n_components=3)
scores = pca.fit_transform(Xs)

df_scores = df[[
    "STATE",
    "BILLING_PROVIDER_NPI_NUM",
    "CLAIM_FROM_MONTH"
]].copy()

df_scores["C1"] = scores[:,0]
df_scores["C2"] = scores[:,1]
df_scores["C3"] = scores[:,2]

scores_path = out_dir / "pca_scores.parquet"
df_scores.to_parquet(scores_path)

print("✅ WROTE:", scores_path)

model = {
    "canonical_id": CANON,
    "features": feature_cols,
    "mean": scaler.mean_.tolist(),
    "scale": scaler.scale_.tolist(),
    "components": pca.components_.tolist(),
    "explained_variance_ratio": pca.explained_variance_ratio_.tolist()
}

model_path = out_dir / "pca_model.json"

model_path.write_text(json.dumps(model, indent=2))

print("✅ WROTE:", model_path)