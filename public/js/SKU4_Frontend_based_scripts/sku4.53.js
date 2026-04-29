console.log("[SKU$.53.js] file loaded");

(function initSKU453Renderer(global) {
    "use strict";

    function render({ targetEl, payload, contract }) {
        console.log("[SKU4.53] render()", {
            bindingKey: contract?.data_binding_key,
            cloudCount: Array.isArray(payload?.canonical_cloud_rows) ? payload.canonical_cloud_rows.length : 0,
            peerCount: Array.isArray(payload?.peer_points) ? payload.peer_points.length : 0
        });

        if (!targetEl) return;

        targetEl.innerHTML = "";

        const comparablePayload = payload || {};
        const cloudRows = Array.isArray(comparablePayload.canonical_cloud_rows)
            ? comparablePayload.canonical_cloud_rows
            : [];
        const peerRows = Array.isArray(comparablePayload.peer_points)
            ? comparablePayload.peer_points
            : [];
        const providerPoint = comparablePayload.provider_point || null;
        const axes = Array.isArray(comparablePayload.axes)
            ? comparablePayload.axes
            : [];
        const center = comparablePayload.center_point || { x: 0, y: 0, z: 0 };
        const axisSemantics = comparablePayload.axis_semantics || {};

        if (!global.Plotly) {
            targetEl.innerHTML = `<div class="sku5-empty-state">Plotly is not loaded.</div>`;
            return;
        }

        const semanticBox = document.createElement("div");
        semanticBox.className = "sku5-cloud-axis-semantics";
        semanticBox.innerHTML = `
            <div><strong>X:</strong> ${escapeHtml(axisSemantics.A1 || axisSemantics.C1 || axes?.[0]?.axis_label || "Not available")}</div>
            <div><strong>Y:</strong> ${escapeHtml(axisSemantics.A2 || axisSemantics.C2 || axes?.[1]?.axis_label || "Not available")}</div>
            <div><strong>Z:</strong> ${escapeHtml(axisSemantics.A3 || axisSemantics.C3 || axes?.[2]?.axis_label || "Not available")}</div>
        `;
        targetEl.appendChild(semanticBox);

        const viewerHost = document.createElement("div");
        viewerHost.style.width = "100%";
        viewerHost.style.height = "620px";
        viewerHost.style.marginTop = "12px";
        targetEl.appendChild(viewerHost);

        const axisSpan = 12;

        const traces = [
            {
                type: "scatter3d",
                mode: "lines+text",
                x: [center.x - axisSpan, center.x + axisSpan],
                y: [center.y, center.y],
                z: [center.z, center.z],
                text: ["", axes?.[0]?.axis_id || "A1"],
                textposition: "top center",
                hoverinfo: "skip",
                showlegend: false,
                line: { width: 6, color: "#dce8f5" },
                name: axes?.[0]?.axis_label || "A1"
            },
            {
                type: "scatter3d",
                mode: "lines+text",
                x: [center.x, center.x],
                y: [center.y - axisSpan, center.y + axisSpan],
                z: [center.z, center.z],
                text: ["", axes?.[1]?.axis_id || "A2"],
                textposition: "top center",
                hoverinfo: "skip",
                showlegend: false,
                line: { width: 6, color: "#dce8f5" },
                name: axes?.[1]?.axis_label || "A2"
            },
            {
                type: "scatter3d",
                mode: "lines+text",
                x: [center.x, center.x],
                y: [center.y, center.y],
                z: [center.z - axisSpan, center.z + axisSpan],
                text: ["", axes?.[2]?.axis_id || "A3"],
                textposition: "top center",
                hoverinfo: "skip",
                showlegend: false,
                line: { width: 6, color: "#dce8f5" },
                name: axes?.[2]?.axis_label || "A3"
            },
            {
                type: "scatter3d",
                mode: "markers+text",
                x: [center.x],
                y: [center.y],
                z: [center.z],
                text: ["Center"],
                textposition: "top center",
                hoverinfo: "skip",
                showlegend: false,
                marker: {
                    size: 8,
                    color: "#ffffff",
                    line: { width: 2, color: "#ffffff" }
                },
                name: "Region Center"
            }
        ];

        if (cloudRows.length) {
            traces.push({
                type: "scatter3d",
                mode: "markers",
                x: cloudRows.map(r => Number(r.x ?? r.C1 ?? 0)),
                y: cloudRows.map(r => Number(r.y ?? r.C2 ?? 0)),
                z: cloudRows.map(r => Number(r.z ?? r.C3 ?? 0)),
                text: cloudRows.map(r => String(r.npi || "")),
                hovertemplate:
                    "<b>Hospital Cloud</b><br>" +
                    "NPI: %{text}<br>" +
                    "X: %{x:.2f}<br>" +
                    "Y: %{y:.2f}<br>" +
                    "Z: %{z:.2f}<extra></extra>",
                showlegend: false,
                marker: {
                    size: 3,
                    color: "rgba(120,140,170,0.18)"
                },
                name: "Hospital Cloud"
            });
        }

        if (providerPoint) {
            traces.push({
                type: "scatter3d",
                mode: "markers+text",
                x: [Number(providerPoint.x ?? 0)],
                y: [Number(providerPoint.y ?? 0)],
                z: [Number(providerPoint.z ?? 0)],
                text: ["Selected Hospital"],
                textposition: "top center",
                hovertemplate:
                    "<b>Selected Hospital</b><br>" +
                    "NPI: " + String(providerPoint.npi || "") + "<br>" +
                    "X: %{x:.2f}<br>" +
                    "Y: %{y:.2f}<br>" +
                    "Z: %{z:.2f}<extra></extra>",
                showlegend: false,
                marker: {
                    size: 12,
                    color: "#ff4d4f",
                    line: { width: 2, color: "#ffffff" }
                },
                name: "Selected Hospital"
            });
        }

        if (peerRows.length) {
            traces.push({
                type: "scatter3d",
                mode: "markers+text",
                x: peerRows.map(r => Number(r.x ?? 0)),
                y: peerRows.map(r => Number(r.y ?? 0)),
                z: peerRows.map(r => Number(r.z ?? 0)),
                text: peerRows.map(r => `#${r.rank ?? ""}`),
                textposition: "top center",
                customdata: peerRows.map(r => [
                    r.provider_name || "Comparable Provider",
                    String(r.npi || ""),
                    Number(r.similarity ?? 0),
                    Number(r.revenue ?? 0),
                    Number(r.intensity ?? 0),
                    Number(r.utilization ?? 0)
                ]),
                hovertemplate:
                    "<b>%{customdata[0]}</b><br>" +
                    "NPI: %{customdata[1]}<br>" +
                    "Similarity: %{customdata[2]:.3f}<br>" +
                    "Revenue: $%{customdata[3]:,.0f}<br>" +
                    "Intensity: %{customdata[4]:.2f}<br>" +
                    "Utilization: %{customdata[5]:.2f}<br>" +
                    "X: %{x:.2f}<br>" +
                    "Y: %{y:.2f}<br>" +
                    "Z: %{z:.2f}<extra></extra>",
                showlegend: false,
                marker: {
                    size: 8,
                    color: "#ffd54f",
                    line: { width: 1, color: "#ffffff" }
                },
                name: "Comparable Providers"
            });
        }



        global.Plotly.newPlot(
            viewerHost,
            traces,
            {
                margin: { l: 0, r: 0, t: 0, b: 0 },
                paper_bgcolor: "#06101c",
                plot_bgcolor: "#06101c",
                showlegend: false,
                scene: {
                    bgcolor: "#06101c",
                    xaxis: { showticklabels: false, ticks: "", color: "#9fb0c3" },
                    yaxis: { showticklabels: false, ticks: "", color: "#9fb0c3" },
                    zaxis: { showticklabels: false, ticks: "", color: "#9fb0c3" },
                    camera: comparablePayload.camera_defaults || { eye: { x: 1.6, y: 1.4, z: 1.2 } },
                    aspectmode: "cube"
                }
            },
            {
                responsive: true,
                displaylogo: false,
                scrollZoom: true
            }
        );

        const legendItems = contract?.props?.legend_items || [];

        if (legendItems.length) {
            const legend = document.createElement("div");
            legend.className = "sku5-legend-row";

            legend.innerHTML = legendItems.map(item => `
                <div class="sku5-legend-item">
                    <span class="sku5-legend-swatch" style="background:${item.color}"></span>
                    <span class="sku5-legend-label">${item.label}</span>
                </div>
            `).join("");

            targetEl.appendChild(legend);
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }


    // RHS renderer SKU4.53 start //
    function renderRHSBlock({ targetEl, payload, contract }) {
        if (!targetEl) return;

        const peerRows = Array.isArray(payload?.peer_table_rows)
            ? payload.peer_table_rows
            : [];

        const percentiles = Array.isArray(payload?.peer_cohort_percentiles)
            ? payload.peer_cohort_percentiles
            : [];

        targetEl.innerHTML = `
        <div class="sku453-rhs-card">
            <div class="sku453-kicker">Comparable Providers</div>
            <div class="sku453-title">Top Comparable Providers</div>
            <div class="sku453-summary">
                ${escapeHtml(payload?.summary || "Nearest providers in canonical CPT space.")}
            </div>

            <div class="sku453-table-wrap">
                <table class="sku453-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Provider</th>
                            <th>NPI</th>
                            <th>Similarity</th>
                            <th>Revenue</th>
                            <th>Intensity</th>
                            <th>Utilization</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${peerRows.map(row => `
                            <tr>
                                <td>${escapeHtml(row.rank ?? "")}</td>
                                <td>${escapeHtml(row.provider_name ?? "")}</td>
                                <td>${escapeHtml(row.npi ?? "")}</td>
                                <td>${Number(row.similarity ?? 0).toFixed(3)}</td>
                                <td>$${Number(row.revenue ?? 0).toLocaleString()}</td>
                                <td>${Number(row.intensity ?? 0).toFixed(2)}</td>
                                <td>${Number(row.utilization ?? 0).toFixed(2)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

            ${percentiles.length ? `
<div class="sku453-cohort-section">
    <div class="sku453-section-title">Peer Cohort Position</div>
    <div class="sku453-section-subtitle">
        Percentile standing within comparable-provider cohort
    </div>

    <div class="sku453-percentile-grid">
        ${percentiles.map(item => {
            const pct = Number(item.percentile || 0);

            return `
                <div class="sku453-percentile-card">
                    <div class="sku453-percentile-header">
                        <div>${escapeHtml(item.metric)}</div>
                        <div class="sku453-badge">${escapeHtml(item.badge)}</div>
                    </div>

                    <div class="sku453-percentile-body">
                        <div>Provider: <b>${escapeHtml(item.provider_value)}</b></div>
                        <div>Median: ${escapeHtml(item.cohort_median)}</div>
                        <div>Percentile: ${pct}</div>
                    </div>
                </div>
            `;
        }).join("")}
    </div>
</div>
` : ""}
        </div>
    `;
    }
    // RHS renderer SKU4.53 end //




    // sku5.53 cohort percentile data helper files RHS start//

    function getPercentileBadgeClass(percentile) {
        if (percentile >= 80) return "sku553-badge-top";
        if (percentile >= 60) return "sku553-badge-above";
        if (percentile >= 40) return "sku553-badge-median";
        if (percentile >= 20) return "sku553-badge-below";
        return "sku553-badge-low";
    }


    // sku 5.53 cohort percentile data helper files RHS End//


    // sku5.53 cohort percentile renderer RHS start//

    function renderPeerCohortPercentiles(percentiles = []) {
        if (!Array.isArray(percentiles) || !percentiles.length) {
            return "";
        }

        return `
        <div class="sku553-cohort-section">
            <div class="sku553-section-header">
                <div class="sku553-section-title">Peer Cohort Position</div>
                <div class="sku553-section-subtitle">
                    Percentile standing within comparable-provider cohort
                </div>
            </div>

            <div class="sku553-percentile-stack">
                ${percentiles.map(item => {
            const percentile = Math.max(0, Math.min(100, Number(item.percentile || 0)));
            const badgeClass = getPercentileBadgeClass(percentile);

            return `
                        <div class="sku553-percentile-card">
                            <div class="sku553-percentile-toprow">
                                <div class="sku553-percentile-metric">${escapeHtml(item.metric || "")}</div>
                                <div class="sku553-percentile-badge ${badgeClass}">
                                    ${escapeHtml(item.badge || "")}
                                </div>
                            </div>

                            <div class="sku553-percentile-values">
                                <div>
                                    <span class="sku553-value-label">Provider:</span>
                                    <span class="sku553-value-text">${escapeHtml(item.provider_value || "—")}</span>
                                </div>
                                <div>
                                    <span class="sku553-value-label">Median:</span>
                                    <span class="sku553-value-text">${escapeHtml(item.cohort_median || "—")}</span>
                                </div>
                                <div>
                                    <span class="sku553-value-label">Percentile:</span>
                                    <span class="sku553-value-text">${percentile}</span>
                                </div>
                            </div>
                        </div>
                    `;
        }).join("")}
            </div>
        </div>
    `;
    }
    // sku5.53 cohort percentile renderer RHS end//


    global.SKU453Renderer = {
        render,
        renderRHSBlock
    };
})(window);