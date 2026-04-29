console.log("[sku4.58.js] file loaded");

(function initSKU458Renderer(global) {
    "use strict";

    function formatCurrency(value) {
        if (global.SKU4FinancialLoader?.formatCompactCurrency) {
            return global.SKU4FinancialLoader.formatCompactCurrency(value || 0);
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

    // ------------------------------------------------------------
    // LHS RENDER
    // ------------------------------------------------------------

    function render({ targetEl, payload }) {
        if (!targetEl) return;

        const summary = payload?.summary || {};
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];
        const chart = payload?.chart || {};

        targetEl.innerHTML = `
            <div class="sku458-shell">

                <div class="sku458-header">
                    <div class="sku458-title">Monetizable CPT Areas</div>
                    <div class="sku458-subtitle">
                        CPTs with positive reimbursement spread and scalable growth potential
                    </div>
                </div>

                <section class="sku458-summary-grid">

                    <div class="sku458-kpi-card">
                        <div class="sku458-kpi-label">Monetizable CPTs</div>
                        <div class="sku458-kpi-value">
                            ${summary.monetizable_count || 0}
                        </div>
                    </div>

                    <div class="sku458-kpi-card">
                        <div class="sku458-kpi-label">Top Growth CPT</div>
                        <div class="sku458-kpi-value">
                            ${summary.top_cpt_code || "—"}
                        </div>
                        <div class="sku458-kpi-sub">
                            ${summary.top_cpt_name || ""}
                        </div>
                    </div>

                    <div class="sku458-kpi-card">
                        <div class="sku458-kpi-label">Total Growth Upside</div>
                        <div class="sku458-kpi-value">
                            ${formatCurrency(summary.total_estimated_upside || 0)}
                        </div>
                    </div>

                </section>

                <section class="sku458-chart-section">
                    <div class="sku458-chart-header">
                        <div class="sku458-chart-title">Growth Opportunity Viewer</div>
                        <div class="sku458-chart-subtitle">
                            Estimated scalable revenue upside by CPT
                        </div>
                    </div>

                    <div class="sku458-chart-shell">
                        <div id="sku458Chart" class="sku458-chart-host"></div>
                    </div>
                </section>

                <section class="sku458-narrative-block">
                    <h3 class="sku458-section-title">Why this matters</h3>
                    <p>${notes[0] || ""}</p>
                    <p>${notes[1] || ""}</p>
                </section>

            </div>
        `;

        renderChart(chart);
    }

    // ------------------------------------------------------------
    // CHART
    // ------------------------------------------------------------

    function renderChart(chart = {}) {
        console.log("[SKU4.58] renderChart", chart);

        const chartHost = document.getElementById("sku458Chart");
        if (!chartHost || !global.Plotly) return;

        const labels = (chart.labels || []).map(v => `CPT ${v}`);
        const values = (chart.values || []).map(v => Number(v || 0));
        const text = chart.text || [];

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
                        "<b>Upside: %{customdata[4]}</b><extra></extra>",
                    name: "Growth Upside"
                }
            ],
            {
                margin: { l: 50, r: 20, t: 40, b: 80 },
                paper_bgcolor: "#08131f",
                plot_bgcolor: "#08131f",
                font: { color: "#d8e1ea" },

                xaxis: {
                    tickangle: -25,
                    automargin: true
                },

                yaxis: {
                    title: "Estimated Upside ($)",
                    gridcolor: "rgba(255,255,255,0.08)",
                    zeroline: true,
                    zerolinecolor: "rgba(255,255,255,0.18)"
                },

                showlegend: false
            },
            {
                responsive: true,
                displaylogo: false
            }
        );
    }

    // ------------------------------------------------------------
    // RHS RENDER
    // ------------------------------------------------------------

    function renderRHSBlock({ targetEl, payload }) {
        if (!targetEl) return;

        const summary = payload?.summary || {};
        const rows = payload?.table?.rows || [];
        const notes = payload?.notes || [];

        const top = rows[0];

        targetEl.innerHTML = `
        <div class="sku458-rhs-shell">

            <div class="sku458-rhs-hero">

                <div class="sku458-rhs-hero-left">
                    <div class="sku458-rhs-kicker">
                        Monetization Summary
                    </div>

                    <div class="sku458-rhs-title">
                        CPT Growth Opportunities
                    </div>

                    <div class="sku458-rhs-subtitle">
                        Highlights CPTs where reimbursement advantage can be scaled into revenue growth.
                    </div>
                </div>

                <div class="sku458-rhs-hero-right">
                    <div class="sku458-rhs-stat-card">
                        <div class="sku458-rhs-stat-label">Total Upside</div>
                        <div class="sku458-rhs-stat-value">
                            ${escapeHtml(summary?.total_estimated_upside_display || "")}
                        </div>
                    </div>
                </div>

            </div>

            ${top ? `
                <div class="sku458-rhs-priority-card">

                    <div class="sku458-rhs-priority-title">
                        Highest Growth Opportunity
                    </div>

                    <div class="sku458-rhs-priority-metric">
                        ${escapeHtml(top.cpt_code)} · ${escapeHtml(top.cpt_name)}
                    </div>

                    <div class="sku458-rhs-priority-pill-row">
                        <div class="sku458-rhs-pill positive">
                            Upside ${escapeHtml(top.estimated_upside_display)}
                        </div>
                    </div>

                </div>
            ` : ""}

            <div class="sku458-rhs-card-grid">
                ${rows.map(row => `
                    <div class="sku458-rhs-metric-card">

                        <div class="sku458-rhs-metric-title">
                            ${escapeHtml(row.cpt_code)}
                        </div>

                        <div class="sku458-rhs-metric-name">
                            ${escapeHtml(row.cpt_name)}
                        </div>

                        <div class="sku458-rhs-metric-interpretation">
                            ${escapeHtml(row.interpretation)}
                        </div>

                        <div class="sku458-rhs-metric-values">

                            <div class="sku458-rhs-value-box">
                                <div class="sku458-rhs-value-label">Claims</div>
                                <div class="sku458-rhs-value-number">
                                    ${escapeHtml(row.total_claims_display)}
                                </div>
                            </div>

                            <div class="sku458-rhs-value-box">
                                <div class="sku458-rhs-value-label">Provider</div>
                                <div class="sku458-rhs-value-number">
                                    ${escapeHtml(row.provider_value_display)}
                                </div>
                            </div>

                            <div class="sku458-rhs-value-box">
                                <div class="sku458-rhs-value-label">Upside</div>
                                <div class="sku458-rhs-value-number positive">
                                    ${escapeHtml(row.estimated_upside_display)}
                                </div>
                            </div>

                        </div>

                    </div>
                `).join("")}
            </div>

            ${notes.length ? `
                <div class="sku458-rhs-notes-shell">
                    ${notes.map(n => `<div class="sku458-rhs-note">${escapeHtml(n)}</div>`).join("")}
                </div>
            ` : ""}

        </div>
        `;
    }

    // ------------------------------------------------------------

    global.SKU458Renderer = {
        render,
        renderRHSBlock
    };

})(window);