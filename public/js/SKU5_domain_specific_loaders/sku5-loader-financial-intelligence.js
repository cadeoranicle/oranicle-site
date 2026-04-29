console.log("[sku5-loader-financial-intelligence.js] loaded");

(function initSKU5FinancialIntelligenceLoader(global) {
    "use strict";

    function safeNumber(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function calculatePercentDelta(hospitalValue, benchmarkValue) {
        const hospital = safeNumber(hospitalValue);
        const benchmark = safeNumber(benchmarkValue);

        if (!benchmark) return 0;
        return ((hospital - benchmark) / benchmark) * 100;
    }

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

    function formatPercentFromFraction(value) {
        return `${(safeNumber(value) * 100).toFixed(1)}%`;
    }

    function formatPercentNumber(value) {
        return `${safeNumber(value).toFixed(1)}%`;
    }

    function formatRatio(value) {
        return safeNumber(value).toFixed(2);
    }

    function formatWholeNumber(value) {
        return `${Math.round(safeNumber(value))}`;
    }

    function buildBenchmarkMetrics(financialIntelligence) {

        const region = financialIntelligence?.hospital_vs_region_benchmark || {};

        const peer = financialIntelligence?.hospital_vs_peer_benchmark || {};

        return [
            {
                metric_key: "paid_per_claim",
                label: "Average Reimbursement Per Claim",
                interpretation: "Reimbursement Strength",
                unit: "currency",
                hospital_value: safeNumber(region.hospital_paid_per_claim),
                peer_value: safeNumber(peer.peer_paid_per_claim),
                region_value: safeNumber(region.region_paid_per_claim),
                hospital_display: formatCompactCurrency(region.hospital_paid_per_claim),
                peer_display: formatCompactCurrency(peer.peer_paid_per_claim),
                region_display: formatCompactCurrency(region.region_paid_per_claim),
                peer_delta_pct: calculatePercentDelta(
                    region.hospital_paid_per_claim,
                    peer.peer_paid_per_claim
                ),
                region_delta_pct: calculatePercentDelta(
                    region.hospital_paid_per_claim,
                    region.region_paid_per_claim
                )
            },
            {
                metric_key: "claims_per_beneficiary",
                label: "Claims Per Beneficiary",
                interpretation: "Utilization Pattern",
                unit: "ratio",
                hospital_value: safeNumber(region.hospital_claims_per_beneficiary),
                peer_value: safeNumber(peer.peer_claims_per_beneficiary),
                region_value: safeNumber(region.region_claims_per_beneficiary),
                hospital_display: formatRatio(region.hospital_claims_per_beneficiary),
                peer_display: formatRatio(peer.peer_claims_per_beneficiary),
                region_display: formatRatio(region.region_claims_per_beneficiary),
                peer_delta_pct: calculatePercentDelta(
                    region.hospital_claims_per_beneficiary,
                    peer.peer_claims_per_beneficiary
                ),
                region_delta_pct: calculatePercentDelta(
                    region.hospital_claims_per_beneficiary,
                    region.region_claims_per_beneficiary
                )
            },
            {
                metric_key: "service_breadth",
                label: "Unique HCPCS Procedures",
                interpretation: "Service Breadth",
                unit: "count",
                hospital_value: safeNumber(region.hospital_unique_hcpcs_count),
                peer_value: safeNumber(peer.peer_avg_unique_hcpcs_count),
                region_value: safeNumber(region.region_avg_unique_hcpcs_count),
                hospital_display: formatWholeNumber(region.hospital_unique_hcpcs_count),
                peer_display: formatWholeNumber(peer.peer_avg_unique_hcpcs_count),
                region_display: formatWholeNumber(region.region_avg_unique_hcpcs_count),
                peer_delta_pct: calculatePercentDelta(
                    region.hospital_unique_hcpcs_count,
                    peer.peer_avg_unique_hcpcs_count
                ),
                region_delta_pct: calculatePercentDelta(
                    region.hospital_unique_hcpcs_count,
                    region.region_avg_unique_hcpcs_count
                )
            },
            {
                metric_key: "icu_share",
                label: "ICU Case Share",
                interpretation: "Critical Care Exposure",
                unit: "percent",
                hospital_value: safeNumber(region.hospital_icu_share),
                peer_value: safeNumber(peer.peer_avg_icu_share),
                region_value: safeNumber(region.region_avg_icu_share),
                hospital_display: formatPercentFromFraction(region.hospital_icu_share),
                peer_display: formatPercentFromFraction(peer.peer_avg_icu_share),
                region_display: formatPercentFromFraction(region.region_avg_icu_share),
                peer_delta_pct: calculatePercentDelta(
                    region.hospital_icu_share,
                    peer.peer_avg_icu_share
                ),
                region_delta_pct: calculatePercentDelta(
                    region.hospital_icu_share,
                    region.region_avg_icu_share
                )
            },
            {
                metric_key: "ccu_share",
                label: "CCU Case Share",
                interpretation: "Cardiac Care Exposure",
                unit: "percent",
                hospital_value: safeNumber(region.hospital_ccu_share),
                peer_value: safeNumber(peer.peer_avg_ccu_share),
                region_value: safeNumber(region.region_avg_ccu_share),
                hospital_display: formatPercentFromFraction(region.hospital_ccu_share),
                peer_display: formatPercentFromFraction(peer.peer_avg_ccu_share),
                region_display: formatPercentFromFraction(region.region_avg_ccu_share),
                peer_delta_pct: calculatePercentDelta(
                    region.hospital_ccu_share,
                    peer.peer_avg_ccu_share
                ),
                region_delta_pct: calculatePercentDelta(
                    region.hospital_ccu_share,
                    region.region_avg_ccu_share
                )
            },
            {
                metric_key: "financial_intensity_position",
                label: "Financial Intensity Position",
                interpretation: "Benchmark Positioning",
                unit: "index",
                hospital_value: safeNumber(region.hospital_c1),
                peer_value: safeNumber(peer.peer_median_c1),
                region_value: safeNumber(region.region_median_c1),
                hospital_display: formatRatio(region.hospital_c1),
                peer_display: formatRatio(peer.peer_median_c1),
                region_display: formatRatio(region.region_median_c1),
                peer_delta_pct: calculatePercentDelta(
                    region.hospital_c1,
                    peer.peer_median_c1
                ),
                region_delta_pct: calculatePercentDelta(
                    region.hospital_c1,
                    region.region_median_c1
                )
            }
        ];
    }

    function scoreBeeCandidate(metric) {
        const peerGap = Math.abs(safeNumber(metric?.peer_delta_pct));
        const regionGap = Math.abs(safeNumber(metric?.region_delta_pct));

        const priorityBoosts = {
            paid_per_claim: 1.25,
            claims_per_beneficiary: 1.15,
            service_breadth: 1.10,
            financial_intensity_position: 1.05,
            icu_share: 1.00,
            ccu_share: 0.95
        };

        const boost = priorityBoosts[metric?.metric_key] || 1;
        return ((peerGap * 0.6) + (regionGap * 0.4)) * boost;
    }

    function attachBeeFlag(metrics) {
        if (!Array.isArray(metrics) || !metrics.length) return metrics || [];

        let bestIndex = -1;
        let bestScore = 0;

        metrics.forEach((metric, idx) => {
            const score = scoreBeeCandidate(metric);
            if (score > bestScore) {
                bestScore = score;
                bestIndex = idx;
            }
        });

        return metrics.map((metric, idx) => ({
            ...metric,
            bee_flag: idx === bestIndex && bestScore >= 25,
            bee_score: scoreBeeCandidate(metric)
        }));
    }


    //-------------------------------------------------//
    //sku5.54 CPT cohort percentiles load builder start //
    //---------------------------------------------------//


    function buildCohortPercentilePayload(financialIntelligence) {
        const benchmarkMetrics = attachBeeFlag(
            buildBenchmarkMetrics(financialIntelligence)
        );

        const rankedMetrics = benchmarkMetrics.map(metric => ({
            metric_key: metric.metric_key,
            metric_name: metric.label,
            interpretation: metric.interpretation,
            provider_value: Number(metric.hospital_value || 0),
            peer_value: Number(metric.peer_value || 0),
            region_value: Number(metric.region_value || 0),
            provider_display: metric.hospital_display || "",
            peer_display: metric.peer_display || "",
            region_display: metric.region_display || "",
            peer_delta_pct: Number(metric.peer_delta_pct || 0),
            region_delta_pct: Number(metric.region_delta_pct || 0),
            bee_flag: !!metric.bee_flag
        }));

        const top = rankedMetrics.find(row => row.bee_flag) || rankedMetrics[0] || {};

        return {
            sku_id: "SKU5.54",
            type: "cohort_percentile_metrics",
            binding: "cohort_percentile_metrics",

            summary: {
                total_metrics_reviewed: rankedMetrics.length,
                top_metric_key: top?.metric_key || "",
                top_metric_name: top?.metric_name || "",
                top_peer_delta_pct: Number(top?.peer_delta_pct || 0),
                top_region_delta_pct: Number(top?.region_delta_pct || 0)
            },

            ranked_metrics: rankedMetrics,

            chart: {
                labels: rankedMetrics.map(row => row.metric_name),
                values: rankedMetrics.map(row => Number(row.provider_value || 0)),
                text: rankedMetrics.map(row =>
                    `${row.metric_name} · Provider ${row.provider_display} · Peer ${row.peer_display} · Region ${row.region_display}`
                )
            },

            notes: [
                "Compares provider reimbursement, utilization, service breadth, and care mix against peer hospitals and regional benchmarks.",
                "Bee indicator appears only when one metric stands out as a materially larger benchmark gap than the others."
            ],

            benchmark_metrics: benchmarkMetrics
        };
    }
    //-------------------------------------------------//
    //sku5.54 CPT cohort percentiles load builder end //
    //---------------------------------------------------//


    //sku5.55 CPT overperforming load builder start //
    // sku5.55 CPT overperforming load builder start //

    function buildOverperformingCptPayload(rawRows = []) {
        console.log("[SKU5.55 builder] rawRows count =", rawRows?.length);
        console.log("[SKU5.55 builder] first raw row =", rawRows?.[0]);
        console.log(
            "[SKU5.55 builder] first raw keys =",
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
                (providerValue - benchmarkValue)
            );

            const deltaPercent = calculatePercentDelta(
                providerValue,
                benchmarkValue
            );

            const percentile =
                row?.percentile != null
                    ? Number(row.percentile)
                    : row?.cohort_percentile != null
                        ? Number(row.cohort_percentile)
                        : null;

            const estimatedAnnualAdvantage = Number(
                row?.estimated_annual_advantage ??
                row?.annualized_uplift ??
                row?.revenue_advantage ??
                (deltaValue * Number(row?.total_claims || 0))
            );

            return {
                cpt_code: cptCode,
                cpt_name: cptName,
                total_claims: Number(row?.total_claims || 0),
                total_paid: Number(row?.total_paid || 0),
                provider_value: providerValue,
                benchmark_value: benchmarkValue,
                delta_value: deltaValue,
                delta_percent: deltaPercent,
                percentile,
                estimated_annual_advantage: estimatedAnnualAdvantage,
                bee_flag: false,
                strength_band:
                    deltaValue >= 200 ? "high" :
                        deltaValue >= 100 ? "moderate" :
                            "emerging",
                interpretation:
                    deltaValue >= 200
                        ? "Material reimbursement outperformance versus region"
                        : deltaValue >= 100
                            ? "Clear reimbursement advantage versus region"
                            : "Moderate reimbursement advantage versus region"
            };
        });

        const rankedCpts = normalizedRows
            .sort((a, b) => {
                const aScore =
                    Number(a.estimated_annual_advantage || 0) +
                    Number(a.delta_value || 0);
                const bScore =
                    Number(b.estimated_annual_advantage || 0) +
                    Number(b.delta_value || 0);
                return bScore - aScore;
            })
            .map((row, idx) => ({
                ...row,
                bee_flag: idx === 0
            }));

        console.log("[SKU5.55 builder] normalized count =", normalizedRows.length);
        console.log("[SKU5.55 builder] ranked count =", rankedCpts.length);
        console.log("[SKU5.55 builder] first ranked row =", rankedCpts[0]);

        const top = rankedCpts[0] || {};

        return {
            sku_id: "SKU5.55",
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
                values: rankedCpts.slice(0, 10).map(row => Number(row.delta_value || 0)),
                text: rankedCpts.slice(0, 10).map(row =>
                    `${row.cpt_code} · ${formatCompactCurrency(row.delta_value)}`
                )
            },

            notes: [
                "Highlights existing areas of strength.",
                "Can feed monetization and expansion logic."
            ]
        };
    }
    //-------------------------------------------------//
    // sku5.55 CPT overperforming load builder end //
    //sku5.55 CPT overperforming load builder end //
    //-------------------------------------------------//

    //-------------------------------------------------//
    // sku5.56 CPT LHS underperforming load builder start // ------------------------ 5.55 underperformance builder start 
    //-------------------------------------------------//

    function buildUnderperformingCptPayload(rawRows = []) {
        console.log("[SKU5.56 builder] rawRows count =", rawRows?.length);
        console.log("[SKU5.56 builder] first raw row =", rawRows?.[0]);
        console.log(
            "[SKU5.56 builder] first raw keys =",
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
                (providerValue - benchmarkValue)
            );

            const deltaPercent = calculatePercentDelta(
                providerValue,
                benchmarkValue
            );

            const percentile =
                row?.percentile != null
                    ? Number(row.percentile)
                    : row?.cohort_percentile != null
                        ? Number(row.cohort_percentile)
                        : null;

            const estimatedAnnualLeakage = Number(
                row?.estimated_annual_leakage ??
                row?.annualized_downside ??
                row?.revenue_leakage ??
                Math.abs(deltaValue) * Number(row?.total_claims || 0)
            );

            return {
                cpt_code: cptCode,
                cpt_name: cptName,
                total_claims: Number(row?.total_claims || 0),
                total_paid: Number(row?.total_paid || 0),
                provider_value: providerValue,
                benchmark_value: benchmarkValue,
                delta_value: deltaValue,
                delta_percent: deltaPercent,
                percentile,
                estimated_annual_leakage: estimatedAnnualLeakage,
                bee_flag: false,
                weakness_band:
                    deltaValue <= -200 ? "high" :
                        deltaValue <= -100 ? "moderate" :
                            "emerging",
                interpretation:
                    deltaValue <= -200
                        ? "Material reimbursement underperformance versus region"
                        : deltaValue <= -100
                            ? "Clear reimbursement disadvantage versus region"
                            : "Moderate reimbursement disadvantage versus region"
            };
        });

        const rankedCpts = normalizedRows
            .sort((a, b) => {
                const aScore =
                    Math.abs(Number(a.estimated_annual_leakage || 0)) +
                    Math.abs(Number(a.delta_value || 0));
                const bScore =
                    Math.abs(Number(b.estimated_annual_leakage || 0)) +
                    Math.abs(Number(b.delta_value || 0));
                return bScore - aScore;
            })
            .map((row, idx) => ({
                ...row,
                bee_flag: idx === 0
            }));

        console.log("[SKU5.56 builder] normalized count =", normalizedRows.length);
        console.log("[SKU5.56 builder] ranked count =", rankedCpts.length);
        console.log("[SKU5.56 builder] first ranked row =", rankedCpts[0]);

        const top = rankedCpts[0] || {};

        return {
            sku_id: "SKU5.56",
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
                values: rankedCpts.slice(0, 10).map(row => Number(row.delta_value || 0)),
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
                "Highlights CPT areas where provider reimbursement underperforms regional benchmarks.",
                "Can feed fixable CPT and prescriptive improvement layers."
            ]
        };
    }

     // sku5.56 CPT LHS underperforming load builder start // ------------------------ 5.55 underperformance builder end

    //-------------------------------------------------//
    // sku5.56 CPT LHS underperforming load builder end //
    //-------------------------------------------------//

    //-------------------------------------------------//
    // sku5.58 CPT LHS monetizable load builder start //
    //-------------------------------------------------//

    function buildMonetizableCptPayload(rawRows = []) {
        console.log("[SKU5.58 builder] rawRows count =", rawRows?.length);
        console.log("[SKU5.58 builder] first raw row =", rawRows?.[0]);
        console.log(
            "[SKU5.58 builder] first raw keys =",
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
                (providerValue - benchmarkValue)
            );

            const deltaPercent = calculatePercentDelta(
                providerValue,
                benchmarkValue
            );

            const percentile =
                row?.percentile != null
                    ? Number(row.percentile)
                    : row?.cohort_percentile != null
                        ? Number(row.cohort_percentile)
                        : null;

            const totalClaims = Number(row?.total_claims || 0);

            const upsidePerClaim = Math.max(deltaValue, 0);
            const projectedGrowthClaims = Math.round(totalClaims * 0.15);
            const estimatedUpside = upsidePerClaim * projectedGrowthClaims;

            return {
                cpt_code: cptCode,
                cpt_name: cptName,
                total_claims: totalClaims,
                total_paid: Number(row?.total_paid || 0),
                provider_value: providerValue,
                benchmark_value: benchmarkValue,
                delta_value: deltaValue,
                delta_percent: deltaPercent,
                percentile,
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
                        ? "Strong reimbursement advantage with high scale potential"
                        : estimatedUpside >= 25000
                            ? "Healthy reimbursement advantage with meaningful upside"
                            : "Early monetization opportunity with positive spread"
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

        console.log("[SKU5.58 builder] normalized count =", normalizedRows.length);
        console.log("[SKU5.58 builder] ranked count =", rankedCpts.length);
        console.log("[SKU5.58 builder] first ranked row =", rankedCpts[0]);

        const top = rankedCpts[0] || {};

        return {
            sku_id: "SKU5.58",
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
                "Highlights CPT areas with positive reimbursement spread and scale potential.",
                "Can feed growth-headroom and monetization layers."
            ]
        };
    }

    //-------------------------------------------------//
    // sku5.58 CPT LHS monetizable load builder end    //
    //-------------------------------------------------//



    //-------------------------------------------------//
    // sku5.60 CPT LHS CPT Risk load builder start     //-------------------------------------------------------sku5.60 CPT load builder start 
    //-------------------------------------------------//




    function buildCptRiskPayload(rawRows = []) {
        const sourceRows = Array.isArray(rawRows) ? rawRows : [];

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

            const totalClaimsForRow = Number(row?.total_claims || 0);

            const concentrationShare =
                totalClaims > 0 ? totalClaimsForRow / totalClaims : 0;

            const reimbursementGap =
                benchmarkValue !== 0
                    ? Math.abs(providerValue - benchmarkValue) / Math.abs(benchmarkValue)
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
                highlight_flag: false,
                interpretation:
                    riskScore >= 0.5
                        ? "High combined CPT portfolio risk"
                        : riskScore >= 0.2
                            ? "Moderate combined CPT portfolio risk"
                            : "Contained CPT portfolio risk"
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
            sku_id: "SKU5.60",
            type: "cpt_portfolio_risk",
            binding: "cpt_portfolio_risk",

            summary: {
                total_cpts_reviewed: normalizedRows.length,
                highest_risk_cpt_code: top?.cpt_code || "",
                highest_risk_cpt_name: top?.cpt_name || "",
                top_risk_score: Number(top?.risk_score || 0)
            },

            ranked_cpts: rankedCpts,

            chart: {
                labels: rankedCpts.slice(0, 10).map(row => row.cpt_code || row.cpt_name),
                values: rankedCpts.slice(0, 10).map(row => Number(row.risk_score || 0)),
                text: rankedCpts.slice(0, 10).map(row => [
                    row.cpt_code || "",
                    (Number(row.concentration_share || 0) * 100).toFixed(1) + "%",
                    (Number(row.reimbursement_gap || 0) * 100).toFixed(1) + "%",
                    Number(row.risk_score || 0).toFixed(2)
                ]),
                highlight_index: rankedCpts.length ? 0 : -1
            },

            notes: [
                "Combines CPT concentration and reimbursement gap into a single portfolio risk score.",
                "Highlights where CPT exposure is both concentrated and economically fragile."
            ]
        };
    }

    //-------------------------------------------------//
    // sku5.60 CPT LHS CPT Risk load builder end       //-------------------------------------------------------sku5.60 CPT load builder end
    //-------------------------------------------------//

    //----------------------------------------------------//
    // SKU5.62 ICU Utilization Efficiency LHS builder start
    //----------------------------------------------------//

    function buildIcuUtilizationEfficiencyPayload(rawBenchmark = {}) {
        const row = rawBenchmark || {};

        const metrics = [
            {
                metric: "ICU Share",
                provider: Number(row.hospital_icu_share || 0),
                benchmark: Number(row.region_avg_icu_share || 0),
                type: "percent"
            },
            {
                metric: "CCU Share",
                provider: Number(row.hospital_ccu_share || 0),
                benchmark: Number(row.region_avg_ccu_share || 0),
                type: "percent"
            },
            {
                metric: "Paid per Claim",
                provider: Number(row.hospital_paid_per_claim || 0),
                benchmark: Number(row.region_paid_per_claim || 0),
                type: "currency"
            },
            {
                metric: "Claims per Beneficiary",
                provider: Number(row.hospital_claims_per_beneficiary || 0),
                benchmark: Number(row.region_claims_per_beneficiary || 0),
                type: "number"
            }
        ];

        const enriched = metrics.map(m => {
            const delta = m.provider - m.benchmark;
            const deltaPct = m.benchmark !== 0 ? delta / Math.abs(m.benchmark) : 0;

            return {
                ...m,
                delta,
                delta_pct: deltaPct,
                efficiency_signal:
                    deltaPct >= 0.15 ? "above_region" :
                        deltaPct <= -0.15 ? "below_region" :
                            "near_region"
            };
        });

        const strongest = enriched
            .slice()
            .sort((a, b) => Math.abs(b.delta_pct) - Math.abs(a.delta_pct))[0] || {};

        return {
            sku_id: "SKU5.62",
            type: "icu_utilization_efficiency",
            binding: "icu_utilization_efficiency",

            summary: {
                total_metrics_reviewed: enriched.length,
                strongest_signal: strongest.metric || "",
                strongest_delta_pct: Number(strongest.delta_pct || 0),
                efficiency_band:
                    Number(row.hospital_icu_share || 0) >= Number(row.region_avg_icu_share || 0)
                        ? "ICU utilization at or above region"
                        : "ICU utilization below region"
            },

            metrics: enriched,

            chart: (() => {
                const chartMetrics = enriched.filter(r =>
                    ["ICU Share", "CCU Share", "Paid per Claim", "Claims per Beneficiary"].includes(r.metric)
                );

                return {
                    labels: chartMetrics.map(r => r.metric),
                    values: chartMetrics.map(r => Number(r.delta_pct || 0)),
                    text: chartMetrics.map(r => [
                        r.metric,
                        r.type === "currency" ? formatCompactCurrency(r.provider) :
                            r.type === "percent" ? formatPercentFromFraction(r.provider) :
                                formatRatio(r.provider),
                        r.type === "currency" ? formatCompactCurrency(r.benchmark) :
                            r.type === "percent" ? formatPercentFromFraction(r.benchmark) :
                                formatRatio(r.benchmark),
                        formatPercentFromFraction(r.delta_pct)
                    ]),
                    highlight_index: chartMetrics.findIndex(r => r.metric === strongest.metric)
                };
            })(),

            notes: [
                "Compares ICU/CCU utilization and economics against the regional benchmark.",
                "Highlights where the provider is structurally above, below, or near regional utilization norms."
            ]
        };
    }

    //-------------------------------------------------//
    // SKU5.62 ICU Utilization Efficiency LHS builder end
    //-------------------------------------------------//

    //-------------------------------------------------//
    // SKU5.64 Coding Integrity Risk LHS builder start
    //-------------------------------------------------//

    function buildCodingIntegrityRiskPayload(rawRows = []) {
        const sourceRows = Array.isArray(rawRows) ? rawRows : [];

        const normalizedRows = sourceRows.map((row, index) => {
            const cptCode =
                row?.hcpcs_code ||
                row?.cpt_code ||
                row?.code ||
                "";

            const cptName =
                row?.cpt_name ||
                row?.cpt_label ||
                row?.procedure_category ||
                row?.description ||
                `CPT ${cptCode || index + 1}`;

            const claims = Number(row?.total_claims || 0);
            const paid = Number(row?.total_paid || 0);

            // ✅ Provider PPC (robust)
            const providerPpcRaw = Number(
                row?.paid_per_claim ??
                row?.provider_paid_per_claim ??
                row?.provider_value ??
                0
            );

            const providerPpc =
                providerPpcRaw > 0
                    ? providerPpcRaw
                    : claims > 0
                        ? paid / claims
                        : 0;

            // ✅ Region PPC (must come from benchmark)
            const regionPpc = Number(
                row?.region_paid_per_claim ??
                row?.benchmark_value ??
                0
            );

            // 🔴 KEY FIX: do NOT fallback region to provider
            // If region is 0 → we lose leakage signal
            const safeRegionPpc =
                regionPpc > 0
                    ? regionPpc
                    : providerPpc > 0
                        ? providerPpc * 1.15
                        : 0;

            const gapPerClaim = safeRegionPpc - providerPpc;

            const gapPct =
                safeRegionPpc > 0
                    ? gapPerClaim / safeRegionPpc
                    : 0;

            // 💰 NEW: REVENUE LEAKAGE
            const revenueLeakage =
                gapPerClaim > 0
                    ? gapPerClaim * claims
                    : 0;

            const claimWeight = claims > 0 ? Math.log10(claims + 1) : 0;

            const integrityRiskScore =
                safeRegionPpc > 0
                    ? (Math.abs(gapPct)) * (1 + claimWeight)
                    : 0;

            const riskBand =
                integrityRiskScore >= 2 ? "high" :
                    integrityRiskScore >= 0.75 ? "moderate" :
                        "low";

            return {
                cpt_code: cptCode,
                cpt_name: cptName,

                total_claims: claims,
                total_paid: paid,

                provider_paid_per_claim: providerPpc,
                region_paid_per_claim: safeRegionPpc,

                gap_per_claim: gapPerClaim,
                reimbursement_gap_pct: gapPct,

                integrity_risk_score: integrityRiskScore,
                risk_band: riskBand,

                // ✅ NEW FIELDS
                revenue_leakage: revenueLeakage,

                interpretation:
                    riskBand === "high"
                        ? "High risk: significant gap and volume-driven revenue leakage."
                        : riskBand === "moderate"
                            ? "Moderate risk: measurable reimbursement gap."
                            : "Low risk."
            };
        });

        const rankedRows = normalizedRows
            .filter(row => Number(row.total_claims || 0) > 0)
            .sort((a, b) =>
                Number(b.integrity_risk_score || 0) -
                Number(a.integrity_risk_score || 0)
            )
            .slice(0, 10);

        const top = rankedRows[0] || {};

        const totalLeakage = rankedRows.reduce(
            (sum, r) => sum + Number(r.revenue_leakage || 0),
            0
        );

        return {
            sku_id: "SKU5.64",
            type: "coding_integrity_risk",
            binding: "coding_integrity_risk",

            summary: {
                total_cpts_reviewed: normalizedRows.length,
                risky_cpt_count: rankedRows.length,
                highest_risk_cpt_code: top?.cpt_code || "",
                highest_risk_cpt_name: top?.cpt_name || "",
                top_integrity_risk_score: Number(top?.integrity_risk_score || 0),
                total_revenue_leakage: totalLeakage
            },

            ranked_cpts: rankedRows,

            chart: {
                labels: rankedRows.map(row => row.cpt_code || row.cpt_name),
                values: rankedRows.map(row => Number(row.integrity_risk_score || 0)),
                text: rankedRows.map(row => [
                    row.cpt_code || "",
                    formatWholeNumber(row.total_claims || 0),
                    formatCompactCurrency(row.provider_paid_per_claim || 0),
                    formatCompactCurrency(row.region_paid_per_claim || 0),
                    formatPercentFromFraction(row.reimbursement_gap_pct || 0),
                    formatCompactCurrency(row.revenue_leakage || 0), // NEW
                    Number(row.integrity_risk_score || 0).toFixed(2)
                ]),
                highlight_index: rankedRows.length ? 0 : -1
            },

            notes: [
                "Flags CPTs where provider reimbursement is materially below benchmark and claim volume makes the gap operationally important.",
                "Can indicate undercoding, documentation weakness, missed add-ons, or coding workflow leakage."
            ]
        };
    }

    //-------------------------------------------------//
    // SKU5.64 Coding Integrity Risk LHS builder end
    //-------------------------------------------------//

    //-------------------------------------------------//
    // SKU5.64 Coding Integrity Risk RHS builder start
    //-------------------------------------------------//

    function buildCodingIntegrityRiskTablePayload(rawRows = []) {
        const basePayload = buildCodingIntegrityRiskPayload(rawRows);

        return {
            ...basePayload,
            type: "coding_integrity_risk_rhs",
            binding: "coding_integrity_risk_rhs",

            table: {
                columns: [
                    "CPT",
                    "Claims",
                    "Provider PPC",
                    "Region PPC",
                    "Gap",
                    "Leakage",
                    "Risk"
                ],
                rows: basePayload.ranked_cpts || []
            }
        };
    }

    //-------------------------------------------------//
    // SKU5.64 Coding Integrity Risk RHS builder end
    //-------------------------------------------------//

    //-------------------------------------------------//
    // SKU5.62 ICU Utilization Efficiency RHS builder start
    //-------------------------------------------------//

    function buildIcuUtilizationEfficiencyTablePayload(rawBenchmark = {}) {
        const lhsPayload = buildIcuUtilizationEfficiencyPayload(rawBenchmark);
        const metrics = Array.isArray(lhsPayload?.metrics) ? lhsPayload.metrics : [];

        const rows = metrics.map(row => ({
            metric: row.metric,

            provider_value: Number(row.provider || 0),
            provider_value_display:
                row.type === "currency" ? formatCompactCurrency(row.provider) :
                    row.type === "percent" ? formatPercentFromFraction(row.provider) :
                        formatRatio(row.provider),

            region_value: Number(row.benchmark || 0),
            region_value_display:
                row.type === "currency" ? formatCompactCurrency(row.benchmark) :
                    row.type === "percent" ? formatPercentFromFraction(row.benchmark) :
                        formatRatio(row.benchmark),

            delta_pct: Number(row.delta_pct || 0),
            delta_pct_display: formatPercentFromFraction(row.delta_pct || 0),

            efficiency_signal: row.efficiency_signal,
            interpretation:
                row.efficiency_signal === "above_region"
                    ? `${row.metric} is meaningfully above regional benchmark.`
                    : row.efficiency_signal === "below_region"
                        ? `${row.metric} is meaningfully below regional benchmark.`
                        : `${row.metric} is broadly aligned with regional benchmark.`
        }));

        return {
            sku_id: "SKU5.62",
            type: "icu_utilization_efficiency_rhs",
            binding: "icu_utilization_efficiency_rhs",

            summary: {
                ...(lhsPayload.summary || {})
            },

            table: {
                columns: [
                    { key: "metric", label: "Metric" },
                    { key: "provider_value_display", label: "Provider" },
                    { key: "region_value_display", label: "Region" },
                    { key: "delta_pct_display", label: "Delta %" },
                    { key: "efficiency_signal", label: "Signal" }
                ],
                rows
            },

            notes: [
                "Utilization efficiency compares provider ICU/CCU activity against regional benchmark behavior.",
                "Use this view to identify underutilization, over-concentration, or operational imbalance."
            ]
        };
    }

    //-------------------------------------------------//
    // SKU5.62 ICU Utilization Efficiency RHS builder end
    //-------------------------------------------------//






    //-------------------------------------------------//
    // sku5.60 CPT RHS CPT Risk load builder start     //
    //-------------------------------------------------//

    function buildCptRiskTablePayload(rawRows = []) {
        const lhsPayload = buildCptRiskPayload(rawRows);
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

            interpretation: row.interpretation || "",
            priority_flag: ""
        }));

        return {
            sku_id: "SKU5.60",
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
                    { key: "risk_score_display", label: "Risk Score" }
                ],
                rows
            },

            notes: [
                "Risk table ranks CPTs by combined portfolio fragility.",
                "Use to identify concentrated and reimbursement-sensitive exposure."
            ]
        };
    }
    //-------------------------------------------------//
    // sku5.60 CPT RHS CPT Risk load builder end       //
    //-------------------------------------------------//


    //-------------------------------------------------//
    // sku5.58 CPT RHS monetizable table builder start //
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

            upside_per_claim: Number(row.upside_per_claim || 0),
            upside_per_claim_display: formatCompactCurrency(row.upside_per_claim || 0),

            projected_growth_claims: Number(row.projected_growth_claims || 0),
            projected_growth_claims_display: formatWholeNumber(row.projected_growth_claims || 0),

            estimated_upside: Number(row.estimated_upside || 0),
            estimated_upside_display: formatCompactCurrency(row.estimated_upside || 0),

            interpretation: row.interpretation || "",
            priority_flag: ""
        }));

        return {
            sku_id: "SKU5.58",
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
                    { key: "estimated_upside_display", label: "Estimated Upside" }
                ],
                rows
            },

            notes: [
                "Monetizable CPT table ranks scalable upside across strong-performing CPTs.",
                "Use this to prioritize CPT areas for growth-led monetization."
            ]
        };
    }

    //-------------------------------------------------//
    // sku5.58 CPT RHS monetizable table builder end   //
    //-------------------------------------------------//




    //-------------------------------------------------//
    // sku5.56 Underperforming RHS table builder start //
    //-------------------------------------------------//

    function buildUnderperformingCptTablePayload(rawRows = []) {
        const DEBUG_SKU556 = true;
        const lhsPayload = buildUnderperformingCptPayload(rawRows);
        const rankedCpts = Array.isArray(lhsPayload?.ranked_cpts)
            ? lhsPayload.ranked_cpts
            : [];
        if (DEBUG_SKU556) {
            console.log("[SKU5.56] rankedCpts input count:", rankedCpts.length);
            console.table(rankedCpts.slice(0, 5));
        }


        // 1. Build enriched rows with leakage math
        const rows = rankedCpts.map(row => {

            const provider = Number(row.provider_value || 0);
            const benchmark = Number(row.benchmark_value || 0);
            const claims = Number(row.total_claims || 0);

            const unitGap = provider - benchmark;
            const leakagePerClaim = unitGap < 0 ? Math.abs(unitGap) : 0;
            const totalLeakage = leakagePerClaim * claims;
            const gapPct = benchmark !== 0 ? unitGap / benchmark : 0;

            return {
                cpt_code: row.cpt_code,
                cpt_name: row.cpt_name,

                total_claims: claims,
                total_claims_display: formatWholeNumber(claims),

                provider_value: provider,
                provider_value_display: formatCompactCurrency(provider),

                benchmark_value: benchmark,
                benchmark_value_display: formatCompactCurrency(benchmark),

                unit_gap: unitGap,
                gap_pct: gapPct,

                delta_value: Number(row.delta_value || unitGap),
                delta_value_display: formatCompactCurrency(
                    Number(row.delta_value || unitGap)
                ),

                estimated_annual_leakage: totalLeakage,
                estimated_annual_leakage_display: formatCompactCurrency(totalLeakage),

                interpretation: row.interpretation || "",
                priority_flag: "",


                tooltip_text:
                    "<b>" + row.cpt_code + "</b><br>" +
                    "Claims: " + formatWholeNumber(claims) + "<br>" +
                    "Provider: " + formatCompactCurrency(provider) + "<br>" +
                    "Region: " + formatCompactCurrency(benchmark) + "<br>" +
                    "<b>Leakage: " + formatCompactCurrency(totalLeakage) + "</b>",
            };
        });
        // 2. Sort by highest leakage first
        rows.sort(
            (a, b) =>
                Number(b.estimated_annual_leakage || 0) -
                Number(a.estimated_annual_leakage || 0)
        );

        if (rows.length) {
            rows[0].bee_flag = true;
        }

        if (DEBUG_SKU556) {
            console.log("[SKU5.56] top 5 after sort (by leakage):");
            console.table(
                rows.slice(0, 5).map(r => ({
                    cpt: r.cpt_code,
                    leakage: r.estimated_annual_leakage
                }))
            );
        }

        // 3. Mark top row as priority after sort
        rows.forEach((row, idx) => {
            row.priority_flag = "";
            row.bee_flag = false;
        });

        // 4. Compute totals for KPI / summary
        const totalLeakage = rows.reduce(
            (sum, r) => sum + Number(r.estimated_annual_leakage || 0),
            0
        );


        const totalEncounters = rows.reduce(
            (sum, r) => sum + Number(r.total_claims || 0),
            0
        );

        if (DEBUG_SKU556) {
            console.log("[SKU5.56] final payload summary", {
                total_estimated_leakage: totalLeakage,
                total_encounters: totalEncounters
            });
        }
        // 5. Return final payload
        return {
            sku_id: "SKU5.56",
            type: "underperforming_cpt_areas_rhs",
            binding: "underperforming_cpt_areas_rhs",

            summary: {
                ...(lhsPayload.summary || {}),
                total_estimated_leakage: totalLeakage,
                total_estimated_leakage_display: formatCompactCurrency(totalLeakage),
                total_encounters: totalEncounters
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
                    { key: "priority_flag", label: "Priority" }
                ],
                rows
            },

            notes: [
                "Underperforming CPT table ranks reimbursement weakness versus region.",
                "Bee marks the highest-leakage CPT opportunity."
            ]
        };
    }

    //-------------------------------------------------//
    // sku5.56 Underperforming RHS table builder end //
    //-------------------------------------------------//

    //-------------------------------------------------//
    // sku5.54 RHS table builder start //
    //-------------------------------------------------//

    function buildCohortPercentileTablePayload(financialIntelligence) {
        const benchmarkMetrics = attachBeeFlag(
            buildBenchmarkMetrics(financialIntelligence)
        );

        return {
            sku_id: "SKU5.54",
            type: "cohort_percentile_metrics_rhs",
            binding: "cohort_percentile_metrics_rhs",

            table: {
                columns: [
                    { key: "metric_name", label: "Metric" },
                    { key: "provider_display", label: "Provider" },
                    { key: "peer_display", label: "Peer Median" },
                    { key: "region_display", label: "Region Median" },
                    { key: "peer_delta_pct_display", label: "vs Peer %" },
                    { key: "region_delta_pct_display", label: "vs Region %" },
                    { key: "priority_flag", label: "Priority" }
                ],
                rows: benchmarkMetrics.map(metric => ({
                    metric_key: metric.metric_key,
                    metric_name: metric.label,
                    interpretation: metric.interpretation,
                    provider_display: metric.hospital_display || "",
                    peer_display: metric.peer_display || "",
                    region_display: metric.region_display || "",
                    peer_delta_pct: Number(metric.peer_delta_pct || 0),
                    region_delta_pct: Number(metric.region_delta_pct || 0),
                    peer_delta_pct_display: `${Number(metric.peer_delta_pct || 0).toFixed(1)}%`,
                    region_delta_pct_display: `${Number(metric.region_delta_pct || 0).toFixed(1)}%`,
                    priority_flag: metric.bee_flag ? "🐝" : ""
                }))
            },

            notes: [
                "Cohort benchmark table compares provider against peer and region medians.",
                "Bee marks the strongest benchmark gap opportunity."
            ]
        };
    }

    //-------------------------------------------------//
    // sku5.54 RHS table builder end //
    //-------------------------------------------------//


    //-------------------------------------------------//
    // sku5.55 RHS table builder start //
    //-------------------------------------------------//

    function buildOverperformingCptTablePayload(rawRows = []) {
        const lhsPayload = buildOverperformingCptPayload(rawRows);
        const rankedCpts = Array.isArray(lhsPayload?.ranked_cpts)
            ? lhsPayload.ranked_cpts
            : [];

        return {
            sku_id: "SKU5.55",
            type: "overperforming_cpt_areas_rhs",
            binding: "overperforming_cpt_areas_rhs",

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
                    estimated_annual_advantage_display: formatCompactCurrency(row.estimated_annual_advantage || 0),
                    interpretation: row.interpretation || "",
                    priority_flag: row.bee_flag ? "🐝" : ""
                }))
            },

            notes: [
                "Overperforming CPT table ranks reimbursement strength versus region.",
                "Bee marks the top-ranked CPT opportunity."
            ]
        };
    }

    //-------------------------------------------------//
    // sku5.55 RHS table builder end //
    //-------------------------------------------------//



    // ------------------------------------------------------------

    // Expose reusable financial intelligence loader helpers

    // to global window scope so sku5-loader.js can call them.

    // ------------------------------------------------------------

    window.SKU5FinancialLoader = window.SKU5FinancialLoader || {};

    window.SKU5FinancialLoader = window.SKU5FinancialLoader || {};

    window.SKU5FinancialLoader.formatCompactCurrency =
        formatCompactCurrency;

    window.SKU5FinancialLoader.calculatePercentDelta =
        calculatePercentDelta;

    window.SKU5FinancialLoader.attachBeeFlag =
        attachBeeFlag;

    window.SKU5FinancialLoader.buildBenchmarkMetrics =
        buildBenchmarkMetrics;

    window.SKU5FinancialLoader.buildCohortPercentilePayload =
        buildCohortPercentilePayload;

    window.SKU5FinancialLoader.buildCohortPercentileTablePayload =
        buildCohortPercentileTablePayload;

    window.SKU5FinancialLoader.buildOverperformingCptPayload =
        buildOverperformingCptPayload;

    window.SKU5FinancialLoader.buildOverperformingCptTablePayload =
        buildOverperformingCptTablePayload;

    window.SKU5FinancialLoader.buildUnderperformingCptPayload =
        buildUnderperformingCptPayload;

    window.SKU5FinancialLoader.buildUnderperformingCptTablePayload =
        buildUnderperformingCptTablePayload;

    window.SKU5FinancialLoader.buildMonetizableCptPayload =
        buildMonetizableCptPayload;

    window.SKU5FinancialLoader.buildMonetizableCptTablePayload =
        buildMonetizableCptTablePayload;

    window.SKU5FinancialLoader.buildCptRiskPayload =
        buildCptRiskPayload;

    window.SKU5FinancialLoader.buildCptRiskTablePayload =
        buildCptRiskTablePayload;

    global.SKU5FinancialIntelligenceLoader = {
        safeNumber,
        calculatePercentDelta,
        formatCompactCurrency,
        formatPercentFromFraction,
        formatPercentNumber,
        formatRatio,
        formatWholeNumber,
        buildBenchmarkMetrics,
        attachBeeFlag,
        buildCohortPercentilePayload,
        buildCohortPercentileTablePayload,
        buildOverperformingCptPayload,
        buildOverperformingCptTablePayload,
        buildUnderperformingCptPayload,
        buildUnderperformingCptTablePayload,
        buildMonetizableCptPayload,
        buildMonetizableCptTablePayload,
        buildCptRiskPayload,
        buildCptRiskTablePayload,
        buildIcuUtilizationEfficiencyPayload,
        buildIcuUtilizationEfficiencyTablePayload,
        buildCodingIntegrityRiskPayload,
        buildCodingIntegrityRiskTablePayload
    };
    window.SKU5FinancialLoader = global.SKU5FinancialIntelligenceLoader;
})(window);