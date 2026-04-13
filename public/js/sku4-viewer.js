window.SKU4Viewer = (() => {
    let currentRegion = "NYNJCT";
    let currentProvider = null;
    let currentRegionCloud = null;
    let currentClusterCentroids = null;
    let currentRegionCentroids = null;
    let activeLayerTraceSet = null;
    let traceRegistry = {};
    let traceOrder = [];
    let traceIndexMap = {};

    function getContainer() {
        return document.getElementById("sku4Viewer");
    }

    function setMessage(html) {
        const el = getContainer();
        if (!el) return;
        el.innerHTML = `<div style="padding:20px;color:#9fb0c3;line-height:1.5;">${html}</div>`;
    }

    function traceEnabled(traceId) {
        if (!(activeLayerTraceSet instanceof Set)) return true;

        if (traceId === "axes") {
            return (
                activeLayerTraceSet.has("axis_u1") ||
                activeLayerTraceSet.has("axis_u2") ||
                activeLayerTraceSet.has("axis_u3") ||
                activeLayerTraceSet.has("axes")
            );
        }

        return activeLayerTraceSet.has(traceId);
    }

    function extractClusterPoints(raw) {
        if (!raw || typeof raw !== "object") return [];

        return Object.entries(raw).map(([clusterId, item]) => ({
            cluster_id: Number(clusterId),
            label: String(clusterId),
            x: Number(item?.umap_space?.U1 ?? 0),
            y: Number(item?.umap_space?.U2 ?? 0),
            z: Number(item?.umap_space?.U3 ?? 0),
            row_count: Number(item?.row_count ?? 0)
        }));
    }

    function extractRegionPoint(raw) {
        if (!raw || typeof raw !== "object") return [];

        const source =
            raw.umap_space ||
            raw.UMAP_SPACE ||
            raw.region_centroid_umap ||
            raw;

        const x = Number(source.U1 ?? source.u1 ?? source.x ?? 0);
        const y = Number(source.U2 ?? source.u2 ?? source.y ?? 0);
        const z = Number(source.U3 ?? source.u3 ?? source.z ?? 0);

        return [{
            label: "Region",
            x,
            y,
            z
        }];
    }

    function extractRegionCloudPoints(raw) {
        if (!Array.isArray(raw)) return [];

        return raw.map(row => ({
            x: Number(row.x ?? 0),
            y: Number(row.y ?? 0),
            z: Number(row.z ?? 0),
            npi: String(row.npi ?? ""),
            cluster_id: String(row.cluster_id ?? ""),
            cluster_label: String(row.cluster_label ?? "")
        }));
    }

    function buildAxisTraces(regionPoints) {
        if (!traceEnabled("axes")) return [];
        if (!regionPoints?.length) return [];

        const c = regionPoints[0];
        const span = 15;

        return [
            {
                type: "scatter3d",
                mode: "lines",
                x: [c.x - span, c.x + span],
                y: [c.y, c.y],
                z: [c.z, c.z],
                line: { width: 6, color: "#cbd5e1" },
                hoverinfo: "skip",
                showlegend: false,
                name: "U1 Axis"
            },
            {
                type: "scatter3d",
                mode: "lines",
                x: [c.x, c.x],
                y: [c.y - span, c.y + span],
                z: [c.z, c.z],
                line: { width: 6, color: "#cbd5e1" },
                hoverinfo: "skip",
                showlegend: false,
                name: "U2 Axis"
            },
            {
                type: "scatter3d",
                mode: "lines",
                x: [c.x, c.x],
                y: [c.y, c.y],
                z: [c.z - span, c.z + span],
                line: { width: 6, color: "#cbd5e1" },
                hoverinfo: "skip",
                showlegend: false,
                name: "U3 Axis"
            }
        ];
    }

    function buildRegionTrace(regionPoints) {
        if (!traceEnabled("region_centroid")) return null;
        if (!regionPoints?.length) return null;

        const p = regionPoints[0];
        return {
            type: "scatter3d",
            mode: "markers+text",
            x: [p.x],
            y: [p.y],
            z: [p.z],
            text: ["Region"],
            textposition: "top center",
            hoverinfo: "text",
            hovertext: ["Regional centroid"],
            showlegend: false,
            marker: {
                size: 10,
                color: "#ffd166",
                opacity: 1,
                line: { width: 2, color: "#fff3c4" }
            },
            name: "Region"
        };
    }


    function isFinalGeometryLayer() {
        return activeLayerTraceSet instanceof Set &&
            activeLayerTraceSet.has("provider_point") &&
            activeLayerTraceSet.has("zonal_centroid") &&
            activeLayerTraceSet.has("zone_provider_connector") &&
            activeLayerTraceSet.has("canonical_cloud");
    }


    function buildCloudTrace(points) {
        if (!traceEnabled("canonical_cloud")) return null;
        if (!points?.length) return null;

        return {
            type: "scatter3d",
            mode: "markers",
            x: points.map(d => d.x),
            y: points.map(d => d.y),
            z: points.map(d => d.z),
            text: points.map(d => `NPI: ${d.npi}<br>Cluster: ${d.cluster_label}`),
            hoverinfo: "text",
            showlegend: false,
            marker: {
                size: 1.5,
                color: "#60a5fa",
                opacity: 0.12
            },
            name: "Region Cloud"
        };
    }

    function getProviderPoint(provider) {
        const latest =
            provider?.latest_position ||
            provider?.geometry?.latest_position ||
            null;

        const p =
            latest?.provider_cpt_umap_position ||
            latest?.umap_position ||
            provider?.provider_cpt_umap_position ||
            provider?.geometry?.provider_cpt_umap_position ||
            null;

        if (!p) return null;

        return {
            x: Number(p.u1 ?? p.U1 ?? p.x ?? 0),
            y: Number(p.u2 ?? p.U2 ?? p.y ?? 0),
            z: Number(p.u3 ?? p.U3 ?? p.z ?? 0),
            label: provider?.provider_npi || ""
        };
    }



    function buildProviderTrace(provider) {
        if (!traceEnabled("provider_point")) return null;

        const providerPoint = getProviderPoint(provider);
        if (!providerPoint) return null;

        const finalLayer = isFinalGeometryLayer();

        return {
            type: "scatter3d",
            mode: "markers+text",
            x: [providerPoint.x],
            y: [providerPoint.y],
            z: [providerPoint.z],
            text: [providerPoint.label],
            textposition: "top center",
            hoverinfo: "text",
            hovertext: [`NPI: ${provider.provider_npi}`],
            showlegend: false,
            marker: {
                size: finalLayer ? 13 : 10,
                color: "#d00000",
                opacity: 1,
                line: { width: 2, color: "#ffffff" }
            },
            name: "Provider"
        };
    }

    function getCurrentZoneClusterId() {
        const latest =
            currentProvider?.latest_position ||
            currentProvider?.geometry?.latest_position ||
            null;

        if (latest?.assigned_cluster_id != null) {
            return Number(latest.assigned_cluster_id);
        }

        if (currentProvider?.dominant_cluster_id != null) {
            return Number(currentProvider.dominant_cluster_id);
        }

        if (currentProvider?.geometry?.dominant_cluster_id != null) {
            return Number(currentProvider.geometry.dominant_cluster_id);
        }

        return null;
    }
    function getCurrentZoneCentroid() {
        const clusterId = getCurrentZoneClusterId();
        if (clusterId == null || !Array.isArray(currentClusterCentroids)) return null;

        return currentClusterCentroids.find(
            p => Number(p.cluster_id) === clusterId
        ) || null;
    }

    function buildZoneCentroidTrace() {
        console.log("zone cluster id =", getCurrentZoneClusterId());
        console.log("currentClusterCentroids =", currentClusterCentroids);
        console.log("current zone centroid =", getCurrentZoneCentroid());

        if (!traceEnabled("zonal_centroid")) return null;

        const zone = getCurrentZoneCentroid();
        if (!zone) return null;
        const latest =
            currentProvider?.latest_position ||
            currentProvider?.geometry?.latest_position ||
            null;

        const zoneLabel =
            latest?.assigned_cluster_label ||
            currentProvider?.dominant_cluster_label ||
            currentProvider?.geometry?.dominant_cluster_label ||
            `Zone ${zone.cluster_id}`;

        return {
            type: "scatter3d",
            mode: "markers+text",
            x: [zone.x],
            y: [zone.y],
            z: [zone.z],
            text: [zoneLabel],
            textposition: "top center",
            hoverinfo: "text",
            hovertext: [`Cluster: ${zoneLabel}`],
            showlegend: false,
            marker: {
                size: 9,
                color: "#0b0ff5",
                opacity: 1,
                line: { width: 2, color: "#ffffff" }
            },
            name: "Zone Centroid"
        };
    }

    function buildProviderZoneLinkTrace() {
        if (!traceEnabled("zone_provider_connector")) return null;

        const providerPoint = getProviderPoint(currentProvider);
        const zone = getCurrentZoneCentroid();

        if (!providerPoint || !zone) return null;

        return {
            type: "scatter3d",
            mode: "lines",
            x: [providerPoint.x, zone.x],
            y: [providerPoint.y, zone.y],
            z: [providerPoint.z, zone.z],
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
    function getProviderTrajectoryPoints(provider) {
        const timeline =
            Array.isArray(provider?.timeline) ? provider.timeline :
                Array.isArray(provider?.geometry?.timeline) ? provider.geometry.timeline :
                    [];

        return timeline
            .map((row) => {
                const p =
                    row?.provider_cpt_umap_position ||
                    row?.umap_position ||
                    null;

                if (!p) return null;

                return {
                    period: row.claim_from_month || row.period || "",
                    x: Number(p.u1 ?? p.U1 ?? p.x ?? 0),
                    y: Number(p.u2 ?? p.U2 ?? p.y ?? 0),
                    z: Number(p.u3 ?? p.U3 ?? p.z ?? 0),
                    cluster_id: row.assigned_cluster_id,
                    cluster_label: row.assigned_cluster_label
                };
            })
            .filter(Boolean);
    }

    function buildProviderTrajectoryTrace(provider) {
        if (!traceEnabled("provider_trajectory")) return null;

        const pts = getProviderTrajectoryPoints(provider);
        if (!pts.length) return null;

        return {
            type: "scatter3d",
            mode: "lines+markers+text",
            x: pts.map(p => p.x),
            y: pts.map(p => p.y),
            z: pts.map(p => p.z),
            text: pts.map(p => p.period),
            textposition: "top center",
            hoverinfo: "text",
            hovertext: pts.map(p => `${p.period}<br>${p.cluster_label || "Cluster"}`),
            showlegend: false,
            line: {
                width: 5,
                color: "#22c55e"
            },
            marker: {
                size: pts.map((p, idx) => idx === pts.length - 1 ? 7 : 4),
                color: pts.map((p, idx) => idx === pts.length - 1 ? "#16a34a" : "#86efac"),
                opacity: 1
            },
            name: "Provider Trajectory"
        };
    }




    function rebuildTraceRegistry() {
        const registry = {};

        const axisTraces = buildAxisTraces(currentRegionCentroids);
        if (axisTraces?.length) {
            registry.axis_u1 = axisTraces[0];
            registry.axis_u2 = axisTraces[1];
            registry.axis_u3 = axisTraces[2];
        }

        const regionTrace = buildRegionTrace(currentRegionCentroids);
        if (regionTrace) registry.region_centroid = regionTrace;

        const cloudTrace = buildCloudTrace(currentRegionCloud);
        if (cloudTrace) registry.canonical_cloud = cloudTrace;

        const providerTrace = buildProviderTrace(currentProvider);
        if (providerTrace) registry.provider_point = providerTrace;

        const zoneCentroidTrace = buildZoneCentroidTrace();
        if (zoneCentroidTrace) registry.zonal_centroid = zoneCentroidTrace;

        const providerZoneLinkTrace = buildProviderZoneLinkTrace();
        if (providerZoneLinkTrace) registry.zone_provider_connector = providerZoneLinkTrace;

        const providerTrajectoryTrace = buildProviderTrajectoryTrace(currentProvider);
        if (providerTrajectoryTrace) registry.provider_trajectory = providerTrajectoryTrace;

        traceRegistry = registry;

        traceOrder = [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "canonical_cloud",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector",
            "provider_trajectory"
        ].filter(key => !!traceRegistry[key]);

        traceIndexMap = {};
        traceOrder.forEach((key, idx) => {
            traceIndexMap[key] = idx;
        });

        window.SKU4ViewerTraceRegistry = traceRegistry;
        window.SKU4ViewerTraceOrder = traceOrder;
        window.SKU4ViewerTraceIndexMap = traceIndexMap;
    }


    function renderPlot() {
        rebuildTraceRegistry();

        const traces = traceOrder.map(key => traceRegistry[key]).filter(Boolean);

        const layout = {
            margin: { l: 0, r: 0, t: 0, b: 0 },
            paper_bgcolor: "#06101c",
            plot_bgcolor: "#06101c",
            showlegend: false,
            scene: {
                bgcolor: "#06101c",
                xaxis: {
                    title: "U1",
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
                    title: "U2",
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
                    title: "U3",
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

        if (!window.Plotly) {
            setMessage("Plotly not loaded.");
            return;
        }

        window.Plotly.newPlot(getContainer(), traces, layout, {
            responsive: true,
            displaylogo: false,
            scrollZoom: true
        });
    }

    async function loadProvider(npi) {
        currentRegion = window.SKU4Loader?.getRegion?.() || currentRegion;

        console.log("loadProvider start", npi, "region =", currentRegion);

        const provider = await window.SKU4Loader.loadProvider(npi, currentRegion);
        console.log("provider loaded", provider);

        currentProvider = provider;

        console.log("currentProvider keys =", Object.keys(currentProvider || {}));
        console.log("currentProvider.geometry keys =", Object.keys(currentProvider?.geometry || {}));
        console.log("provider latest position top-level =", currentProvider?.latest_position);
        console.log("provider latest position geometry =", currentProvider?.geometry?.latest_position);
        console.log("provider point =", getProviderPoint(currentProvider));
        console.log("provider timeline length top-level =", currentProvider?.timeline?.length || 0);
        console.log("provider timeline length geometry =", currentProvider?.geometry?.timeline?.length || 0);
        console.log("provider trajectory sample =", getProviderTrajectoryPoints(currentProvider).slice(0, 2));

        return provider;
    }

    async function initBase() {
        currentRegion = window.SKU4Loader?.getRegion?.() || currentRegion;

        setMessage(`Loading <b>${currentRegion}</b> CPT canonical...`);

        const [regionCloud, clusterCentroids, regionCentroids] = await Promise.all([
            window.SKU4Loader.loadRegionCloud(currentRegion),
            window.SKU4Loader.loadClusterCentroidsUmap(currentRegion),
            window.SKU4Loader.loadRegionCentroids(currentRegion)
        ]);

        currentRegionCloud = extractRegionCloudPoints(regionCloud);
        currentClusterCentroids = extractClusterPoints(clusterCentroids);
        currentRegionCentroids = extractRegionPoint(regionCentroids);

        console.log("currentRegion =", currentRegion);
        console.log("currentRegionCentroids =", currentRegionCentroids);
        console.log("raw regionCentroids =", regionCentroids);
        console.log("region cloud count", currentRegionCloud.length);
        console.log("cluster centroid count", currentClusterCentroids.length);
    }

    function applyLayerVisibility(layerState = {}) {
        const traceIds =
            Array.isArray(layerState.visible_traces)
                ? layerState.visible_traces
                : Array.isArray(layerState.traces)
                    ? layerState.traces
                    : [];

        activeLayerTraceSet = new Set(traceIds);
        renderPlot();
    }
    function renderCustomLegend(legendKeys = []) {
        const keys = Array.isArray(legendKeys) ? legendKeys : [];
        window.SKU4ViewerActiveLegendKeys = keys;

        const allLegendItems = Array.from(
            document.querySelectorAll('[data-asset-id^="legend-"]')
        );

        if (!allLegendItems.length) {
            console.log("renderCustomLegend: no legend items found");
            return;
        }

        const legendHost =
            document.getElementById("skuLegendStack") ||
            document.getElementById("viewerLegendStack") ||
            allLegendItems[0].parentElement;

        if (!legendHost) {
            console.log("renderCustomLegend: no legend host found");
            return;
        }

        // hide all first
        allLegendItems.forEach((el) => {
            el.style.display = "none";
        });

        // then re-show only in requested order
        keys.forEach((key) => {
            const el = document.querySelector(`[data-asset-id="${key}"]`);
            if (!el) return;

            el.style.display = "";
            legendHost.appendChild(el);
        });

        console.log("renderCustomLegend", keys);
    }
    function init(containerId) {
        const el = document.getElementById(containerId);
        if (!el) throw new Error(`Viewer container not found: ${containerId}`);
        setMessage("SKU4 viewer initialized. Waiting for CPT canonical load.");
    }

    return {
        init,
        initBase,
        loadProvider,
        applyLayerVisibility,
        renderCustomLegend
    };
})();



console.log("sku4-viewer.js loaded");