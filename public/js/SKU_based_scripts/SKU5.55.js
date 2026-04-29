console.log("[SKU5.55.js] file loaded");

(function initSKU555Renderer(global) {
    "use strict";

    function formatCurrency(value) {
        if (global.SKU5FinancialLoader?.formatCompactCurrency) {
            return global.SKU5FinancialLoader.formatCompactCurrency(value || 0);
        }
        return `$${Number(value || 0).toFixed(0)}`;
    }

    function formatWholeNumber(value) {
        return Number(value || 0).toLocaleString();
    }

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function renderCptRow(row = {}) {
        return `
            <div class="sku555-cpt-row">
                <div class="sku555-cpt-row-top">
                    
                <div class="sku555-cpt-name">
                    ${escapeHtml(row.cpt_name || "Unnamed CPT")}
                </div>

                <div class="sku555-cpt-interpretation">
                    ${escapeHtml(row.interpretation || "")}
                </div>

                <div class="sku555-cpt-metric-grid">
                    <div class="sku555-cpt-metric">
                        <div class="sku555-cpt-caption">Claims</div>
                        <div class="sku555-cpt-value">${formatWholeNumber(row.total_claims)}</div>
                    </div>

                    <div class="sku555-cpt-metric">
                        <div class="sku555-cpt-caption">Provider $/Claim</div>
                        <div class="sku555-cpt-value">${formatCurrency(row.provider_value)}</div>
                    </div>

                    <div class="sku555-cpt-metric">
                        <div class="sku555-cpt-caption">Region $/Claim</div>
                        <div class="sku555-cpt-value">${formatCurrency(row.benchmark_value)}</div>
                    </div>

                    <div class="sku555-cpt-metric">
                        <div class="sku555-cpt-caption">Delta</div>
                        <div class="sku555-cpt-value">${formatCurrency(row.delta_value)}</div>
                    </div>

                    <div class="sku555-cpt-metric">
                        <div class="sku555-cpt-caption">Annual Advantage</div>
                        <div class="sku555-cpt-value">${formatCurrency(row.estimated_annual_advantage)}</div>
                    </div>
                </div>
            </div>
        `;
    }


    // RHS block table formatting and painting start the disptahcer fromn panel engine comes here // 

    function render({ targetEl, payload, contract }) {
        if (!targetEl) return;

        const summary = payload?.summary || {};
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];
        const chart = payload?.chart || {};

        targetEl.innerHTML = `
            <div class="sku555-shell">
                <div class="sku555-header">
                    <div class="sku555-title">Overperforming CPT Areas</div>
                    <div class="sku555-subtitle">
                        CPTs where reimbursement strength exceeds regional benchmarks
                    </div>
                </div>

                <section class="sku555-summary-block">
                    <div class="sku555-kpi-card">
                        <div class="sku555-kpi-label">Overperforming CPTs</div>
                        <div class="sku555-kpi-value">${summary.overperforming_count || 0}</div>
                    </div>

                    <div class="sku555-kpi-card">
                        <div class="sku555-kpi-label">Top CPT</div>
                        <div class="sku555-kpi-value">${summary.top_cpt_code || "—"}</div>
                        <div class="sku555-kpi-sub">${summary.top_cpt_name || ""}</div>
                    </div>

                    <div class="sku555-kpi-card">
                        <div class="sku555-kpi-label">Total Estimated Advantage</div>
                        <div class="sku555-kpi-value">${formatCurrency(summary.total_estimated_advantage || 0)}</div>
                    </div>
                </section>

                <div class="sku555-chart-shell">
                    <div id="sku555Chart" class="sku555-chart-host"></div>
                </div>

                <section class="sku555-narrative-block">
                    <h3 class="sku555-section-title">Why this matters</h3>
                    <p>${notes[0] || ""}</p>
                    <p>${notes[1] || ""}</p>
                </section>
            </div>
        `;

        renderChart(chart);
    }

    function renderChart(chart = {}) {
        const chartHost = document.getElementById("sku555Chart");

        if (!chartHost || !global.Plotly) return;

        const labels = Array.isArray(chart.labels)
            ? chart.labels.map(v => `CPT ${v}`)
            : [];

        const values = Array.isArray(chart.values) ? chart.values : [];
        const text = Array.isArray(chart.text) ? chart.text : [];

        global.Plotly.newPlot(
            chartHost,
            [
                {
                    type: "bar",
                    x: labels,
                    y: values,
                    text: text,
                    hoverinfo: "text+y+x",
                    name: "Overperformance"
                }
            ],
            {
                margin: { l: 50, r: 20, t: 20, b: 80 },
                paper_bgcolor: "#08131f",
                plot_bgcolor: "#08131f",
                font: {
                    color: "#d8e1ea",
                    size: 12
                },
                xaxis: {
                    type: "category",
                    tickangle: -25,
                    automargin: true
                },
                yaxis: {
                    title: "Delta vs Region Paid per Claim",
                    gridcolor: "rgba(255,255,255,0.08)"
                },
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
        console.log("[SKU5.55 RHS payload]", payload);
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
        <div class="sku555-rhs-shell">

            <div class="sku555-rhs-hero">
                <div class="sku555-rhs-hero-left">
                    <div class="sku555-rhs-kicker">
                        Overperforming CPT Summary
                    </div>

                    <div class="sku555-rhs-title">
                        Provider CPT Strengths vs Region
                    </div>

                    <div class="sku555-rhs-subtitle">
                        Highlights reimbursement strength, volume, and annual advantage for top performing CPT areas.
                    </div>
                </div>

                <div class="sku555-rhs-hero-right">
                    <div class="sku555-rhs-stat-card">
                        <div class="sku555-rhs-stat-label">
                            CPTs Reviewed
                        </div>
                        <div class="sku555-rhs-stat-value">
                            ${summary?.total_cpts_reviewed || rows.length || 0}
                        </div>
                    </div>
                </div>
            </div>

            ${topCpt
                ? `
                        <div class="sku555-rhs-priority-card">
                            <div class="sku555-rhs-priority-top">
                                <div class="sku555-rhs-priority-icon">🐝</div>

                                <div>
                                    <div class="sku555-rhs-priority-title">
                                        Highest Annual Advantage
                                    </div>

                                    <div class="sku555-rhs-priority-metric">
                                        ${escapeHtml(topCpt.cpt_code || "")} · ${escapeHtml(topCpt.cpt_name || "")}
                                    </div>
                                </div>
                            </div>

                            <div class="sku555-rhs-priority-description">
                                This CPT currently represents the strongest reimbursement advantage versus region when annualized across claim volume.
                            </div>

                            <div class="sku555-rhs-priority-pill-row">
                                <div class="sku555-rhs-pill positive">
                                    Delta ${escapeHtml(topCpt.delta_value_display || "")}
                                </div>

                                <div class="sku555-rhs-pill positive">
                                    Annual ${escapeHtml(topCpt.estimated_annual_advantage_display || "")}
                                </div>
                            </div>
                        </div>
                    `
                : ""
            }

            <div class="sku555-rhs-card-grid">
                ${rows.map(row => `
                    <div class="sku555-rhs-metric-card ${row?.priority_flag ? "bee-highlight" : ""}">
                        <div class="sku555-rhs-metric-top">
                            <div class="sku555-rhs-metric-title">
                                ${escapeHtml(row.cpt_code || "")}
                            </div>

                            ${row?.priority_flag
                    ? `<div class="sku555-rhs-bee-chip">🐝 Priority</div>`
                    : ""
                }
                        </div>

                        <div class="sku555-rhs-metric-name">
                            ${escapeHtml(row.cpt_name || "")}
                        </div>

                        <div class="sku555-rhs-metric-interpretation">
                            ${escapeHtml(row.interpretation || "")}
                        </div>

                        <div class="sku555-rhs-metric-values">
                            <div class="sku555-rhs-value-box">
                                <div class="sku555-rhs-value-label">Claims</div>
                                <div class="sku555-rhs-value-number">
                                    ${escapeHtml(row.total_claims_display || "")}
                                </div>
                            </div>

                            <div class="sku555-rhs-value-box">
                                <div class="sku555-rhs-value-label">Provider $/Claim</div>
                                <div class="sku555-rhs-value-number">
                                    ${escapeHtml(row.provider_value_display || "")}
                                </div>
                            </div>

                            <div class="sku555-rhs-value-box">
                                <div class="sku555-rhs-value-label">Region $/Claim</div>
                                <div class="sku555-rhs-value-number muted">
                                    ${escapeHtml(row.benchmark_value_display || "")}
                                </div>
                            </div>
                        </div>

                        <div class="sku555-rhs-delta-row">
                            <div class="sku555-rhs-delta-chip positive">
                                Delta ${escapeHtml(row.delta_value_display || "")}
                            </div>

                            <div class="sku555-rhs-delta-chip positive">
                                Annual ${escapeHtml(row.estimated_annual_advantage_display || "")}
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>

            ${notes.length
                ? `
                        <div class="sku555-rhs-notes-shell">
                            ${notes.map(note => `
                                <div class="sku555-rhs-note">
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

    // rhs block formatting and painting end//

    global.SKU555Renderer = {
        render,
        renderRHSBlock
    };
})(window);