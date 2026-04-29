// ============================================================
// SKU4 Domain-Specific Loader Intelligence Layer
// ------------------------------------------------------------
// Purpose:
// This file contains enrichment logic for SKU4 payloads.
//
// Architecture Position:
// - SKU4Loader → fetches raw canonical data (geometry + artifacts)
// - SKU4LoaderIntelligence → transforms raw data into business-ready payloads
// - Panel Engine → routes payloads to renderers (NO business logic)
// - SKU4.01.js → renders UI (NO enrichment logic)
//
// Design Principle:
// Keep ALL SKU-specific enrichment OUT of panel-engine.
// This ensures:
// - clean separation of concerns
// - portability of SKUs
// - easier monetization / versioning / testing
//
// Current Scope:
// - SKU4.01 canonical enrichment
//
// Future:
// - Add SKU4.xx enrichment functions here
//   (peer, benchmark, CPT intelligence, etc.)
//
// ============================================================

console.log("[sku4-loader-intelligence.js] loaded");

(function initSKU4LoaderIntelligence(global) {
    "use strict";

    function safeNumber(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function calculatePercentDelta(providerValue, benchmarkValue) {
        const provider = safeNumber(providerValue);
        const benchmark = safeNumber(benchmarkValue);

        if (!benchmark) return 0;

        return ((provider - benchmark) / Math.abs(benchmark)) * 100;
    }

    function formatPercentNumber(value) {
        return `${safeNumber(value).toFixed(1)}%`;
    }
    function formatPercentFromFraction(value) {
        return `${(safeNumber(value) * 100).toFixed(1)}%`;
    }

    function formatRatio(value) {
        return safeNumber(value).toFixed(2);
    }

    function formatWholeNumber(value) {
        return `${Math.round(safeNumber(value))}`;
    }

    function average(rows, field, fallbackField) {
        const vals = (rows || [])
            .map(r => {
                const v = r?.[field] ?? r?.[fallbackField];
                return Number(v);   // raw conversion
            })
            .filter(v => Number.isFinite(v));  // drop bad values

        if (!vals.length) return 0;

        return vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    // RHS SKU4.01-------------------------------------------------------------//
    function enrichSKU401Payload(data = {}) {
        if (!data || typeof data !== "object") return data;

        const point = data.hospital_point || data.provider_point || {};
        const cloudRows = Array.isArray(data.canonical_cloud_rows)
            ? data.canonical_cloud_rows
            : [];

        const cohortSize = cloudRows.length;

        const providerPaidPerClaim = safeNumber(point.paid_per_claim);
        const providerClaimsPerBeneficiary = safeNumber(point.claims_per_beneficiary);
        const providerUniqueHcpcs = safeNumber(point.unique_hcpcs_count);

        const regionPaidPerClaim = average(cloudRows, "paid_per_claim");
        const regionClaimsPerBeneficiary = average(cloudRows, "claims_per_beneficiary");
        const regionUniqueHcpcs = average(cloudRows, "unique_hcpcs_count");

        function money(value) {
            return `$${safeNumber(value).toLocaleString(undefined, {
                maximumFractionDigits: 2
            })}`;
        }

        function ratio(value) {
            return safeNumber(value).toFixed(2);
        }

        function count(value) {
            return Math.round(safeNumber(value)).toLocaleString();
        }

        function deltaPct(providerValue, regionValue) {
            const p = safeNumber(providerValue);
            const r = safeNumber(regionValue);
            if (!r) return 0;
            return ((p - r) / r) * 100;
        }

        function deltaDisplay(providerValue, regionValue) {
            const d = deltaPct(providerValue, regionValue);
            const sign = d > 0 ? "+" : "";
            return `${sign}${d.toFixed(1)}% vs region`;
        }

        return {
            ...data,

            summary: {
                provider_name: point.organization_name || point.provider_name || "",
                provider_npi: point.npi || point.hospital_npi || "",
                cohort_size: cohortSize,
                cohort_label: `Currently mapping ${cohortSize} providers in NYNJCT canonical space`,

                dominant_axis: "Care Economic Intensity",
                weakest_axis: "Service Scale / Breadth",
                strongest_percentile: 50,

                total_paid: safeNumber(point.total_paid),
                total_claims: safeNumber(point.total_claims),
                paid_per_claim: providerPaidPerClaim,
                claims_per_beneficiary: providerClaimsPerBeneficiary,
                unique_hcpcs_count: providerUniqueHcpcs,

                region_avg_paid_per_claim: regionPaidPerClaim,
                region_avg_claims_per_beneficiary: regionClaimsPerBeneficiary,
                region_avg_unique_hcpcs_count: regionUniqueHcpcs
            },

            axes: [
                {
                    axis_code: "C1",
                    axis_id: "C1",
                    axis_label: "Care Economic Intensity",
                    metric_label: "Paid per Claim",
                    provider_score: providerPaidPerClaim,
                    region_average: regionPaidPerClaim,
                    provider_display: money(providerPaidPerClaim),
                    region_display: money(regionPaidPerClaim),
                    delta_display: deltaDisplay(providerPaidPerClaim, regionPaidPerClaim),
                    percentile: 50,
                    interpretation: `C1 maps reimbursement intensity. This provider is ${deltaDisplay(providerPaidPerClaim, regionPaidPerClaim)} on paid per claim.`
                },
                {
                    axis_code: "C2",
                    axis_id: "C2",
                    axis_label: "Utilization Structure",
                    metric_label: "Claims per Beneficiary",
                    provider_score: providerClaimsPerBeneficiary,
                    region_average: regionClaimsPerBeneficiary,
                    provider_display: ratio(providerClaimsPerBeneficiary),
                    region_display: ratio(regionClaimsPerBeneficiary),
                    delta_display: deltaDisplay(providerClaimsPerBeneficiary, regionClaimsPerBeneficiary),
                    percentile: 50,
                    interpretation: `C2 maps utilization structure. This provider is ${deltaDisplay(providerClaimsPerBeneficiary, regionClaimsPerBeneficiary)} on claims per beneficiary.`
                },
                {
                    axis_code: "C3",
                    axis_id: "C3",
                    axis_label: "Service Scale / Breadth",
                    metric_label: "Unique HCPCS Count",
                    provider_score: providerUniqueHcpcs,
                    region_average: regionUniqueHcpcs,
                    provider_display: count(providerUniqueHcpcs),
                    region_display: count(regionUniqueHcpcs),
                    delta_display: deltaDisplay(providerUniqueHcpcs, regionUniqueHcpcs),
                    percentile: 50,
                    interpretation: `C3 maps service scale and breadth. This provider is ${deltaDisplay(providerUniqueHcpcs, regionUniqueHcpcs)} on unique HCPCS count.`
                }
            ]
        };
    }



    // ------------------------------------------------------------
    // SKU4 Shared Helper Functions (Benchmark Metrics)
    // ------------------------------------------------------------

    function buildBenchmarkMetrics(financialIntelligence) {
        const b = financialIntelligence?.hospital_vs_peer_benchmark || {};

        return [
            {
                metric_key: "c1",
                label: "Care Intensity",
                interpretation: "Position along canonical intensity axis",

                hospital_value: b.hospital_c1,
                peer_value: b.peer_median_c1,
                region_value: b.region_median_c1,

                hospital_display: String(b.hospital_c1 || ""),
                peer_display: String(b.peer_median_c1 || ""),
                region_display: String(b.region_median_c1 || ""),

                peer_delta_pct: Number(b.delta_peer_c1 || 0),
                region_delta_pct: Number(b.delta_region_c1 || 0)
            }
        ];
    }



    function attachBeeFlag(metrics = []) {
        if (!Array.isArray(metrics) || !metrics.length) return [];

        // find max absolute deviation (peer + region combined)
        let maxScore = -Infinity;

        metrics.forEach(m => {
            const score =
                Math.abs(Number(m.peer_delta_pct || 0)) +
                Math.abs(Number(m.region_delta_pct || 0));

            if (score > maxScore) {
                maxScore = score;
            }
        });

        return metrics.map(m => {
            const score =
                Math.abs(Number(m.peer_delta_pct || 0)) +
                Math.abs(Number(m.region_delta_pct || 0));

            return {
                ...m,
                bee_flag: score === maxScore
            };
        });
    }

    // ------------------------------------------------------------
    // SKU4.50 Provider vs Region Benchmark builders---------------
    // ------------------------------------------------------------

    // ------------------------------------------------------------
    // SKU4.50 — Provider vs Region Benchmark (LHS Builder)
    // ------------------------------------------------------------------------------------------------==============---SKU4.50 Start
    // Purpose:
    // Convert raw financial intelligence → structured benchmark payload.
    //
    // Role:
    // Input: financialIntelligence JSON (loader)
    // Output: Panel 3 (graph-ready payload)
    //
    // Principles:
    // - No UI / DOM
    // - Pure data transformation
    // - Panel Engine only routes
    //
    // What it does:
    // - Normalize input (SKU4 + SKU5 shapes)
    // - Define core metrics (reimbursement, utilization, breadth, C1–C3)
    // - Compute delta + % delta + signal (above / below / near)
    // - Format display values
    // - Identify strongest deviation (highlight)
    // - Build chart payload
    //
    // Output:
    // { sku_id, type, binding, summary, metrics[], chart{}, notes[] }
    //
    // Why:
    // First descriptive monetization layer → converts position → insight.
    //
    // Extensible:
    // Peer comparison, scoring, financial impact ranking
    // ------------------------------------------------------------



    function buildProviderVsRegionBenchmarkPayload(financialIntelligence = {}) {

        //Normalize different possible input shapes into ONE consistent object (region)
        const region =
            financialIntelligence?.hospital_vs_region_benchmark ||
            financialIntelligence?.provider_vs_region_benchmark ||
            financialIntelligence?.region_benchmark ||
            financialIntelligence ||
            {};

        const metrics = [
            {
                metric_key: "paid_per_claim",
                metric_name: "Average Reimbursement Per Claim",
                interpretation: "Reimbursement Strength",
                unit: "currency",
                provider_value: safeNumber(region.hospital_paid_per_claim),
                region_value: safeNumber(region.region_paid_per_claim)
            },
            {
                metric_key: "claims_per_beneficiary",
                metric_name: "Claims Per Beneficiary",
                interpretation: "Utilization Pattern",
                unit: "ratio",
                provider_value: safeNumber(region.hospital_claims_per_beneficiary),
                region_value: safeNumber(region.region_claims_per_beneficiary)
            },
            {
                metric_key: "service_breadth",
                metric_name: "Unique CPT / HCPCS Procedures",
                interpretation: "Service Breadth",
                unit: "count",
                provider_value: safeNumber(region.hospital_unique_hcpcs_count),
                region_value: safeNumber(region.region_avg_unique_hcpcs_count)
            },
            {
                metric_key: "intensity_position",
                metric_name: "Economic Intensity Position",
                interpretation: "Canonical Intensity",
                unit: "index",
                provider_value: safeNumber(region.hospital_c1),
                region_value: safeNumber(region.region_median_c1)
            },

        ];

        const enrichedMetrics = metrics.map(metric => {
            const deltaValue = metric.provider_value - metric.region_value;
            const deltaPct = calculatePercentDelta(
                metric.provider_value,
                metric.region_value
            );

            return {
                ...metric,
                delta_value: deltaValue,
                delta_pct: deltaPct,
                provider_display: formatMetricValue(metric.provider_value, metric.unit),
                region_display: formatMetricValue(metric.region_value, metric.unit),
                delta_pct_display: formatPercentNumber(deltaPct),
                signal:
                    deltaPct >= 15 ? "above_region" :
                        deltaPct <= -15 ? "below_region" :
                            "near_region"
            };
        });

        const strongest =
            enrichedMetrics
                .slice()
                .sort((a, b) => Math.abs(b.delta_pct) - Math.abs(a.delta_pct))[0] ||
            {};

        return {
            sku_id: "SKU4.50",
            type: "provider_vs_region_benchmark",
            binding: "provider_vs_region_benchmark",

            summary: {
                total_metrics_reviewed: enrichedMetrics.length,
                strongest_metric_key: strongest.metric_key || "",
                strongest_metric_name: strongest.metric_name || "",
                strongest_delta_pct: Number(strongest.delta_pct || 0),
                strongest_signal: strongest.signal || ""
            },

            metrics: enrichedMetrics,

            chart: {
                labels: enrichedMetrics.map(row => row.metric_name),
                values: enrichedMetrics.map(row => Number(row.delta_pct || 0)),
                text: enrichedMetrics.map(row => [
                    row.metric_name,
                    row.provider_display,
                    row.region_display,
                    row.delta_pct_display,
                    row.signal
                ]),
                highlight_index: enrichedMetrics.findIndex(
                    row => row.metric_key === strongest.metric_key
                )
            },

            notes: [
                "Compares provider economics, utilization, breadth, and canonical position against the regional benchmark.",
                "This is the first descriptive monetization layer after the canonical position view."
            ]
        };
    }
    //--------------------------------------------------------------------------------------------4.50 LHS builder end 

    //----------------------------------------------------------------------------------------------4.55 builder start
    // ------------------------------------------------------------
    // SKU4.55 — CPT Overperformance builders
    // ------------------------------------------------------------

    function buildOverperformingCptPayload(rawRows = []) {
        const sourceRows = Array.isArray(rawRows) ? rawRows : [];

        const normalizedRows = sourceRows.map((row, index) => {
            const cptCode =
                row?.cpt_code ||
                row?.hcpcs_code ||
                row?.code ||
                "";

            const cptName =
                row?.cpt_name ||
                row?.hcpcs_description ||
                row?.procedure_category ||
                row?.description ||
                `CPT ${cptCode || index + 1}`;

            const providerValue = Number(
                row?.paid_per_claim ??
                row?.provider_value ??
                row?.provider_paid_per_claim ??
                row?.provider_metric ??
                0
            );

            const benchmarkValue = Number(
                row?.region_paid_per_claim ??
                row?.benchmark_value ??
                row?.cohort_median ??
                row?.peer_value ??
                0
            );

            const deltaValue = Number(
                row?.delta_vs_region_paid_per_claim ??
                row?.delta_value ??
                (providerValue - benchmarkValue)
            );

            const deltaPercent = calculatePercentDelta(
                providerValue,
                benchmarkValue
            );

            const totalClaims = Number(row?.total_claims || 0);

            const estimatedAnnualAdvantage = Number(
                row?.estimated_annual_advantage ??
                row?.annualized_uplift ??
                row?.revenue_advantage ??
                Math.max(deltaValue, 0) * totalClaims
            );

            return {
                cpt_code: cptCode,
                cpt_name: cptName,
                total_claims: totalClaims,
                total_paid: Number(row?.total_paid || 0),

                provider_value: providerValue,
                benchmark_value: benchmarkValue,
                delta_value: deltaValue,
                delta_percent: deltaPercent,

                estimated_annual_advantage: estimatedAnnualAdvantage,
                bee_flag: false,

                strength_band:
                    estimatedAnnualAdvantage >= 100000 ? "high" :
                        estimatedAnnualAdvantage >= 25000 ? "moderate" :
                            "emerging",

                interpretation:
                    estimatedAnnualAdvantage >= 100000
                        ? "High-value CPT strength with meaningful annual advantage."
                        : estimatedAnnualAdvantage >= 25000
                            ? "Measurable CPT reimbursement advantage."
                            : "Emerging CPT overperformance signal."
            };
        });

        const rankedCpts = normalizedRows
            .filter(row => Number(row.delta_value || 0) > 0)
            .sort((a, b) =>
                Number(b.estimated_annual_advantage || 0) -
                Number(a.estimated_annual_advantage || 0)
            )
            .map((row, idx) => ({
                ...row,
                bee_flag: false
            }));

        const top = rankedCpts[0] || {};

        return {
            sku_id: "SKU4.55",
            type: "overperforming_cpt_areas",
            binding: "overperforming_cpt_areas",

            summary: {
                total_cpts_reviewed: normalizedRows.length,
                overperforming_count: rankedCpts.length,
                top_cpt_code: top?.cpt_code || "",
                top_cpt_name: top?.cpt_name || "",
                top_uplift_value: Number(top?.delta_value || 0),
                total_estimated_advantage: rankedCpts.reduce(
                    (sum, row) => sum + Number(row.estimated_annual_advantage || 0),
                    0
                )
            },

            ranked_cpts: rankedCpts,

            chart: {
                labels: rankedCpts.slice(0, 10).map(row => row.cpt_code || row.cpt_name),
                values: rankedCpts.slice(0, 10).map(row =>
                    Number(row.estimated_annual_advantage || 0)
                ),
                text: rankedCpts.slice(0, 10).map(row => [
                    row.cpt_code || "",
                    formatWholeNumber(row.total_claims || 0),
                    formatCompactCurrency(row.provider_value || 0),
                    formatCompactCurrency(row.benchmark_value || 0),
                    formatCompactCurrency(row.estimated_annual_advantage || 0)
                ]),
                highlight_index: rankedCpts.length ? 0 : -1
            },

            notes: [
                "Highlights CPT areas where provider reimbursement is above benchmark.",
                "Ranks CPT strengths by estimated annual financial advantage."
            ]
        };
    }

    function buildOverperformingCptTablePayload(rawRows = []) {
        const lhsPayload = buildOverperformingCptPayload(rawRows);
        const rankedCpts = Array.isArray(lhsPayload?.ranked_cpts)
            ? lhsPayload.ranked_cpts
            : [];

        return {
            sku_id: "SKU4.55",
            type: "overperforming_cpt_areas_rhs",
            binding: "overperforming_cpt_areas_rhs",

            summary: {
                ...(lhsPayload.summary || {}),
                total_estimated_advantage_display: formatCompactCurrency(
                    lhsPayload?.summary?.total_estimated_advantage || 0
                )
            },

            table: {
                columns: [
                    { key: "cpt_code", label: "CPT" },
                    { key: "cpt_name", label: "Category" },
                    { key: "total_claims_display", label: "Claims" },
                    { key: "provider_value_display", label: "Provider $/Claim" },
                    { key: "benchmark_value_display", label: "Region $/Claim" },
                    { key: "delta_value_display", label: "Delta" },
                    { key: "estimated_annual_advantage_display", label: "Annual Advantage" },
                    { key: "priority_flag", label: "Priority" }
                ],
                rows: rankedCpts.map(row => ({
                    cpt_code: row.cpt_code,
                    cpt_name: row.cpt_name,

                    total_claims: Number(row.total_claims || 0),
                    total_claims_display: formatWholeNumber(row.total_claims || 0),

                    provider_value: Number(row.provider_value || 0),
                    provider_value_display: formatCompactCurrency(row.provider_value || 0),

                    benchmark_value: Number(row.benchmark_value || 0),
                    benchmark_value_display: formatCompactCurrency(row.benchmark_value || 0),

                    delta_value: Number(row.delta_value || 0),
                    delta_value_display: formatCompactCurrency(row.delta_value || 0),

                    estimated_annual_advantage: Number(row.estimated_annual_advantage || 0),
                    estimated_annual_advantage_display: formatCompactCurrency(
                        row.estimated_annual_advantage || 0
                    ),

                    interpretation: row.interpretation || "",

                }))
            },

            notes: [
                "Overperforming CPT table ranks current CPT economic strengths.",
                "Bee marks the largest estimated annual CPT advantage."
            ]
        };
    }
    //----------------------------------------------------------------------------------------------4.55 builder end

    // underperformance sku4.56 ---------------------------------------------------------------------4.56 underperformance builder start 
    //-------------------------------------------------//
    // SKU4.56 CPT underperformance LHS builder start
    //-------------------------------------------------//

    function buildUnderperformingCptPayload(rawRows = []) {
        console.log("[SKU4.56 builder] rawRows count =", rawRows?.length);
        console.log("[SKU4.56 builder] first raw row =", rawRows?.[0]);
        console.log(
            "[SKU4.56 builder] first raw keys =",
            rawRows?.[0] ? Object.keys(rawRows[0]) : []
        );

        const sourceRows = Array.isArray(rawRows) ? rawRows : [];

        const normalizedRows = sourceRows.map((row, index) => {
            const cptCode =
                row?.cpt_code ||
                row?.hcpcs_code ||
                row?.code ||
                "";

            const cptName =
                row?.cpt_name ||
                row?.hcpcs_description ||
                row?.procedure_category ||
                row?.description ||
                `CPT ${cptCode || index + 1}`;

            const providerValue = Number(
                row?.paid_per_claim ??
                row?.provider_value ??
                row?.provider_paid_per_claim ??
                row?.provider_metric ??
                0
            );

            const benchmarkValue = Number(
                row?.region_paid_per_claim ??
                row?.benchmark_value ??
                row?.cohort_median ??
                row?.peer_value ??
                0
            );

            const deltaValue = Number(
                row?.delta_vs_region_paid_per_claim ??
                row?.delta_value ??
                (providerValue - benchmarkValue)
            );

            const deltaPercent = calculatePercentDelta(
                providerValue,
                benchmarkValue
            );

            const totalClaims = Number(row?.total_claims || 0);

            const estimatedAnnualLeakage = Number(
                row?.estimated_annual_leakage ??
                row?.annualized_downside ??
                row?.revenue_leakage ??
                (deltaValue < 0 ? Math.abs(deltaValue) * totalClaims : 0)
            );

            return {
                cpt_code: cptCode,
                cpt_name: cptName,
                total_claims: totalClaims,
                total_paid: Number(row?.total_paid || 0),

                provider_value: providerValue,
                benchmark_value: benchmarkValue,
                delta_value: deltaValue,
                delta_percent: deltaPercent,

                estimated_annual_leakage: estimatedAnnualLeakage,
                bee_flag: false,

                weakness_band:
                    estimatedAnnualLeakage >= 100000 ? "high" :
                        estimatedAnnualLeakage >= 25000 ? "moderate" :
                            "emerging",

                interpretation:
                    estimatedAnnualLeakage >= 100000
                        ? "High-value CPT leakage with material annual downside."
                        : estimatedAnnualLeakage >= 25000
                            ? "Measurable CPT reimbursement leakage versus benchmark."
                            : "Emerging CPT underperformance signal."
            };
        });

        const rankedCpts = normalizedRows
            .filter(row => Number(row.delta_value || 0) < 0)
            .sort((a, b) =>
                Number(b.estimated_annual_leakage || 0) -
                Number(a.estimated_annual_leakage || 0)
            )
            .map((row, idx) => ({
                ...row,
                bee_flag: idx === 0
            }));

        console.log("[SKU4.56 builder] normalized count =", normalizedRows.length);
        console.log("[SKU4.56 builder] ranked count =", rankedCpts.length);
        console.log("[SKU4.56 builder] first ranked row =", rankedCpts[0]);

        const top = rankedCpts[0] || {};

        return {
            sku_id: "SKU4.56",
            type: "underperforming_cpt_areas",
            binding: "underperforming_cpt_areas",

            summary: {
                total_cpts_reviewed: normalizedRows.length,
                underperforming_count: rankedCpts.length,
                top_cpt_code: top?.cpt_code || "",
                top_cpt_name: top?.cpt_name || "",
                top_downside_value: Number(top?.delta_value || 0),
                total_estimated_leakage: rankedCpts.reduce(
                    (sum, row) => sum + Number(row.estimated_annual_leakage || 0),
                    0
                )
            },

            ranked_cpts: rankedCpts,

            chart: {
                labels: rankedCpts.slice(0, 10).map(row => row.cpt_code || row.cpt_name),
                values: rankedCpts.slice(0, 10).map(row =>
                    Number(row.estimated_annual_leakage || 0)
                ),
                text: rankedCpts.slice(0, 10).map(row => [
                    row.cpt_code || "",
                    formatWholeNumber(row.total_claims || 0),
                    formatCompactCurrency(row.provider_value || 0),
                    formatCompactCurrency(row.benchmark_value || 0),
                    formatCompactCurrency(row.estimated_annual_leakage || 0)
                ]),
                highlight_index: rankedCpts.length ? 0 : -1
            },

            notes: [
                "Highlights CPT areas where provider reimbursement falls below benchmark.",
                "Ranks CPT weaknesses by estimated annual revenue leakage."
            ]
        };
    }

    //-------------------------------------------------//
    // SKU4.56 CPT underperformance LHS builder end
    //-------------------------------------------------//
    // underperformance sku4.56 ---------------------------------------------------------------------4.56 underperformance builder end


    //-------------------------------------------------//
    // SKU4.56 CPT underperformance RHS table builder start------------------------------------------------------------------- Builder RHS underperformance  4.56 start 
    //-------------------------------------------------//

    function buildUnderperformingCptTablePayload(rawRows = []) {
        const lhsPayload = buildUnderperformingCptPayload(rawRows);
        const rankedCpts = Array.isArray(lhsPayload?.ranked_cpts)
            ? lhsPayload.ranked_cpts
            : [];

        const rows = rankedCpts.map(row => ({
            cpt_code: row.cpt_code,
            cpt_name: row.cpt_name,

            total_claims: Number(row.total_claims || 0),
            total_claims_display: formatWholeNumber(row.total_claims || 0),

            provider_value: Number(row.provider_value || 0),
            provider_value_display: formatCompactCurrency(row.provider_value || 0),

            benchmark_value: Number(row.benchmark_value || 0),
            benchmark_value_display: formatCompactCurrency(row.benchmark_value || 0),

            delta_value: Number(row.delta_value || 0),
            delta_value_display: formatCompactCurrency(row.delta_value || 0),

            estimated_annual_leakage: Number(row.estimated_annual_leakage || 0),
            estimated_annual_leakage_display: formatCompactCurrency(
                row.estimated_annual_leakage || 0
            ),

            interpretation: row.interpretation || "",

        }));

        const totalEstimatedLeakage = rows.reduce(
            (sum, row) => sum + Number(row.estimated_annual_leakage || 0),
            0
        );

        return {
            sku_id: "SKU4.56",
            type: "underperforming_cpt_areas_rhs",
            binding: "underperforming_cpt_areas_rhs",

            summary: {
                ...(lhsPayload.summary || {}),
                total_estimated_leakage: totalEstimatedLeakage,
                total_estimated_leakage_display: formatCompactCurrency(totalEstimatedLeakage)
            },

            table: {
                columns: [
                    { key: "cpt_code", label: "CPT" },
                    { key: "cpt_name", label: "Category" },
                    { key: "total_claims_display", label: "Claims" },
                    { key: "provider_value_display", label: "Provider $/Claim" },
                    { key: "benchmark_value_display", label: "Region $/Claim" },
                    { key: "delta_value_display", label: "Delta" },
                    { key: "estimated_annual_leakage_display", label: "Annual Leakage" },

                ],
                rows
            },

            notes: [
                "Underperforming CPT table ranks reimbursement weakness versus benchmark.",
                "Bee marks the largest estimated annual leakage opportunity."
            ]
        };
    }

    //-------------------------------------------------//
    // SKU4.56 CPT underperformance RHS table builder end-----------------------------------------------------------------4.56 RHS underperformance builder end 
    //-------------------------------------------------//

    //-------------------------------------------------//
    // SKU4.58 CPT monetizable LHS builder start
    //-------------------------------------------------//

    function buildMonetizableCptPayload(rawRows = []) {
        console.log("[SKU4.58 builder] rawRows count =", rawRows?.length);
        console.log("[SKU4.58 builder] first raw row =", rawRows?.[0]);
        console.log(
            "[SKU4.58 builder] first raw keys =",
            rawRows?.[0] ? Object.keys(rawRows[0]) : []
        );

        const sourceRows = Array.isArray(rawRows) ? rawRows : [];

        const normalizedRows = sourceRows.map((row, index) => {
            const cptCode =
                row?.cpt_code ||
                row?.hcpcs_code ||
                row?.code ||
                "";

            const cptName =
                row?.cpt_name ||
                row?.hcpcs_description ||
                row?.procedure_category ||
                row?.description ||
                `CPT ${cptCode || index + 1}`;

            const providerValue = Number(
                row?.paid_per_claim ??
                row?.provider_value ??
                row?.provider_paid_per_claim ??
                row?.provider_metric ??
                0
            );

            const benchmarkValue = Number(
                row?.region_paid_per_claim ??
                row?.benchmark_value ??
                row?.cohort_median ??
                row?.peer_value ??
                0
            );

            const deltaValue = Number(
                row?.delta_vs_region_paid_per_claim ??
                row?.delta_value ??
                (providerValue - benchmarkValue)
            );

            const deltaPercent = calculatePercentDelta(
                providerValue,
                benchmarkValue
            );

            const totalClaims = Number(row?.total_claims || 0);

            const upsidePerClaim = Math.max(deltaValue, 0);

            const projectedGrowthClaims = Number(
                row?.projected_growth_claims ??
                Math.round(totalClaims * 0.15)
            );

            const estimatedUpside = Number(
                row?.estimated_upside ??
                row?.estimated_growth_upside ??
                row?.revenue_upside ??
                upsidePerClaim * projectedGrowthClaims
            );

            return {
                cpt_code: cptCode,
                cpt_name: cptName,
                total_claims: totalClaims,
                total_paid: Number(row?.total_paid || 0),

                provider_value: providerValue,
                benchmark_value: benchmarkValue,
                delta_value: deltaValue,
                delta_percent: deltaPercent,

                upside_per_claim: upsidePerClaim,
                projected_growth_claims: projectedGrowthClaims,
                estimated_upside: estimatedUpside,

                highlight_flag: false,

                growth_band:
                    estimatedUpside >= 100000 ? "high" :
                        estimatedUpside >= 25000 ? "moderate" :
                            "emerging",

                interpretation:
                    estimatedUpside >= 100000
                        ? "Strong reimbursement advantage with high scale potential."
                        : estimatedUpside >= 25000
                            ? "Healthy reimbursement advantage with meaningful growth upside."
                            : "Early monetization opportunity with positive spread."
            };
        });

        const rankedCpts = normalizedRows
            .filter(row => Number(row.upside_per_claim || 0) > 0)
            .sort((a, b) => {
                const aScore =
                    Number(a.estimated_upside || 0) +
                    Number(a.upside_per_claim || 0);
                const bScore =
                    Number(b.estimated_upside || 0) +
                    Number(b.upside_per_claim || 0);
                return bScore - aScore;
            })
            .map((row, idx) => ({
                ...row,
                highlight_flag: idx === 0
            }));

        console.log("[SKU4.58 builder] normalized count =", normalizedRows.length);
        console.log("[SKU4.58 builder] ranked count =", rankedCpts.length);
        console.log("[SKU4.58 builder] first ranked row =", rankedCpts[0]);

        const top = rankedCpts[0] || {};

        return {
            sku_id: "SKU4.58",
            type: "monetizable_cpt_areas",
            binding: "monetizable_cpt_areas",

            summary: {
                total_cpts_reviewed: normalizedRows.length,
                monetizable_count: rankedCpts.length,
                top_cpt_code: top?.cpt_code || "",
                top_cpt_name: top?.cpt_name || "",
                top_upside_value: Number(top?.estimated_upside || 0),
                total_estimated_upside: rankedCpts.reduce(
                    (sum, row) => sum + Number(row.estimated_upside || 0),
                    0
                )
            },

            ranked_cpts: rankedCpts,

            chart: {
                labels: rankedCpts.slice(0, 10).map(row => row.cpt_code || row.cpt_name),
                values: rankedCpts.slice(0, 10).map(row => Number(row.estimated_upside || 0)),
                text: rankedCpts.slice(0, 10).map(row => [
                    row.cpt_code || "",
                    formatWholeNumber(row.total_claims || 0),
                    formatCompactCurrency(row.provider_value || 0),
                    formatCompactCurrency(row.benchmark_value || 0),
                    formatCompactCurrency(row.estimated_upside || 0)
                ]),
                highlight_index: rankedCpts.length ? 0 : -1
            },

            notes: [
                "Highlights CPT areas with positive reimbursement spread and scalable growth potential.",
                "Use this layer to prioritize where the provider can expand volume into already favorable economics."
            ]
        };
    }

    //-------------------------------------------------//
    // SKU4.58 CPT monetizable LHS builder end-----------------------------------------------------------------------------4.58 LHS end 
    //-------------------------------------------------//


    //-------------------------------------------------//
    // SKU4.60 CPT portfolio risk LHS builder start
    //-------------------------------------------------//

    function buildCptRiskPayload(financialIntelligence = {}) {
        console.log("[SKU4.60 builder] FI keys =", Object.keys(financialIntelligence || {}));

        const leakageRows = Array.isArray(financialIntelligence?.cpt_leakage_areas)
            ? financialIntelligence.cpt_leakage_areas
            : [];

        const sourceRows = leakageRows.length
            ? leakageRows
            : [
                ...(financialIntelligence?.underperforming_cpt_areas || []),
                ...(financialIntelligence?.overperforming_cpt_areas || [])
            ];

        const totalClaims = sourceRows.reduce(
            (sum, row) => sum + Number(row?.total_claims || 0),
            0
        );

        const normalizedRows = sourceRows.map((row, index) => {
            const cptCode =
                row?.cpt_code ||
                row?.hcpcs_code ||
                row?.code ||
                "";

            const cptName =
                row?.cpt_name ||
                row?.procedure_category ||
                row?.hcpcs_description ||
                row?.description ||
                `CPT ${cptCode || index + 1}`;

            const totalClaimsForRow = Number(row?.total_claims || 0);

            // IMPORTANT: concentration must be a fraction, not raw claims
            const concentrationShare =
                row?.claim_share != null
                    ? Number(row.claim_share)
                    : totalClaims > 0
                        ? totalClaimsForRow / totalClaims
                        : 0;

            // IMPORTANT: reimbursement gap must be a fraction where possible
            const providerValue = Number(row?.paid_per_claim || 0);
            const benchmarkValue = Number(
                row?.region_paid_per_claim ||
                row?.peer_paid_per_claim ||
                0
            );

            const reimbursementGap =
                row?.leakage_gap != null
                    ? Number(row.leakage_gap)
                    : benchmarkValue > 0
                        ? Math.abs(providerValue - benchmarkValue) / benchmarkValue
                        : 0;

            const riskScore =
                (concentrationShare * 0.6) + (reimbursementGap * 0.4);

            return {
                cpt_code: cptCode,
                cpt_name: cptName,
                total_claims: totalClaimsForRow,

                provider_value: providerValue,
                benchmark_value: benchmarkValue,

                concentration_share: concentrationShare,
                reimbursement_gap: reimbursementGap,
                risk_score: riskScore,

                risk_band:
                    riskScore >= 0.08 ? "high" :
                        riskScore >= 0.04 ? "moderate" :
                            "contained",

                interpretation:
                    riskScore >= 0.08
                        ? "High CPT portfolio risk driven by concentration and leakage."
                        : riskScore >= 0.04
                            ? "Moderate CPT portfolio risk requiring monitoring."
                            : "Contained CPT portfolio risk."
            };
        });

        const rankedCpts = normalizedRows
            .sort((a, b) => Number(b.risk_score || 0) - Number(a.risk_score || 0))
            .map((row, idx) => ({
                ...row,
                highlight_flag: idx === 0
            }));

        const top = rankedCpts[0] || {};

        return {
            sku_id: "SKU4.60",
            type: "cpt_portfolio_risk",
            binding: "cpt_portfolio_risk",

            summary: {
                total_cpts_reviewed: rankedCpts.length,
                highest_risk_cpt_code: top?.cpt_code || "",
                highest_risk_cpt_name: top?.cpt_name || "",
                top_risk_score: Number(top?.risk_score || 0),
                total_claims_reviewed: totalClaims
            },

            ranked_cpts: rankedCpts,

            chart: {
                labels: rankedCpts.slice(0, 10).map(row => row.cpt_code || row.cpt_name),
                values: rankedCpts.slice(0, 10).map(row => Number(row.risk_score || 0)),
                text: rankedCpts.slice(0, 10).map(row => [
                    row.cpt_code || "",
                    (Number(row.concentration_share || 0) * 100).toFixed(1) + "%",
                    (Number(row.reimbursement_gap || 0) * 100).toFixed(1) + "%",
                    Number(row.risk_score || 0).toFixed(2),
                    row.risk_band || ""
                ]),
                highlight_index: rankedCpts.length ? 0 : -1
            },

            notes: [
                "Combines CPT concentration and reimbursement leakage into a normalized portfolio risk score.",
                "Uses precomputed financial intelligence rather than recalculating raw CPT economics in the browser."
            ]
        };
    }

    //-------------------------------------------------//
    // SKU4.60 CPT portfolio risk LHS builder end
    //-------------------------------------------------//

    //-------------------------------------------------//
    // SKU4.60 CPT portfolio risk RHS builder start
    //-------------------------------------------------//

    function buildCptRiskTablePayload(financialIntelligence = {}) {
        const lhsPayload = buildCptRiskPayload(financialIntelligence);

        const rankedCpts = Array.isArray(lhsPayload?.ranked_cpts)
            ? lhsPayload.ranked_cpts
            : [];

        const rows = rankedCpts.map(row => ({
            cpt_code: row.cpt_code,
            cpt_name: row.cpt_name,

            total_claims: Number(row.total_claims || 0),
            total_claims_display: formatWholeNumber(row.total_claims || 0),

            provider_value: Number(row.provider_value || 0),
            provider_value_display: formatCompactCurrency(row.provider_value || 0),

            benchmark_value: Number(row.benchmark_value || 0),
            benchmark_value_display: formatCompactCurrency(row.benchmark_value || 0),

            concentration_share: Number(row.concentration_share || 0),
            concentration_share_display:
                (Number(row.concentration_share || 0) * 100).toFixed(1) + "%",

            reimbursement_gap: Number(row.reimbursement_gap || 0),
            reimbursement_gap_display:
                (Number(row.reimbursement_gap || 0) * 100).toFixed(1) + "%",

            risk_score: Number(row.risk_score || 0),
            risk_score_display: Number(row.risk_score || 0).toFixed(2),

            risk_band: row.risk_band || "",
            interpretation: row.interpretation || ""
        }));

        return {
            sku_id: "SKU4.60",
            type: "cpt_portfolio_risk_rhs",
            binding: "cpt_portfolio_risk_rhs",

            summary: {
                ...(lhsPayload.summary || {})
            },

            table: {
                columns: [
                    { key: "cpt_code", label: "CPT" },
                    { key: "cpt_name", label: "Category" },
                    { key: "total_claims_display", label: "Claims" },
                    { key: "concentration_share_display", label: "Concentration" },
                    { key: "reimbursement_gap_display", label: "Reimbursement Gap" },
                    { key: "risk_score_display", label: "Risk Score" },
                    { key: "risk_band", label: "Risk Band" }
                ],
                rows
            },

            notes: [
                "Risk table ranks CPTs using precomputed financial intelligence signals.",
                "Use this to identify CPTs where concentration and reimbursement sensitivity create predictive portfolio risk."
            ]
        };
    }

    //-------------------------------------------------//
    // SKU4.60 CPT portfolio risk RHS builder end
    //-------------------------------------------------//


    //-------------------------------------------------//
    // SKU4.58 CPT monetizable RHS table builder start
    //-------------------------------------------------//

    function buildMonetizableCptTablePayload(rawRows = []) {
        const lhsPayload = buildMonetizableCptPayload(rawRows);
        const rankedCpts = Array.isArray(lhsPayload?.ranked_cpts)
            ? lhsPayload.ranked_cpts
            : [];

        const totalEstimatedUpside = rankedCpts.reduce(
            (sum, row) => sum + Number(row.estimated_upside || 0),
            0
        );

        const rows = rankedCpts.map(row => ({
            cpt_code: row.cpt_code,
            cpt_name: row.cpt_name,

            total_claims: Number(row.total_claims || 0),
            total_claims_display: formatWholeNumber(row.total_claims || 0),

            provider_value: Number(row.provider_value || 0),
            provider_value_display: formatCompactCurrency(row.provider_value || 0),

            benchmark_value: Number(row.benchmark_value || 0),
            benchmark_value_display: formatCompactCurrency(row.benchmark_value || 0),

            delta_value: Number(row.delta_value || 0),
            delta_value_display: formatCompactCurrency(row.delta_value || 0),

            upside_per_claim: Number(row.upside_per_claim || 0),
            upside_per_claim_display: formatCompactCurrency(row.upside_per_claim || 0),

            projected_growth_claims: Number(row.projected_growth_claims || 0),
            projected_growth_claims_display: formatWholeNumber(row.projected_growth_claims || 0),

            estimated_upside: Number(row.estimated_upside || 0),
            estimated_upside_display: formatCompactCurrency(row.estimated_upside || 0),

            interpretation: row.interpretation || ""
        }));

        return {
            sku_id: "SKU4.58",
            type: "monetizable_cpt_areas_rhs",
            binding: "monetizable_cpt_areas_rhs",

            summary: {
                ...(lhsPayload.summary || {}),
                total_estimated_upside: totalEstimatedUpside,
                total_estimated_upside_display: formatCompactCurrency(totalEstimatedUpside)
            },

            table: {
                columns: [
                    { key: "cpt_code", label: "CPT" },
                    { key: "cpt_name", label: "Category" },
                    { key: "total_claims_display", label: "Claims" },
                    { key: "provider_value_display", label: "Provider $/Claim" },
                    { key: "benchmark_value_display", label: "Region $/Claim" },
                    { key: "upside_per_claim_display", label: "Upside / Claim" },
                    { key: "projected_growth_claims_display", label: "Growth Claims" },
                    { key: "estimated_upside_display", label: "Estimated Upside" }
                ],
                rows
            },

            notes: [
                "Monetizable CPT table ranks scalable upside across CPTs with positive reimbursement spread.",
                "This view converts existing reimbursement advantage into a prescriptive growth target."
            ]
        };
    }

    //-------------------------------------------------//
    // SKU4.58 CPT monetizable RHS table builder end
    //-------------------------------------------------//

    // --------------------------------------------------------------------------------------------4.51 LHS Builder start

    // SKU4.51 — LHS Builder (Peer Benchmark)
    function buildProviderVsPeerBenchmarkPayload(financialIntelligence = {}) {
        const peer =
            financialIntelligence?.hospital_vs_peer_benchmark ||
            financialIntelligence?.provider_vs_peer_benchmark ||
            {};

        const metrics = [
            {
                metric_key: "paid_per_claim",
                metric_name: "Average Reimbursement Per Claim",
                interpretation: "Reimbursement Strength",
                unit: "currency",
                provider_value: safeNumber(peer.hospital_paid_per_claim),
                peer_value: safeNumber(peer.peer_paid_per_claim)
            },
            {
                metric_key: "claims_per_beneficiary",
                metric_name: "Claims Per Beneficiary",
                interpretation: "Utilization Pattern",
                unit: "ratio",
                provider_value: safeNumber(peer.hospital_claims_per_beneficiary),
                peer_value: safeNumber(peer.peer_claims_per_beneficiary)
            },
            {
                metric_key: "service_breadth",
                metric_name: "Unique CPT / HCPCS Procedures",
                interpretation: "Service Breadth",
                unit: "count",
                provider_value: safeNumber(peer.hospital_unique_hcpcs_count),
                peer_value: safeNumber(peer.peer_avg_unique_hcpcs_count)
            },
            {
                metric_key: "intensity_position",
                metric_name: "Care Economic Intensity",
                interpretation: "Canonical Economic Position",
                unit: "index",
                provider_value: safeNumber(peer.hospital_c1),
                peer_value: safeNumber(peer.peer_median_c1)
            },
            {
                metric_key: "utilization_position",
                metric_name: "Utilization Structure",
                interpretation: "Canonical Utilization Position",
                unit: "index",
                provider_value: safeNumber(peer.hospital_c2),
                peer_value: safeNumber(peer.peer_median_c2)
            },
            {
                metric_key: "scale_position",
                metric_name: "Provider Scale / Breadth",
                interpretation: "Canonical Scale Position",
                unit: "index",
                provider_value: safeNumber(peer.hospital_c3),
                peer_value: safeNumber(peer.peer_median_c3)
            }
        ];

        const enrichedMetrics = metrics.map(metric => {
            const deltaValue = metric.provider_value - metric.peer_value;
            const deltaPct = calculatePercentDelta(
                metric.provider_value,
                metric.peer_value
            );

            return {
                ...metric,
                delta_value: deltaValue,
                delta_pct: deltaPct,
                provider_display: formatMetricValue(metric.provider_value, metric.unit),
                peer_display: formatMetricValue(metric.peer_value, metric.unit),
                delta_pct_display: formatPercentNumber(deltaPct),
                signal:
                    deltaPct >= 15 ? "above_peer" :
                        deltaPct <= -15 ? "below_peer" :
                            "near_peer"
            };
        });

        const strongest =
            enrichedMetrics
                .slice()
                .sort((a, b) => Math.abs(b.delta_pct) - Math.abs(a.delta_pct))[0] ||
            {};

        return {
            sku_id: "SKU4.51",
            type: "provider_vs_peer_benchmark",
            binding: "provider_vs_peer_benchmark",

            summary: {
                peer_method: peer.peer_method || "",
                peer_count: Number(peer.peer_count || 0),
                total_metrics_reviewed: enrichedMetrics.length,
                strongest_metric_key: strongest.metric_key || "",
                strongest_metric_name: strongest.metric_name || "",
                strongest_delta_pct: Number(strongest.delta_pct || 0),
                strongest_signal: strongest.signal || ""
            },

            metrics: enrichedMetrics,

            chart: {
                labels: enrichedMetrics.map(row => row.metric_name),
                values: enrichedMetrics.map(row => Number(row.delta_pct || 0)),
                text: enrichedMetrics.map(row => [
                    row.metric_name,
                    row.provider_display,
                    row.peer_display,
                    row.delta_pct_display,
                    row.signal
                ]),
                highlight_index: enrichedMetrics.findIndex(
                    row => row.metric_key === strongest.metric_key
                )
            },

            notes: [
                "Compares provider economics, utilization, breadth, and canonical position against nearest-neighbor peer cohort.",
                "Peer cohort is precomputed upstream using same provider category and C1/C2/C3 canonical distance."
            ]
        };
    }



    // --------------------------------------------------------------------------------------------4.51 LHS peer benchmark Builder end     



    // ------------------------------------------------------------
    // SKU4.50 — Region Benchmark (RHS Table Builder)-------------------------------------------4.50 RHS builder start 
    // ------------------------------------------------------------
    // Scope:
    // SKU-specific RHS builder for Region Benchmark only.
    //
    // Purpose:
    // Converts the SKU4.50 LHS region benchmark payload into a
    // table-ready RHS payload.
    //
    // Architecture:
    // - ETL precomputes provider financial intelligence
    // - Loader fetches the JSON
    // - Loader Intelligence adapts it for RHS display
    // - Panel Engine routes it
    // - Renderer paints it
    //
    // Notes:
    // - Uses region_display / region benchmark fields
    // - No DOM logic here
    // - No bee / priority marker in RHS
    // - SKU4.51 peer benchmark has a separate peer-specific builder
    // -------------------------------------------------------------------------------------------------------



    function buildProviderVsRegionBenchmarkTablePayload(financialIntelligence = {}) {
        const lhsPayload =
            buildProviderVsRegionBenchmarkPayload(financialIntelligence);

        const rows = Array.isArray(lhsPayload?.metrics)
            ? lhsPayload.metrics.map(row => ({
                metric_key: row.metric_key,
                metric_name: row.metric_name,
                interpretation: row.interpretation,

                provider_value: Number(row.provider_value || 0),
                provider_display: row.provider_display || "",

                region_value: Number(row.region_value || 0),
                region_display: row.region_display || "",

                delta_value: Number(row.delta_value || 0),
                delta_pct: Number(row.delta_pct || 0),
                delta_pct_display: row.delta_pct_display || "",

                signal: row.signal || ""

            }))
            : [];

        return {
            sku_id: "SKU4.50",
            type: "provider_vs_region_benchmark_rhs",
            binding: "provider_vs_region_benchmark_rhs",

            summary: {
                ...(lhsPayload.summary || {})
            },

            table: {
                columns: [
                    { key: "metric_name", label: "Metric" },
                    { key: "provider_display", label: "Provider" },
                    { key: "region_display", label: "Region" },
                    { key: "delta_pct_display", label: "Delta %" },
                    { key: "signal", label: "Signal" },

                ],
                rows
            },

            notes: [
                "Region benchmark table explains where the provider is above, below, or near regional norms.",
                "Bee marks the strongest regional benchmark gap."
            ]
        };
    }


    // ------------------------------------------------------------
    // SKU4.50 — Region Benchmark (RHS Table Builder)-----------------------------------------------------------------4.50 RHS builder end 
    // ------------------------------------------------------------

    // SKU4.51 — RHS Builder (Peer Benchmark)-------------------------------------------------------------------------4.51 RHS builder start

    function buildProviderVsPeerBenchmarkTablePayload(financialIntelligence = {}) {
        const lhsPayload =
            buildProviderVsPeerBenchmarkPayload(financialIntelligence);

        const rows = Array.isArray(lhsPayload?.metrics)
            ? lhsPayload.metrics.map(row => ({
                metric_key: row.metric_key,
                metric_name: row.metric_name,
                interpretation: row.interpretation,

                provider_value: Number(row.provider_value || 0),
                provider_display: row.provider_display || "",

                peer_value: Number(row.peer_value || 0),
                peer_display: row.peer_display || "",

                delta_value: Number(row.delta_value || 0),
                delta_pct: Number(row.delta_pct || 0),
                delta_pct_display: row.delta_pct_display || "",

                signal: row.signal || ""
            }))
            : [];

        return {
            sku_id: "SKU4.51",
            type: "provider_vs_peer_benchmark_rhs",
            binding: "provider_vs_peer_benchmark_rhs",

            summary: {
                ...(lhsPayload.summary || {})
            },

            table: {
                columns: [
                    { key: "metric_name", label: "Metric" },
                    { key: "provider_display", label: "Provider" },
                    { key: "peer_display", label: "Peer" },
                    { key: "delta_pct_display", label: "Delta %" },
                    { key: "signal", label: "Signal" }
                ],
                rows
            },

            notes: [
                "Peer benchmark table explains how the provider compares against its nearest comparable cohort.",
                "Signals are derived from peer benchmark deltas and presented without priority markers."
            ]
        };
    }
    // SKU4.51 — RHS Builder (Peer Benchmark)-------------------------------------------------------------------------4.51 RHS builder end


    // color the trajectory lines per regression or progression -------------------------------------// color the trajectory lines start 
    function colorForTrajectoryTrend(trend) {
        if (trend === "improving") return "#00c853";
        if (trend === "worsening") return "#ff3b30";
        if (trend === "flat") return "#ffcc00";
        return "#9aa6b2";
    }

    function buildTrajectorySegments(points = [], basis = "region") {
        if (!Array.isArray(points) || points.length < 2) return [];

        const trendKey =
            basis === "peer" ? "peer_gap_trend" : "region_gap_trend";

        return points.slice(0, -1).map((point, index) => {
            const next = points[index + 1];
            const trend = next?.[trendKey] || "unknown";

            return {
                from_index: index,
                to_index: index + 1,
                from_label: point.month || "",
                to_label: next.month || "",
                signal: trend,
                color: colorForTrajectoryTrend(trend),
                basis,
                from: point,
                to: next
            };
        });
    }


    // color the trajectory lines per regression or progression -------------------------------------// color the trajectory lines  end





    //------------------------------------------------------------------------------------------------ Builder for 4.54      start
    function buildCohortPercentilePayload(financialIntelligence) {

        // STEP 1: reuse existing metric builders
        const benchmarkMetrics = attachBeeFlag(
            buildBenchmarkMetrics(financialIntelligence)
        );

        // STEP 2: normalize rows for SKU4 table + cards
        const rows = benchmarkMetrics.map(metric => ({
            metric_key: metric.metric_key,
            metric_name: metric.label,   // ✅ FIXED
            interpretation: metric.interpretation,

            provider_value: Number(metric.hospital_value || 0),  // ✅ FIXED
            peer_value: Number(metric.peer_value || 0),
            region_value: Number(metric.region_value || 0),

            provider_display: metric.hospital_display || "",
            peer_display: metric.peer_display || "",
            region_display: metric.region_display || "",

            peer_delta_pct: Number(metric.peer_delta_pct || 0),
            region_delta_pct: Number(metric.region_delta_pct || 0),

            bee_flag: !!metric.bee_flag
        }));
        console.log("[SKU4.54 rows]", rows);
        const top =
            rows.find(r => r.bee_flag) ||
            rows[0] ||
            {};

        // STEP 3: RETURN IN SKU4 FORMAT (CRITICAL)
        return {
            sku_id: "SKU4.54",
            type: "cohort_percentile_metrics",
            binding: "cohort_percentile_metrics",

            summary: {
                total_metrics_reviewed: rows.length,
                top_metric_key: top.metric_key || "",
                top_metric_name: top.metric_name || "",
                top_peer_delta_pct: Number(top.peer_delta_pct || 0),
                top_region_delta_pct: Number(top.region_delta_pct || 0)
            },

            table: {
                columns: [
                    "Metric",
                    "Provider",
                    "Peer",
                    "Region",
                    "Peer Δ%",
                    "Region Δ%"
                ],
                rows: rows
            },

            // OPTIONAL (for LHS chart)
            chart: {
                labels: rows.map(r => r.metric_name),
                provider: rows.map(r => r.provider_value),
                peer: rows.map(r => r.peer_value),
                region: rows.map(r => r.region_value)
            },

            notes: [
                "Compares provider reimbursement, utilization, service breadth, and care mix against peer hospitals and regional benchmarks.",
                "Bee indicator highlights the highest deviation opportunity."
            ]
        };
    }
    //----------------------------------------------------------------------------------------------------------------------- Builder for 4.54      end



    //-----------------------------------------------------------------------------------------------------------------4.52 RHS Builder start 
    // ------------------------------------------------------------
    // SKU4.52 — Canonical Trajectory Builders
    // ------------------------------------------------------------

    function buildCanonicalTrajectoryPayload(rawTrajectory = {}) {
        const points = Array.isArray(rawTrajectory?.trajectory_points)
            ? rawTrajectory.trajectory_points
            : Array.isArray(rawTrajectory?.timeline)
                ? rawTrajectory.timeline
                : [];

        return {
            sku_id: "SKU4.52",
            type: "canonical_trajectory",
            binding: "canonical_trajectory",

            region: rawTrajectory.region || "",
            provider_npi:
                rawTrajectory.provider_npi ||
                rawTrajectory.npi ||
                "",

            provider_name: rawTrajectory.provider_name || "",
            benchmark_basis: rawTrajectory.benchmark_basis || "",
            grain: rawTrajectory.grain || "monthly",

            start_month:
                rawTrajectory.start_month ||
                rawTrajectory.timeline_start_month ||
                points?.[0]?.month ||
                "",

            end_month:
                rawTrajectory.end_month ||
                rawTrajectory.timeline_end_month ||
                points?.[points.length - 1]?.month ||
                "",

            timeline_point_count:
                rawTrajectory.timeline_point_count ||
                points.length,

            trajectory_points: points,
            trajectory_segments: buildTrajectorySegments(points, "region"),

            axes: rawTrajectory.axes || [],
            center_point: rawTrajectory.center_point || {},
            axis_semantics: rawTrajectory.axis_semantics || {},
            axis_ranges: rawTrajectory.axis_ranges || {},
            camera_defaults: rawTrajectory.camera_defaults || {},
            provenance: rawTrajectory.provenance || {},

            summary: points.length
                ? `Trajectory contains ${points.length} canonical time points.`
                : "No trajectory points found for this provider."
        };
    }

    function buildTrajectoryMetricsPayload(rawTrajectory = {}) {
        const trajectory = buildCanonicalTrajectoryPayload(rawTrajectory);
        const points = Array.isArray(trajectory.trajectory_points)
            ? trajectory.trajectory_points
            : [];

        return {
            sku_id: "SKU4.52",
            type: "trajectory_metrics",
            binding: "trajectory_metrics",

            provider_npi: trajectory.provider_npi,
            provider_name: trajectory.provider_name,
            start_month: trajectory.start_month,
            end_month: trajectory.end_month,
            point_count: points.length,

            status: points.length ? "Available" : "No trajectory found",

            summary: points.length
                ? `Trajectory runs from ${trajectory.start_month || "start"} to ${trajectory.end_month || "current"} across ${points.length} points.`
                : "No longitudinal trajectory points were available for this provider.",

            rows: [
                {
                    label: "Timeline Points",
                    value: points.length,
                    interpretation: "Number of canonical positions available over time."
                },
                {
                    label: "Start Month",
                    value: trajectory.start_month || "—",
                    interpretation: "First observed canonical position."
                },
                {
                    label: "End Month",
                    value: trajectory.end_month || "—",
                    interpretation: "Most recent observed canonical position."
                },
                {
                    label: "Grain",
                    value: trajectory.grain || "monthly",
                    interpretation: "Time resolution of the trajectory."
                }
            ]
        };
    }
    //-----------------------------------------------------------------------------------------------------------------4.52 RHS Builder end










    // ------------------------------------------------------------
    // EXPOSE FUNCTIONS
    //Take the local function called buildProviderVsRegionBenchmarkPayload
    //and attach it to window.SKU4FinancialLoader
    //so sku4-loader.js can call it later. loader-intelligence creates the product, 
    // and the expose block puts it on the shelf so the main loader can pick it up and deliver it to Panel 3 / Panel 4.
    // ------------------------------------------------------------

    window.SKU4FinancialLoader = window.SKU4FinancialLoader || {};

    // SKU 4.50 LHS EXPOSE

    window.SKU4FinancialLoader.buildProviderVsRegionBenchmarkPayload =
        buildProviderVsRegionBenchmarkPayload;

    // SKU 4.50 RHS EXPOSE


    window.SKU4FinancialLoader.buildProviderVsRegionBenchmarkTablePayload =
        buildProviderVsRegionBenchmarkTablePayload;


    // SKU 4.51 RHS EXPOSE-------------------------------------------------------------------4.51 RHS expose

    window.SKU4FinancialLoader.buildProviderVsPeerBenchmarkTablePayload =
        buildProviderVsPeerBenchmarkTablePayload;

    // SKU 4.51 RHS EXPOSE-------------------------------------------------------------------4.51 RHS expose



    // SKU 4.52 LHS EXPOSE-------------------------------------------------------------------4.52 LHS expose

    window.SKU4FinancialLoader.buildCanonicalTrajectoryPayload =
        buildCanonicalTrajectoryPayload;

    // SKU 4.52 RHS EXPOSE -------------------------------------------------------------------4.52 RHS expose

    window.SKU4FinancialLoader.buildTrajectoryMetricsPayload =
        buildTrajectoryMetricsPayload;


    // ------------------------------------------------------------
    // SKU4.54 Cohort Percentile Builders (Expose)-------------------------------------------4.54 LHS and RHS expose functions
    // ------------------------------------------------------------

    // LHS (viewer payload)
    window.SKU4FinancialLoader.buildCohortPercentilePayload =
        buildCohortPercentilePayload;

    // RHS (table payload)
    window.SKU4FinancialLoader.buildCohortPercentileTablePayload =
        function (financialIntelligence) {
            const payload = buildCohortPercentilePayload(financialIntelligence);

            return {
                table: payload.table || { columns: [], rows: [] },
                summary: payload.summary || {},
                notes: payload.notes || []
            };
        };



    // ---------------------------------------------------------------------SKU4.55 LHS EXPOSE
    window.SKU4FinancialLoader.buildOverperformingCptPayload =
        buildOverperformingCptPayload;

    // -------------------------------------------------------------------------------SKU4.55 RHS EXPOSE
    window.SKU4FinancialLoader.buildOverperformingCptTablePayload =
        buildOverperformingCptTablePayload;

    // --------------------------------------------------------------------------------SKU4.56 LHS EXPOSE
    window.SKU4FinancialLoader.buildUnderperformingCptPayload =
        buildUnderperformingCptPayload;

    // --------------------------------------------------------------------------------SKU4.56 RHS EXPOSE
    window.SKU4FinancialLoader.buildUnderperformingCptTablePayload =
        buildUnderperformingCptTablePayload;

    // SKU4.58 LHS EXPOSE   -----------------------------------------------------------SKU 5.58 LHS RHS expose 
    window.SKU4FinancialLoader.buildMonetizableCptPayload =
        buildMonetizableCptPayload;

    // SKU4.58 RHS EXPOSE
    window.SKU4FinancialLoader.buildMonetizableCptTablePayload =
        buildMonetizableCptTablePayload;

    // SKU4.60 LHS EXPOSE-----------------------------------------------------------------SKU4.60 LHS EXPOSE
    window.SKU4FinancialLoader.buildCptRiskPayload =
        buildCptRiskPayload;

    // SKU4.60 RHS EXPOSE------------------------------------------------------------------SKU4.60 RHS EXPOSE
    window.SKU4FinancialLoader.buildCptRiskTablePayload =
        buildCptRiskTablePayload;

    window.SKU4FinancialLoader.buildProviderVsPeerBenchmarkPayload =
        buildProviderVsPeerBenchmarkPayload;

    function formatCompactCurrency(value) {
        const num = safeNumber(value);
        if (Math.abs(num) >= 1000000) {
            return `$${(num / 1000000).toFixed(1)}M`;
        }
        if (Math.abs(num) >= 1000) {
            return `$${(num / 1000).toFixed(1)}K`;
        }
        return `$${num.toFixed(0)}`;
    }


    // shared display helper
    function formatMetricValue(value, unit) {
        if (unit === "currency") return formatCompactCurrency(value);
        if (unit === "percent") return formatPercentFromFraction(value);
        if (unit === "ratio") return formatRatio(value);
        if (unit === "count") return formatWholeNumber(value);
        return formatRatio(value);
    }

    //---------------------------------------------------------------------
    // EXPORT
    //---------------------------------------------------------------------

    global.SKU4LoaderIntelligence = {
        safeNumber,
        average,
        enrichSKU401Payload,
        buildProviderVsRegionBenchmarkPayload,
        buildProviderVsRegionBenchmarkTablePayload,
        buildCanonicalTrajectoryPayload,
        buildTrajectoryMetricsPayload,
        buildCohortPercentilePayload,
        buildOverperformingCptPayload,
        buildOverperformingCptTablePayload
    };
})(window);