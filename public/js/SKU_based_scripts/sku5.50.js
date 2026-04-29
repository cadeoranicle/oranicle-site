(function initSKU550Renderer(global) {
    "use strict";

    function render({ targetEl, data, contract, helpers = {} }) {
        if (!targetEl) return;

        const {
            formatBenchmarkMetricLabel,
            formatTableCell
        } = helpers;

        targetEl.innerHTML = "";

        if (!Array.isArray(data) || !data.length) {
            targetEl.innerHTML = `<div class="sku5-empty-state">No graph data available.</div>`;
            return;
        }

        if (!global.Plotly) {
            targetEl.innerHTML = `<div class="sku5-empty-state">Plotly is not loaded.</div>`;
            return;
        }

        const graphWrap = document.createElement("div");
        graphWrap.className = "sku5-tooltip-target";
        graphWrap.style.width = "100%";
        graphWrap.style.height = "520px";
        graphWrap.style.position = "relative";
        graphWrap.style.overflow = "visible";
        targetEl.appendChild(graphWrap);

        const graphHost = document.createElement("div");
        graphHost.style.width = "100%";
        graphHost.style.height = "100%";
        graphWrap.appendChild(graphHost);

        const marker = document.createElement("div");
        marker.className = "sku5-tooltip-marker";
        marker.classList.add("sku5-graph-bee-marker");
        graphWrap.appendChild(marker);

        const x = data.map(row => formatBenchmarkMetricLabel(row.metric || ""));
        const y = data.map(row => {
            const provider = Number(row.provider ?? 0);
            const benchmark = Number(row.region ?? 0);

            if (!Number.isFinite(provider) || !Number.isFinite(benchmark) || benchmark === 0) {
                return 0;
            }

            return ((provider - benchmark) / Math.abs(benchmark)) * 100;
        });

        const metricLabels = x;
        const deltaValues = y;

        const topIndex = deltaValues.reduce((bestIdx, value, idx, arr) => {
            return Math.abs(value) > Math.abs(arr[bestIdx]) ? idx : bestIdx;
        }, 0);

        const metricDescriptions = {
            "C1 Position": "Relative economic intensity position in canonical space.",
            "Total Paid": "Total reimbursement volume across the observed period.",
            "Paid per Claim": "Average reimbursement per claim.",
            "Claims per Beneficiary": "Utilization intensity per beneficiary.",
            "ICU Share": "Share of claims associated with ICU-like activity.",
            "CCU Share": "Share of claims associated with ICU-like activity.",
            "Unique HCPCS Count": "Breadth of CPT / HCPCS activity."
        };

        const customdata = data.map(row => [
            formatTableCell("provider", row.provider, row),
            formatTableCell("region", row.region, row),
            formatTableCell("delta", row.delta, row),
            metricDescriptions[row.metric] || ""
        ]);

        const deltaTrace = {
            type: "bar",
            orientation: "h",
            name: "Delta %",
            x: deltaValues,
            y: metricLabels,
            customdata,
            hovertemplate:
                "<b>%{y}</b><br>" +
                "Delta vs Benchmark: %{x:.2f}%<br>" +
                "Hospital: %{customdata[0]}<br>" +
                "Benchmark: %{customdata[1]}<br>" +
                "Delta Value: %{customdata[2]}<br>" +
                "%{customdata[3]}" +
                "<extra></extra>"
        };

        global.Plotly.newPlot(
            graphHost,
            [deltaTrace],
            {
                margin: { l: 180, r: 30, t: 20, b: 80 },
                paper_bgcolor: "#06101c",
                plot_bgcolor: "#06101c",
                font: { color: "#d9e2f1" },
                xaxis: {
                    title: "Delta vs Benchmark (%)",
                    automargin: true,
                    zeroline: true
                },
                yaxis: {
                    automargin: true
                },
                showlegend: false,
                hoverlabel: {
                    bgcolor: "#0b1626",
                    bordercolor: "rgba(255,255,255,0.12)",
                    font: {
                        color: "#e7eef8",
                        size: 22
                    },
                    align: "left",
                    namelength: -1
                },
                annotations: [
                    {
                        xref: "x",
                        yref: "y",
                        x: deltaValues[topIndex],
                        y: metricLabels[topIndex],
                        text: "🐝",
                        showarrow: false,
                        font: {
                            size: 16
                        },
                        xanchor: deltaValues[topIndex] >= 0 ? "left" : "right",
                        yanchor: "middle",
                        xshift: deltaValues[topIndex] >= 0 ? 12 : -12
                    }
                ]
            },
            {
                responsive: true,
                displaylogo: false,
                scrollZoom: true
            }
        );
    }

    global.SKU550Renderer = {
        render
    };
})(window);