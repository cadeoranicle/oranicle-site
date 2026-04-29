console.log("[SKU5.64.js] file loaded");

(function initSKU564Renderer(global) {
    "use strict";

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }


    function formatWholeNumber(value) {
        return Number(value || 0).toLocaleString("en-US", {
            maximumFractionDigits: 0
        });
    }

    function formatCompactCurrency(value) {
        const n = Number(value || 0);
        if (Math.abs(n) >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
        if (Math.abs(n) >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
        return "$" + n.toFixed(0);
    }

    function formatPercentFromFraction(value) {
        return (Number(value || 0) * 100).toFixed(1) + "%";
    }

    function render({ targetEl, payload, contract }) {
        if (!targetEl) return;

        const summary = payload?.summary || {};
        const notes = Array.isArray(payload?.notes) ? payload.notes : [];
        const chart = payload?.chart || {};

        targetEl.innerHTML = `
            <div class="sku564-shell">
                <div class="sku564-header">
                    <div class="sku564-title">Coding Integrity Risk</div>
                    <div class="sku564-subtitle">
                        CPT-level undercoding and reimbursement gap risk based on benchmark comparison
                    </div>
                </div>

                <section class="sku564-summary-grid">
                    <div class="sku564-kpi-card">
                        <div class="sku564-kpi-label">CPTs Reviewed</div>
                        <div class="sku564-kpi-value">${summary.total_cpts_reviewed || 0}</div>
                    </div>

                    <div class="sku564-kpi-card">
                        <div class="sku564-kpi-label">Highest Risk CPT</div>
                        <div class="sku564-kpi-value">${escapeHtml(summary.highest_risk_cpt_code || "—")}</div>
                        <div class="sku564-kpi-sub">${escapeHtml(summary.highest_risk_cpt_name || "")}</div>
                    </div>

                    <div class="sku564-kpi-card">
                        <div class="sku564-kpi-label">Top Risk Score</div>
                        <div class="sku564-kpi-value">${Number(summary.top_integrity_risk_score || 0).toFixed(2)}</div>
                    </div>
                </section>

                <section class="sku564-chart-section">
                    <div class="sku564-chart-header">
                        <div class="sku564-chart-title">Coding Risk Viewer</div>
                        <div class="sku564-chart-subtitle">
                            CPT-level coding integrity risk ranked by reimbursement gap and claim weight
                        </div>
                    </div>

                    <div class="sku564-chart-shell">
                        <div id="sku564Chart" class="sku564-chart-host"></div>
                    </div>
                </section>

                <section class="sku564-narrative-block">
                    <h3 class="sku564-section-title">Why this matters</h3>
                    <p>${escapeHtml(notes[0] || "")}</p>
                    <p>${escapeHtml(notes[1] || "")}</p>
                </section>
            </div>
        `;

        renderChart(chart);
    }

    function renderChart(chart = {}) {
        console.log("[SKU5.64] renderChart entered", chart);

        const chartHost = document.getElementById("sku564Chart");
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

        window.__SKU564_DEBUG__ = {
            chart,
            labels,
            values,
            text
        };

        global.Plotly.newPlot(
            chartHost,
            [
                {
                    type: "bar",
                    orientation: "h",
                    name: "Coding Risk",
                    x: values,
                    y: labels,
                    customdata: text,
                    marker: {
                        size: 12,
                        color: values,
                        colorscale: "Reds",
                        showscale: false
                    },
                    textposition: "top center",
                    hovertemplate:
                        "<b>CPT %{customdata[0]}</b><br>" +
                        "Claims: %{customdata[1]}<br>" +
                        "Provider: %{customdata[2]}<br>" +
                        "Region: %{customdata[3]}<br>" +
                        "Gap: %{customdata[4]}<br>" +
                        "Leakage: %{customdata[5]}<br>" +
                        "<b>Risk Score: %{customdata[6]}</b><extra></extra>"
                }
            ],
            {
                margin: { l: 70, r: 30, t: 30, b: 90 },
                paper_bgcolor: "#08131f",
                plot_bgcolor: "#08131f",
                font: { color: "#d8e1ea", size: 12 },
                xaxis: {
                    title: "Coding Integrity Risk Score",
                    range: [0, Math.max(...values) * 1.25],
                    automargin: true
                },
                yaxis: {
                    title: "",
                    type: "category",
                    automargin: true
                },
                hoverlabel: {
                    bgcolor: "#1c3553",
                    bordercolor: "#7ea6ff",
                    font: { color: "#ffffff", size: 13 }
                },
                annotations: [],
                showlegend: false
            },
            {
                responsive: true,
                displaylogo: false,
                scrollZoom: false
            }
        );
    }

    function renderRHSBlock(input = {}) {
        console.log("[SKU5.64 RHS input]", input);

        const targetEl = input?.targetEl || null;
        const payload = input?.payload || input;

        console.log("[SKU5.64 RHS resolved payload]", payload);

        const summary = payload?.summary || {};
        const rows =
            payload?.table?.rows ||
            payload?.ranked_cpts ||
            [];

        const totalLeakage =
            Number(summary.total_revenue_leakage || 0) ||
            rows.reduce((sum, r) => sum + Number(r.revenue_leakage || 0), 0);

        const topLeakageRow = [...rows].sort(
            (a, b) => Number(b.revenue_leakage || 0) - Number(a.revenue_leakage || 0)
        )[0] || {};

        const totalClaims = rows.reduce(
            (sum, r) => sum + Number(r.total_claims || 0),
            0
        );

        const html = `
        <div class="sku564-rhs-wrap">
            <div class="sku564-rhs-hero">
                <div class="sku564-kpi-card">
                    <div class="sku564-kpi-label">Estimated Revenue Leakage</div>
                    <div class="sku564-kpi-value">${formatCompactCurrency(totalLeakage)}</div>
                    <div class="sku564-kpi-sub">Reimbursement gap × exposed claims</div>
                </div>

                <div class="sku564-kpi-card">
                    <div class="sku564-kpi-label">Top Leakage CPT</div>
                    <div class="sku564-kpi-value">${topLeakageRow.cpt_code || "—"}</div>
                    <div class="sku564-kpi-sub">${formatCompactCurrency(topLeakageRow.revenue_leakage || 0)}</div>
                </div>

                <div class="sku564-kpi-card">
                    <div class="sku564-kpi-label">Claims Exposed</div>
                    <div class="sku564-kpi-value">${formatWholeNumber(totalClaims)}</div>
                    <div class="sku564-kpi-sub">Across flagged CPTs</div>
                </div>

                <div class="sku564-kpi-card">
                    <div class="sku564-kpi-label">Top Risk Score</div>
                    <div class="sku564-kpi-value">${Number(summary.top_integrity_risk_score || 0).toFixed(2)}</div>
                    <div class="sku564-kpi-sub">Coding integrity signal</div>
                </div>
            </div>

            <div class="sku564-section-title">Coding Gap & Revenue Loss</div>

            <div class="sku564-table-wrap">
                <table class="sku564-table">
                    <thead>
                        <tr>
                            <th>CPT</th>
                            <th>Claims</th>
                            <th>Provider PPC</th>
                            <th>Region PPC</th>
                            <th>Gap</th>
                            <th>Leakage</th>
                            <th>Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `
                            <tr>
                                <td><strong>${row.cpt_code || "—"}</strong></td>
                                <td>${formatWholeNumber(row.total_claims || 0)}</td>
                                <td>${formatCompactCurrency(row.provider_paid_per_claim || 0)}</td>
                                <td>${formatCompactCurrency(row.region_paid_per_claim || 0)}</td>
                                <td>${formatPercentFromFraction(row.reimbursement_gap_pct || 0)}</td>
                                <td><strong>${formatCompactCurrency(row.revenue_leakage || 0)}</strong></td>
                                <td>${Number(row.integrity_risk_score || 0).toFixed(2)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

            <div class="sku564-footnote">
                Estimates are based on reimbursement gaps versus regional benchmarks and exclude claim-level adjustments such as modifiers, denials, and contract-specific rules.
            </div>
        </div>
    `;

        if (targetEl) {
            targetEl.innerHTML = html;
        }

        return html;
    }
    global.SKU564Renderer = {
        render,
        renderRHSBlock,
        renderRHS: renderRHSBlock,
        renderNarrative: renderRHSBlock,
        renderDataTable: renderRHSBlock
    };

})(window);