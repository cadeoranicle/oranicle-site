console.log("[SKU5.62.js] file loaded");

(function initSKU562Renderer(global) {
    "use strict";

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function render({ targetEl, payload, contract }) {
        if (!targetEl) return;

        const summary = payload?.summary || {};
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];
        const chart = payload?.chart || {};

        targetEl.innerHTML = `
            <div class="sku562-shell">
                <div class="sku562-header">
                    <div class="sku562-title">ICU Utilization Efficiency</div>
                    <div class="sku562-subtitle">
                        ICU/CCU utilization and economics versus regional benchmark behavior
                    </div>
                </div>

                <section class="sku562-summary-grid">
                    <div class="sku562-kpi-card">
                        <div class="sku562-kpi-label">Metrics Reviewed</div>
                        <div class="sku562-kpi-value">${summary.total_metrics_reviewed || 0}</div>
                    </div>

                    <div class="sku562-kpi-card">
                        <div class="sku562-kpi-label">Strongest Signal</div>
                        <div class="sku562-kpi-value">${escapeHtml(summary.strongest_signal || "—")}</div>
                    </div>

                    <div class="sku562-kpi-card">
                        <div class="sku562-kpi-label">Efficiency Band</div>
                        <div class="sku562-kpi-value">${escapeHtml(summary.efficiency_band || "—")}</div>
                    </div>
                </section>

                <section class="sku562-chart-section">
                    <div class="sku562-chart-header">
                        <div class="sku562-chart-title">ICU Utilization Viewer</div>
                        <div class="sku562-chart-subtitle">
                            Provider versus regional ICU/CCU benchmark metrics
                        </div>
                    </div>

                    <div class="sku562-chart-shell">
                        <div id="sku562Chart" class="sku562-chart-host"></div>
                    </div>
                </section>

                <section class="sku562-narrative-block">
                    <h3 class="sku562-section-title">Why this matters</h3>
                    <p>${escapeHtml(notes[0] || "")}</p>
                    <p>${escapeHtml(notes[1] || "")}</p>
                </section>
            </div>
        `;

        renderChart(chart);
    }

    function renderChart(chart = {}) {
        console.log("[SKU5.62] renderChart entered", chart);

        const chartHost = document.getElementById("sku562Chart");
        if (!chartHost || !global.Plotly) return;

        const labels = Array.isArray(chart.labels) ? chart.labels : [];

        const values = Array.isArray(chart.values)
            ? chart.values.map(v => Number(v || 0))
            : [];

        const text = Array.isArray(chart.text) ? chart.text : [];

        const annotations = labels.map((label) => ({
            xref: "x",
            yref: "paper",
            x: label,
            y: 1.03,
            showarrow: false,
            xanchor: "center",
            yanchor: "middle",
            text: `
            <span style="
                display:inline-block;
                width:16px;
                height:16px;
                line-height:16px;
                text-align:center;
                background:#000;
                border-radius:50%;
                font-size:10px;
            ">🐝</span>
        `
        }));

        window.__SKU562_DEBUG__ = {
            chart,
            labels,
            values,
            text,
            chartHost,
            annotations
        };



        const barColors = values.map(v => v >= 0 ? "#34c759" : "#ff6b6b");

        console.log("[SKU5.62 barColors]", barColors, values);

        // Clear old plot (important)
        global.Plotly.purge(chartHost);

        // Re-render with fresh colors
        global.Plotly.newPlot(
            chartHost,
            [
                {
                    type: "bar",
                    name: "Delta vs Region",
                    x: labels,
                    y: values,
                    customdata: text,
                    marker: {
                        color: barColors,
                        line: {
                            color: barColors,
                            width: 1
                        }
                    },
                    hovertemplate:
                        "<b>%{customdata[0]}</b><br>" +
                        "Provider: %{customdata[1]}<br>" +
                        "Region: %{customdata[2]}<br>" +
                        "<b>Delta: %{customdata[3]}</b><extra></extra>"
                }
            ],
            {
                margin: { l: 60, r: 20, t: 60, b: 90 },
                paper_bgcolor: "#08131f",
                plot_bgcolor: "#08131f",
                font: {
                    color: "#d8e1ea",
                    size: 12
                },
                xaxis: {
                    type: "category",
                    tickangle: -20,
                    automargin: true
                },
                yaxis: {
                    title: "Delta vs Region",
                    range: [-1.2, 1.2],
                    tickformat: ".0%",
                    gridcolor: "rgba(255,255,255,0.08)",
                    zeroline: true,
                    zerolinecolor: "rgba(255,255,255,0.35)",
                    automargin: true
                },
                hoverlabel: {
                    bgcolor: "#1c3553",
                    bordercolor: "#7ea6ff",
                    font: {
                        color: "#ffffff",
                        size: 13
                    },
                    align: "left",
                    namelength: -1
                },
                annotations,
                showlegend: false
            },
            {
                responsive: true,
                displaylogo: false,
                scrollZoom: false
            }
        );
    }

    function renderRHSBlock({ targetEl, payload }) {
        console.log("[SKU5.62 RHS payload]", payload);

        if (!targetEl) return;

        const summary = payload?.summary || {};
        const table = payload?.table || {};
        const rows = Array.isArray(table?.rows) ? table.rows : [];
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];

        const topMetric = rows[0] || null;

        targetEl.innerHTML = `
            <div class="sku562-rhs-shell">

                <div class="sku562-rhs-hero">
                    <div class="sku562-rhs-hero-left">
                        <div class="sku562-rhs-kicker">
                            ICU Utilization Efficiency Summary
                        </div>

                        <div class="sku562-rhs-title">
                            ICU/CCU Operational Efficiency Profile
                        </div>

                        <div class="sku562-rhs-subtitle">
                            Compares utilization intensity, ICU/CCU share, and reimbursement efficiency against regional benchmark behavior.
                        </div>
                    </div>

                    <div class="sku562-rhs-hero-right">
                        <div class="sku562-rhs-stat-card">
                            <div class="sku562-rhs-stat-label">Strongest Signal</div>
                            <div class="sku562-rhs-stat-value">
                                ${escapeHtml(summary?.strongest_signal || "—")}
                            </div>
                        </div>

                        <div class="sku562-rhs-stat-card">
                            <div class="sku562-rhs-stat-label">Metrics Reviewed</div>
                            <div class="sku562-rhs-stat-value">
                                ${summary?.total_metrics_reviewed || rows.length || 0}
                            </div>
                        </div>
                    </div>
                </div>

                ${topMetric
                ? `
                        <div class="sku562-rhs-priority-card">
                            <div class="sku562-rhs-priority-top">
                                <div>
                                    <div class="sku562-rhs-priority-title">
                                        Primary Utilization Signal
                                    </div>

                                    <div class="sku562-rhs-priority-metric">
                                        ${escapeHtml(topMetric.metric || "")}
                                    </div>
                                </div>
                            </div>

                            <div class="sku562-rhs-priority-description">
                                ${escapeHtml(topMetric.interpretation || "")}
                            </div>

                            <div class="sku562-rhs-priority-pill-row">
                                <div class="sku562-rhs-pill muted">
                                    Provider ${escapeHtml(topMetric.provider_value_display || "")}
                                </div>

                                <div class="sku562-rhs-pill muted">
                                    Region ${escapeHtml(topMetric.region_value_display || "")}
                                </div>

                                <div class="sku562-rhs-pill positive">
                                    Delta ${escapeHtml(topMetric.delta_pct_display || "")}
                                </div>
                            </div>
                        </div>
                    `
                : ""
            }

                <div class="sku562-rhs-card-grid">
                    ${rows.map(row => `
                        <div class="sku562-rhs-metric-card">
                            <div class="sku562-rhs-metric-top">
                                <div class="sku562-rhs-metric-title">
                                    ${escapeHtml(row.metric || "")}
                                </div>
                            </div>

                            <div class="sku562-rhs-metric-interpretation">
                                ${escapeHtml(row.interpretation || "")}
                            </div>

                            <div class="sku562-rhs-metric-values">
                                <div class="sku562-rhs-value-box">
                                    <div class="sku562-rhs-value-label">Provider</div>
                                    <div class="sku562-rhs-value-number">
                                        ${escapeHtml(row.provider_value_display || "")}
                                    </div>
                                </div>

                                <div class="sku562-rhs-value-box">
                                    <div class="sku562-rhs-value-label">Region</div>
                                    <div class="sku562-rhs-value-number muted">
                                        ${escapeHtml(row.region_value_display || "")}
                                    </div>
                                </div>

                                <div class="sku562-rhs-value-box">
                                    <div class="sku562-rhs-value-label">Delta</div>
                                    <div class="sku562-rhs-value-number positive">
                                        ${escapeHtml(row.delta_pct_display || "")}
                                    </div>
                                </div>
                            </div>

                            <div class="sku562-rhs-delta-row">
                                <div class="sku562-rhs-delta-chip muted">
                                    Signal ${escapeHtml(row.efficiency_signal || "")}
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>

                ${notes.length
                ? `
                        <div class="sku562-rhs-notes-shell">
                            ${notes.map(note => `
                                <div class="sku562-rhs-note">
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

    global.SKU562Renderer = {
        render,
        renderRHSBlock
    };
})(window);