console.log("[SKU4.50.js] file loaded");

(function initSKU450Renderer(global) {
    "use strict";

    //RHS render function // start 

    function renderTable({ targetEl, data }) {
        if (!targetEl) return;

        targetEl.innerHTML = "";

        const columns = data?.table?.columns || [];
        const rows = data?.table?.rows || [];

        if (!rows.length) {
            targetEl.innerHTML = `
            <div class="sku4-empty-state">
                No provider vs region benchmark table data available.
            </div>
        `;
            return;
        }

        targetEl.innerHTML = `
        <div class="sku450-rhs-wrap">
            <div class="sku450-rhs-title">Provider vs Region Benchmark</div>
            <div class="sku450-rhs-subtitle">
                Provider performance compared against the regional benchmark.
            </div>

            <table class="sku450-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col.label}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${columns.map(col => `
                                <td>${row[col.key] ?? ""}</td>
                            `).join("")}
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
    }

    //RHS render function // end 



    function render({ targetEl, data, contract, helpers = {} }) {
        if (!targetEl) return;

        const rows = Array.isArray(data) ? data : (data?.metrics || []);

        targetEl.innerHTML = "";

        console.log("[SKU4.50] render called", {
            key: contract?.data_binding_key,
            data,
            rows,
            rowCount: rows.length,
            metrics: data?.metrics,
            isArray: Array.isArray(data)
        });

        if (contract?.data_binding_key === "provider_vs_region_benchmark_rhs") {
            renderTable({ targetEl, data, contract, helpers });
            return;
        }

       

        if (!rows.length) {
            targetEl.innerHTML = `<div class="sku4-empty-state">No graph data available.</div>`;
            return;
        }

        if (!global.Plotly) {
            targetEl.innerHTML = `<div class="sku4-empty-state">Plotly is not loaded.</div>`;
            return;
        }

        const graphWrap = document.createElement("div");
        graphWrap.className = "sku4-tooltip-target";
        graphWrap.style.width = "100%";
        graphWrap.style.height = "520px";
        graphWrap.style.position = "relative";
        graphWrap.style.overflow = "visible";
        targetEl.appendChild(graphWrap);

        const graphHost = document.createElement("div");
        graphHost.style.width = "100%";
        graphHost.style.height = "100%";
        graphWrap.appendChild(graphHost);

        const metricLabels = rows.map(row =>
            row.metric_name || row.label || row.metric || row.metric_key || ""
        );

        const deltaValues = rows.map(row => {
            if (row.delta_pct != null) {
                return Number(row.delta_pct || 0);
            }

            const provider = Number(row.provider_value ?? row.provider ?? 0);
            const benchmark = Number(row.region_value ?? row.region ?? 0);

            if (!Number.isFinite(provider) || !Number.isFinite(benchmark) || benchmark === 0) {
                return 0;
            }

            return ((provider - benchmark) / Math.abs(benchmark)) * 100;
        });

        const topIndex = deltaValues.reduce((bestIdx, value, idx, arr) => {
            return Math.abs(value) > Math.abs(arr[bestIdx]) ? idx : bestIdx;
        }, 0);

        const customdata = rows.map(row => [
            row.provider_display || row.provider || row.provider_value || "",
            row.region_display || row.region || row.region_value || "",
            row.delta_pct_display || `${Number(row.delta_pct || 0).toFixed(1)}%`,
            row.interpretation || "",
            row.signal || ""
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
                "Delta vs Region: %{x:.2f}%<br>" +
                "Provider: %{customdata[0]}<br>" +
                "Region: %{customdata[1]}<br>" +
                "Signal: %{customdata[4]}<br>" +
                "%{customdata[3]}" +
                "<extra></extra>"
        };

        global.Plotly.newPlot(
            graphHost,
            [deltaTrace],
            {
                margin: { l: 190, r: 30, t: 20, b: 80 },
                paper_bgcolor: "#06101c",
                plot_bgcolor: "#06101c",
                font: { color: "#d9e2f1" },
                xaxis: {
                    title: "Delta vs Region (%)",
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
                        font: { size: 16 },
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

    global.SKU450Renderer = {
        render,
        renderTable
    };
})(window);