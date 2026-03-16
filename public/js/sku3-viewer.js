window.SKU3Viewer = (() => {
    let currentBundle = null;
    let currentRegion = null;
    let currentGeometryMode = "umap3d";
    let currentNpi = null;

    const MAX_RENDER_POINTS = 40000;
    const HIGHLIGHT_SIZE = 7;
    const BASE_SIZE = 2;

    function getContainer() {
        return document.getElementById("sku3Viewer");
    }

    function clearContainer() {
        const el = getContainer();
        if (el) el.innerHTML = "";
    }

    function setMessage(html) {
        const el = getContainer();
        if (!el) return;
        el.innerHTML = `<div style="padding:20px;color:#9fb0c3;line-height:1.5;">${html}</div>`;
    }

    function buildOverlayMap(overlayRows) {
        const map = new Map();
        if (!Array.isArray(overlayRows)) return map;
        for (const row of overlayRows) {
            const key = `${row.provider_npi}|${row.claim_month}|${row.billing_state}`;
            map.set(key, row);
        }
        return map;
    }

    function enrichPoints(points, overlayRows) {
        const overlayMap = buildOverlayMap(overlayRows);
        return points.map((p) => {
            const key = `${p.provider_npi}|${p.claim_month}|${p.billing_state}`;
            const ov = overlayMap.get(key);
            return {
                ...p,
                kmeans_cluster: ov?.kmeans_cluster ?? null,
                archetype_label: ov?.archetype_label ?? "Unlabeled"
            };
        });
    }

    function pickCoords(point, geometryMode) {
        if (geometryMode === "pca3d") return point.pca_3d || { x: 0, y: 0, z: 0 };
        return point.umap_3d || { x: 0, y: 0, z: 0 };
    }

    function hashColor(text) {
        const palette = [
            "#4dabf7", "#51cf66", "#ffd43b", "#ff8787", "#b197fc",
            "#63e6be", "#ffa94d", "#74c0fc", "#f783ac", "#94d82d",
            "#e599f7", "#ff6b6b"
        ];
        let h = 0;
        const s = String(text || "");
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % palette.length;
        return palette[h];
    }

    function buildDisplayPoints(points) {
        if (points.length <= MAX_RENDER_POINTS) {
            return points;
        }
        const sampled = [];
        const step = Math.ceil(points.length / MAX_RENDER_POINTS);
        for (let i = 0; i < points.length; i += step) sampled.push(points[i]);
        return sampled;
    }

    function buildTrace(points, geometryMode, size, opacity, fixedColor = null) {
        const x = [];
        const y = [];
        const z = [];
        const text = [];
        const colors = [];

        for (const p of points) {
            const c = pickCoords(p, geometryMode);
            x.push(c.x);
            y.push(c.y);
            z.push(c.z);

            text.push(
                `NPI: ${p.provider_npi}<br>` +
                `Month: ${p.claim_month}<br>` +
                `State: ${p.billing_state}<br>` +
                `Archetype: ${p.archetype_label || "Unlabeled"}<br>` +
                `Claims: ${Number(p.raw_metrics?.total_claims_sum || 0).toLocaleString()}<br>` +
                `Paid: ${Number(p.raw_metrics?.total_paid_sum || 0).toLocaleString()}<br>` +
                `Paid/Claim: ${Number(p.raw_metrics?.paid_per_claim || 0).toFixed(2)}<br>` +
                `Unique CPT: ${Number(p.raw_metrics?.unique_cpt_count || 0).toFixed(0)}`
            );

            colors.push(fixedColor || hashColor(p.archetype_label));
        }

        return {
            type: "scatter3d",
            mode: "markers",
            x, y, z, text,
            hoverinfo: "text",
            marker: { size, color: colors, opacity }
        };
    }

    function summarizeProvider(providerData, npi) {
        if (!npi) return "No NPI selected.";
        if (!providerData) return `NPI ${npi} not found in Southeast provider pilot index.`;

        return `
      <b>NPI ${npi}</b> found.<br/>
      Provider point count: <b>${providerData.point_count}</b><br/>
      Region: <b>${providerData.region}</b>
    `;
    }

    function updateProviderMeta(providerData) {
        const card = document.getElementById("providerMetaCard");
        if (!card) return;

        if (!providerData || !providerData.positions || providerData.positions.length === 0) {
            card.classList.add("hidden");
            return;
        }


        const first = providerData.positions[0];

        document.getElementById("metaProvider").textContent =
            providerData.provider_npi || "-";

        document.getElementById("metaRegion").textContent =
            providerData.region || "-";

        document.getElementById("metaArchetype").textContent =
            first.archetype_label || "Unlabeled";

        document.getElementById("metaCluster").textContent =
            first.kmeans_cluster ?? "-";

        document.getElementById("metaMonths").textContent =
            providerData.point_count ?? providerData.positions.length ?? "-";

        card.classList.remove("hidden");
    }

    function render(bundle, geometryMode, npi = "") {
        currentBundle = bundle;
        currentRegion = bundle?.region || null;
        currentGeometryMode = geometryMode || "umap3d";
        currentNpi = npi || null;

        clearContainer();

        if (!window.Plotly) {
            setMessage("Plotly not loaded.");
            return;
        }

        const geometry = bundle?.geometry;
        if (!geometry?.points || !Array.isArray(geometry.points)) {
            setMessage("No canonical geometry points available.");
            return;
        }

        const manifoldPoints = enrichPoints(geometry.points, bundle?.overlay?.rows || []);
        const bgPoints = buildDisplayPoints(manifoldPoints);

        const providerPoints = bundle?.providerData?.positions
            ? enrichPoints(bundle.providerData.positions, bundle?.overlay?.rows || [])
            : [];
        if (bundle?.providerData?.positions) {
            bundle.providerData.positions = providerPoints;
        }

        updateProviderMeta(bundle?.providerData);

        const traces = [
            {
                ...buildTrace(bgPoints, currentGeometryMode, BASE_SIZE, 0.42),
                name: "Canonical manifold"
            }
        ];

        if (providerPoints.length > 0) {
            traces.push({
                ...buildTrace(providerPoints, currentGeometryMode, HIGHLIGHT_SIZE, 1, "#ffffff"),
                name: `Provider ${npi}`,
                marker: {
                    size: HIGHLIGHT_SIZE,
                    color: "#21b300",
                    opacity: 1,
                    line: { width: 2, color: "#f5f0f0" }
                }
            });

            const sorted = [...providerPoints].sort((a, b) =>
                String(a.claim_month).localeCompare(String(b.claim_month))
            );

            const lx = [];
            const ly = [];
            const lz = [];
            const ltext = [];

            for (const p of sorted) {
                const c = pickCoords(p, currentGeometryMode);
                lx.push(c.x);
                ly.push(c.y);
                lz.push(c.z);
                ltext.push(`${p.claim_month}`);
            }

            traces.push({
                type: "scatter3d",
                mode: "lines+markers",
                x: lx,
                y: ly,
                z: lz,
                text: ltext,
                hoverinfo: "text",
                line: { width: 4, color: "#eef3f1" },
                marker: { size: 3, color: "#e9eeeb" },
                name: "Provider trajectory"
            });
        }

        const layout = {
            title: {
                text: `SKU3 ${String(currentRegion).toUpperCase()} — ${String(currentGeometryMode).toUpperCase()}`,
                font: { color: "#dce6f2", size: 18 }
            },

            paper_bgcolor: "#06101c",
            plot_bgcolor: "#06101c",
            margin: { l: 0, r: 0, t: 50, b: 0 },
            legend: {
                font: { color: "#dce6f2" },
                bgcolor: "rgba(0,0,0,0)"
            },
            scene: {
                bgcolor: "#06101c",
                xaxis: { title: "X", color: "#9fb0c3", gridcolor: "#223043", zerolinecolor: "#223043" },
                yaxis: { title: "Y", color: "#9fb0c3", gridcolor: "#223043", zerolinecolor: "#223043" },
                zaxis: { title: "Z", color: "#9fb0c3", gridcolor: "#223043", zerolinecolor: "#223043" },
                camera: { eye: { x: 1.6, y: 1.4, z: 1.2 } }
            }
        };

        Plotly.newPlot(getContainer(), traces, layout, {
            responsive: true,
            displaylogo: false,
            scrollZoom: true
        });
    }

    async function loadRegion(region, geometryMode, npi = "") {
        setMessage(`Loading <b>${region}</b> canonical bundle...`);
        const bundle = await window.SKU3Loader.loadBundle(region, npi);
        render(bundle, geometryMode, npi);
    }

    function updateGeometryMode(geometryMode) {
        if (!currentBundle) return;
        render(currentBundle, geometryMode, currentNpi);
    }

    async function updateNpi(npi) {
        if (!currentBundle) return;
        const bundle = await window.SKU3Loader.loadBundle(currentRegion, npi);
        render(bundle, currentGeometryMode, npi);
    }

    function init(containerId) {
        const el = document.getElementById(containerId);
        if (!el) throw new Error(`Viewer container not found: ${containerId}`);
        setMessage("SKU3 viewer initialized. Waiting for region selection.");
    }

    return {
        init,
        loadRegion,
        updateGeometryMode,
        updateNpi
    };
})();

console.log("sku3-viewer.js loaded");