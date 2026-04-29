console.log("[SKU5.60.js] file loaded");

(function initSKU560Renderer(global) {
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
            <div class="sku560-shell">
                <div class="sku560-header">
                    <div class="sku560-title">CPT Portfolio Risk</div>
                    <div class="sku560-subtitle">
                        Combined CPT concentration and reimbursement exposure risk
                    </div>
                </div>

                <section class="sku560-summary-grid">
                    <div class="sku560-kpi-card">
                        <div class="sku560-kpi-label">CPTs Reviewed</div>
                        <div class="sku560-kpi-value">${summary.total_cpts_reviewed || 0}</div>
                    </div>

                    <div class="sku560-kpi-card">
                        <div class="sku560-kpi-label">Highest Risk CPT</div>
                        <div class="sku560-kpi-value">${summary.highest_risk_cpt_code || "—"}</div>
                        <div class="sku560-kpi-sub">${summary.highest_risk_cpt_name || ""}</div>
                    </div>

                    <div class="sku560-kpi-card">
                        <div class="sku560-kpi-label">Top Risk Score</div>
                        <div class="sku560-kpi-value">${Number(summary.top_risk_score || 0).toFixed(2)}</div>
                    </div>
                </section>

                <section class="sku560-chart-section">
                    <div class="sku560-chart-header">
                        <div class="sku560-chart-title">CPT Risk Viewer</div>
                        <div class="sku560-chart-subtitle">
                            Combined portfolio fragility across concentration and reimbursement gap
                        </div>
                    </div>

                    <div class="sku560-chart-shell">
                        <div id="sku560Chart" class="sku560-chart-host"></div>
                    </div>
                </section>

                <section class="sku560-narrative-block">
                    <h3 class="sku560-section-title">Why this matters</h3>
                    <p>${notes[0] || ""}</p>
                    <p>${notes[1] || ""}</p>
                </section>
            </div>
        `;

        renderChart(chart);
    }

    function renderChart(chart = {}) {
        console.log("[SKU5.60] renderChart entered", chart);
        const chartHost = document.getElementById("sku560Chart");

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

        console.log("[SKU5.60] labels", labels);
        console.log("[SKU5.60] values", values);
        console.log("[SKU5.60] text", text);
        console.log("[SKU5.60] chartHost", chartHost);

        window.__SKU560_DEBUG__ = { chart, labels, values, text, chartHost, annotations, highlightIndex };

        global.Plotly.newPlot(
            chartHost,
            [
                {
                    type: "bar",
                    x: labels,
                    y: values,
                    width: 0.45,
                    customdata: text,
                    hovertemplate:
                        "<b>%{customdata[0]}</b><br>" +
                        "Concentration: %{customdata[1]}<br>" +
                        "Reimbursement Gap: %{customdata[2]}<br>" +
                        "<b>Risk Score: %{customdata[3]}</b><extra></extra>",
                    name: "CPT Risk"
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
                    title: "Combined CPT Risk Score",
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
        console.log("[SKU5.60 RHS payload]", payload);

        if (!targetEl) return;

        const summary = payload?.summary || {};
        const table = payload?.table || {};
        const rows = Array.isArray(table?.rows) ? table.rows : [];
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];

        const topCpt = rows[0] || null;

        targetEl.innerHTML = `
        <div class="sku560-rhs-shell">

            <div class="sku560-rhs-hero">
                <div class="sku560-rhs-hero-left">
                    <div class="sku560-rhs-kicker">
                        CPT Portfolio Risk Summary
                    </div>

                    <div class="sku560-rhs-title">
                        Provider CPT Fragility Profile
                    </div>

                    <div class="sku560-rhs-subtitle">
                        Highlights concentrated and reimbursement-sensitive CPT exposure across the provider portfolio.
                    </div>
                </div>

                <div class="sku560-rhs-hero-right">
                    <div class="sku560-rhs-stat-card">
                        <div class="sku560-rhs-stat-label">
                            Top Risk Score
                        </div>
                        <div class="sku560-rhs-stat-value">
                            ${Number(summary?.top_risk_score || 0).toFixed(2)}
                        </div>
                    </div>

                    <div class="sku560-rhs-stat-card">
                        <div class="sku560-rhs-stat-label">
                            CPTs Reviewed
                        </div>
                        <div class="sku560-rhs-stat-value">
                            ${summary?.total_cpts_reviewed || rows.length || 0}
                        </div>
                    </div>
                </div>
            </div>

            ${topCpt
                ? `
                        <div class="sku560-rhs-priority-card">
                            <div class="sku560-rhs-priority-top">
                                <div>
                                    <div class="sku560-rhs-priority-title">
                                        Highest Combined Risk
                                    </div>

                                    <div class="sku560-rhs-priority-metric">
                                        ${escapeHtml(topCpt.cpt_code || "")} · ${escapeHtml(topCpt.cpt_name || "")}
                                    </div>
                                </div>
                            </div>

                            <div class="sku560-rhs-priority-description">
                                This CPT currently represents the highest portfolio fragility based on combined concentration and reimbursement exposure.
                            </div>

                            <div class="sku560-rhs-priority-pill-row">
                                <div class="sku560-rhs-pill muted">
                                    Concentration ${escapeHtml(topCpt.concentration_share_display || "")}
                                </div>

                                <div class="sku560-rhs-pill muted">
                                    Gap ${escapeHtml(topCpt.reimbursement_gap_display || "")}
                                </div>

                                <div class="sku560-rhs-pill negative">
                                    Risk ${escapeHtml(topCpt.risk_score_display || "")}
                                </div>
                            </div>
                        </div>
                    `
                : ""
            }

            <div class="sku560-rhs-card-grid">
                ${rows.map(row => `
                    <div class="sku560-rhs-metric-card">
                        <div class="sku560-rhs-metric-top">
                            <div class="sku560-rhs-metric-title">
                                ${escapeHtml(row.cpt_code || "")}
                            </div>
                        </div>

                        <div class="sku560-rhs-metric-name">
                            ${escapeHtml(row.cpt_name || "")}
                        </div>

                        <div class="sku560-rhs-metric-interpretation">
                            ${escapeHtml(row.interpretation || "")}
                        </div>

                        <div class="sku560-rhs-metric-values">
                            <div class="sku560-rhs-value-box">
                                <div class="sku560-rhs-value-label">Claims</div>
                                <div class="sku560-rhs-value-number">
                                    ${escapeHtml(row.total_claims_display || "")}
                                </div>
                            </div>

                            <div class="sku560-rhs-value-box">
                                <div class="sku560-rhs-value-label">Concentration</div>
                                <div class="sku560-rhs-value-number muted">
                                    ${escapeHtml(row.concentration_share_display || "")}
                                </div>
                            </div>

                            <div class="sku560-rhs-value-box">
                                <div class="sku560-rhs-value-label">Reimbursement Gap</div>
                                <div class="sku560-rhs-value-number negative">
                                    ${escapeHtml(row.reimbursement_gap_display || "")}
                                </div>
                            </div>
                        </div>

                        <div class="sku560-rhs-delta-row">
                            <div class="sku560-rhs-delta-chip muted">
                                Claims ${escapeHtml(row.total_claims_display || "")}
                            </div>

                            <div class="sku560-rhs-delta-chip negative">
                                Risk ${escapeHtml(row.risk_score_display || "")}
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>

            ${notes.length
                ? `
                        <div class="sku560-rhs-notes-shell">
                            ${notes.map(note => `
                                <div class="sku560-rhs-note">
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

    global.SKU560Renderer = {
        render,
        renderRHSBlock
    };
})(window);