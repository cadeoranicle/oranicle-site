console.log("[sku4.60.js] file loaded");

(function initSKU460Renderer(global) {
    "use strict";

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function render({ targetEl, payload }) {
        if (!targetEl) return;

        const summary = payload?.summary || {};
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];
        const chart = payload?.chart || {};

        targetEl.innerHTML = `
            <div class="sku460-shell">
                <div class="sku460-header">
                    <div class="sku460-title">CPT Portfolio Risk</div>
                    <div class="sku460-subtitle">
                        Combined CPT concentration and reimbursement sensitivity risk
                    </div>
                </div>

                <section class="sku460-summary-grid">
                    <div class="sku460-kpi-card">
                        <div class="sku460-kpi-label">CPTs Reviewed</div>
                        <div class="sku460-kpi-value">${summary.total_cpts_reviewed || 0}</div>
                    </div>

                    <div class="sku460-kpi-card">
                        <div class="sku460-kpi-label">Highest Risk CPT</div>
                        <div class="sku460-kpi-value">${escapeHtml(summary.highest_risk_cpt_code || "—")}</div>
                        <div class="sku460-kpi-sub">${escapeHtml(summary.highest_risk_cpt_name || "")}</div>
                    </div>

                    <div class="sku460-kpi-card">
                        <div class="sku460-kpi-label">Top Risk Score</div>
                        <div class="sku460-kpi-value">${Number(summary.top_risk_score || 0).toFixed(2)}</div>
                    </div>
                </section>

                <section class="sku460-chart-section">
                    <div class="sku460-chart-header">
                        <div class="sku460-chart-title">CPT Risk Viewer</div>
                        <div class="sku460-chart-subtitle">
                            Portfolio fragility across concentration and reimbursement gap
                        </div>
                    </div>

                    <div class="sku460-chart-shell">
                        <div id="sku460Chart" class="sku460-chart-host"></div>
                    </div>
                </section>

                <section class="sku460-narrative-block">
                    <h3 class="sku460-section-title">Why this matters</h3>
                    <p>${escapeHtml(notes[0] || "")}</p>
                    <p>${escapeHtml(notes[1] || "")}</p>
                </section>
            </div>
        `;

        renderChart(chart);
    }

    function renderChart(chart = {}) {
        console.log("[SKU4.60] renderChart entered", chart);

        const chartHost = document.getElementById("sku460Chart");
        if (!chartHost || !global.Plotly) return;

        const labels = Array.isArray(chart.labels)
            ? chart.labels.map(v => `${v}`)
            : [];

        const values = Array.isArray(chart.values)
            ? chart.values.map(v => Number(v || 0))
            : [];

        const text = Array.isArray(chart.text) ? chart.text : [];

        window.__SKU460_DEBUG__ = { chart, labels, values, text, chartHost };

        global.Plotly.newPlot(
            chartHost,
            [{
                type: "bar",
                x: labels,
                y: values,
                width: 0.45,
                customdata: text,
                hovertemplate:
                    "<b>%{customdata[0]}</b><br>" +
                    "Concentration: %{customdata[1]}<br>" +
                    "Reimbursement Gap: %{customdata[2]}<br>" +
                    "<b>Risk Score: %{customdata[3]}</b><br>" +
                    "Band: %{customdata[4]}<extra></extra>",
                name: "CPT Risk"
            }],
            {
                margin: { l: 60, r: 25, t: 35, b: 95 },
                paper_bgcolor: "#08131f",
                plot_bgcolor: "#08131f",
                font: { color: "#d8e1ea", size: 12 },
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
                    font: { color: "#ffffff", size: 13 },
                    align: "left",
                    namelength: -1
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
        console.log("[SKU4.60 RHS payload]", payload);
        if (!targetEl) return;

        const summary = payload?.summary || {};
        const table = payload?.table || {};
        const rows = Array.isArray(table?.rows) ? table.rows : [];
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];

        const topCpt = rows[0] || null;

        targetEl.innerHTML = `
            <div class="sku460-rhs-shell">

                <div class="sku460-rhs-hero">
                    <div class="sku460-rhs-hero-left">
                        <div class="sku460-rhs-kicker">CPT Portfolio Risk Summary</div>
                        <div class="sku460-rhs-title">Provider CPT Fragility Profile</div>
                        <div class="sku460-rhs-subtitle">
                            Highlights concentrated and reimbursement-sensitive CPT exposure across the provider portfolio.
                        </div>
                    </div>

                    <div class="sku460-rhs-hero-right">
                        <div class="sku460-rhs-stat-card">
                            <div class="sku460-rhs-stat-label">Top Risk Score</div>
                            <div class="sku460-rhs-stat-value">
                                ${Number(summary?.top_risk_score || 0).toFixed(2)}
                            </div>
                        </div>

                        <div class="sku460-rhs-stat-card">
                            <div class="sku460-rhs-stat-label">CPTs Reviewed</div>
                            <div class="sku460-rhs-stat-value">
                                ${summary?.total_cpts_reviewed || rows.length || 0}
                            </div>
                        </div>
                    </div>
                </div>

                ${topCpt ? `
                    <div class="sku460-rhs-priority-card">
                        <div class="sku460-rhs-priority-title">Highest Combined Risk</div>

                        <div class="sku460-rhs-priority-metric">
                            ${escapeHtml(topCpt.cpt_code || "")} · ${escapeHtml(topCpt.cpt_name || "")}
                        </div>

                        <div class="sku460-rhs-priority-description">
                            This CPT currently represents the highest portfolio fragility based on combined concentration and reimbursement exposure.
                        </div>

                        <div class="sku460-rhs-priority-pill-row">
                            <div class="sku460-rhs-pill muted">
                                Concentration ${escapeHtml(topCpt.concentration_share_display || "")}
                            </div>

                            <div class="sku460-rhs-pill muted">
                                Gap ${escapeHtml(topCpt.reimbursement_gap_display || "")}
                            </div>

                            <div class="sku460-rhs-pill negative">
                                Risk ${escapeHtml(topCpt.risk_score_display || "")}
                            </div>
                        </div>
                    </div>
                ` : ""}

                <div class="sku460-rhs-card-grid">
                    ${rows.map(row => `
                        <div class="sku460-rhs-metric-card">
                            <div class="sku460-rhs-metric-top">
                                <div class="sku460-rhs-metric-title">
                                    ${escapeHtml(row.cpt_code || "")}
                                </div>
                            </div>

                            <div class="sku460-rhs-metric-name">
                                ${escapeHtml(row.cpt_name || "")}
                            </div>

                            <div class="sku460-rhs-metric-interpretation">
                                ${escapeHtml(row.interpretation || "")}
                            </div>

                            <div class="sku460-rhs-metric-values">
                                <div class="sku460-rhs-value-box">
                                    <div class="sku460-rhs-value-label">Claims</div>
                                    <div class="sku460-rhs-value-number">
                                        ${escapeHtml(row.total_claims_display || "")}
                                    </div>
                                </div>

                                <div class="sku460-rhs-value-box">
                                    <div class="sku460-rhs-value-label">Concentration</div>
                                    <div class="sku460-rhs-value-number muted">
                                        ${escapeHtml(row.concentration_share_display || "")}
                                    </div>
                                </div>

                                <div class="sku460-rhs-value-box">
                                    <div class="sku460-rhs-value-label">Reimbursement Gap</div>
                                    <div class="sku460-rhs-value-number negative">
                                        ${escapeHtml(row.reimbursement_gap_display || "")}
                                    </div>
                                </div>
                            </div>

                            <div class="sku460-rhs-delta-row">
                                <div class="sku460-rhs-delta-chip muted">
                                    Band ${escapeHtml(row.risk_band || "")}
                                </div>

                                <div class="sku460-rhs-delta-chip negative">
                                    Risk ${escapeHtml(row.risk_score_display || "")}
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>

                ${notes.length ? `
                    <div class="sku460-rhs-notes-shell">
                        ${notes.map(note => `
                            <div class="sku460-rhs-note">${escapeHtml(note)}</div>
                        `).join("")}
                    </div>
                ` : ""}
            </div>
        `;
    }

    global.SKU460Renderer = {
        render,
        renderRHSBlock
    };
})(window);