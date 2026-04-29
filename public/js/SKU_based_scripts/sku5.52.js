console.log("[SKU5.52.js] file loaded");

(function initSKU552Renderer(global) {
    "use strict";

    function render({ targetEl, payload, contract }) {
        console.log("[SKU5.52] render()", {
            bindingKey: contract?.data_binding_key,
            pointCount: Array.isArray(payload?.trajectory_points) ? payload.trajectory_points.length : 0
        });

        if (!targetEl) return;

        targetEl.innerHTML = "";

        const trajectoryPayload = payload || {};
        const axes = Array.isArray(trajectoryPayload.axes) ? trajectoryPayload.axes : [];
        const center = trajectoryPayload.center_point || { x: 0, y: 0, z: 0 };
        const points = Array.isArray(trajectoryPayload.trajectory_points)
            ? trajectoryPayload.trajectory_points
            : [];

        if (!global.Plotly) {
            targetEl.innerHTML = `<div class="sku5-empty-state">Plotly is not loaded.</div>`;
            return;
        }

        const viewerHost = document.createElement("div");
        viewerHost.style.width = "100%";
        viewerHost.style.height = "620px";
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
                line: { width: 6, color: "#ffffff" },
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
                line: { width: 6, color: "#ffffff" },
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
                line: { width: 6, color: "#ffffff" },
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

        if (points.length) {
            function getTrendColor(trend) {
                if (trend === "worsening") return "#ff3b30";
                if (trend === "improving") return "#00c853";
                if (trend === "flat") return "#ffcc00";
                return "#9aa6b2";
            }

            const first = points[0] || {};
            const last = points[points.length - 1] || {};

            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];

                const trend = curr.peer_gap_trend || null;
                const color = getTrendColor(trend);

                traces.push({
                    type: "scatter3d",
                    mode: "lines",
                    x: [Number(prev.C1 ?? prev.x ?? 0), Number(curr.C1 ?? curr.x ?? 0)],
                    y: [Number(prev.C2 ?? prev.y ?? 0), Number(curr.C2 ?? curr.y ?? 0)],
                    z: [Number(prev.C3 ?? prev.z ?? 0), Number(curr.C3 ?? curr.z ?? 0)],
                    hovertemplate:
                        "<b>" + (curr.month || curr.period || "") + "</b><br>" +
                        "Trend vs Peer: " + (trend || "n/a") + "<br>" +
                        "C1: %{x:.2f}<br>" +
                        "C2: %{y:.2f}<br>" +
                        "C3: %{z:.2f}<extra></extra>",
                    showlegend: false,
                    line: {
                        width: 6,
                        color
                    },
                    name: "Trajectory Segment"
                });
            }

            traces.push({
                type: "scatter3d",
                mode: "markers",
                x: points.map(p => Number(p.C1 ?? p.x ?? 0)),
                y: points.map(p => Number(p.C2 ?? p.y ?? 0)),
                z: points.map(p => Number(p.C3 ?? p.z ?? 0)),
                text: points.map(p => p.month || p.period || ""),
                hovertemplate:
                    "<b>%{text}</b><br>" +
                    "C1: %{x:.2f}<br>" +
                    "C2: %{y:.2f}<br>" +
                    "C3: %{z:.2f}<br>" +
                    "Trend vs Peer: %{customdata}<extra></extra>",
                customdata: points.map(p => p.peer_gap_trend || "n/a"),
                showlegend: false,
                marker: {
                    size: 5,
                    color: "#ffcc00"
                },
                name: "Trajectory Points"
            });

            traces.push({
                type: "scatter3d",
                mode: "markers+text",
                x: [Number(first.C1 ?? first.x ?? 0)],
                y: [Number(first.C2 ?? first.y ?? 0)],
                z: [Number(first.C3 ?? first.z ?? 0)],
                text: ["Start"],
                textfont: {
                    color: "#ffffff",
                    size: 14,
                    family: "Inter, Arial, sans-serif"
                },
                textposition: "top center",
                hovertemplate:
                    "<b>Start: " + (first.month || "n/a") + "</b><br>" +
                    "Peer Trend: " + (first.peer_gap_trend || "n/a") + "<br>" +
                    "Region Trend: " + (first.region_gap_trend || "n/a") + "<br>" +
                    "Status vs Peer: " + (first.status_vs_peer || "n/a") + "<br>" +
                    "Status vs Region: " + (first.status_vs_region || "n/a") + "<br>" +
                    "Claims: " + Number(first.total_claims || 0).toLocaleString() + "<br>" +
                    "Paid: $" + Number(first.total_paid || 0).toLocaleString() + "<br>" +
                    "C1: %{x:.2f}<br>" +
                    "C2: %{y:.2f}<br>" +
                    "C3: %{z:.2f}<extra></extra>",
                showlegend: false,
                marker: {
                    size: 12,
                    color: "#00bcd4",
                    line: { width: 2, color: "#ffffff" }
                },
                name: "Start"
            });

            traces.push({
                type: "scatter3d",
                mode: "markers+text",
                x: [Number(last.C1 ?? last.x ?? 0)],
                y: [Number(last.C2 ?? last.y ?? 0)],
                z: [Number(last.C3 ?? last.z ?? 0)],
                text: ["End"],
                textfont: {
                    color: "#ffffff",
                    size: 14,
                    family: "Inter, Arial, sans-serif"
                },
                textposition: "top center",
                hovertemplate:
                    "<b>End: " + (last.month || "n/a") + "</b><br>" +
                    "Peer Trend: " + (last.peer_gap_trend || "n/a") + "<br>" +
                    "Region Trend: " + (last.region_gap_trend || "n/a") + "<br>" +
                    "Status vs Peer: " + (last.status_vs_peer || "n/a") + "<br>" +
                    "Status vs Region: " + (last.status_vs_region || "n/a") + "<br>" +
                    "Claims: " + Number(last.total_claims || 0).toLocaleString() + "<br>" +
                    "Paid: $" + Number(last.total_paid || 0).toLocaleString() + "<br>" +
                    "C1: %{x:.2f}<br>" +
                    "C2: %{y:.2f}<br>" +
                    "C3: %{z:.2f}<extra></extra>",
                showlegend: false,
                marker: {
                    size: 12,
                    color: "#ff0000",
                    line: { width: 2, color: "#ffffff" }
                },
                name: "End"
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
                    camera: trajectoryPayload.camera_defaults || { eye: { x: 1.6, y: 1.4, z: 1.2 } },
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

    global.SKU552Renderer = {
        render
    };
})(window);