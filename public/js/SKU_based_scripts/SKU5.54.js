console.log("[SKU5.54.js] file loaded");

(function initSKU554Renderer(global) {
    "use strict";


    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function getDeltaClass(value) {
        const delta = Number(value || 0);

        if (delta >= 15) return "sku5-delta-strong-positive";
        if (delta >= 0) return "sku5-delta-positive";
        if (delta <= -15) return "sku5-delta-strong-negative";
        return "sku5-delta-negative";
    }

    function formatDelta(value) {
        const delta = Number(value || 0);
        const sign = delta > 0 ? "+" : "";
        return `${sign}${delta.toFixed(1)}%`;
    }

    function renderBeeBadge(metric) {
        if (!metric?.bee_flag) return "";

        return `
            <div class="sku5-bee-badge" title="Largest benchmark deviation opportunity">
                🐝 Highest Priority Opportunity
            </div>
        `;
    }

    function renderBenchmarkMetricCard(metric) {
        return `
            <div class="sku554-metric-card">
                <div class="sku554-metric-header">
                    <div>
                        <div class="sku554-metric-label">
                            ${escapeHtml(metric.label)}
                        </div>
                        <div class="sku554-metric-subtitle">
                            ${escapeHtml(metric.interpretation)}
                        </div>
                    </div>

                    ${renderBeeBadge(metric)}
                </div>

                <div class="sku554-metric-grid">
                    <div class="sku554-metric-cell">
                        <div class="sku554-metric-caption">Provider</div>
                        <div class="sku554-metric-value">
                            ${escapeHtml(metric.hospital_display)}
                        </div>
                    </div>

                    <div class="sku554-metric-cell">
                        <div class="sku554-metric-caption">Peer Median</div>
                        <div class="sku554-metric-value">
                            ${escapeHtml(metric.peer_display)}
                        </div>
                    </div>

                    <div class="sku554-metric-cell">
                        <div class="sku554-metric-caption">Region Median</div>
                        <div class="sku554-metric-value">
                            ${escapeHtml(metric.region_display)}
                        </div>
                    </div>
                </div>

                <div class="sku554-delta-row">
                    <div class="sku554-delta-block ${getDeltaClass(metric.peer_delta_pct)}">
                        vs Peer: ${formatDelta(metric.peer_delta_pct)}
                    </div>

                    <div class="sku554-delta-block ${getDeltaClass(metric.region_delta_pct)}">
                        vs Region: ${formatDelta(metric.region_delta_pct)}
                    </div>
                </div>
            </div>
        `;
    }

    function renderBenchmarkMetricCards(metrics = []) {
        if (!Array.isArray(metrics) || !metrics.length) {
            return `
                <div class="sku5-empty-state">
                    No benchmark metrics available.
                </div>
            `;
        }

        return `
            <div class="sku554-metric-card-stack">
                ${metrics.map(renderBenchmarkMetricCard).join("")}
            </div>
        `;
    }

    function render({ targetEl, payload, contract }) {
        if (!targetEl) return;

        const summary = payload?.summary || {};
        const table = payload?.table || {};
        const rows = Array.isArray(table?.rows) ? table.rows : [];
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];

        const benchmarkMetrics = rows;

        const beeMetric =
            benchmarkMetrics.find(metric => metric?.bee_flag) || null;
        targetEl.innerHTML = `
            <div class="sku554-shell">
                <div class="sku554-header">
                    <div class="sku554-title">
                        Cohort Median and Percentile Metrics
                    </div>
                    <div class="sku554-subtitle">
                        Benchmark comparison against peer hospitals and regional norms
                    </div>
                </div>

                ${beeMetric
                ? `
                        <div class="sku554-priority-banner">
                            <div class="sku554-priority-icon">🐝</div>
                            <div class="sku554-priority-content">
                                <div class="sku554-priority-title">
                                    Highest Priority Opportunity
                                </div>
                                <div class="sku554-priority-text">
                                    ${escapeHtml(beeMetric.label)} shows the largest deviation from both peer and regional benchmarks and may deserve immediate review.
                                </div>
                            </div>
                        </div>
                    `
                : ""
            }

                <div class="sku554-chart-shell">
                    <div id="sku554BenchmarkChart" class="sku554-chart-host"></div>
                </div>

                <div class="sku554-card-shell">
                    ${renderBenchmarkMetricCards(benchmarkMetrics)}
                </div>
            </div>
        `;

        renderBenchmarkChart(benchmarkMetrics);
    }

    function renderBenchmarkChart(metrics) {
        const chartHost = document.getElementById("sku554BenchmarkChart");

        if (!chartHost || !global.Plotly || !Array.isArray(metrics) || !metrics.length) {
            return;
        }

        const labels = metrics.map(metric => metric.label);
        const providerValues = metrics.map(metric => Number(metric.hospital_value || 0));
        const peerValues = metrics.map(metric => Number(metric.peer_value || 0));
        const regionValues = metrics.map(metric => Number(metric.region_value || 0));

        const traces = [
            {
                type: "bar",
                name: "Provider",
                x: labels,
                y: providerValues
            },
            {
                type: "bar",
                name: "Peer Median",
                x: labels,
                y: peerValues
            },
            {
                type: "bar",
                name: "Region Median",
                x: labels,
                y: regionValues
            }
        ];

        global.Plotly.newPlot(
            chartHost,
            traces,
            {
                barmode: "group",
                margin: {
                    l: 50,
                    r: 20,
                    t: 20,
                    b: 120
                },
                paper_bgcolor: "#08131f",
                plot_bgcolor: "#08131f",
                font: {
                    color: "#d8e1ea",
                    size: 12
                },
                xaxis: {
                    tickangle: -25,
                    automargin: true
                },
                yaxis: {
                    title: "Metric Value",
                    gridcolor: "rgba(255,255,255,0.08)"
                },
                legend: {
                    orientation: "h",
                    y: 1.12
                }
            },
            {
                responsive: true,
                displaylogo: false,
                scrollZoom: false
            }
        );
    }

    function renderRHSBlock({ targetEl, payload }) {
        if (!targetEl) return;

        const summary = payload?.summary || {};
        const table = payload?.table || {};
        const rows = Array.isArray(table?.rows) ? table.rows : [];
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];

        const beeMetric =
            rows.find(row => row?.bee_flag) ||
            rows[0] ||
            null;

        targetEl.innerHTML = `
        <div class="sku554-rhs-shell">

            <div class="sku554-rhs-hero">
                <div class="sku554-rhs-hero-left">
                    <div class="sku554-rhs-kicker">
                        Cohort Benchmark Summary
                    </div>

                    <div class="sku554-rhs-title">
                        Provider vs Peer and Region Benchmark Gaps
                    </div>

                    <div class="sku554-rhs-subtitle">
                        Highlights reimbursement, utilization, service breadth, and care-mix variance against cohort medians.
                    </div>
                </div>

                <div class="sku554-rhs-hero-right">
                    <div class="sku554-rhs-stat-card">
                        <div class="sku554-rhs-stat-label">
                            Metrics Reviewed
                        </div>
                        <div class="sku554-rhs-stat-value">
                            ${summary?.total_metrics_reviewed || rows.length || 0}
                        </div>
                    </div>
                </div>
            </div>

            ${beeMetric
                ? `
                        <div class="sku554-rhs-priority-card">
                            <div class="sku554-rhs-priority-top">
                                <div class="sku554-rhs-priority-icon">🐝</div>

                                <div>
                                    <div class="sku554-rhs-priority-title">
                                        Largest Benchmark Gap
                                    </div>

                                    <div class="sku554-rhs-priority-metric">
                                        ${escapeHtml(beeMetric.metric_name || beeMetric.metric_key || "")}
                                    </div>
                                </div>
                            </div>

                            <div class="sku554-rhs-priority-description">
                                This metric shows the largest combined deviation from both peer hospitals and regional norms.
                            </div>

                            <div class="sku554-rhs-priority-pill-row">
                                <div class="sku554-rhs-pill positive">
                                    vs Peer ${formatDelta(beeMetric.peer_delta_pct)}
                                </div>

                                <div class="sku554-rhs-pill positive">
                                    vs Region ${formatDelta(beeMetric.region_delta_pct)}
                                </div>
                            </div>
                        </div>
                    `
                : ""
            }

            <div class="sku554-rhs-card-grid">
                ${rows.map(row => `
                    <div class="sku554-rhs-metric-card ${row?.bee_flag ? "bee-highlight" : ""}">
                        <div class="sku554-rhs-metric-top">
                            <div class="sku554-rhs-metric-title">
                                ${escapeHtml(row.metric_name || row.metric_key || "")}
                            </div>

                            ${row?.bee_flag
                    ? `<div class="sku554-rhs-bee-chip">🐝 Priority</div>`
                    : ""
                }
                        </div>

                        <div class="sku554-rhs-metric-interpretation">
                            ${escapeHtml(row.interpretation || "")}
                        </div>

                        <div class="sku554-rhs-metric-values">
                            <div class="sku554-rhs-value-box">
                                <div class="sku554-rhs-value-label">Provider</div>
                                <div class="sku554-rhs-value-number">
                                    ${escapeHtml(row.provider_display || "")}
                                </div>
                            </div>

                            <div class="sku554-rhs-value-box">
                                <div class="sku554-rhs-value-label">Peer</div>
                                <div class="sku554-rhs-value-number muted">
                                    ${escapeHtml(row.peer_display || "")}
                                </div>
                            </div>

                            <div class="sku554-rhs-value-box">
                                <div class="sku554-rhs-value-label">Region</div>
                                <div class="sku554-rhs-value-number muted">
                                    ${escapeHtml(row.region_display || "")}
                                </div>
                            </div>
                        </div>

                        <div class="sku554-rhs-delta-row">
                            <div class="sku554-rhs-delta-chip ${Number(row.peer_delta_pct) >= 0 ? "positive" : "negative"}">
                                Peer ${formatDelta(row.peer_delta_pct)}
                            </div>

                            <div class="sku554-rhs-delta-chip ${Number(row.region_delta_pct) >= 0 ? "positive" : "negative"}">
                                Region ${formatDelta(row.region_delta_pct)}
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>

            ${notes.length
                ? `
                        <div class="sku554-rhs-notes-shell">
                            ${notes.map(note => `
                                <div class="sku554-rhs-note">
                                    ${escapeHtml(note)}
                                </div>
                            `).join("")}
                        </div>
                    `
                : ""
            }
        </div>
    `;
    }


    global.SKU554Renderer = {
        render,
        renderRHSBlock
    };
})(window);