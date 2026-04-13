window.SKU3Viewer = (() => {
    let currentBundle = null;
    let currentRegion = null;
    let currentGeometryMode = "pca3d";
    let currentNpi = null;
    let activeLayerTraceSet = null;

    const MAX_RENDER_POINTS = 40000;
    const HIGHLIGHT_SIZE = 11;
    const BASE_SIZE = 0.8;

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

    function traceEnabled(traceId) {
        if (activeLayerTraceSet instanceof Set) {
            return activeLayerTraceSet.has(traceId);
        }

        for (const [skuId, def] of Object.entries(window.SKU_REGISTRY || {})) {
            if (!skuId.startsWith("SKU3")) continue;
            if (!window.checkAccess(skuId)) continue;

            const traces = def?.traces || [];
            if (traces.includes(traceId)) return true;
        }
        return false;
    }

    async function loadRegionMetrics(region) {
        const path =
            region === "NYNJCT"
                ? `https://pub-6dde7e3865604b0aa28903cdbc0f2627.r2.dev/canonical/regions/NYNJCT/v1/metrics/region_metrics.json`
                : `/canonical/regions/${region}/v1/metrics/region_metrics.json`;
        try {
            const res = await fetch(path, { cache: "no-store" });
            if (!res.ok) throw new Error(`Failed to load region metrics: ${path}`);
            return await res.json();
        } catch (e) {
            console.error("Failed to load region metrics:", e);
            return null;
        }
    }

    function renderRegionMetrics(m) {
        if (!m) return;

        const source = m.display_defaults?.business_metrics_source || "real_space_raw_mean";
        const profile = m.region_centroid_profile?.[source];
        if (!profile) return;
        window.__centroidProfile = profile;
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        set("rhsProviders", m.provider_count ?? "-");
        set("rhsRevenueAvg", `$${Math.round(profile.revenue_avg).toLocaleString()}`);
        set("rhsIntensity", `$${profile.intensity_avg}`);
        set("rhsUtilization", `${profile.utilization_avg}`);
        set("rhsClaimsAvg", `${Math.round(profile.claims_avg).toLocaleString()}`);

        const axes = m.axis_definitions || {};
        set("rhsAxisX", axes.C1?.business_meaning || "X");
        set("rhsAxisY", axes.C2?.business_meaning || "Y");
        set("rhsAxisZ", axes.C3?.business_meaning || "Z");
        set("rhsCentroidRevenue", `$${Math.round(profile.revenue_avg).toLocaleString()}`);
        set("rhsCentroidIntensity", `$${profile.intensity_avg}`);
        set("rhsCentroidUtilization", `${profile.utilization_avg}`);
        set("rhsDeltaIntensity", "-");
        set("rhsDeltaUtilization", "-");
        set("rhsDeltaRevenue", "-");
    }

    function convertGeometryRowsToPoints(geometry, geometryMode = "pca3d") {
        if (!geometry || !geometry.rows || !Array.isArray(geometry.rows)) return [];

        const scale = geometry.scale || 1000;

        return geometry.rows.map((row) => {
            const point = {
                provider_npi: row[0],
                kmeans_cluster: row[4] ?? null
            };

            if (geometryMode === "umap3d") {
                point.umap_3d = {
                    x: row[1] / scale,
                    y: row[2] / scale,
                    z: row[3] / scale
                };
            } else {
                point.pca_3d = {
                    x: row[1] / scale,
                    y: row[2] / scale,
                    z: row[3] / scale
                };
            }

            return point;
        });
    }

    function buildClusterLabelMap(overlay) {
        const map = new Map();
        if (!overlay?.clusters || !Array.isArray(overlay.clusters)) return map;

        for (const row of overlay.clusters) {
            const clusterId = row?.[0];
            const label = row?.[1];
            map.set(clusterId, label || "Unlabeled");
        }
        return map;
    }


    function enrichPoints(points, overlay) {
        const clusterLabelMap = buildClusterLabelMap(overlay);

        return points.map((p) => {
            const cluster = p.kmeans_cluster ?? null;
            return {
                ...p,
                kmeans_cluster: cluster,
                archetype_label: clusterLabelMap.get(cluster) || p.archetype_label || "Not yet mapped"
            };
        });
    }

    function pickCoords(point, geometryMode) {
        if (geometryMode === "pca3d") {
            return point.pca_3d || { x: 0, y: 0, z: 0 };
        }
        return point.umap_3d || point.pca_3d || { x: 0, y: 0, z: 0 };
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
                `Archetype: ${p.archetype_label || "Not yet mapped"}`
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
    function buildAxisTraces(bundle) {
        const triad = bundle?.metadata?.geometry_summary?.axis_triad;
        if (!triad) return [];

        const makeAxis = (axisKey, color) => {
            const axis = triad[axisKey];
            if (!axis?.start || !axis?.end) return null;

            return {
                type: "scatter3d",
                mode: "lines",
                x: [axis.start[0], axis.end[0]],
                y: [axis.start[1], axis.end[1]],
                z: [axis.start[2], axis.end[2]],
                line: {
                    width: 3,                 // thicker = visible
                    color: color              // consistent color
                },
                hoverinfo: "skip",
                showlegend: false
            };
        };

        return [
            makeAxis("A1", "#8aa1b8"),  // X
            makeAxis("A2", "#8aa1b8"),  // Y
            makeAxis("A3", "#8aa1b8")   // Z
        ].filter(Boolean);
    }

    function buildCentroidTrace(bundle) {
        const centroid = bundle?.metadata?.geometry_summary?.centroid_latent;
        if (!centroid || centroid.length < 3) return null;

        return {
            type: "scatter3d",
            mode: "markers",
            x: [centroid[0]],
            y: [centroid[1]],
            z: [centroid[2]],
            text: ["Regional centroid"],
            hoverinfo: "text",
            name: "Centroid",
            showlegend: false,
            marker: {
                size: 8,
                color: "#ffd166",
                opacity: 1,
                line: { width: 2, color: "#fff3c4" }
            }
        };
    }

    function buildZoneCenterTrace(providerData, lattice) {
        const regionId = providerData?.canonical_metrics?.canonical_region?.region_id;
        if (!regionId || !lattice?.nodes) return null;

        const node = lattice.nodes.find(n => n.region_id === regionId);
        if (!node || !Array.isArray(node.center) || node.center.length < 3) return null;

        return {
            type: "scatter3d",
            mode: "markers",
            x: [node.center[0]],
            y: [node.center[1]],
            z: [node.center[2]],
            text: [
                `Zone Centroid<br>Region: ${node.region_id}<br>Bands: ${node.a1_band} / ${node.a2_band} / ${node.a3_band}<br>Points: ${node.point_count}`
            ],
            hoverinfo: "text",
            name: "Zone Centroid",
            showlegend: false,
            marker: {
                size: 9,
                color: "#7c3aed",
                opacity: 1,
                line: { width: 2, color: "#f3e8ff" }
            }
        };
    }

    function buildProviderZoneLinkTrace(providerData, lattice, geometryMode = "pca3d") {
        const first = providerData?.positions?.[0];
        const regionId = providerData?.canonical_metrics?.canonical_region?.region_id;

        if (!first || !regionId || !lattice?.nodes) return null;

        const node = lattice.nodes.find(n => n.region_id === regionId);
        if (!node || !Array.isArray(node.center) || node.center.length < 3) return null;

        const p = geometryMode === "pca3d"
            ? (first.pca_3d || null)
            : (first.umap_3d || first.pca_3d || null);

        if (!p) return null;

        return {
            type: "scatter3d",
            mode: "lines",
            x: [p.x, node.center[0]],
            y: [p.y, node.center[1]],
            z: [p.z, node.center[2]],
            hoverinfo: "skip",
            showlegend: false,
            line: {
                width: 4,
                color: "#c084fc",
                dash: "dot"
            },
            name: "Provider to Zone"
        };
    }


    function computePercentDelta(providerValue, benchmarkValue) {
        if (
            providerValue == null ||
            benchmarkValue == null ||
            Number(benchmarkValue) === 0
        ) return "-";

        const delta = ((Number(providerValue) - Number(benchmarkValue)) / Number(benchmarkValue)) * 100;
        const sign = delta > 0 ? "+" : "";
        return `${sign}${delta.toFixed(1)}%`;
    }


    function renderCanonicalRegionSemantics(canonicalMetrics) {
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        if (!canonicalMetrics) {
            set("rhsCanonicalRegion", "-");
            set("rhsDensityClass", "-");
            set("rhsFrontierClass", "-");
            set("rhsNearestAnchor", "-");
            set("rhsCentroidDistance", "-");
            set("rhsRegionPointCount", "-");
            set("rhsRegionBands", "-");
            return;
        }

        const region = canonicalMetrics.canonical_region || {};
        const density = canonicalMetrics.density_rarity || {};
        const frontier = canonicalMetrics.frontier_relation || {};
        const anchor = canonicalMetrics.nearest_anchor || {};
        const centroid = canonicalMetrics.centroid_distance || {};

        set("rhsCanonicalRegion", region.region_id || "-");
        set("rhsDensityClass", density.rarity_class || "-");
        set("rhsFrontierClass", frontier.frontier_class || "-");
        set("rhsNearestAnchor", anchor.label || "-");
        set(
            "rhsCentroidDistance",
            centroid.relative_to_mean != null ? `${Number(centroid.relative_to_mean).toFixed(2)}x mean` : "-"
        );
        set("rhsRegionPointCount", region.region_point_count ?? "-");
        set(
            "rhsRegionBands",
            region.a1_band != null && region.a2_band != null && region.a3_band != null
                ? `${region.a1_band} / ${region.a2_band} / ${region.a3_band}`
                : "-"
        );
    }


    function updateProviderMeta(providerData) {
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        if (!providerData || !providerData.positions || providerData.positions.length === 0) {
            set("rhsProvider", "-");
            set("rhsRegion", currentRegion || "-");
            set("rhsArchetype", "-");
            set("rhsCluster", "-");
            set("rhsMonths", "-");
            set("rhsDeltaIntensity", "-");
            set("rhsDeltaUtilization", "-");
            set("rhsDeltaRevenue", "-");

            // renderCanonicalRegionSemantics(null);

            const el = document.getElementById("rhsCanonicalInterpretation");
            if (el) el.textContent = "-";

            return;
        }

        const first = providerData.positions[0];
        const centroid = window.__centroidProfile || {};
        set("rhsDeltaIntensity", computePercentDelta(first.intensity, centroid.intensity_avg));
        set("rhsDeltaUtilization", computePercentDelta(first.utilization, centroid.utilization_avg));
        set("rhsDeltaRevenue", computePercentDelta(first.revenue, centroid.revenue_avg));
        set("rhsProvider", providerData.provider_npi || "-");
        set("rhsRegion", providerData.region || currentRegion || "-");
        set("rhsArchetype", first.archetype_label || "Not yet mapped");
        set("rhsCluster", first.kmeans_cluster ?? "-");
        set("rhsMonths", providerData.point_count ?? providerData.positions.length ?? "-");
        renderCanonicalRegionSemantics(providerData?.canonical_metrics || null);
        // const canonicalInterpretationEl = document.getElementById("rhsCanonicalInterpretation");
        // if (canonicalInterpretationEl && window.SKU3CanonicalInterpretation) {
        //    const result = window.SKU3CanonicalInterpretation.interpret(
        //        providerData?.canonical_metrics || null
        //    );
        //    canonicalInterpretationEl.textContent = result?.narrative || "-";
        //}
    }

    function render(bundle, geometryMode, npi = "") {
        currentBundle = bundle;
        currentRegion = bundle?.region || null;
        currentGeometryMode = geometryMode || "pca3d";
        currentNpi = npi || null;

        clearContainer();

        if (!window.Plotly) {
            setMessage("Plotly not loaded.");
            return;
        }



        const viewerTitleRegion = document.getElementById("viewerTitleRegion");
        const regionSelect = document.getElementById("regionSelect");
        if (viewerTitleRegion && regionSelect) {
            const selectedText = regionSelect.options[regionSelect.selectedIndex]?.text || String(currentRegion || "").toUpperCase();
            viewerTitleRegion.textContent = selectedText;
        }

        const geometry =
            currentGeometryMode === "umap3d"
                ? bundle?.umapGeometry
                : bundle?.geometry;

        const canonicalPoints =
            (geometry?.points && Array.isArray(geometry.points))
                ? geometry.points
                : convertGeometryRowsToPoints(geometry, currentGeometryMode);

        if (!canonicalPoints || !Array.isArray(canonicalPoints) || canonicalPoints.length === 0) {
            setMessage("No canonical geometry points available.");
            return;
        }

        const manifoldPoints = enrichPoints(canonicalPoints, bundle?.overlay);
        const bgPoints = buildDisplayPoints(manifoldPoints);


        const providerPoints = bundle?.providerData?.positions
            ? enrichPoints(bundle.providerData.positions, bundle?.overlay)
            : [];

        // console.log("render providerPoints:", providerPoints.length, "providerData:", bundle?.providerData, "npi:", npi);

        if (bundle?.providerData?.positions) {
            bundle.providerData.positions = providerPoints;
        }


        if (window.checkAccess("SKU3.8")) {
            updateProviderMeta(bundle?.providerData);
        }



        const traces = [];

        if (traceEnabled("manifold")) {
            traces.push({
                ...buildTrace(bgPoints, currentGeometryMode, BASE_SIZE, 0.14),
                name: "Canonical manifold"
            });
        }

        console.log("trace flags", {
            manifold: traceEnabled("manifold"),
            provider: traceEnabled("provider"),
            regionalCentroid: traceEnabled("regional-centroid"),
            providerRegionLink: traceEnabled("provider-region-link"),
            zoneCentroid: traceEnabled("zone-centroid"),
            providerZoneLink: traceEnabled("provider-zone-link"),
            currentZoneBox: traceEnabled("current-zone-box"),
            adjacentZones: traceEnabled("adjacent-zones"),
            adjacentLinks: traceEnabled("adjacent-links")
        });

        if (traceEnabled("axes")) {
            const axisTraces = buildAxisTraces(bundle);
            traces.push(...axisTraces);
        }

        if (traceEnabled("regional-centroid")) {
            const centroidTrace = buildCentroidTrace(bundle);
            if (centroidTrace) traces.push(centroidTrace);
        }

        if (traceEnabled("zone-centroid")) {
            const zoneCenterTrace = buildZoneCenterTrace(
                bundle?.providerData,
                bundle?.lattice
            );
            if (zoneCenterTrace) traces.push(zoneCenterTrace);
        }

        if (traceEnabled("provider-zone-link")) {
            const providerZoneLinkTrace = buildProviderZoneLinkTrace(
                bundle?.providerData,
                bundle?.lattice,
                currentGeometryMode
            );
            if (providerZoneLinkTrace) traces.push(providerZoneLinkTrace);
        }

        if (traceEnabled("lattice")) {
            const latticeNodes = buildLatticeNodesTrace(bundle?.lattice);
            if (latticeNodes) traces.push(latticeNodes);

            const latticeLinks = buildLatticeLinksTrace(bundle?.lattice);
            if (latticeLinks) traces.push(latticeLinks);
        }

        if (traceEnabled("adjacent-links")) {
            const adjacentZoneLinks = buildAdjacentZoneLinksTrace(
                bundle?.providerData,
                bundle?.lattice
            );
            if (adjacentZoneLinks) traces.push(adjacentZoneLinks);
        }

        if (traceEnabled("adjacent-zones")) {
            const adjacentZoneHighlights = buildAdjacentZoneHighlightsTrace(
                bundle?.providerData,
                bundle?.lattice
            );
            if (adjacentZoneHighlights) traces.push(adjacentZoneHighlights);
        }

        if (traceEnabled("current-zone-box")) {
            const currentZoneBox = buildCurrentZoneBoxTrace(
                bundle?.providerData,
                bundle?.lattice
            );
            if (currentZoneBox) traces.push(currentZoneBox);
        }

        /*   if (traceEnabled("current-zone-highlight")) {
              const currentZoneHighlight = buildCurrentZoneHighlightTrace(
                  bundle?.providerData,
                  bundle?.lattice
              );
              if (currentZoneHighlight) traces.push(currentZoneHighlight);
          } */



        if (providerPoints.length > 0) {
            if (traceEnabled("provider")) {
                traces.push({
                    type: "scatter3d",
                    mode: "markers",
                    x: providerPoints.map(p => pickCoords(p, currentGeometryMode).x),
                    y: providerPoints.map(p => pickCoords(p, currentGeometryMode).y),
                    z: providerPoints.map(p => pickCoords(p, currentGeometryMode).z),
                    text: providerPoints.map(
                        p => `NPI: ${p.provider_npi}<br>Archetype: ${p.archetype_label || "Not yet mapped"}`
                    ),
                    hoverinfo: "text",
                    name: `Provider ${npi}`,
                    marker: {
                        size: 12,
                        color: "#d00000",
                        opacity: 1,
                        line: { width: 3, color: "#ffffff" }
                    }
                });
            }

            const sorted = [...providerPoints].sort((a, b) =>
                String(a.claim_month || "").localeCompare(String(b.claim_month || ""))
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
                ltext.push(`${p.claim_month || "Current"}`);
            }

            if (providerPoints.length > 1 && window.checkAccess("SKU3.6")) {
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
        }


        const layout = {
            title: {
                text: "",
                font: { color: "#dce6f2", size: 18 }
            },

            paper_bgcolor: "#06101c",
            plot_bgcolor: "#06101c",
            margin: { l: 0, r: 0, t: 50, b: 0 },

            showlegend: false,

            scene: {
                bgcolor: "#06101c",
                xaxis: {
                    title: "X",
                    color: "#9fb0c3",
                    gridcolor: "#223043",
                    zerolinecolor: "#223043",
                    showticklabels: false,
                    ticks: "",
                    showspikes: false,
                    showline: true,
                    linewidth: 2,
                    linecolor: "#8aa1b8"
                },
                yaxis: {
                    title: "Y",
                    color: "#9fb0c3",
                    gridcolor: "#223043",
                    zerolinecolor: "#223043",
                    showticklabels: false,
                    ticks: "",
                    showspikes: false,
                    showline: true,
                    linewidth: 2,
                    linecolor: "#8aa1b8"
                },
                zaxis: {
                    title: "Z",
                    color: "#9fb0c3",
                    gridcolor: "#223043",
                    zerolinecolor: "#223043",
                    showticklabels: false,
                    ticks: "",
                    showspikes: false,
                    showline: true,
                    linewidth: 2,
                    linecolor: "#8aa1b8"
                },
                camera: { eye: { x: 1.6, y: 1.4, z: 1.2 } }
            }
        };

        Plotly.newPlot(getContainer(), traces, layout, {
            responsive: true,
            displaylogo: false,
            scrollZoom: true
        });
    }

    function buildLatticeNodesTrace(lattice) {
        if (!lattice?.nodes) return null;

        return {
            type: "scatter3d",
            mode: "markers",
            x: lattice.nodes.map(n => n.center[0]),
            y: lattice.nodes.map(n => n.center[1]),
            z: lattice.nodes.map(n => n.center[2]),
            text: lattice.nodes.map(n =>
                `Region ${n.region_id}<br>Points: ${n.point_count}`
            ),
            hoverinfo: "text",
            name: "Lattice Nodes",
            showlegend: false,
            marker: {
                size: 4,
                color: "#8b5cf6",
                opacity: 0.28
            }
        };
    }

    function buildLatticeLinksTrace(lattice) {
        if (!lattice?.links || !lattice?.nodes) return null;

        const nodeMap = {};
        lattice.nodes.forEach(n => {
            nodeMap[n.region_id] = n.center;
        });

        const xs = [];
        const ys = [];
        const zs = [];

        lattice.links.forEach(link => {
            const a = nodeMap[link.source];
            const b = nodeMap[link.target];
            if (!a || !b) return;

            xs.push(a[0], b[0], null);
            ys.push(a[1], b[1], null);
            zs.push(a[2], b[2], null);
        });

        return {
            type: "scatter3d",
            mode: "lines",
            x: xs,
            y: ys,
            z: zs,
            hoverinfo: "skip",
            showlegend: false,
            line: {
                width: 1,
                color: "rgba(120,130,150,0.18)",

            },
            name: "Lattice Links"
        };
    }

    function buildCurrentZoneHighlightTrace(providerData, lattice) {
        const regionId = providerData?.canonical_metrics?.canonical_region?.region_id;
        if (!regionId || !lattice?.nodes) return null;

        const node = lattice.nodes.find(n => n.region_id === regionId);
        if (!node || !Array.isArray(node.center) || node.center.length < 3) return null;

        return {
            type: "scatter3d",
            mode: "markers",
            x: [node.center[0]],
            y: [node.center[1]],
            z: [node.center[2]],
            text: [
                `Current Zone<br>Region: ${node.region_id}<br>Bands: ${node.a1_band} / ${node.a2_band} / ${node.a3_band}<br>Points: ${node.point_count}`
            ],
            hoverinfo: "text",
            name: "Current Zone",
            showlegend: false,
            marker: {
                size: 14,
                color: "#ff4d6d",
                opacity: 1,
                line: { width: 3, color: "#ffffff" }
            }
        };
    }

    function buildCurrentZoneBoxTrace(providerData, lattice) {
        const regionId = providerData?.canonical_metrics?.canonical_region?.region_id;
        if (!regionId || !lattice?.nodes) return null;

        const node = lattice.nodes.find(n => n.region_id === regionId);
        if (!node || !node.min_corner || !node.max_corner) return null;

        const [x0, y0, z0] = node.min_corner;
        const [x1, y1, z1] = node.max_corner;

        const corners = {
            a: [x0, y0, z0],
            b: [x1, y0, z0],
            c: [x1, y1, z0],
            d: [x0, y1, z0],
            e: [x0, y0, z1],
            f: [x1, y0, z1],
            g: [x1, y1, z1],
            h: [x0, y1, z1]
        };

        const edges = [
            ["a", "b"], ["b", "c"], ["c", "d"], ["d", "a"], // bottom
            ["e", "f"], ["f", "g"], ["g", "h"], ["h", "e"], // top
            ["a", "e"], ["b", "f"], ["c", "g"], ["d", "h"]  // verticals
        ];

        const xs = [];
        const ys = [];
        const zs = [];

        edges.forEach(([p1, p2]) => {
            xs.push(corners[p1][0], corners[p2][0], null);
            ys.push(corners[p1][1], corners[p2][1], null);
            zs.push(corners[p1][2], corners[p2][2], null);
        });

        return {
            type: "scatter3d",
            mode: "lines",
            x: xs,
            y: ys,
            z: zs,
            hoverinfo: "skip",
            showlegend: false,
            name: "Current Zone Box",
            line: {
                width: 1,
                color: "#ef4444"
            }
        };
    }


    function buildAdjacentZoneLinksTrace(providerData, lattice) {
        const regionId = providerData?.canonical_metrics?.canonical_region?.region_id;
        if (!regionId || !lattice?.nodes || !lattice?.links) return null;

        const nodeMap = {};
        lattice.nodes.forEach(n => {
            nodeMap[n.region_id] = n.center;
        });

        const xs = [];
        const ys = [];
        const zs = [];

        lattice.links.forEach(link => {
            if (link.source !== regionId && link.target !== regionId) return;

            const a = nodeMap[link.source];
            const b = nodeMap[link.target];
            if (!a || !b) return;

            xs.push(a[0], b[0], null);
            ys.push(a[1], b[1], null);
            zs.push(a[2], b[2], null);
        });

        return {
            type: "scatter3d",
            mode: "lines",
            x: xs,
            y: ys,
            z: zs,
            hoverinfo: "skip",
            showlegend: false,
            name: "Adjacent Zone Links",
            line: {
                width: 3,
                color: "#f59e0b"
            }
        };
    }

    function buildAdjacentZoneHighlightsTrace(providerData, lattice) {
        const regionId = providerData?.canonical_metrics?.canonical_region?.region_id;
        if (!regionId || !lattice?.nodes || !lattice?.links) return null;

        const adjacentIds = new Set();

        lattice.links.forEach(link => {
            if (link.source === regionId) adjacentIds.add(link.target);
            if (link.target === regionId) adjacentIds.add(link.source);
        });

        const adjacentNodes = lattice.nodes.filter(n => adjacentIds.has(n.region_id));
        if (!adjacentNodes.length) return null;

        return {
            type: "scatter3d",
            mode: "markers",
            x: adjacentNodes.map(n => n.center[0]),
            y: adjacentNodes.map(n => n.center[1]),
            z: adjacentNodes.map(n => n.center[2]),
            text: adjacentNodes.map(n =>
                `Adjacent Zone<br>Region: ${n.region_id}<br>Bands: ${n.a1_band} / ${n.a2_band} / ${n.a3_band}<br>Points: ${n.point_count}`
            ),
            hoverinfo: "text",
            name: "Adjacent Zones",
            showlegend: false,
            marker: {
                size: 6,
                color: "#f59e0b",
                opacity: 0.85,
                line: { width: 1, color: "#fff7ed" }
            }
        };
    }


    async function loadRegion(region, geometryMode, npi = "", suppressInitialRender = false) {
        setMessage(`Loading <b>${region}</b> canonical bundle...`);

        const [bundle, metrics, zoneMetrics] = await Promise.all([
            window.SKU3Loader.loadBundle(region, npi),
            loadRegionMetrics(region),
            window.SKU3Loader.loadZoneMetrics(region)
        ]);



        if (metrics && window.checkAccess("SKU3.7")) {
            renderRegionMetrics(metrics);
        }




        const provider = bundle?.providerData?.positions?.[0];
        const regionProfile = metrics?.region_centroid_profile?.real_space_raw_mean;
        const zoneId = bundle?.providerData?.canonical_metrics?.canonical_region?.region_id;
        const zoneProfile = zoneMetrics?.zones?.find(z => z.region_id === zoneId) || null;

        if (provider && regionProfile && window.SKU3Interpretation) {
            const result = window.SKU3Interpretation.interpret(
                {
                    revenue: provider.revenue,
                    intensity: provider.intensity,
                    utilization: provider.utilization
                },
                {
                    revenue: regionProfile.revenue_avg,
                    intensity: regionProfile.intensity_avg,
                    utilization: regionProfile.utilization_avg
                }
            );

            const el = document.getElementById("rhsInterpretation");
            if (el && result) {
                el.textContent = result.summary;
            }
        }

        if (provider && zoneProfile) {
            const set = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            // Zone averages
            set("rhsZoneAvgIntensity", `$${Math.round(zoneProfile.intensity_avg)}`);
            set("rhsZoneAvgUtilization", `${zoneProfile.utilization_avg.toFixed(2)}`);
            set("rhsZoneAvgRevenue", `$${Math.round(zoneProfile.revenue_avg).toLocaleString()}`);

            // Provider vs zone deltas
            set("rhsZoneDeltaIntensity", computePercentDelta(provider.intensity, zoneProfile.intensity_avg));
            set("rhsZoneDeltaUtilization", computePercentDelta(provider.utilization, zoneProfile.utilization_avg));
            set("rhsZoneDeltaRevenue", computePercentDelta(provider.revenue, zoneProfile.revenue_avg));

            // Placeholder interpretation
            const deltaIntensity = ((provider.intensity - zoneProfile.intensity_avg) / zoneProfile.intensity_avg) * 100;
            const deltaUtilization = ((provider.utilization - zoneProfile.utilization_avg) / zoneProfile.utilization_avg) * 100;
            const deltaRevenue = ((provider.revenue - zoneProfile.revenue_avg) / zoneProfile.revenue_avg) * 100;

            const insights = [];

            if (deltaIntensity < -15) insights.push("Lower monetization than similar providers");
            else if (deltaIntensity > 15) insights.push("Higher monetization than similar providers");

            if (deltaUtilization < -15) insights.push("Lower utilization than peer cohort");
            else if (deltaUtilization > 15) insights.push("Higher utilization than peer cohort");

            if (deltaRevenue < -15) insights.push("Lower revenue than immediate peers");
            else if (deltaRevenue > 15) insights.push("Higher revenue than immediate peers");

            if (insights.length === 0) {
                insights.push("Broadly aligned with peer cohort");
            }

            set("rhsZoneInterpretation", insights.join(" • "));
        }

        if (!suppressInitialRender) {
            render(bundle, geometryMode, npi);
        } else {
            currentBundle = bundle;
            currentRegion = bundle?.region || region || null;
            currentGeometryMode = geometryMode || "pca3d";
            currentNpi = npi || null;
        }
    }

    function applyLayerVisibility(layerState = {}) {
        const traceIds = Array.isArray(layerState.traces) ? layerState.traces : [];
        activeLayerTraceSet = new Set(traceIds);

        if (currentBundle) {
            render(currentBundle, currentGeometryMode, currentNpi);
        }
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
        updateNpi,
        applyLayerVisibility,

    };
})();

console.log("sku3-viewer.js loaded");