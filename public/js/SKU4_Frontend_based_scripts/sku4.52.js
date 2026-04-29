// ------------------------------------------------------------
// SKU4.52 — Canonical Trajectory Renderer
// LHS: trajectory viewer
// RHS: trajectory metrics
// ------------------------------------------------------------

(function () {
    "use strict";

    console.log("[SKU4.52.js] file loaded");

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
    }

    function getPointX(p) {
        return Number(p.x ?? p.C1 ?? p.c1 ?? p.pc1 ?? 0);
    }

    function getPointY(p) {
        return Number(p.y ?? p.C2 ?? p.c2 ?? p.pc2 ?? 0);
    }

    function getPointZ(p) {
        return Number(p.z ?? p.C3 ?? p.c3 ?? p.pc3 ?? 0);
    }

    function getPointLabel(p, index) {
        return (
            p.month ||
            p.period ||
            p.service_month ||
            p.label ||
            `Point ${index + 1}`
        );
    }

    function renderEmpty(targetEl, message) {
        targetEl.innerHTML = `
            <div class="sku452-empty">
                ${esc(message || "No trajectory data available.")}
            </div>
        `;
    }

    function buildAxisTraces(payload) {
        const axes = Array.isArray(payload?.axes) ? payload.axes : [];

        return axes.map(axis => {
            const start = axis.start || { x: 0, y: 0, z: 0 };
            const end = axis.end || { x: 0, y: 0, z: 0 };

            return {
                type: "scatter3d",
                mode: "lines",
                name: axis.axis_label || axis.axis_id || "Canonical Axis",
                x: [Number(start.x || 0), Number(end.x || 0)],
                y: [Number(start.y || 0), Number(end.y || 0)],
                z: [Number(start.z || 0), Number(end.z || 0)],
                line: { width: 4 },
                hoverinfo: "name"
            };
        });
    }

    function buildCenterTrace(payload) {
        const center = payload?.center_point || null;
        if (!center) return null;

        return {
            type: "scatter3d",
            mode: "markers",
            name: "Canonical Center",
            x: [Number(center.x || 0)],
            y: [Number(center.y || 0)],
            z: [Number(center.z || 0)],
            marker: {
                size: 6
            },
            hovertemplate: "Canonical Center<extra></extra>"
        };
    }





    function buildTrajectoryTrace(points) {
        return {
            type: "scatter3d",
            mode: "lines+markers",
            name: "Provider Trajectory",
            x: points.map(getPointX),
            y: points.map(getPointY),
            z: points.map(getPointZ),
            text: points.map(getPointLabel),
            hovertemplate:
                "<b>%{text}</b><br>" +
                "C1: %{x:.3f}<br>" +
                "C2: %{y:.3f}<br>" +
                "C3: %{z:.3f}<extra></extra>",
            marker: {
                size: 5
            },
            line: {
                width: 5
            }
        };
    }

    function buildSegmentTraces(payload) {
        const segments = safeArray(payload?.trajectory_segments);

        if (!segments.length) {
            return [buildTrajectoryTrace(safeArray(payload?.trajectory_points))];
        }

        return segments.map((seg, index) => {
            const from = seg.from || {};
            const to = seg.to || {};

            return {
                type: "scatter3d",
                mode: "lines",
                name: seg.signal || `Segment ${index + 1}`,
                x: [getPointX(from), getPointX(to)],
                y: [getPointY(from), getPointY(to)],
                z: [getPointZ(from), getPointZ(to)],
                text: [
                    `${seg.from_label || ""} → ${seg.to_label || ""}`,
                    `${seg.from_label || ""} → ${seg.to_label || ""}`
                ],
                hovertemplate:
                    "<b>%{text}</b><br>" +
                    `Trend: ${esc(seg.signal || "unknown")}<extra></extra>`,
                line: {
                    width: 6,
                    color: seg.color || "#9aa6b2"
                },
                showlegend: false
            };
        });
    }



    function buildStartTrace(points) {
        if (!points.length) return null;

        const p = points[0];

        return {
            type: "scatter3d",
            mode: "markers",
            name: "Start",
            x: [getPointX(p)],
            y: [getPointY(p)],
            z: [getPointZ(p)],
            text: [getPointLabel(p, 0)],
            hovertemplate:
                "<b>Start: %{text}</b><br>" +
                "C1: %{x:.3f}<br>" +
                "C2: %{y:.3f}<br>" +
                "C3: %{z:.3f}<extra></extra>",
            marker: {
                size: 9,
                color: "#ff8c00",   // 🔶 orange
                symbol: "circle"
            }
        };
    }

    function buildEndTrace(points) {
        if (!points.length) return null;

        const p = points[points.length - 1];

        return {
            type: "scatter3d",
            mode: "markers",
            name: "Current",
            x: [getPointX(p)],
            y: [getPointY(p)],
            z: [getPointZ(p)],
            text: [getPointLabel(p, points.length - 1)],
            hovertemplate:
                "<b>Current: %{text}</b><br>" +
                "C1: %{x:.3f}<br>" +
                "C2: %{y:.3f}<br>" +
                "C3: %{z:.3f}<extra></extra>",
            marker: {
                size: 10,
                color: "#00c853",   // 🟢 green
                symbol: "diamond"
            }
        };
    }

    function getSymmetricRange(payload) {
        const points = safeArray(payload?.trajectory_points);
        const axes = safeArray(payload?.axes);

        const vals = [];

        points.forEach(p => {
            vals.push(Math.abs(getPointX(p)));
            vals.push(Math.abs(getPointY(p)));
            vals.push(Math.abs(getPointZ(p)));
        });

        axes.forEach(a => {
            vals.push(Math.abs(Number(a.start?.x || 0)));
            vals.push(Math.abs(Number(a.end?.x || 0)));
            vals.push(Math.abs(Number(a.start?.y || 0)));
            vals.push(Math.abs(Number(a.end?.y || 0)));
            vals.push(Math.abs(Number(a.start?.z || 0)));
            vals.push(Math.abs(Number(a.end?.z || 0)));
        });

        const maxAbs = Math.max(...vals.filter(Number.isFinite), 1);
        const padded = maxAbs * 1.1;

        return [-padded, padded];
    }

    function buildLayout(payload) {
        const axisSem = payload?.axis_semantics || {};
        const symmetricRange = getSymmetricRange(payload);

        return {
            margin: { l: 0, r: 0, t: 10, b: 0 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            scene: {
                aspectmode: "cube",
                xaxis: {
                    title: axisSem.C1?.label || "C1",
                    range: symmetricRange,
                    zeroline: true
                },
                yaxis: {
                    title: axisSem.C2?.label || "C2",
                    range: symmetricRange,
                    zeroline: true
                },
                zaxis: {
                    title: axisSem.C3?.label || "C3",
                    range: symmetricRange,
                    zeroline: true
                },
                camera: payload?.camera_defaults || undefined
            },
            showlegend: true,
            legend: {
                orientation: "h",
                x: 0,
                y: -0.05
            }
        };
    }

    function renderViewer({ targetEl, payload }) {
        const points = safeArray(payload?.trajectory_points);

        if (!targetEl) return;

        targetEl.innerHTML = `
            <div class="sku452-wrap">
                <div class="sku452-summary">
                    <div class="sku452-title">Canonical Trajectory</div>
                    <div class="sku452-subtitle">
                        ${esc(payload?.summary || "Provider movement across canonical CPT space.")}
                    </div>
                </div>
                <div id="sku452TrajectoryViewer" class="sku452-viewer"></div>
            </div>
        `;

        if (!points.length) {
            renderEmpty(
                targetEl.querySelector("#sku452TrajectoryViewer"),
                "No trajectory points found for this provider."
            );
            return;
        }

        if (!window.Plotly) {
            renderEmpty(
                targetEl.querySelector("#sku452TrajectoryViewer"),
                "Plotly not loaded."
            );
            return;
        }

        const traces = [
            ...buildAxisTraces(payload),
            buildCenterTrace(payload),
            ...buildSegmentTraces(payload),
            buildStartTrace(points),
            buildEndTrace(points)
        ].filter(Boolean);

        window.Plotly.newPlot(
            "sku452TrajectoryViewer",
            traces,
            buildLayout(payload),
            {
                responsive: true,
                displaylogo: false,
                scrollZoom: true
            }
        );
    }

    function renderRHS({ targetEl, payload }) {
        if (!targetEl) return;

        const rows = safeArray(
            payload?.rows ||
            payload?.metrics ||
            payload?.trajectory_metrics
        );

        const htmlRows = rows.length
            ? rows.map(row => `
            <div class="sku452-metric-row">
                <div class="sku452-metric-label">${esc(row.label || row.metric || "")}</div>
                <div class="sku452-metric-value">${esc(row.value || row.display_value || "")}</div>
                <div class="sku452-metric-meaning">${esc(row.interpretation || row.note || "")}</div>
            </div>
        `).join("")
            : `
            <div class="sku452-metric-row">
                <div class="sku452-metric-label">Trajectory status</div>
                <div class="sku452-metric-value">${esc(payload?.status || "Available")}</div>
                <div class="sku452-metric-meaning">${esc(payload?.summary || "Trajectory metrics will render here.")}</div>
            </div>
        `;

        targetEl.innerHTML = `
        <div class="sku452-rhs-card">
            <div class="sku452-rhs-kicker">Trajectory Metrics</div>
            <div class="sku452-rhs-title">Temporal Canonical Movement</div>
            <div class="sku452-rhs-summary">
                ${esc(payload?.summary || "Tracks provider movement across canonical CPT space over time.")}
            </div>

            <div class="sku452-metric-grid">
                <div class="sku452-grid-head">Metric</div>
                <div class="sku452-grid-head">Value</div>
                <div class="sku452-grid-head">Meaning</div>
                ${htmlRows}
            </div>
        </div>
    `;
    }

    window.SKU452Renderer = {
        render: renderViewer,
        renderRHS
    };
})();