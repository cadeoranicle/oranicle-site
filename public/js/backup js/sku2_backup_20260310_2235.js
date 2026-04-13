let canonicalViewerBooted = false;
let providerMetrics = null;

function sendProviderToViewer(iframe, npi) {
    if (!iframe || !iframe.contentWindow) return;

    iframe.contentWindow.postMessage(
        {
            type: "load_provider",
            npi: npi
        },
        "*"
    );
}

function ensureViewerLoadedOnce(iframe, defaultNpi) {
    if (!iframe) return;

    const viewerSrc = `canonical_provider_viewer.html?npi=${defaultNpi}`;

    if (!canonicalViewerBooted) {
        iframe.removeAttribute("srcdoc");
        iframe.src = viewerSrc;
        canonicalViewerBooted = true;
    }
}

function sendCameraPresetToViewer(iframe, preset) {
    if (!iframe || !iframe.contentWindow) {
        console.log("camera preset send failed: iframe not ready");
        return;
    }

    console.log("sending camera preset:", preset);

    iframe.contentWindow.postMessage(
        {
            type: "set_camera_preset",
            preset: preset
        },
        "*"
    );
}

// =====================================================
// RHS PANEL HELPERS
// =====================================================
function setNarrativeHTML(html) {
    const narrative = document.getElementById("sku2Narrative");
    if (narrative) {
        narrative.innerHTML = html;
    }
}

function renderDefaultNarrativeForMappedProvider() {
    setNarrativeHTML(`
        This provider is present in the current NY NJ CT HCPCS utilization canonical.
        The map below shows the provider position within the system manifold.
    `);
}

function renderDefaultNarrativeForNoNpi() {
    setNarrativeHTML(`
        No provider-specific lookup was requested. The viewer below shows the current
        NY NJ CT canonical with a reference provider.
    `);
}

function renderDefaultNarrativeForUnsupportedProvider() {
    setNarrativeHTML(`
        This NPI is not currently present in the NY NJ CT HCPCS utilization canonical.
        You may still explore the tri-state provider population map below.
    `);
}

// =====================================================
// PROVIDER METRIC JSON LOADER
// =====================================================
async function loadProviderMetrics(npi) {
    try {
        const res = await fetch(
            `providers/provider_specific_cloud_metrics_json_files/provider_metrics_${npi}.json`,
            { cache: "no-store" }
        );

        if (!res.ok) {
            throw new Error(`Metric JSON fetch failed for ${npi}`);
        }

        providerMetrics = await res.json();
        console.log("provider metrics loaded:", providerMetrics.npi);
    } catch (err) {
        providerMetrics = null;
        console.log("provider metrics load failed:", err);
    }
}

// =====================================================
// SKU2.1 : AXIS POSITION / NORMALIZED RANK
// =====================================================
function renderSku2_1_AxisPosition() {
    if (!providerMetrics || !providerMetrics.canonical_metrics) {
        setNarrativeHTML(`
            <strong>Axis Position</strong><br><br>
            Provider metric data is not available yet for this NPI.
        `);
        return;
    }

    const axisData = providerMetrics.canonical_metrics.axis_position_normalized_rank;
    if (!axisData) {
        setNarrativeHTML(`
            <strong>Axis Position</strong><br><br>
            Axis position data is missing from the provider metric object.
        `);
        return;
    }

    const a1 = axisData.A1.normalized_rank_pct;
    const a2 = axisData.A2.normalized_rank_pct;
    const a3 = axisData.A3.normalized_rank_pct;

    const lowestAxis = [
        { axis: "A1", value: a1 },
        { axis: "A2", value: a2 },
        { axis: "A3", value: a3 }
    ].sort((x, y) => x.value - y.value)[0];

    setNarrativeHTML(`
        <div style="font-size:22px; font-weight:700; color:#e8eef5; margin-bottom:14px;">
            Axis Position / Normalized Rank
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6; margin-bottom:16px;">
            These values show where the provider sits along each canonical axis relative
            to the full population range.
        </div>

        <div style="display:grid; gap:12px; margin-bottom:18px;">
            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:#cfe0f2;">A1</span>
                    <span style="color:#e8eef5;">${a1}%</span>
                </div>
                <div style="height:10px; background:#0f1821; border:1px solid #2d3a48; border-radius:999px; overflow:hidden;">
                    <div style="width:${a1}%; height:100%; background:#4ea1ff;"></div>
                </div>
            </div>

            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:#cfe0f2;">A2</span>
                    <span style="color:#e8eef5;">${a2}%</span>
                </div>
                <div style="height:10px; background:#0f1821; border:1px solid #2d3a48; border-radius:999px; overflow:hidden;">
                    <div style="width:${a2}%; height:100%; background:#4ea1ff;"></div>
                </div>
            </div>

            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:#cfe0f2;">A3</span>
                    <span style="color:#e8eef5;">${a3}%</span>
                </div>
                <div style="height:10px; background:#0f1821; border:1px solid #2d3a48; border-radius:999px; overflow:hidden;">
                    <div style="width:${a3}%; height:100%; background:#4ea1ff;"></div>
                </div>
            </div>
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6;">
            This provider sits in the lower-to-mid band across all three axes.
            The weakest relative position is <strong style="color:#e8eef5;">${lowestAxis.axis}</strong>,
            which indicates the provider is comparatively lowest on that canonical dimension.
        </div>

        <div style="margin-top:18px; font-size:13px; line-height:1.6; color:#9fb0c3;">
            <strong>Axis Interpretation</strong><br><br>

            <strong>A1 — Billing Intensity</strong><br>
            Measures the relative intensity of billing activity per service interaction.<br><br>

            <strong>A2 — Utilization Pattern</strong><br>
            Reflects how frequently services are utilized within the provider's patient population.<br><br>

            <strong>A3 — Operational Scale</strong><br>
            Indicates the overall scale of billing activity and service volume generated by the provider.
        </div>
    `);
}

// =====================================================
// SKU2.2 : CENTROID DISTANCE
// =====================================================
function renderSku2_2_CentroidDistance() {
    if (!providerMetrics || !providerMetrics.canonical_metrics) {
        setNarrativeHTML(`
            <strong>Center Distance</strong><br><br>
            Provider metric data is not available yet for this NPI.
        `);
        return;
    }

    const centroidData = providerMetrics.canonical_metrics.centroid_distance;
    if (!centroidData) {
        setNarrativeHTML(`
            <strong>Center Distance</strong><br><br>
            Centroid distance data is missing from the provider metric object.
        `);
        return;
    }

    const absoluteDistance = centroidData.absolute_distance;
    const normalizedPct = (centroidData.normalized_position_0_1 * 100).toFixed(2);
    const relativeToMean = centroidData.relative_to_mean;
    const interpretation = centroidData.interpretation;

    const relativeText = relativeToMean !== null && relativeToMean !== undefined
        ? relativeToMean.toFixed(3)
        : "n/a";

    setNarrativeHTML(`
        <div style="font-size:22px; font-weight:700; color:#e8eef5; margin-bottom:14px;">
            Center Distance
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6; margin-bottom:16px;">
            This metric shows how far the provider sits from the canonical center of the
            tri-state behavioral manifold.
        </div>

        <div style="display:grid; gap:12px; margin-bottom:18px;">
            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:#cfe0f2;">Distance from Center</span>
                    <span style="color:#e8eef5;">${absoluteDistance.toFixed(3)}</span>
                </div>
                <div style="height:10px; background:#0f1821; border:1px solid #2d3a48; border-radius:999px; overflow:hidden;">
                    <div style="width:${normalizedPct}%; height:100%; background:#4ea1ff;"></div>
                </div>
            </div>
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.8; margin-bottom:18px;">
            <strong style="color:#e8eef5;">Normalized Position:</strong> ${normalizedPct}%<br>
            <strong style="color:#e8eef5;">Relative to Mean:</strong> ${relativeText}<br>
            <strong style="color:#e8eef5;">Interpretation:</strong> ${interpretation}
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6;">
            A lower value means the provider is closer to the canonical center and therefore
            more typical relative to the broader population. A higher value means the provider
            sits further away from the center and is more behaviorally distinct.
        </div>
    `);
}

// =====================================================
// SKU2.3 : CANONICAL REGION
// =====================================================
function renderSku2_3_CanonicalRegion() {
    if (!providerMetrics || !providerMetrics.canonical_metrics) {
        setNarrativeHTML(`
            <strong>Region</strong><br><br>
            Provider metric data is not available yet for this NPI.
        `);
        return;
    }

    const regionData = providerMetrics.canonical_metrics.canonical_region;
    const densityData = providerMetrics.canonical_metrics.density_rarity;

    if (!regionData) {
        setNarrativeHTML(`
            <strong>Region</strong><br><br>
            Canonical region data is missing from the provider metric object.
        `);
        return;
    }

    const regionId = regionData.region_id;
    const a1Band = regionData.a1_band;
    const a2Band = regionData.a2_band;
    const a3Band = regionData.a3_band;
    const pointCount = regionData.region_point_count ?? "n/a";

    const densityClass = densityData?.rarity_class ?? "n/a";
    const lowDensityFlag = densityData?.is_low_density_region ? "Yes" : "No";

    setNarrativeHTML(`
        <div style="font-size:22px; font-weight:700; color:#e8eef5; margin-bottom:14px;">
            Canonical Region
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6; margin-bottom:16px;">
            The canonical cloud is partitioned into 27 behavioral regions using a
            3 × 3 × 3 grid across A1, A2, and A3.
        </div>

        <div style="display:grid; gap:12px; margin-bottom:18px;">
            <div style="padding:12px; background:#0f1821; border:1px solid #2d3a48; border-radius:12px;">
                <div style="font-size:13px; color:#9fb0c3; margin-bottom:6px;">Region ID</div>
                <div style="font-size:22px; font-weight:700; color:#e8eef5;">${regionId}</div>
            </div>
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.8; margin-bottom:18px;">
            <strong style="color:#e8eef5;">A1 Band:</strong> ${a1Band}<br>
            <strong style="color:#e8eef5;">A2 Band:</strong> ${a2Band}<br>
            <strong style="color:#e8eef5;">A3 Band:</strong> ${a3Band}<br>
            <strong style="color:#e8eef5;">Providers in Region:</strong> ${pointCount}<br>
            <strong style="color:#e8eef5;">Density Class:</strong> ${densityClass}<br>
            <strong style="color:#e8eef5;">Low Density Region:</strong> ${lowDensityFlag}
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6;">
            This provider belongs to a specific behavioral zone within the tri-state
            manifold. Region membership helps classify the provider into a comparable
            group before deeper rarity, peer, and frontier analysis.
        </div>
    `);
}

// =====================================================
// SKU2.4 : DENSITY / RARITY
// =====================================================
function renderSku2_4_DensityRarity() {
    if (!providerMetrics || !providerMetrics.canonical_metrics) {
        setNarrativeHTML(`
            <strong>Density</strong><br><br>
            Provider metric data is not available yet for this NPI.
        `);
        return;
    }

    const densityData = providerMetrics.canonical_metrics.density_rarity;
    if (!densityData) {
        setNarrativeHTML(`
            <strong>Density</strong><br><br>
            Density / rarity data is missing from the provider metric object.
        `);
        return;
    }

    const regionId = densityData.region_id;
    const pointCount = densityData.region_point_count;
    const densityRatio = (densityData.relative_density_ratio * 100).toFixed(2);
    const rarityClass = densityData.rarity_class;
    const lowDensityFlag = densityData.is_low_density_region ? "Yes" : "No";

    setNarrativeHTML(`
        <div style="font-size:22px; font-weight:700; color:#e8eef5; margin-bottom:14px;">
            Density / Rarity
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6; margin-bottom:16px;">
            This metric shows how densely populated the provider's canonical region is
            relative to the most populated behavioral region in the tri-state manifold.
        </div>

        <div style="display:grid; gap:12px; margin-bottom:18px;">
            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:#cfe0f2;">Relative Density</span>
                    <span style="color:#e8eef5;">${densityRatio}%</span>
                </div>
                <div style="height:10px; background:#0f1821; border:1px solid #2d3a48; border-radius:999px; overflow:hidden;">
                    <div style="width:${densityRatio}%; height:100%; background:#4ea1ff;"></div>
                </div>
            </div>
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.8; margin-bottom:18px;">
            <strong style="color:#e8eef5;">Region ID:</strong> ${regionId}<br>
            <strong style="color:#e8eef5;">Providers in Region:</strong> ${pointCount}<br>
            <strong style="color:#e8eef5;">Density Class:</strong> ${rarityClass}<br>
            <strong style="color:#e8eef5;">Low Density Region:</strong> ${lowDensityFlag}
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6;">
            Dense regions indicate common provider behavior patterns inside the canonical.
            Sparse regions indicate rarer positioning and may signal a more unusual
            behavioral profile relative to the wider provider population.
        </div>
    `);
}
// =====================================================
// SKU2.5 : NEAREST ANCHOR
// =====================================================
function renderSku2_5_NearestAnchor() {

    if (!providerMetrics || !providerMetrics.canonical_metrics) {
        setNarrativeHTML(`
            <strong>Nearest Anchor</strong><br><br>
            Provider metric data is not available yet for this NPI.
        `);
        return;
    }

    const anchorData = providerMetrics.canonical_metrics.nearest_anchor;

    if (!anchorData) {
        setNarrativeHTML(`
            <strong>Nearest Anchor</strong><br><br>
            Anchor data is missing from the provider metric object.
        `);
        return;
    }

    const label = anchorData.label;
    const distance = anchorData.distance.toFixed(3);
    const point = anchorData.point;

    setNarrativeHTML(`

        <div style="font-size:22px; font-weight:700; color:#e8eef5; margin-bottom:14px;">
            Nearest Anchor
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6; margin-bottom:16px;">
            Anchors represent the behavioral extremes of the canonical system.
            The nearest anchor indicates which extreme provider behavior the
            current provider most closely resembles.
        </div>

        <div style="
            padding:14px;
            background:#0f1821;
            border:1px solid #2d3a48;
            border-radius:12px;
            margin-bottom:18px;">

            <div style="font-size:13px; color:#9fb0c3; margin-bottom:6px;">
                Closest Canonical Anchor
            </div>

            <div style="font-size:22px; font-weight:700; color:#e8eef5;">
                ${label}
            </div>

        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.8; margin-bottom:18px;">

            <strong style="color:#e8eef5;">Distance to Anchor:</strong> ${distance}<br>

            <strong style="color:#e8eef5;">Anchor Coordinates:</strong><br>

            A1: ${point[0].toFixed(3)}<br>
            A2: ${point[1].toFixed(3)}<br>
            A3: ${point[2].toFixed(3)}

        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6;">
            The anchor point represents one of the outer extremes of the canonical
            provider manifold. A smaller distance indicates that the provider's
            behavior is closer to that extreme reference point.
        </div>

    `);
}
// =====================================================
// SKU2.6 : EXTREMITY RELATION
// =====================================================
function renderSku2_6_ExtremityRelation() {
    if (!providerMetrics || !providerMetrics.canonical_metrics) {
        setNarrativeHTML(`
            <strong>Extremity</strong><br><br>
            Provider metric data is not available yet for this NPI.
        `);
        return;
    }

    const ext = providerMetrics.canonical_metrics.extremity_relation;
    if (!ext) {
        setNarrativeHTML(`
            <strong>Extremity</strong><br><br>
            Extremity relation data is missing from the provider metric object.
        `);
        return;
    }

    const axes = [
        {
            axis: "A1",
            nearer: ext.A1.nearer_extreme,
            dist: ext.A1.nearer_extreme_distance
        },
        {
            axis: "A2",
            nearer: ext.A2.nearer_extreme,
            dist: ext.A2.nearer_extreme_distance
        },
        {
            axis: "A3",
            nearer: ext.A3.nearer_extreme,
            dist: ext.A3.nearer_extreme_distance
        }
    ].sort((a, b) => a.dist - b.dist);

    const closest = axes[0];

    setNarrativeHTML(`
        <div style="font-size:22px; font-weight:700; color:#e8eef5; margin-bottom:14px;">
            Extremity Relation
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6; margin-bottom:16px;">
            This metric shows which axis extreme the provider is closest to across
            A1, A2, and A3.
        </div>

        <div style="display:grid; gap:12px; margin-bottom:18px;">
            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:#cfe0f2;">A1 → ${ext.A1.nearer_extreme}</span>
                    <span style="color:#e8eef5;">${ext.A1.nearer_extreme_distance.toFixed(3)}</span>
                </div>
                <div style="height:10px; background:#0f1821; border:1px solid #2d3a48; border-radius:999px; overflow:hidden;">
                    <div style="width:${Math.max(5, 100 - Math.min(100, ext.A1.nearer_extreme_distance * 10))}%; height:100%; background:#4ea1ff;"></div>
                </div>
            </div>

            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:#cfe0f2;">A2 → ${ext.A2.nearer_extreme}</span>
                    <span style="color:#e8eef5;">${ext.A2.nearer_extreme_distance.toFixed(3)}</span>
                </div>
                <div style="height:10px; background:#0f1821; border:1px solid #2d3a48; border-radius:999px; overflow:hidden;">
                    <div style="width:${Math.max(5, 100 - Math.min(100, ext.A2.nearer_extreme_distance * 10))}%; height:100%; background:#4ea1ff;"></div>
                </div>
            </div>

            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:#cfe0f2;">A3 → ${ext.A3.nearer_extreme}</span>
                    <span style="color:#e8eef5;">${ext.A3.nearer_extreme_distance.toFixed(3)}</span>
                </div>
                <div style="height:10px; background:#0f1821; border:1px solid #2d3a48; border-radius:999px; overflow:hidden;">
                    <div style="width:${Math.max(5, 100 - Math.min(100, ext.A3.nearer_extreme_distance * 10))}%; height:100%; background:#4ea1ff;"></div>
                </div>
            </div>
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.8; margin-bottom:18px;">
            <strong style="color:#e8eef5;">Closest Extreme Overall:</strong> ${closest.nearer}<br>
            <strong style="color:#e8eef5;">Closest Distance:</strong> ${closest.dist.toFixed(3)}
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6;">
            The provider is behaviorally closest to the
            <strong style="color:#e8eef5;">${closest.nearer}</strong> extreme.
            Smaller distances indicate stronger proximity to an outer canonical boundary
            on that axis.
        </div>
    `);
}
// =====================================================
// SKU2.7 : FRONTIER RELATION
// =====================================================
function renderSku2_7_FrontierRelation() {
    if (!providerMetrics || !providerMetrics.canonical_metrics) {
        setNarrativeHTML(`
            <strong>Frontier</strong><br><br>
            Provider metric data is not available yet for this NPI.
        `);
        return;
    }

    const frontier = providerMetrics.canonical_metrics.frontier_relation;
    if (!frontier) {
        setNarrativeHTML(`
            <strong>Frontier</strong><br><br>
            Frontier relation data is missing from the provider metric object.
        `);
        return;
    }

    const proxyPct = (frontier.proxy_score_0_1 * 100).toFixed(2);
    const frontierClass = frontier.frontier_class;
    const method = frontier.method;
    const ref = frontier.distance_stats_reference || {};

    setNarrativeHTML(`
        <div style="font-size:22px; font-weight:700; color:#e8eef5; margin-bottom:14px;">
            Frontier Relation
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6; margin-bottom:16px;">
            This metric estimates how far outward the provider sits relative to the
            broader canonical manifold.
        </div>

        <div style="display:grid; gap:12px; margin-bottom:18px;">
            <div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="color:#cfe0f2;">Frontier Proximity</span>
                    <span style="color:#e8eef5;">${proxyPct}%</span>
                </div>
                <div style="height:10px; background:#0f1821; border:1px solid #2d3a48; border-radius:999px; overflow:hidden;">
                    <div style="width:${proxyPct}%; height:100%; background:#4ea1ff;"></div>
                </div>
            </div>
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.8; margin-bottom:18px;">
            <strong style="color:#e8eef5;">Frontier Class:</strong> ${frontierClass}<br>
            <strong style="color:#e8eef5;">Method:</strong> ${method}<br>
            <strong style="color:#e8eef5;">Reference Min:</strong> ${ref.min !== undefined ? ref.min.toFixed(3) : "n/a"}<br>
            <strong style="color:#e8eef5;">Reference Mean:</strong> ${ref.mean !== undefined ? ref.mean.toFixed(3) : "n/a"}<br>
            <strong style="color:#e8eef5;">Reference Max:</strong> ${ref.max !== undefined ? ref.max.toFixed(3) : "n/a"}
        </div>

        <div style="font-size:14px; color:#9fb0c3; line-height:1.6;">
            Providers deeper in the interior tend to reflect more common or central
            system behavior. Providers nearer the frontier sit closer to the outer
            behavioral edge of the canonical and may reflect more distinctive patterns.
        </div>

        <div style="margin-top:18px; font-size:13px; line-height:1.6; color:#9fb0c3;">
            <strong>Note</strong><br><br>
            This current version uses a first-pass proxy based on centroid-to-hull
            banding. It can later be upgraded to an exact point-to-hull distance model.
        </div>
    `);
}

// =====================================================
// CTA WIRING
// =====================================================
function wireMetricButtons() {
    const btnAxis = document.getElementById("cta_axis_position");
    if (btnAxis) {
        btnAxis.addEventListener("click", renderSku2_1_AxisPosition);
    }

    const btnCentroid = document.getElementById("cta_centroid_distance");
    if (btnCentroid) {
        btnCentroid.addEventListener("click", renderSku2_2_CentroidDistance);
    }
    const btnRegion = document.getElementById("cta_canonical_region");
    if (btnRegion) {
        btnRegion.addEventListener("click", renderSku2_3_CanonicalRegion);
    }
    const btnDensity = document.getElementById("cta_density_rarity");
    if (btnDensity) {
        btnDensity.addEventListener("click", renderSku2_4_DensityRarity);
    }
    const btnAnchor = document.getElementById("cta_nearest_anchor");
    if (btnAnchor) {
    btnAnchor.addEventListener("click", renderSku2_5_NearestAnchor);
    }
    const btnExtremity = document.getElementById("cta_extremity_relation");
    if (btnExtremity) {
    btnExtremity.addEventListener("click", renderSku2_6_ExtremityRelation);
    }
    const btnFrontier = document.getElementById("cta_frontier_relation");
    if (btnFrontier) {
    btnFrontier.addEventListener("click", renderSku2_7_FrontierRelation);
}
}

async function initSKU2() {
    const params = new URLSearchParams(window.location.search);
    const npi = params.get("npi");

    const iframe = document.getElementById("canonicalViewer");
    const title = document.getElementById("sku2Title");
    const subtitle = document.getElementById("sku2Subtitle");
    const btnPresetA1A2 = document.getElementById("btnPresetA1A2");
    const defaultNpi = "1003268400";

    if (!iframe) return;

    wireMetricButtons();

    if (btnPresetA1A2) {
        btnPresetA1A2.addEventListener("click", () => {
            sendCameraPresetToViewer(iframe, "A1_A2");
        });
    }

    ensureViewerLoadedOnce(iframe, defaultNpi);

    if (!npi) {
        subtitle.textContent = "No provider NPI was supplied. Showing default tri-state canonical view.";
        renderDefaultNarrativeForNoNpi();

        iframe.onload = () => {
            sendProviderToViewer(iframe, defaultNpi);
        };

        await loadProviderMetrics(defaultNpi);
        return;
    }

    let supported = new Set();

    try {
        const res = await fetch("providers/provider_index.json", { cache: "no-store" });
        const data = await res.json();
        supported = new Set(data.supported_npis || []);
    } catch (err) {
        title.textContent = `Provider Canonical Viewer — NPI ${npi}`;
        subtitle.textContent = "Provider index unavailable.";
        setNarrativeHTML(`
            The provider lookup index could not be loaded.
            Showing the default tri-state canonical view.
        `);

        iframe.onload = () => {
            sendProviderToViewer(iframe, defaultNpi);
        };

        await loadProviderMetrics(defaultNpi);
        return;
    }

    title.textContent = `Provider Canonical Viewer — NPI ${npi}`;

    if (supported.has(npi)) {
        subtitle.textContent = "Tri-state behavioral manifold with hull, anchors, and provider-specific position.";
        renderDefaultNarrativeForMappedProvider();

        await loadProviderMetrics(npi);

        if (iframe.contentWindow && iframe.src && !iframe.srcdoc) {
            sendProviderToViewer(iframe, npi);
        } else {
            iframe.onload = () => {
                sendProviderToViewer(iframe, npi);
            };
        }

        return;
    }

    subtitle.textContent = "Provider not currently present in the active NY NJ CT canonical.";
    renderDefaultNarrativeForUnsupportedProvider();

    iframe.srcdoc = `
  <div style="
    height:100%;
    min-height:520px;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#0a1118;
    color:#9fb0c3;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
    text-align:center;
    padding:32px;">
    <div>
      <div style="font-size:48px; margin-bottom:12px;">⌄</div>
      <div style="font-size:20px; color:#e8eef5; margin-bottom:10px;">
        Provider not yet mapped in this canonical
      </div>
      <div style="font-size:14px; line-height:1.6; max-width:520px;">
        This NPI is not currently part of the active NY NJ CT HCPCS utilization canonical.<br>
        Additional regional canonicals are being prepared.
      </div>
    </div>
  </div>
`;
}

window.addEventListener("DOMContentLoaded", initSKU2);