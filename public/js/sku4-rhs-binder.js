window.SKU4RhsBinder = (() => {
    function formatValue(value) {
        if (value === null || value === undefined || value === "-") return "-";

        if (typeof value === "number") return value.toFixed(2);

        const numeric = Number(value);
        if (!Number.isNaN(numeric) && value !== "") return numeric.toFixed(2);

        return String(value);
    }

    function getRhsStack() {
        return document.getElementById("rhsBlockStack");
    }

    function clearRhsStack() {
        console.log("CLEAR RHS STACK");
        const el = getRhsStack();
        if (!el) return;
        el.innerHTML = "";
    }

    function appendRhsBlock(blockId, title, html) {
        const stack = getRhsStack();
        if (!stack) return;

        if (stack.querySelector(`[data-rhs-block-id="${blockId}"]`)) {
            console.log("SKIP DUPLICATE RHS BLOCK:", blockId);
            return;
        }

        const block = document.createElement("div");
        block.className = "rhs-render-block";
        block.setAttribute("data-rhs-block-id", blockId);
        block.innerHTML = `
            <h3 class="section-title">${title}</h3>
            ${html}
        `;
        stack.appendChild(block);
    }

    function renderProviderVsRegionBenchmark(payload, skuId) {
        if (!payload) return;
        console.log("renderProviderVsRegionBenchmark payload", payload);

        appendRhsBlock(`${skuId}.summary`, "Provider Summary", `
            <div class="meta-row">
                <div><span>NPI</span><b>${formatValue(payload.provider_npi)}</b></div>
                <div><span>Region</span><b>${formatValue(payload.region)}</b></div>
            </div>
        `);

        appendRhsBlock(`${skuId}.regional`, "Regional Benchmark", `
            <div class="meta-row">
                <div><span>$/Claim (Avg)</span><b>${formatValue(payload.region_avg_intensity)}</b></div>
                <div><span>Claims/Beneficiary (Avg)</span><b>${formatValue(payload.region_avg_utilization)}</b></div>
                <div><span>Revenue (Avg)</span><b>${formatValue(payload.region_avg_revenue)}</b></div>
            </div>
        `);

        appendRhsBlock(`${skuId}.delta`, "Provider vs Regional Benchmark", `
            <div class="meta-row">
                <div><span>Δ $/Claim</span><b>${formatValue(payload.delta_intensity)}</b></div>
                <div><span>Δ Utilization</span><b>${formatValue(payload.delta_utilization)}</b></div>
                <div><span>Δ Revenue</span><b>${formatValue(payload.delta_revenue)}</b></div>
            </div>
            <div style="margin-top:12px;">
                <span>Interpretation</span>
                <p class="copy">${formatValue(payload.interpretation)}</p>
            </div>
        `);
    }

    function renderProviderVsZoneBenchmark(payload, skuId) {
        if (!payload) return;
        console.log("renderProviderVsZoneBenchmark payload", payload);

        appendRhsBlock(`${skuId}.peercohort`, "Peer Cohort", `
            <div class="meta-row">
                <div><span>$/Claim (Zone Avg)</span><b>${formatValue(payload.zone_avg_intensity)}</b></div>
                <div><span>Claims/Beneficiary (Zone Avg)</span><b>${formatValue(payload.zone_avg_utilization)}</b></div>
                <div><span>Revenue (Zone Avg)</span><b>${formatValue(payload.zone_avg_revenue)}</b></div>
            </div>
        `);

        appendRhsBlock(`${skuId}.peerdelta`, "Provider vs Peer Benchmark", `
            <div class="meta-row">
                <div><span>Δ $/Claim</span><b>${formatValue(payload.delta_intensity)}</b></div>
                <div><span>Δ Utilization</span><b>${formatValue(payload.delta_utilization)}</b></div>
                <div><span>Δ Revenue</span><b>${formatValue(payload.delta_revenue)}</b></div>
            </div>
            <div style="margin-top:12px;">
                <span>Interpretation</span>
                <p class="copy">${formatValue(payload.interpretation)}</p>
            </div>
        `);
    }

    function renderSku4P1NearestNeighborPeer(payload, skuId) {
        console.log("renderSku4P1NearestNeighborPeer CALLED", { skuId, payload });

        const blockId = `rhs-${skuId}-nearest-peer`;
        const firstNeighbor = payload?.neighbors?.[0];

        console.log("renderSku4P1 firstNeighbor =", firstNeighbor);

        if (!firstNeighbor) {
            console.log("renderSku4P1 EXIT no firstNeighbor");
            return;
        }

        const html = `
        <div class="rhs-peer-pack">
            <div><strong>Peer NPI:</strong> ${firstNeighbor.peer_npi ?? "—"}</div>
            ${fmtScore(firstNeighbor?.similarity_score)}
            ${fmtScore(firstNeighbor?.distance_score)}
            ${fmtClusterMatch(firstNeighbor?.cluster_match)}
            <div style="margin-top:8px;">
                Closest comparable peer based on normalized distance across financial, utilization  and structural metrics.
            </div>
        </div>
    `;

        console.log("renderSku4P1 append blockId =", blockId);
        appendRhsBlock(blockId, "Nearest Neighbor Peer", html);
    }



    const DRIVER_LABEL_MAP = {
        "PCA PC1 position": "Care Economic Intensity",
        "PCA PC2 position": "Utilization Structure",
        "PCA PC3 position": "Provider Scale",
        "utilization structure": "Utilization Structure",
        "specialization": "Specialization",
        "payment efficiency": "Payment Efficiency",
        "region distance": "Regional Proximity",
        "timeline depth": "Historical Activity Depth",
        "CPT breadth": "Procedure Breadth"
    };


    function fmtScore(value, digits = 3) {
        return (typeof value === "number" && Number.isFinite(value))
            ? value.toFixed(digits)
            : "—";
    }

    function fmtClusterMatch(value) {
        return value === true ? "Same Cluster" : "Adjacent Cluster";
    }


    function renderPeerSimilarityDrivers(payload, skuId) {
        const blockId = `rhs-${skuId}-peer-similarity-drivers`;

        const firstPeer = Array.isArray(payload?.peer_driver_analysis)
            ? payload.peer_driver_analysis[0]
            : null;

        const consensus = Array.isArray(payload?.consensus_similarity_drivers)
            ? payload.consensus_similarity_drivers
            : [];

        const topDrivers = Array.isArray(firstPeer?.top_similarity_drivers)
            ? firstPeer.top_similarity_drivers
            : [];

        const summary = payload?.summary || "";

        const clusterMatchText =
            firstPeer?.cluster_match === true
                ? "Same Cluster"
                : "Adjacent Cluster";

        const peerMetaHtml = firstPeer
            ? `
            <div class="meta-row">
                <div><span>Peer NPI</span><b>${firstPeer.peer_npi ?? "—"}</b></div>
                ${fmtScore(firstPeer?.similarity_score)}
                ${fmtScore(firstPeer?.distance_score)}
                ${fmtClusterMatch(firstPeer?.cluster_match)}
            </div>
        `
            : `<div class="rhs-empty-state">No peer driver analysis available.</div>`;

        const consensusHtml = consensus.length
            ? `
            <div style="margin-top:12px;">
                <span>Consensus Drivers</span>
                <p class="copy">${consensus.join(", ")}</p>
            </div>
        `
            : "";

        const topDriversHtml = topDrivers.length
            ? `
        <div style="margin-top:12px;">
            <span>Top Similarity Drivers</span>
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
                ${topDrivers.map(driver => `
                    <div style="border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:10px 12px;">
                        <div style="font-weight:600; margin-bottom:8px;">
                            ${DRIVER_LABEL_MAP[driver?.label] || driver?.label || driver?.metric || "—"}
                        </div>

                        <div class="meta-row" style="margin-top:0;">
                            <div><span>Provider</span><b>${fmtScore(driver?.provider_value, 3)}</b></div>
                            <div><span>Peer</span><b>${fmtScore(driver?.peer_value, 3)}</b></div>
                        </div>

                        <div class="meta-row" style="margin-top:8px;">
                            <div><span>Gap</span><b>${fmtScore(driver?.normalized_gap, 3)}</b></div>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `
            : "";

        const summaryHtml = summary
            ? `
            <div style="margin-top:12px;">
                <span>Summary</span>
                <p class="copy">${summary}</p>
            </div>
        `
            : "";

        const html = `
        <div class="rhs-peer-similarity-block">
            ${peerMetaHtml}
            ${consensusHtml}
            ${topDriversHtml}
            ${summaryHtml}
        </div>
    `;

        appendRhsBlock(blockId, "Peer Similarity Drivers", html);
    }

    function renderTopComparableProviders(payload, skuId) {
        if (!payload) return;

        const rows = (payload.providers || []).map(p => `
            <div style="margin-top:10px;padding:10px;border:1px solid #223043;border-radius:10px;">
                <div><b>NPI</b> ${formatValue(p.provider_npi)}</div>
                <div><b>Rank</b> ${formatValue(p.rank)}</div>
                <div><b>Similarity</b> ${formatValue(p.similarity_score)}</div>
                <div><b>Revenue</b> ${formatValue(p.revenue)}</div>
                <div><b>Intensity</b> ${formatValue(p.intensity)}</div>
                <div><b>Utilization</b> ${formatValue(p.utilization)}</div>
            </div>
        `).join("");

        appendRhsBlock(`${skuId}.comparables`, "Top Comparable Providers", rows || "<div>-</div>");
    }

    const COHORT_FLAG_MAP = {
        "above_median": "Above Cohort Median",
        "below_median": "Below Cohort Median",
        "at_median": "Near Cohort Median"
    };

    function renderCohortPercentiles(payload, skuId) {
        if (!payload) return;

        const rows = (payload.metric_percentiles || []).map(r => `
            <div style="margin-top:10px;padding:10px;border:1px solid #223043;border-radius:10px;">
                <div><b>${formatValue(r.label)}</b></div>
                <div>Provider: ${formatValue(r.provider_value)}</div>
                <div>Cohort Median: ${formatValue(r.cohort_median)}</div>
                <div>Percentile: ${formatValue(r.provider_percentile)}</div>
                <div>Position: ${COHORT_FLAG_MAP[r.comparison_flag] || r.comparison_flag || "—"}</div>
            </div>
        `).join("");

        appendRhsBlock(`${skuId}.percentiles`, "Cohort Median and Percentiles", `
            <div><b>Cohort Size</b> ${formatValue(payload.cohort_size)}</div>
            <div style="margin-top:10px;">${rows}</div>
        `);
    }


    function renderOverperformingCptAreas(data, skuId) {
        const rows = Array.isArray(data?.cpts) ? data.cpts : [];

        const html = `
        <div class="rhs-block">
            <div class="rhs-title">Overperforming CPT Areas</div>
            <div class="rhs-subtitle">
                CPTs where the provider appears stronger than peer median.
            </div>

            ${rows.length
                ? rows.map(row => `
                        <div class="rhs-card" style="margin-top:12px; padding:10px; border:1px solid rgba(255,255,255,0.08); border-radius:8px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <div style="font-weight:600;">
                                    ${row?.cpt_code || "—"}
                                </div>
                                <div style="font-size:11px; opacity:0.7;">
                                    ${row?.comparison_flag || "above peer median"}
                                </div>
                            </div>

                            <div style="font-size:12px; opacity:0.75; margin-bottom:8px;">
                                ${row?.interpretation || ""}
                            </div>

                            <div class="meta-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                                <div class="meta-row">
                                    <span>Provider Paid</span>
                                    <b>${formatValue(row?.provider_total_paid)}</b>
                                </div>
                                <div class="meta-row">
                                    <span>Peer Median Paid</span>
                                    <b>${formatValue(row?.peer_median_total_paid)}</b>
                                </div>

                                <div class="meta-row">
                                    <span>Revenue Delta</span>
                                    <b>${formatValue(row?.delta_total_paid_pct)}%</b>
                                </div>
                                <div class="meta-row">
                                    <span>Revenue Percentile</span>
                                    <b>${formatValue(row?.percentile_total_paid)}</b>
                                </div>

                                <div class="meta-row">
                                    <span>Provider Claims</span>
                                    <b>${formatValue(row?.provider_total_claims)}</b>
                                </div>
                                <div class="meta-row">
                                    <span>Peer Median Claims</span>
                                    <b>${formatValue(row?.peer_median_total_claims)}</b>
                                </div>
                            </div>
                        </div>
                    `).join("")
                : `
                        <div class="rhs-empty-state">
                            No overperforming CPT areas found for this provider.
                        </div>
                    `
            }
        </div>
    `;

        const blockId = `${skuId}.overperforming_cpt_areas`;
        appendRhsBlock(blockId, "Overperforming CPT Areas", html);
    }

    function renderUnderperformingCptAreas(data, skuId) {
        const rows = Array.isArray(data?.cpts) ? data.cpts : [];

        const html = `
    <div class="rhs-block">
        <div class="rhs-title">Underperforming CPT Areas</div>
        <div class="rhs-subtitle">
            CPTs where the provider appears weaker than peer median.
        </div>

        ${rows.length
                ? rows.map(row => `
                <div class="rhs-card" style="margin-top:12px; padding:10px; border:1px solid rgba(255,255,255,0.08); border-radius:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <div style="font-weight:600;">
                            ${row.cpt_code || ""}
                        </div>
                        <div style="font-size:11px; opacity:0.7;">
                            Paid percentile: ${row.percentile_total_paid ?? "-"}
                        </div>
                    </div>

                    ${row.cpt_label ? `
                        <div style="font-size:12px; opacity:0.85; margin-bottom:8px;">
                            ${row.cpt_label}
                        </div>
                    ` : ""}

                    <div class="rhs-metric-grid">
                        <div class="rhs-metric">
                            <div class="rhs-label">Provider Paid</div>
                            <div class="rhs-value">$${formatNumber(row.provider_total_paid)}</div>
                        </div>

                        <div class="rhs-metric">
                            <div class="rhs-label">Peer Median Paid</div>
                            <div class="rhs-value">$${formatNumber(row.peer_median_total_paid)}</div>
                        </div>

                        <div class="rhs-metric">
                            <div class="rhs-label">Provider Claims</div>
                            <div class="rhs-value">${formatNumber(row.provider_total_claims)}</div>
                        </div>

                        <div class="rhs-metric">
                            <div class="rhs-label">Peer Median Claims</div>
                            <div class="rhs-value">${formatNumber(row.peer_median_total_claims)}</div>
                        </div>
                    </div>

                    <div style="margin-top:8px; font-size:12px; color:#f59e0b;">
                        Paid Gap: ${formatSignedPercent(row.delta_total_paid_pct)}
                    </div>

                    <div style="font-size:12px; color:#ef4444;">
                        Claims Gap: ${formatSignedPercent(row.delta_total_claims_pct)}
                    </div>

                    <div style="font-size:12px; color:#fb7185;">
                        Reimbursement / Claim Gap: ${formatSignedPercent(row.delta_paid_per_claim_pct)}
                    </div>

                    <div style="margin-top:8px; font-size:12px; opacity:0.8; line-height:1.5;">
                        ${row.interpretation || ""}
                    </div>
                </div>
            `).join("")
                : `<div class="rhs-empty">No underperforming CPT areas found.</div>`
            }
    </div>
    `;

        const blockId = `${skuId}.underperforming_cpt_areas`;
        appendRhsBlock(blockId, "Underperforming CPT Areas", html);
    }

    function formatNumber(value) {
        if (value === null || value === undefined || value === "") return "-";
        const num = Number(value);
        if (!Number.isFinite(num)) return "-";
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    function formatSignedPercent(value) {
        if (value === null || value === undefined || value === "") return "-";
        const num = Number(value);
        if (!Number.isFinite(num)) return "-";
        return `${num > 0 ? "+" : ""}${num.toFixed(1)}%`;
    }

    function renderFixableCptAreas(data, skuId) {
        const rows = Array.isArray(data?.cpts) ? data.cpts : [];
        const def = window.SKU4_REGISTRY?.[skuId] || {};
        const infographHtml =
            window.SKU4InfographEngine?.render(def.infograph_type, data, { skuId }) || "";

        const tableRows = rows.length
            ? rows.slice(0, 4).map(row => `
            <tr>
                <td class="rhs-metric-emphasis">${row.cpt_code || "—"}</td>
                <td>$${formatNumber(row.provider_total_paid)}</td>
                <td>$${formatNumber(row.peer_median_total_paid)}</td>
                <td>${formatSignedPercent(row.delta_total_paid_pct)}</td>
                <td>${formatNumber(row.fixability_score)}</td>
            </tr>
        `).join("")
            : `<tr><td colspan="5">No fixable CPT areas found.</td></tr>`;

        const primaryNarrative = rows.length
            ? `These CPTs appear operationally recoverable because the provider already shows some real activity, but still trails peers in volume, reimbursement per claim, or both.`
            : `No operationally recoverable CPT opportunities were identified for this provider in the current opportunity artifact.`;

        const topInterpretation = rows[0]?.interpretation || "No interpretation available.";
        const topAction = rows.length
            ? "Review coding pattern, payer behavior, and service penetration for the highest-ranked CPTs first."
            : "No immediate recovery action suggested from current CPT opportunity scoring.";

        const html = `
        <div class="rhs-dataset">
            <div class="rhs-frame">

                <div class="rhs-frame-header">
                    <div class="rhs-frame-title-row">
                        <div class="rhs-frame-title">Fixable CPT Areas</div>
                        <div class="rhs-frame-badge">Recovery Layer</div>
                    </div>
                    <div class="rhs-frame-subtitle">
                        CPTs that appear operationally recoverable relative to peer cohort.
                    </div>
                    <div class="rhs-frame-context">
                        Focus on moderate underperformance with existing provider activity.
                    </div>
                </div>

                <div class="rhs-frame-narrative">
                    ${primaryNarrative}
                </div>

                <div class="rhs-frame-main">
                    <div class="rhs-frame-metrics">
                        <table class="rhs-metric-table">
                            <thead>
                                <tr>
                                    <th>CPT</th>
                                    <th>Provider Paid</th>
                                    <th>Peer Paid</th>
                                    <th>Paid Gap</th>
                                    <th>Fixability</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>

                    <div class="rhs-frame-visual">
                        ${infographHtml}
                    </div>
                </div>

                <div class="rhs-frame-footer">
                    <div class="rhs-frame-interpretation">
                        <div class="rhs-frame-footer-label">Interpretation</div>
                        <div class="rhs-frame-footer-text">
                            ${topInterpretation}
                        </div>
                    </div>

                    <div class="rhs-frame-action">
                        <div class="rhs-frame-footer-label">Action</div>
                        <div class="rhs-frame-footer-text">
                            ${topAction}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

        const blockId = `${skuId}.fixable_cpt_areas`;
        appendRhsBlock(blockId, "Fixable CPT Areas", html);
    }

    function renderMonetizableCptAreas(data, skuId) {
        const rows = Array.isArray(data?.cpts) ? data.cpts : [];
        const def = window.SKU4_REGISTRY?.[skuId] || {};

        const infographHtml =
            window.SKU4InfographEngine?.render(def.infograph_type, data, { skuId }) || "";

        const tableRows = rows.length
            ? rows.slice(0, 5).map(row => `
            <tr>
                <td class="rhs-metric-emphasis">${row.cpt_code || "—"}</td>
                <td>$${formatNumber(row.provider_total_paid)}</td>
                <td>$${formatNumber(row.peer_median_total_paid)}</td>
                <td>$${formatNumber(row.estimated_upside_value)}</td>
                <td>${formatNumber(row.monetizable_score)}</td>
            </tr>
        `).join("")
            : `<tr><td colspan="5">No monetizable CPT areas found.</td></tr>`;

        const primaryNarrative = rows.length
            ? `These CPTs represent the largest estimated peer-gap revenue opportunities. The strongest upside comes from CPTs where the provider trails peers in reimbursement volume, pricing strength, or both.`
            : `No monetizable CPT opportunities were identified for this provider in the current opportunity artifact.`;

        const topInterpretation = rows[0]?.interpretation || "No interpretation available.";
        const topAction = rows.length
            ? "Prioritize CPTs with the highest estimated upside and strongest monetizable score first."
            : "No immediate monetization action suggested from current CPT opportunity scoring.";

        const html = `
        <div class="rhs-dataset">
            <div class="rhs-frame">

                <div class="rhs-frame-header">
                    <div class="rhs-frame-title-row">
                        <div class="rhs-frame-title">Monetizable CPT Areas</div>
                        <div class="rhs-frame-badge">Revenue Layer</div>
                    </div>

                    <div class="rhs-frame-subtitle">
                        CPTs with the strongest estimated peer-gap revenue upside.
                    </div>

                    <div class="rhs-frame-context">
                        Focus on highest-value CPT gaps relative to peer cohort.
                    </div>
                </div>

                <div class="rhs-frame-narrative">
                    ${primaryNarrative}
                </div>

                <div class="rhs-frame-main">
                    <div class="rhs-frame-metrics">
                        <table class="rhs-metric-table">
                            <thead>
                                <tr>
                                    <th>CPT</th>
                                    <th>Provider Paid</th>
                                    <th>Peer Paid</th>
                                    <th>Upside</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>

                    <div class="rhs-frame-visual">
                        ${infographHtml}
                    </div>
                </div>

                <div class="rhs-frame-footer">
                    <div class="rhs-frame-interpretation">
                        <div class="rhs-frame-footer-label">Interpretation</div>
                        <div class="rhs-frame-footer-text">
                            ${topInterpretation}
                        </div>
                    </div>

                    <div class="rhs-frame-action">
                        <div class="rhs-frame-footer-label">Action</div>
                        <div class="rhs-frame-footer-text">
                            ${topAction}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

        const blockId = `${skuId}.monetizable_cpt_areas`;
        appendRhsBlock(blockId, "Monetizable CPT Areas", html);
    }

    function renderCptLeakageAreas(data, skuId) {
        const rows = Array.isArray(data?.cpts) ? data.cpts : [];

        const html = `
        <div class="rhs-block">
            <div class="rhs-title">CPT Leakage Areas</div>
            <div class="rhs-subtitle">
                CPTs where peers appear materially active but this provider shows very low activity.
            </div>

            ${rows.length
                ? rows.map(row => `
                    <div class="rhs-card" style="margin-top:12px; padding:10px; border:1px solid rgba(255,255,255,0.08); border-radius:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <div style="font-weight:600;">
                                ${row?.cpt_code || "—"}
                            </div>
                            <div style="font-size:11px; opacity:0.7;">
                                ${row?.comparison_flag || "missing from provider"}
                            </div>
                        </div>

                        <div style="font-size:12px; opacity:0.75; margin-bottom:8px;">
                            ${row?.interpretation || ""}
                        </div>

                        <div style="font-size:12px; opacity:0.75; margin-bottom:8px;">
    ${row?.interpretation || ""}
</div>

<div style="margin-top:10px; margin-bottom:10px;">
    <div style="display:flex; justify-content:space-between; font-size:11px; opacity:0.7; margin-bottom:4px;">
        <span>Provider vs Peer Position</span>
        <span>${formatValue(row?.provider_vs_peer_claims_pct)}%</span>
    </div>

    <div style="
        display:flex;
        height:10px;
        border-radius:999px;
        overflow:hidden;
        background:rgba(255,255,255,0.08);
    ">
        <div style="
            width:${row?.provider_vs_peer_claims_pct || 0}%;
            background:linear-gradient(90deg, #34d399, #60a5fa);
        "></div>

        <div style="
            width:${row?.remaining_peer_gap_pct || 0}%;
            background:rgba(255,255,255,0.12);
        "></div>
        </div>

         <div style="font-size:11px; opacity:0.65; margin-top:4px;">
        ${formatValue(row?.remaining_peer_gap_pct)}% remaining opportunity gap
        </div>
        </div>

        <div class="meta-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">

                        <div class="meta-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                            <div class="meta-row">
                                <span>Provider Paid</span>
                                <b>$${formatValue(row?.provider_total_paid)}</b>
                            </div>
                            <div class="meta-row">
                                <span>Peer Median Paid</span>
                                <b>$${formatValue(row?.peer_median_total_paid)}</b>
                            </div>

                            <div class="meta-row">
                                <span>Provider Claims</span>
                                <b>$${formatValue(row?.provider_total_claims)}</b>
                            </div>
                            <div class="meta-row">
                                <span>Peer Median Claims</span>
                                <b>$${formatValue(row?.peer_median_total_claims)}</b>
                            </div>

                            <div class="meta-row">
                                <span>Revenue Gap</span>
                                <b>$${formatValue(row?.estimated_revenue_gap)}</b>
                            </div>
                            <div class="meta-row">
                                <span>Leakage Score</span>
                                <b>${formatValue(row?.leakage_score)}</b>
                            </div>

                            <div class="meta-row">
                                <span>Paid Ratio</span>
                                <b>${formatValue(row?.provider_to_peer_paid_ratio)}</b>
                            </div>
                            <div class="meta-row">
                                <span>Claims Ratio</span>
                                <b>${formatValue(row?.provider_to_peer_claims_ratio)}</b>
                            </div>
                                <div class="meta-row">
                                <span>Opportunity Band</span>
                                <b>${row?.opportunity_band || "—"}</b>
                            </div>
                        </div>
                    </div>
                `).join("")
                : `
                    <div class="rhs-empty-state">
                        No CPT leakage areas found for this provider.
                    </div>
                `
            }
        </div>
    `;

        const blockId = `${skuId}.cpt_leakage_areas`;
        appendRhsBlock(blockId, "CPT Leakage Areas", html);
    }

    function renderCptReimbursementRisk(data, skuId) {
        const rows = Array.isArray(data?.cpts) ? data.cpts : [];
        console.log("renderCptReimbursementRisk CALLED", { skuId, data });
        const html = `
        <div class="rhs-block">
            <div class="rhs-title">CPT Reimbursement Risk</div>
            <div class="rhs-subtitle">
                Dominant CPTs where reimbursement per claim appears materially below peer levels.
            </div>

            ${rows.length
                ? rows.map(row => `
                        <div class="rhs-card" style="margin-top:12px; padding:10px; border:1px solid rgba(255,255,255,0.08); border-radius:8px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                <div style="font-weight:600;">
                                    ${row?.cpt_code || "—"}
                                </div>
                                <div style="font-size:11px; opacity:0.7;">
                                    ${row?.comparison_flag || "below peer reimbursement"}
                                </div>
                            </div>

                            <div style="font-size:12px; opacity:0.75; margin-bottom:8px;">
                                ${row?.interpretation || ""}
                            </div>

                            <div class="meta-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                                <div class="meta-row">
                                    <span>Provider Paid</span>
                                    <b>$${formatValue(row?.provider_total_paid)}</b>
                                </div>

                                <div class="meta-row">
                                    <span>Provider Claims</span>
                                    <b>${formatValue(row?.provider_total_claims)}</b>
                                </div>

                                <div class="meta-row">
                                    <span>Revenue Share</span>
                                    <b>${formatValue(row?.share_of_total_paid_pct)}%</b>
                                </div>

                                <div class="meta-row">
                                    <span>Provider Paid / Claim</span>
                                    <b>$${formatValue(row?.provider_paid_per_claim)}</b>
                                </div>

                                <div class="meta-row">
                                    <span>Peer Paid / Claim</span>
                                    <b>$${formatValue(row?.peer_median_paid_per_claim)}</b>
                                </div>

                                <div class="meta-row">
                                    <span>Reimbursement Ratio</span>
                                    <b>${formatValue(row?.reimbursement_ratio)}</b>
                                </div>

                                <div class="meta-row">
                                    <span>Gap %</span>
                                    <b>${formatValue(row?.reimbursement_gap_pct)}%</b>
                                </div>

                                <div class="meta-row">
                                    <span>Risk Score</span>
                                    <b>${formatValue(row?.risk_score)}</b>
                                </div>
                            </div>
                        </div>
                    `).join("")
                : `
                        <div class="rhs-empty-state">
                            No major CPT reimbursement risk areas found for this provider.
                        </div>
                    `
            }
        </div>
    `;

        const blockId = `${skuId}.cpt_reimbursement_risk`;
        appendRhsBlock(blockId, "CPT Reimbursement Risk", html);
    }
    function renderSkuPayload(skuId) {
        console.log("renderSkuPayload skuId =", skuId);

        const def = window.SKU4_REGISTRY?.[skuId];
        if (!def) return;

        console.log("def =", def);
        console.log("def.binder_key =", def?.binder_key);
        console.log("def.binder_variant =", def?.binder_variant);
        console.log("renderSkuPayload registry def =", def);

        const payloadSource = def?.payload_source || "rhsPayload";
        const payload = window.SKU4State?.[payloadSource];

        console.log("renderSkuPayload payloadSource =", payloadSource);
        console.log("renderSkuPayload payload exists =", !!payload);

        if (!payload) return;
        if (!def?.data_binding_key) return;

        const data = payload?.[def.data_binding_key];

        console.log("binding key =", def?.data_binding_key);
        console.log("state rhsPayload keys =", Object.keys(window.SKU4State?.rhsPayload || {}));
        console.log("state rhs underperforming =", window.SKU4State?.rhsPayload?.underperforming_cpt_areas);
        console.log("state rhs overperforming =", window.SKU4State?.rhsPayload?.overperforming_cpt_areas);
        console.log("renderSkuPayload resolved data =", data);

        if (!data) return;


        if (!data) return;

        // ============================================
        // New template-driven render path
        // ============================================
        if (def?.use_template_renderer) {
            console.log("dispatch -> template renderer");

            const templatePayload = window.bindCptOpportunityPayload({
                binderVariant: def.binder_variant,
                skuId: skuId,
                skuTitle: def.title,
                skuSubtitle: def.focus,
                providerName: payload?.provider_name || "",
                providerNpi: payload?.provider_npi || payload?.provider_npi || "",
                regionLabel: payload?.region_label || payload?.region || "",
                skuCounter: "",
                skuType: def.data_binding_key,
                rawItems: data?.cpts || data
            });
            console.log("templatePayload =", templatePayload);

            const html = window.renderTemplate1CptOpportunityFullscreen(templatePayload);

            const stack = getRhsStack();
            if (!stack) return;

            stack.innerHTML = html;
            return;
        }

        // ============================================
        // Legacy render path
        // ============================================

        if (def.binder_key === null) {
            console.log("No RHS binding for layer", skuId);
            return;
        }   

        if (def.data_binding_key === "provider_vs_region_benchmark") {
            console.log("dispatch -> provider_vs_region_benchmark");
            renderProviderVsRegionBenchmark(data, skuId);
            return;
        }

        if (def.data_binding_key === "provider_vs_zone_benchmark") {
            console.log("dispatch -> provider_vs_zone_benchmark");
            renderProviderVsZoneBenchmark(data, skuId);
            return;
        }

        if (def.data_binding_key === "nearest_neighbor_peer_pack") {
            console.log("dispatch -> nearest_neighbor_peer_pack");
            renderSku4P1NearestNeighborPeer(data, skuId);
            return;
        }

        if (def.data_binding_key === "peer_similarity_drivers") {
            console.log("dispatch -> peer_similarity_drivers");
            renderPeerSimilarityDrivers(data, skuId);
            return;
        }

        if (def.data_binding_key === "top_comparable_providers") {
            console.log("dispatch -> top_comparable_providers");
            renderTopComparableProviders(data, skuId);
            return;
        }

        if (def.data_binding_key === "cohort_percentiles") {
            console.log("dispatch -> cohort_percentiles");
            renderCohortPercentiles(data, skuId);
            return;
        }

        if (def.data_binding_key === "overperforming_cpt_areas") {
            console.log("dispatch -> overperforming_cpt_areas");
            renderOverperformingCptAreas(data, skuId);
            return;
        }

        if (def.data_binding_key === "underperforming_cpt_areas") {
            console.log("dispatch -> underperforming_cpt_areas");
            renderUnderperformingCptAreas(data, skuId);
            return;
        }

        if (def.data_binding_key === "fixable_cpt_areas") {
            console.log("dispatch -> fixable_cpt_areas");
            renderFixableCptAreas(data, skuId);
            return;
        }

        if (def.data_binding_key === "monetizable_cpt_areas") {
            console.log("dispatch -> monetizable_cpt_areas");
            renderMonetizableCptAreas(data, skuId);
            return;
        }

        if (def.data_binding_key === "cpt_leakage_areas") {
            console.log("dispatch -> cpt_leakage_areas");
            renderCptLeakageAreas(data, skuId);
            return;
        }

        if (def.data_binding_key === "cpt_reimbursement_risk") {
            console.log("dispatch -> cpt_reimbursement_risk");
            renderCptReimbursementRisk(data, skuId);
            return;
        }
    }

    return {
        clearRhsStack,
        renderSkuPayload
    };
})();

console.log("sku4-rhs-binder.js loaded v2", window.SKU4RhsBinder);
