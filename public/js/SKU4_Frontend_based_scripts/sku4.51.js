// ------------------------------------------------------------
// SKU4.51 — Peer Benchmark (Provider CPT Domain)
//
// This renderer is SKU-specific and NOT shared with SKU5.
// It filters ICU/CCU metrics and operates on provider-level
// CPT benchmark data (array-based contract).
//
// Input shape:
// Array<{
//   metric_name,
//   provider_display,
//   peer_display,
//   delta_pct,
//   signal
// }>
//
// DO NOT reuse SKU5 renderer here — domain mismatch.
// ------------------------------------------------------------


(function initSKU451Renderer(global) {
    "use strict";
    console.log("[SKU4.51.js] file loaded");

    function render({ targetEl, data, contract, helpers = {} }) {
        if (!targetEl) return;

        targetEl.innerHTML = "";

        const rawMetrics = Array.isArray(data)
            ? data
            : (data?.metrics || []);

        const metrics = rawMetrics.filter(m => {
            const name = String(
                m.metric_name ||
                m.metric ||
                m.label ||
                m.metric_key ||
                ""
            ).toLowerCase();

            return !(
                name.includes("icu") ||
                name.includes("ccu")
            );
        });

        console.log("[SKU4.51] filtered metrics", metrics);

        if (!metrics.length) {
            targetEl.innerHTML =
                `<div class="sku4-empty-state">No peer benchmark data available.</div>`;
            return;
        }

        if (!global.Plotly) {
            targetEl.innerHTML =
                `<div class="sku4-empty-state">Plotly is not loaded.</div>`;
            return;
        }

        const graphWrap = document.createElement("div");
        graphWrap.style.width = "100%";
        graphWrap.style.height = "520px";
        targetEl.appendChild(graphWrap);

        const labels = metrics.map(m =>
            m.metric_name ||
            m.metric ||
            m.label ||
            m.metric_key ||
            "Unknown"
        );

        const values = metrics.map(m => {
            if (Number.isFinite(Number(m.delta_pct))) {
                return Number(m.delta_pct);
            }

            const provider = Number(m.provider_value ?? m.provider ?? 0);
            const peer = Number(m.peer_value ?? m.peer ?? 0);

            if (!Number.isFinite(provider) || !Number.isFinite(peer) || peer === 0) {
                return 0;
            }

            return ((provider - peer) / Math.abs(peer)) * 100;
        });

        const customdata = metrics.map((m, idx) => [
            m.provider_display ?? m.provider ?? "",
            m.peer_display ?? m.peer ?? "",
            m.delta_pct_display ?? `${values[idx].toFixed(1)}%`,
            m.signal ?? ""
        ]);

        const trace = {
            type: "bar",
            orientation: "h",
            x: values,
            y: labels,
            customdata,
            hovertemplate:
                "<b>%{y}</b><br>" +
                "Delta vs Peer: %{x:.2f}%<br>" +
                "Provider: %{customdata[0]}<br>" +
                "Peer: %{customdata[1]}<br>" +
                "Delta: %{customdata[2]}<br>" +
                "Signal: %{customdata[3]}" +
                "<extra></extra>"
        };

        const layout = {
            margin: { l: 180, r: 30, t: 20, b: 70 },
            paper_bgcolor: "#06101c",
            plot_bgcolor: "#06101c",
            font: { color: "#d9e2f1" },
            xaxis: {
                title: "Delta vs Peer (%)",
                automargin: true,
                zeroline: true,
                gridcolor: "rgba(255,255,255,0.06)",
                zerolinecolor: "rgba(255,255,255,0.35)"
            },
            yaxis: {
                automargin: true,
                gridcolor: "rgba(255,255,255,0.04)"
            },
            showlegend: false,
            hoverlabel: {
                bgcolor: "#0b1626",
                bordercolor: "rgba(255,255,255,0.12)",
                font: { color: "#e7eef8", size: 14 },
                align: "left",
                namelength: -1
            }
        };

        global.Plotly.newPlot(
            graphWrap,
            [trace],
            layout,
            {
                responsive: true,
                displaylogo: false,
                scrollZoom: true
            }
        );
    }

    global.SKU451Renderer = { render };

})(window);