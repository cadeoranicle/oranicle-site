console.log("[SKU5.58.js] file loaded");

(function initSKU558Renderer(global) {
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

    function render({ targetEl, payload, contract }) {
        if (!targetEl) return;

        const summary = payload?.summary || {};
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];
        const chart = payload?.chart || {};

        targetEl.innerHTML = `
            <div class="sku558-shell">
                <div class="sku558-header">
                    <div class="sku558-title">Monetizable CPT Areas</div>
                    <div class="sku558-subtitle">
                        CPTs with positive reimbursement spread and scale potential
                    </div>
                </div>

                <section class="sku558-summary-grid">
                    <div class="sku558-kpi-card">
                        <div class="sku558-kpi-label">Monetizable CPTs</div>
                        <div class="sku558-kpi-value">${summary.monetizable_count || 0}</div>
                    </div>

                    <div class="sku558-kpi-card">
                        <div class="sku558-kpi-label">Highest Upside CPT</div>
                        <div class="sku558-kpi-value">${summary.top_cpt_code || "—"}</div>
                        <div class="sku558-kpi-sub">${summary.top_cpt_name || ""}</div>
                    </div>

                    <div class="sku558-kpi-card">
                        <div class="sku558-kpi-label">Total Estimated Upside</div>
                        <div class="sku558-kpi-value">${formatCurrency(summary.total_estimated_upside || 0)}</div>
                    </div>
                </section>

                <section class="sku558-chart-section">
                    <div class="sku558-chart-header">
                        <div class="sku558-chart-title">Monetizable CPT Viewer</div>
                        <div class="sku558-chart-subtitle">
                            Estimated upside across monetizable CPT areas
                        </div>
                    </div>

                    <div class="sku558-chart-shell">
                        <div id="sku558Chart" class="sku558-chart-host"></div>
                    </div>
                </section>

                <section class="sku558-narrative-block">
                    <h3 class="sku558-section-title">Why this matters</h3>
                    <p>${notes[0] || ""}</p>
                    <p>${notes[1] || ""}</p>
                </section>
            </div>
        `;

        renderChart(chart);
    }









    function renderChart(chart = {}) {
        console.log("[SKU5.58] renderChart entered", chart);
        const chartHost = document.getElementById("sku558Chart");

        if (!chartHost || !global.Plotly) return;

        const labels = Array.isArray(chart.labels)
            ? chart.labels.map(v => `CPT ${v}`)
            : [];

        const values = Array.isArray(chart.values)
            ? chart.values.map(v => Number(v || 0))
            : [];

        const text = Array.isArray(chart.text) ? chart.text : [];

        const highlightIndex = Number.isInteger(chart.highlight_index)
            ? chart.highlight_index
            : -1;

        const beeY =
            values[highlightIndex] < 0 ? 0 : values[highlightIndex];

        const annotations = labels.map((label) => ({
            xref: "x",
            yref: "paper",
            x: label,
            y: 1.03,
            showarrow: false,
            xanchor: "center",
            yanchor: "middle",

            // 👇 HTML badge
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

        console.log("[SKU5.58] labels", labels);
        console.log("[SKU5.58] values", values);
        console.log("[SKU5.58] text", text);
        console.log("[SKU5.58] chartHost", chartHost);

        window.__SKU558_DEBUG__ = { chart, labels, values, text, chartHost, annotations };

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
                    name: "Monetizable"
                }
            ],
            {
                margin: { l: 50, r: 20, t: 60, b: 80 },
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
                    title: "Estimated upside across monetizable CPT areas",
                    gridcolor: "rgba(255,255,255,0.08)",
                    zeroline: true,
                    zerolinecolor: "rgba(255,255,255,0.18)",
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
        console.log("[SKU5.58 RHS payload]", payload);

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
        <div class="sku558-rhs-shell">

            <div class="sku558-rhs-hero">
                <div class="sku558-rhs-hero-left">
                    <div class="sku558-rhs-kicker">
                        Monetizable CPT Summary
                    </div>

                    <div class="sku558-rhs-title">
                        Provider CPT Growth Opportunities
                    </div>

                    <div class="sku558-rhs-subtitle">
                        Highlights scalable CPT areas with positive spread and estimated upside.
                    </div>
                </div>

                <div class="sku558-rhs-hero-right">
                <div class="sku558-rhs-stat-card">
                        <div class="sku558-rhs-stat-label">
                            Total Estimated Upside
                        </div>
                        <div class="sku558-rhs-stat-value">
                            ${escapeHtml(summary?.total_estimated_leakage_display || "")}
                        </div>
                        </div>
                    <div class="sku558-rhs-stat-card">
                        <div class="sku558-rhs-stat-label">
                            CPTs Reviewed
                        </div>
                        <div class="sku558-rhs-stat-value">
                            ${summary?.total_cpts_reviewed || rows.length || 0}
                        </div>
                    </div>
                </div>
            </div>

            ${topCpt
                ? `
                        <div class="sku558-rhs-priority-card">
                            <div class="sku558-rhs-priority-top">
                                

                                <div>
                                    <div class="sku558-rhs-priority-title">
                                        Highest Estimated Upside
                                    </div>

                                    <div class="sku558-rhs-priority-metric">
                                        ${escapeHtml(topCpt.cpt_code || "")} · ${escapeHtml(topCpt.cpt_name || "")}
                                    </div>
                                </div>
                            </div>

                            <div class="sku558-rhs-priority-description">
                                This CPT currently represents the strongest scalable upside based on positive spread and projected growth.
                            </div>

                            <div class="sku558-rhs-priority-pill-row">
                                <div class="sku558-rhs-pill positive">
                                    Spread ${escapeHtml(topCpt.delta_value_display || "")}
                                </div>

                                <div class="sku558-rhs-pill positive">
                                    Upside ${escapeHtml(topCpt.estimated_annual_leakage_display || "")}
                                </div>
                            </div>
                        </div>
                    `
                : ""
            }

            <div class="sku558-rhs-card-grid">
                ${rows.map(row => `
                    <div class="sku558-rhs-metric-card ${row?.priority_flag ? "priority-highlight" : ""}">
                        <div class="sku558-rhs-metric-top">
                            <div class="sku558-rhs-metric-title">
                                ${escapeHtml(row.cpt_code || "")}
                            </div>

                            
                        </div>

                        <div class="sku558-rhs-metric-name">
                            ${escapeHtml(row.cpt_name || "")}
                        </div>

                        <div class="sku558-rhs-metric-interpretation">
                            ${escapeHtml(row.interpretation || "")}
                        </div>

                        <div class="sku558-rhs-metric-values">
                            <div class="sku558-rhs-value-box">
                                <div class="sku558-rhs-value-label">Claims</div>
                                <div class="sku558-rhs-value-number">
                                    ${escapeHtml(row.total_claims_display || "")}
                                </div>
                            </div>

                            <div class="sku558-rhs-value-box">
                                <div class="sku558-rhs-value-label">Provider $/Claim</div>
                                <div class="sku558-rhs-value-number">
                                    ${escapeHtml(row.provider_value_display || "")}
                                </div>
                            </div>

                            <div class="sku558-rhs-value-box">
                                <div class="sku558-rhs-value-label">Region $/Claim</div>
                                <div class="sku558-rhs-value-number muted">
                                    ${escapeHtml(row.benchmark_value_display || "")}
                                </div>
                            </div>
                        </div>

                        <div class="sku558-rhs-delta-row">
                            <div class="sku558-rhs-delta-chip positive">
                                Spread ${escapeHtml(row.delta_value_display || "")}
                            </div>

                            <div class="sku558-rhs-delta-chip positive">
                                Upside ${escapeHtml(row.estimated_annual_leakage_display || "")}
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>

            ${notes.length
                ? `
                        <div class="sku558-rhs-notes-shell">
                            ${notes.map(note => `
                                <div class="sku558-rhs-note">
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

    global.SKU558Renderer = {
        render,
        renderRHSBlock
    };
})(window);