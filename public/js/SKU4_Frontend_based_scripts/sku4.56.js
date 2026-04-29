console.log("[sku4.56.js] file loaded");

(function initSKU456Renderer(global) {
    "use strict";

    function formatCurrency(value) {
        if (global.SKU4FinancialLoader?.formatCompactCurrency) {
            return global.SKU4FinancialLoader.formatCompactCurrency(value || 0);
        }
        return `$${Number(value || 0).toFixed(0)}`;
    }

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
            <div class="sku456-shell">
                <div class="sku456-header">
                    <div class="sku456-title">CPT Underperformance</div>
                    <div class="sku456-subtitle">
                        CPT areas where reimbursement falls below regional benchmark expectations
                    </div>
                </div>

                <section class="sku456-summary-grid">
                    <div class="sku456-kpi-card">
                        <div class="sku456-kpi-label">Underperforming CPTs</div>
                        <div class="sku456-kpi-value">${summary.underperforming_count || 0}</div>
                    </div>

                    <div class="sku456-kpi-card">
                        <div class="sku456-kpi-label">Largest Leakage CPT</div>
                        <div class="sku456-kpi-value">${escapeHtml(summary.top_cpt_code || "—")}</div>
                        <div class="sku456-kpi-sub">${escapeHtml(summary.top_cpt_name || "")}</div>
                    </div>

                    <div class="sku456-kpi-card">
                        <div class="sku456-kpi-label">Total Estimated Leakage</div>
                        <div class="sku456-kpi-value">${formatCurrency(summary.total_estimated_leakage || 0)}</div>
                    </div>
                </section>

                <section class="sku456-chart-section">
                    <div class="sku456-chart-header">
                        <div class="sku456-chart-title">CPT Leakage Viewer</div>
                        <div class="sku456-chart-subtitle">
                            Estimated annual leakage by CPT
                        </div>
                    </div>

                    <div class="sku456-chart-shell">
                        <div id="sku456Chart" class="sku456-chart-host"></div>
                    </div>
                </section>

                <section class="sku456-narrative-block">
                    <h3 class="sku456-section-title">Money leakage signal</h3>
                    <p>${escapeHtml(notes[0] || "Highlights CPT areas where provider reimbursement falls below benchmark.")}</p>
                    <p>${escapeHtml(notes[1] || "These CPTs can feed fixable CPT and prescriptive improvement layers.")}</p>
                </section>
            </div>
        `;

        renderChart(chart);
    }

    function renderChart(chart = {}) {
        console.log("[SKU4.56] renderChart entered", chart);

        const chartHost = document.getElementById("sku456Chart");
        if (!chartHost || !global.Plotly) return;

        const labels = Array.isArray(chart.labels)
            ? chart.labels.map(v => `${v}`)
            : [];

        const values = Array.isArray(chart.values)
            ? chart.values.map(v => Number(v || 0))
            : [];

        const text = Array.isArray(chart.text) ? chart.text : [];

        const highlightIndex = Number.isInteger(chart.highlight_index)
            ? chart.highlight_index
            : -1;

        const annotations =
            highlightIndex >= 0 && labels[highlightIndex]
                ? [{
                    xref: "x",
                    yref: "paper",
                    x: labels[highlightIndex],
                    y: 1.05,
                    showarrow: false,
                    xanchor: "center",
                    yanchor: "middle",
                    text: `
                        <span style="
                            display:inline-block;
                            width:18px;
                            height:18px;
                            line-height:18px;
                            text-align:center;
                            background:#000;
                            border-radius:50%;
                            font-size:11px;
                        ">🐝</span>
                    `
                }]
                : [];

        window.__SKU456_DEBUG__ = { chart, labels, values, text, chartHost, annotations };

        global.Plotly.newPlot(
            chartHost,
            [
                {
                    type: "bar",
                    x: labels,
                    y: values,
                    customdata: text,
                    hovertemplate:
                        "<b>%{customdata[0]}</b><br>" +
                        "Claims: %{customdata[1]}<br>" +
                        "Provider: %{customdata[2]}<br>" +
                        "Region: %{customdata[3]}<br>" +
                        "<b>Leakage: %{customdata[4]}</b><extra></extra>",
                    name: "Revenue Leakage"
                }
            ],
            {
                margin: { l: 70, r: 30, t: 50, b: 110 },
                paper_bgcolor: "#08131f",
                plot_bgcolor: "#08131f",
                font: { color: "#d8e1ea", size: 12 },

                autosize: true,
                bargap: 0.35,

                xaxis: {
                    type: "category",
                    tickangle: -35,
                    automargin: true,
                    tickmode: "array",
                    tickvals: labels,
                    ticktext: labels,
                    categoryorder: "array",
                    categoryarray: labels
                },

                yaxis: {
                    title: "Estimated Annual Leakage",
                    gridcolor: "rgba(255,255,255,0.08)",
                    zeroline: true,
                    zerolinecolor: "rgba(255,255,255,0.18)",
                    automargin: true,
                    rangemode: "tozero"
                },

                hoverlabel: {
                    bgcolor: "#1c3553",
                    bordercolor: "#7ea6ff",
                    font: { color: "#ffffff", size: 13 },
                    align: "left",
                    namelength: -1
                },

                annotations: [],
                showlegend: false
            }
        );
        setTimeout(() => {
            if (chartHost && global.Plotly) {
                global.Plotly.Plots.resize(chartHost);
            }
        }, 50);
    }

    function renderRHSBlock({ targetEl, payload }) {
        console.log("[SKU4.56 RHS payload]", payload);

        if (!targetEl) return;

        const summary = payload?.summary || {};
        const table = payload?.table || {};
        const rows = Array.isArray(table?.rows) ? table.rows : [];
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];

        const topCpt =
            rows.find(row => row?.priority_flag) ||
            rows[0] ||
            null;

        targetEl.innerHTML = `
            <div class="sku456-rhs-shell">

                <div class="sku456-rhs-hero">
                    <div class="sku456-rhs-hero-left">
                        <div class="sku456-rhs-kicker">
                            CPT Underperformance Summary
                        </div>

                        <div class="sku456-rhs-title">
                            Provider CPT Weaknesses vs Region
                        </div>

                        <div class="sku456-rhs-subtitle">
                            Highlights reimbursement weakness, benchmark gap, and annual leakage for underperforming CPT areas.
                        </div>
                    </div>

                    <div class="sku456-rhs-hero-right">
                        <div class="sku456-rhs-stat-card">
                            <div class="sku456-rhs-stat-label">Total Revenue Leakage</div>
                            <div class="sku456-rhs-stat-value">
                                ${escapeHtml(summary?.total_estimated_leakage_display || formatCurrency(summary?.total_estimated_leakage || 0))}
                            </div>
                        </div>

                        <div class="sku456-rhs-stat-card">
                            <div class="sku456-rhs-stat-label">CPTs Reviewed</div>
                            <div class="sku456-rhs-stat-value">
                                ${summary?.total_cpts_reviewed || rows.length || 0}
                            </div>
                        </div>
                    </div>
                </div>

                ${topCpt ? `
                    <div class="sku456-rhs-priority-card">
                        <div class="sku456-rhs-priority-top">
                            <div class="sku456-rhs-priority-icon">🐝</div>
                            <div>
                                <div class="sku456-rhs-priority-title">
                                    Largest Annual Leakage
                                </div>

                                <div class="sku456-rhs-priority-metric">
                                    ${escapeHtml(topCpt.cpt_code || "")} · ${escapeHtml(topCpt.cpt_name || "")}
                                </div>
                            </div>
                        </div>

                        <div class="sku456-rhs-priority-description">
                            This CPT currently represents the greatest reimbursement downside versus region when annualized across claim volume.
                        </div>

                        <div class="sku456-rhs-priority-pill-row">
                            <div class="sku456-rhs-pill negative">
                                Delta ${escapeHtml(topCpt.delta_value_display || "")}
                            </div>

                            <div class="sku456-rhs-pill negative">
                                Leakage ${escapeHtml(topCpt.estimated_annual_leakage_display || "")}
                            </div>
                        </div>
                    </div>
                ` : ""}

                <div class="sku456-rhs-card-grid">
                    ${rows.map(row => `
                        <div class="sku456-rhs-metric-card ${row?.priority_flag ? "priority-highlight" : ""}">
                            <div class="sku456-rhs-metric-top">
                                <div class="sku456-rhs-metric-title">
                                    ${escapeHtml(row.cpt_code || "")}
                                </div>

                                ${row?.priority_flag ? `<div class="sku456-rhs-bee-chip">🐝 Priority</div>` : ""}
                            </div>

                            <div class="sku456-rhs-metric-name">
                                ${escapeHtml(row.cpt_name || "")}
                            </div>

                            <div class="sku456-rhs-metric-interpretation">
                                ${escapeHtml(row.interpretation || "")}
                            </div>

                            <div class="sku456-rhs-metric-values">
                                <div class="sku456-rhs-value-box">
                                    <div class="sku456-rhs-value-label">Claims</div>
                                    <div class="sku456-rhs-value-number">
                                        ${escapeHtml(row.total_claims_display || "")}
                                    </div>
                                </div>

                                <div class="sku456-rhs-value-box">
                                    <div class="sku456-rhs-value-label">Provider $/Claim</div>
                                    <div class="sku456-rhs-value-number negative">
                                        ${escapeHtml(row.provider_value_display || "")}
                                    </div>
                                </div>

                                <div class="sku456-rhs-value-box">
                                    <div class="sku456-rhs-value-label">Region $/Claim</div>
                                    <div class="sku456-rhs-value-number muted">
                                        ${escapeHtml(row.benchmark_value_display || "")}
                                    </div>
                                </div>
                            </div>

                            <div class="sku456-rhs-delta-row">
                                <div class="sku456-rhs-delta-chip negative">
                                    Delta ${escapeHtml(row.delta_value_display || "")}
                                </div>

                                <div class="sku456-rhs-delta-chip negative">
                                    Leakage ${escapeHtml(row.estimated_annual_leakage_display || "")}
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>

                ${notes.length ? `
                    <div class="sku456-rhs-notes-shell">
                        ${notes.map(note => `
                            <div class="sku456-rhs-note">
                                ${escapeHtml(note)}
                            </div>
                        `).join("")}
                    </div>
                ` : ""}
            </div>
        `;
    }

    global.SKU456Renderer = {
        render,
        renderRHSBlock
    };
})(window);