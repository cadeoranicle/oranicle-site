(function () {
    const SKU_ID = "sku501";

    function formatValue(value, decimals = 2) {
        const num = Number(value);
        if (Number.isNaN(num)) return "—";
        return num.toFixed(decimals);
    }

    function buildStrengthLabel(percentile) {
        const pct = Number(percentile) || 0;

        if (pct >= 80) return "Strong Position";
        if (pct >= 60) return "Above Average";
        if (pct >= 40) return "Near Cohort Median";
        if (pct >= 20) return "Below Average";
        return "Structurally Weak";
    }

    function renderLHSBlock() {
        return `
        <div class="sku501-lhs-block">
            <div class="sku501-title">Canonical Positioning</div>
            <div class="sku501-subtitle">
                Review the hospital position across the canonical dimensions.
            </div>
            <div class="sku501-viewer-host" id="sku501ViewerHost"></div>
        </div>
    `;
    }

    function renderRHSBlock(payloadData = {}) {
        const summaryData = payloadData.summary || {};
        const axesData = Array.isArray(payloadData.axes) ? payloadData.axes : [];

        return `
        <div class="sku501-rhs-block">
            ${renderSummaryBlock(summaryData)}
            ${renderAxisCards(axesData)}
            ${renderNarrativeBlock(summaryData)}
        </div>
    `;
    }



    function renderSummaryBlock(summary = {}) {
        return `
            <div class="sku501-card sku501-summary-card" style="margin-top:12px; padding:12px; border:1px solid rgba(255,255,255,0.08); border-radius:10px;">
                <div class="sku501-title">Canonical Summary</div>

                <div class="sku501-meta-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
                    <div class="sku501-meta-row">
                        <span>Dominant Axis</span>
                        <b>${summary.dominant_axis || "—"}</b>
                    </div>

                    <div class="sku501-meta-row">
                        <span>Weakest Axis</span>
                        <b>${summary.weakest_axis || "—"}</b>
                    </div>

                    <div class="sku501-meta-row">
                        <span>Highest Percentile</span>
                        <b>${formatValue(summary.strongest_percentile)}%</b>
                    </div>
                </div>
            </div>
        `;
    }

    function renderAxisCards(axes = []) {
        return axes.map(axis => `
            <div class="sku501-card sku501-axis-card" style="margin-top:12px; padding:12px; border:1px solid rgba(255,255,255,0.08); border-radius:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div>
                        <div style="font-size:12px; opacity:0.7;">${axis.axis_code || axis.axis_id || "—"}</div>
                        <div style="font-weight:600; font-size:15px;">
                            ${axis.axis_label || "Unknown Axis"}
                        </div>
                    </div>

                    <div class="sku501-metric-pill" style="font-size:11px; padding:4px 8px; border-radius:999px; border:1px solid rgba(255,255,255,0.12);">
                        ${buildStrengthLabel(axis.percentile)}
                    </div>
                </div>

                <div class="sku501-meta-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div class="sku501-meta-row">
                        <span>Provider Score</span>
                        <b>${formatValue(axis.provider_score)}</b>
                    </div>

                    <div class="sku501-meta-row">
                        <span>Percentile</span>
                        <b>${formatValue(axis.percentile)}%</b>
                    </div>

                    <div class="sku501-meta-row">
                        <span>Regional Average</span>
                        <b>${formatValue(axis.region_average)}</b>
                    </div>
                </div>

                <div style="margin-top:10px; font-size:12px; opacity:0.82; line-height:1.5;">
                    ${axis.interpretation || "No interpretation available."}
                </div>
            </div>
        `).join("");
    }

    function renderNarrativeBlock(summary = {}) {
        return `
            <div class="sku501-card sku501-narrative-card" style="margin-top:12px; padding:12px; border:1px solid rgba(255,255,255,0.08); border-radius:10px;">
                <div class="sku501-title">Structural Narrative</div>

                <div style="font-size:13px; line-height:1.6; opacity:0.85; margin-top:8px;">
                    This hospital appears strongest on <b>${summary.dominant_axis || "—"}</b>
                    and weakest on <b>${summary.weakest_axis || "—"}</b>.
                    The canonical profile provides the first structural view of where the hospital
                    sits inside the broader regional reference frame.
                </div>
            </div>
        `;
    }

    function buildAxisU1Trace(payload = {}) {
        const center = payload.center_point || { x: 0, y: 0, z: 0 };
        const span = 12;
        const label = payload?.axes?.[0]?.axis_id || payload?.axes?.[0]?.axis || "A1";

        return {
            type: "scatter3d",
            mode: "lines+text",
            x: [center.x - span, center.x + span],
            y: [center.y, center.y],
            z: [center.z, center.z],
            text: ["", label],
            textposition: "top center",
            hoverinfo: "skip",
            showlegend: false,
            line: { width: 6, color: "#ffffff" },
            name: label
        };
    }

    function buildAxisU2Trace(payload = {}) {
        const center = payload.center_point || { x: 0, y: 0, z: 0 };
        const span = 12;
        const label = payload?.axes?.[1]?.axis_id || payload?.axes?.[1]?.axis || "A2";

        return {
            type: "scatter3d",
            mode: "lines+text",
            x: [center.x, center.x],
            y: [center.y - span, center.y + span],
            z: [center.z, center.z],
            text: ["", label],
            textposition: "top center",
            hoverinfo: "skip",
            showlegend: false,
            line: { width: 6, color: "#ffffff" },
            name: label
        };
    }

    function buildAxisU3Trace(payload = {}) {
        const center = payload.center_point || { x: 0, y: 0, z: 0 };
        const span = 12;
        const label = payload?.axes?.[2]?.axis_id || payload?.axes?.[2]?.axis || "A3";

        return {
            type: "scatter3d",
            mode: "lines+text",
            x: [center.x, center.x],
            y: [center.y, center.y],
            z: [center.z - span, center.z + span],
            text: ["", label],
            textposition: "top center",
            hoverinfo: "skip",
            showlegend: false,
            line: { width: 6, color: "#ffffff" },
            name: label
        };
    }

    function buildRegionCentroidTrace(payload = {}) {
        const center = payload.center_point || { x: 0, y: 0, z: 0 };

        return {
            type: "scatter3d",
            mode: "markers+text",
            x: [center.x],
            y: [center.y],
            z: [center.z],
            text: ["Region"],
            textposition: "top center",
            hoverinfo: "skip",
            showlegend: false,
            marker: {
                size: 8,
                color: "#ffffff",
                line: { width: 2, color: "#ffffff" }
            },
            name: "Region Centroid"
        };
    }

    function buildHospitalPointTrace(payload = {}) {
        const point = payload.hospital_point || {};

        return {
            type: "scatter3d",
            mode: "markers+text",
            x: [Number(point.x ?? 0)],
            y: [Number(point.y ?? 0)],
            z: [Number(point.z ?? 0)],
            text: ["Hospital"],
            textposition: "top center",
            hoverinfo: "skip",
            showlegend: false,
            marker: {
                size: 10,
                color: "#ff0000",
                line: { width: 2, color: "#ffffff" }
            },
            name: "Hospital"
        };
    }

    function buildPeerCohortPointTrace(payload = {}) {
        const peer = payload.peer_cohort_point || {};

        return {
            type: "scatter3d",
            mode: "markers+text",
            x: [Number(peer.x ?? 0)],
            y: [Number(peer.y ?? 0)],
            z: [Number(peer.z ?? 0)],
            text: ["Peer"],
            textposition: "top center",
            hoverinfo: "skip",
            showlegend: false,
            marker: {
                size: 9,
                color: "#ffd700",
                line: { width: 2, color: "#ffffff" }
            },
            name: "Peer Cohort Point"
        };
    }

    function buildProviderPeerConnectorTrace(payload = {}) {
        const connector = payload.provider_peer_connector || null;

        if (!connector) return null;

        const start = connector.start_point || {};
        const end = connector.end_point || {};

        return {
            type: "scatter3d",
            mode: "lines",
            x: [Number(start.x ?? 0), Number(end.x ?? 0)],
            y: [Number(start.y ?? 0), Number(end.y ?? 0)],
            z: [Number(start.z ?? 0), Number(end.z ?? 0)],
            hoverinfo: "skip",
            showlegend: false,
            line: {
                width: 5,
                color: "#00c853"
            },
            name: "Hospital to Peer"
        };
    }

    function buildCanonicalCloudTrace(payload = {}) {
        const points = Array.isArray(payload.canonical_cloud_rows)
            ? payload.canonical_cloud_rows
            : [];

        return {
            type: "scatter3d",
            mode: "markers",
            x: points.map(p => Number(p.x ?? 0)),
            y: points.map(p => Number(p.y ?? 0)),
            z: points.map(p => Number(p.z ?? 0)),
            hoverinfo: "skip",
            showlegend: false,
            marker: {
                size: 2,
                color: "rgba(173,216,230,0.22)"
            },
            name: "Canonical Cloud"
        };
    }

    function buildViewerTraces(payload, shouldShow) {
        const traces = [];

        if (shouldShow("axis_u1")) {
            traces.push(buildAxisU1Trace(payload));
        }

        if (shouldShow("axis_u2")) {
            traces.push(buildAxisU2Trace(payload));
        }

        if (shouldShow("axis_u3")) {
            traces.push(buildAxisU3Trace(payload));
        }

        if (shouldShow("canonical_cloud")) {
            traces.push(buildCanonicalCloudTrace(payload));
        }

        if (shouldShow("region_centroid")) {
            traces.push(buildRegionCentroidTrace(payload));
        }

        if (shouldShow("hospital_point")) {
            traces.push(buildHospitalPointTrace(payload));
        }

        if (shouldShow("peer_cohort_point")) {
            traces.push(buildPeerCohortPointTrace(payload));
        }

        if (shouldShow("provider_peer_connector")) {
            const connectorTrace = buildProviderPeerConnectorTrace(payload);
            if (connectorTrace) traces.push(connectorTrace);
        }

        return traces;
    }

    function renderViewer(data = {}) {
        console.log("sku501 renderViewer CALLED", data);

        const payloadData = data?.payload || data;
        const shouldShow = data?.shouldShow || (() => true);
        const targetEl = data?.targetEl;

        if (!targetEl) {
            console.warn("SKU5.01 missing targetEl");
            return;
        }

        targetEl.innerHTML = `
        <div class="sku501-shell">
            <div class="sku501-left">
                ${renderLHSBlock()}
            </div>
        </div>
    `;

        const viewerHost = targetEl.querySelector("#sku501ViewerHost");
        const traces = buildViewerTraces(payloadData, shouldShow);

        console.log("sku501 payloadData", payloadData);
        console.log("about to render SKU5.01 viewer traces", traces);

        if (viewerHost && window.Plotly) {
            window.Plotly.newPlot(viewerHost, traces, {
                margin: { l: 0, r: 0, t: 0, b: 0 },
                paper_bgcolor: "#06101c",
                plot_bgcolor: "#06101c",
                showlegend: false,
                scene: {
                    bgcolor: "#06101c",
                    xaxis: { showticklabels: false, ticks: "", color: "#9fb0c3" },
                    yaxis: { showticklabels: false, ticks: "", color: "#9fb0c3" },
                    zaxis: { showticklabels: false, ticks: "", color: "#9fb0c3" },
                    camera: payloadData.camera_defaults || { eye: { x: 1.6, y: 1.4, z: 1.2 } },
                    aspectmode: "cube"
                }
            }, {
                responsive: true,
                displaylogo: false,
                scrollZoom: true
            });
        } else {
            console.warn("sku501: viewerHost or Plotly missing");
        }
    }

    function renderNarrative(data = {}) {
        const payloadData = data?.payload || data;
        const targetEl = data?.targetEl;

        if (!targetEl) {
            console.warn("SKU5.01 missing narrative targetEl");
            return;
        }

        targetEl.innerHTML = `
        <div class="sku501-panel4-wrap">
            ${renderRHSBlock(payloadData)}
        </div>
    `;
    }

    function renderNotes(data = {}) {
        const targetEl = data?.targetEl;

        if (!targetEl) {
            console.warn("SKU5.01 missing notes targetEl");
            return;
        }

        targetEl.innerHTML = "";
    }

    window.SKU501Renderer = {
        skuId: SKU_ID,
        renderViewer,
        renderNarrative,
        renderNotes,
        renderLHSBlock,
        renderRHSBlock,
        renderSummaryBlock,
        renderAxisCards,
        renderNarrativeBlock
    };
})();