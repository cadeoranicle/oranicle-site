// sku5-loader.js
// SKU5 data resolver / fetch layer
// Responsibilities:
// 1. Read registry entry contracts
// 2. Determine required data binding keys
// 3. Fetch / assemble payloads
// 4. Return one normalized payload object

(function initSKU5Loader(global) {
    "use strict";

    const DEBUG = true;

    const SKU5_DATA_CONFIG = {
        remoteBase: "https://pub-6dde7e3865604b0aa28903cdbc0f2627.r2.dev"
    };

    // ------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------

    async function loadSkuPayload({ entry, session }) {
        assertInputs({ entry, session });

        log("loadSkuPayload() start", {
            skuId: entry.sku_id,
            lhs_contract: entry.lhs_contract,
            rhs_contract: entry.rhs_contract
        });

        const bindingKeys = collectBindingKeys(entry);

        log("binding keys resolved", bindingKeys);

        const payload = {
            _meta: {
                sku_id: entry.sku_id,
                sequence: entry.sequence,
                range_group: entry.range_group,
                intelligence_class: entry.intelligence_class,
                binding_keys: bindingKeys,
                loaded_at: new Date().toISOString()
            }
        };

        for (const key of bindingKeys) {
            payload[key] = await resolveBindingKey({ key, entry, session });
        }

        mergeNarrativePayloads({ entry, payload });

        if (entry.accumulate_from_previous) {
            payload._accumulation = buildAccumulationState({ entry, session, payload });
        }

        log("loadSkuPayload() complete", payload);

        return payload;
    }


    //--------------------------------------------------------------
    // SKU5.60 CPT portfolio risk data loader (R2)
    //--------------------------------------------------------------
    async function loadCptPortfolioRisk(entry, session) {
        const url = "https://pub-6dde7e3865604b0aa28903cdbc0f2627.r2.dev/canonical/regions/NYNJCT/v1/CPT_ICU_CCU_SKU5/artefacts/NYNJCT_allNPI_CPT_ICUCCU.json";

        const res = await fetch(url);
        const json = await res.json();

        const hospitalNpi = getProviderNpi();

        const provider = json?.providers?.find(
            p => String(p.hospital_npi).trim() === String(hospitalNpi).trim()
        );

        return provider?.cpt_rows || [];
    }

    // ------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------

    function assertInputs({ entry, session }) {
        if (!entry) throw new Error("SKU5Loader missing entry.");
        if (!session) throw new Error("SKU5Loader missing session.");
        if (!entry.sku_id) throw new Error("SKU5Loader entry missing sku_id.");
    }

    // ------------------------------------------------------------
    // URL helpers
    // ------------------------------------------------------------

    function getRegion() {
        return readContextValue("region") || "NYNJCT";
    }

    function getProviderNpi() {
        return readContextValue("provider") || readContextValue("npi") || "";
    }

    function getSku5ContractsBaseUrl() {
        const region = getRegion();
        return `${SKU5_DATA_CONFIG.remoteBase}/canonical/regions/${region}/v1/CPT_ICU_CCU_SKU5/contracts`;
    }

    function getSku5ArtefactsBaseUrl() {
        const region = getRegion();
        return `${SKU5_DATA_CONFIG.remoteBase}/canonical/regions/${region}/v1/CPT_ICU_CCU_SKU5/artefacts`;
    }

    function getRegionAxesContractUrl() {
        return `${getSku5ContractsBaseUrl()}/SKU5_4_1_hospital_region_cloud_axes_contract.json`;
    }

    function getRegionCloudSampleUrl() {
        return `${getSku5ArtefactsBaseUrl()}/SKU5_4_1_hospital_region_cloud_sample.json`;
    }

    function getRegionCloudFullUrl() {
        return `${getSku5ArtefactsBaseUrl()}/SKU5_4_1_hospital_region_cloud_full.json`;
    }

    function getTrajectoryUrl() {
        const npi = getProviderNpi();
        return `${getSku5ArtefactsBaseUrl()}/hospital_trajectory/SKU5_4_6_hospital_trajectory_${npi}.json`;
    }

    function getHospitalFinancialBaseUrl() {
        return `${getSku5ArtefactsBaseUrl()}/hospital_financial_intelligence`;
    }

    function getHospitalFinancialUrl() {
        const npi = getProviderNpi();
        return `${getHospitalFinancialBaseUrl()}/SKU5_5_hospital_financial_intelligence_${npi}.json`;
    }

    // ------------------------------------------------------------
    // Fetch helpers
    // ------------------------------------------------------------

    async function fetchJson(url) {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} ${response.statusText} -> ${url}`);
        }
        return await response.json();
    }

    async function loadRegionAxesContractJson() {
        const url = getRegionAxesContractUrl();
        log("loadRegionAxesContractJson()", { url });
        return await fetchJson(url);
    }

    async function loadRegionCloudSampleJson() {
        const url = getRegionCloudSampleUrl();
        log("loadRegionCloudSampleJson()", { url });
        return await fetchJson(url);
    }

    async function loadRegionCloudFullJson() {
        const url = getRegionCloudFullUrl();
        log("loadRegionCloudFullJson()", { url });
        return await fetchJson(url);
    }

    async function loadTrajectoryJson() {
        const url = getTrajectoryUrl();
        log("loadTrajectoryJson()", { url });
        return await fetchJson(url);
    }

    async function loadHospitalFinancialJson() {
        const url = getHospitalFinancialUrl();
        log("loadHospitalFinancialJson()", { url });
        return await fetchJson(url);
    }

    // ------------------------------------------------------------
    // Binding key discovery
    // ------------------------------------------------------------

    function collectBindingKeys(entry) {
        const keys = new Set();

        addIfPresent(keys, entry.lhs_contract);
        addIfPresent(keys, entry.rhs_contract);

        addContractBindingKey(keys, entry.panel_1_contract);
        addContractBindingKey(keys, entry.panel_2_contract);
        addContractBindingKey(keys, entry.panel_3_contract);
        addContractBindingKey(keys, entry.panel_4_contract);
        addContractBindingKey(keys, entry.panel_5_contract);

        addNarrativeKey(keys, entry.panel_1_contract);
        addNarrativeKey(keys, entry.panel_2_contract);
        addNarrativeKey(keys, entry.panel_3_contract);
        addNarrativeKey(keys, entry.panel_4_contract);
        addNarrativeKey(keys, entry.panel_5_contract);

        return [...keys].filter(Boolean);
    }

    function addIfPresent(set, value) {
        if (value && typeof value === "string") set.add(value);
    }

    function addContractBindingKey(set, contract) {
        if (contract?.data_binding_key) set.add(contract.data_binding_key);
    }

    function addNarrativeKey(set, contract) {
        const key = contract?.props?.narrative_key;
        if (key) set.add(key);
    }

    // ------------------------------------------------------------
    // Canonical helpers
    // ------------------------------------------------------------

    function normalizeNpi(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function buildAxesFallback() {
        return [
            { axis_id: "A1", axis_label: "Care Economic Intensity" },
            { axis_id: "A2", axis_label: "Utilization Structure" },
            { axis_id: "A3", axis_label: "Provider Scale / Structural Activity" }
        ];
    }

    function buildAxesFromContract(contract = {}) {
        const displayAxes = Array.isArray(contract?.axes?.display_axes)
            ? contract.axes.display_axes
            : null;

        const axisDisplayMap = contract?.axes?.axis_display_map || {};
        const axisSemantics = contract?.axes?.axis_semantics || {};

        if (displayAxes?.length) {
            return displayAxes.map((axisId, idx) => ({
                axis_id: axisId,
                axis_label:
                    axisDisplayMap[axisId] ||
                    axisSemantics[axisId] ||
                    buildAxesFallback()[idx]?.axis_label ||
                    axisId
            }));
        }

        return buildAxesFallback();
    }

    function buildCenterPointFromContract(contract = {}) {
        const origin = contract?.geometry?.origin || contract?.geometry?.centroid || {};
        return {
            x: Number(origin.x ?? origin.C1 ?? 0),
            y: Number(origin.y ?? origin.C2 ?? 0),
            z: Number(origin.z ?? origin.C3 ?? 0)
        };
    }

    function buildAxisSemanticsFromContract(contract = {}) {
        return contract?.axes?.axis_semantics || {};
    }

    function buildAxisRangesFromContract(contract = {}) {
        return contract?.axes?.axis_ranges || {};
    }

    function buildCameraDefaultsFromContract(contract = {}) {
        return contract?.geometry?.camera_defaults || {};
    }

    function buildProvenanceFromContract(contract = {}) {
        return {
            canonical_id: contract?.canonical_id || "",
            build_timestamp_utc: contract?.build_timestamp_utc || "",
            build_version: contract?.provenance?.build_version || "",
            row_count: contract?.provenance?.row_count || 0,
            source_dataset: contract?.provenance?.source_dataset || "",
            state_coverage: contract?.provenance?.state_coverage || []
        };
    }

    function buildHospitalPointFromRow(row) {
        if (!row) return null;

        return {
            npi: String(row.hospital_npi || row.npi || row.provider_npi || ""),
            x: Number(row.C1 ?? row.x ?? 0),
            y: Number(row.C2 ?? row.y ?? 0),
            z: Number(row.C3 ?? row.z ?? 0)
        };
    }

    function buildPeerCohortPointFromPeer(peer) {
        if (!peer) return null;

        return {
            npi: String(peer.peer_npi || peer.npi || ""),
            x: Number(peer.x ?? 0),
            y: Number(peer.y ?? 0),
            z: Number(peer.z ?? 0)
        };
    }

    function buildProviderPeerConnector(hospitalPoint, peerPoint) {
        if (!hospitalPoint || !peerPoint) return null;

        return {
            start_point: {
                x: Number(hospitalPoint.x ?? 0),
                y: Number(hospitalPoint.y ?? 0),
                z: Number(hospitalPoint.z ?? 0)
            },
            end_point: {
                x: Number(peerPoint.x ?? 0),
                y: Number(peerPoint.y ?? 0),
                z: Number(peerPoint.z ?? 0)
            }
        };
    }

    function buildCanonicalCloudRows(json = {}) {
        const rows = Array.isArray(json?.rows) ? json.rows : [];

        return rows.map(row => ({
            npi: String(row.hospital_npi || row.npi || ""),
            x: Number(row.C1 ?? row.x ?? 0),
            y: Number(row.C2 ?? row.y ?? 0),
            z: Number(row.C3 ?? row.z ?? 0)
        }));
    }

    // ------------------------------------------------------------
    // Binding key resolver
    // ------------------------------------------------------------

    async function resolveBindingKey({ key, entry, session }) {
        log("resolveBindingKey()", { key, skuId: entry.sku_id });

        global.SKU5PayloadCache = global.SKU5PayloadCache || {};

        if (key === "canonical_axes_center") {
            return await loadCanonicalAxesCenter(entry, session);
        }

        if (key === "canonical_cloud") {
            const cacheKey = `canonical_cloud_${getRegion()}_${getProviderNpi()}`;

            if (global.SKU5PayloadCache[cacheKey]) {
                log("canonical cloud cache hit", { cacheKey });
                return global.SKU5PayloadCache[cacheKey];
            }

            const payload = await loadCanonicalCloud(entry, session);
            global.SKU5PayloadCache[cacheKey] = payload;
            return payload;
        }

        if (key === "canonical_trajectory") {
            return await loadCanonicalTrajectory(entry, session);
        }

        if (key === "trajectory_metrics") {
            return await loadTrajectoryMetrics(entry, session);
        }

        if (key === "comparable_peers_view") {
            return await loadComparablePeersView(entry, session);
        }

        if (key === "peer_table_rows") {
            const payload = await loadComparablePeersView(entry, session);
            return payload.peer_table_rows || [];
        }

        if (key === "provider_vs_region_benchmark") {
            return await loadProviderVsRegionBenchmark(entry, session);
        }

        if (key === "provider_vs_peer_benchmark") {
            return await loadProviderVsPeerBenchmark(entry, session);
        }

        if (key === "top_comparable_providers") {
            return await loadComparablePeersView(entry, session);
        }

        if (key === "top_comparable_providers_table") {
            const payload = await loadComparablePeersView(entry, session);
            return payload.peer_table_rows || [];
        }

        if (key === "cohort_percentiles") {
            return await loadCohortPercentiles(entry, session);
        }






        if (key === "fixable_cpts") {
            return await loadFixableCpts(entry, session);
        }

        //--------------------------------------------------------------
        // SKU5.58 monetizable CPT LHS payload resolver start
        //--------------------------------------------------------------
        if (key === "monetizable_cpt_areas") {
            const rawRows = await loadMonetizableCptAreas(entry, session);

            return window.SKU5FinancialLoader?.buildMonetizableCptPayload
                ? window.SKU5FinancialLoader.buildMonetizableCptPayload(rawRows)
                : null;
        }
        //--------------------------------------------------------------
        // SKU5.58 monetizable CPT LHS payload resolver end
        //--------------------------------------------------------------

        //--------------------------------------------------------------
        // SKU5.58 monetizable CPT RHS payload resolver start
        //--------------------------------------------------------------
        if (key === "monetizable_cpt_areas_rhs") {
            const rawRows = await loadMonetizableCptAreas(entry, session);

            return window.SKU5FinancialLoader?.buildMonetizableCptTablePayload
                ? window.SKU5FinancialLoader.buildMonetizableCptTablePayload(rawRows)
                : { table: { columns: [], rows: [] } };
        }
        //--------------------------------------------------------------
        // SKU5.58 monetizable CPT RHS payload resolver end
        //--------------------------------------------------------------


        //--------------------------------------------------------------
        // SKU5.60 CPT portfolio risk LHS payload resolver start
        //--------------------------------------------------------------
        if (key === "cpt_portfolio_risk") {
            const rawRows = await window.SKU5Loader.loadCptPortfolioRisk(entry, session);

            return window.SKU5FinancialLoader?.buildCptRiskPayload
                ? window.SKU5FinancialLoader.buildCptRiskPayload(rawRows)
                : null;
        }
        //--------------------------------------------------------------
        // SKU5.60 CPT portfolio risk LHS payload resolver end
        //--------------------------------------------------------------


        //--------------------------------------------------------------
        // SKU5.60 CPT portfolio risk RHS payload resolver start
        //--------------------------------------------------------------
        if (key === "cpt_portfolio_risk_rhs") {
            const rawRows = await loadCptPortfolioRisk(entry, session);

            return window.SKU5FinancialLoader?.buildCptRiskTablePayload
                ? window.SKU5FinancialLoader.buildCptRiskTablePayload(rawRows)
                : { table: { columns: [], rows: [] } };
        }
        //--------------------------------------------------------------
        // SKU5.60 CPT portfolio risk RHS payload resolver end
        //--------------------------------------------------------------


        //--------------------------------------------------------------
        // SKU5.62 ICU utilization efficiency LHS payload resolver start
        //--------------------------------------------------------------
        if (key === "icu_utilization_efficiency") {
            const json = await loadHospitalFinancialJson();
            const rawBenchmark =
                json?.hospital_financial_intelligence?.hospital_vs_region_benchmark || {};

            return window.SKU5FinancialLoader?.buildIcuUtilizationEfficiencyPayload
                ? window.SKU5FinancialLoader.buildIcuUtilizationEfficiencyPayload(rawBenchmark)
                : null;
        }
        //--------------------------------------------------------------
        // SKU5.62 ICU utilization efficiency LHS payload resolver end
        //--------------------------------------------------------------

        //--------------------------------------------------------------
        // SKU5.62 ICU utilization efficiency RHS payload resolver start
        //--------------------------------------------------------------
        if (key === "icu_utilization_efficiency_rhs") {
            const json = await loadHospitalFinancialJson();
            const rawBenchmark =
                json?.hospital_financial_intelligence?.hospital_vs_region_benchmark || {};

            return window.SKU5FinancialLoader?.buildIcuUtilizationEfficiencyTablePayload
                ? window.SKU5FinancialLoader.buildIcuUtilizationEfficiencyTablePayload(rawBenchmark)
                : { table: { columns: [], rows: [] } };
        }
        //--------------------------------------------------------------
        // SKU5.62 ICU utilization efficiency RHS payload resolver end
        //--------------------------------------------------------------

        //--------------------------------------------------------------
        // SKU5.64 Coding Integrity Risk LHS payload resolver start
        //--------------------------------------------------------------
        if (key === "coding_integrity_risk") {
            const rawRows = await loadCptLeakageAreas(entry, session);

            return window.SKU5FinancialLoader?.buildCodingIntegrityRiskPayload
                ? window.SKU5FinancialLoader.buildCodingIntegrityRiskPayload(rawRows)
                : null;
        }
        //--------------------------------------------------------------
        // SKU5.64 Coding Integrity Risk LHS payload resolver end
        //--------------------------------------------------------------


        //--------------------------------------------------------------
        // SKU5.64 Coding Integrity Risk RHS payload resolver start
        //--------------------------------------------------------------
        if (key === "coding_integrity_risk_rhs") {
            const rawRows = await loadCptLeakageAreas(entry, session);

            return window.SKU5FinancialLoader?.buildCodingIntegrityRiskTablePayload
                ? window.SKU5FinancialLoader.buildCodingIntegrityRiskTablePayload(rawRows)
                : { table: { columns: [], rows: [] } };
        }
        //--------------------------------------------------------------
        // SKU5.64 Coding Integrity Risk RHS payload resolver end
        //--------------------------------------------------------------

        //--------------------------------------------------------------
        // SKU5.64 Coding Integrity Risk LHS payload resolver start
        //--------------------------------------------------------------
        if (key === "coding_integrity_risk") {
            const rawRows = await loadUnderperformingCptAreas(entry, session);

            return window.SKU5FinancialLoader?.buildCodingIntegrityRiskPayload
                ? window.SKU5FinancialLoader.buildCodingIntegrityRiskPayload(rawRows)
                : null;
        }
        //--------------------------------------------------------------
        // SKU5.64 Coding Integrity Risk LHS payload resolver end
        //--------------------------------------------------------------


        //--------------------------------------------------------------
        // SKU5.64 Coding Integrity Risk RHS payload resolver start
        //--------------------------------------------------------------
        if (key === "coding_integrity_risk_rhs") {
            const rawRows = await loadUnderperformingCptAreas(entry, session);

            return window.SKU5FinancialLoader?.buildCodingIntegrityRiskTablePayload
                ? window.SKU5FinancialLoader.buildCodingIntegrityRiskTablePayload(rawRows)
                : { table: { columns: [], rows: [] } };
        }
        //--------------------------------------------------------------
        // SKU5.64 Coding Integrity Risk RHS payload resolver end
        //--------------------------------------------------------------

        if (key === "cpt_portfolio_risk_notes") {
            return [
                "Combines CPT concentration and reimbursement fragility into a unified portfolio risk view.",
                "Highlights CPT exposure where claim dependence and benchmark sensitivity create structural downside."
            ];
        }

        if (key === "coding_integrity_risk_notes") {
            return [
                "Coding integrity risk flags CPTs where benchmark underpayment and operational volume may indicate undercoding, documentation weakness, or coding workflow leakage.",
                "Use this view to prioritize coding audit, documentation review, and corrective revenue-cycle action."
            ];
        }

        if (key === "cpt_leakage_areas") {
            return await loadCptLeakageAreas(entry, session);
        }



        if (key === "canonical_layer_1_notes") {
            return [
                "Axis center established.",
                "Canonical reference frame initialized."
            ];
        }

        if (key === "canonical_layer_2_notes") {
            return [
                "Regional cloud added.",
                "Distribution envelope now visible."
            ];
        }

        if (key === "canonical_layer_3_notes") {
            return [
                "Hospital point added to canonical space."
            ];
        }

        if (key === "canonical_layer_4_notes") {
            return [
                "Peer cohort reference added."
            ];
        }

        if (key === "canonical_layer_5_notes") {
            return [
                "Cloud suppressed for focused comparison."
            ];
        }

        if (key === "narrative_1") {
            return "This layer establishes the canonical axis framework and the center reference for hospital positioning.";
        }

        if (key === "narrative_2") {
            return "This layer introduces the regional cloud, showing the broader distribution envelope around the canonical center.";
        }

        if (key === "narrative_3") {
            return "This layer places the hospital into canonical space so its structural position becomes visible against the reference geometry.";
        }

        if (key === "peer_context_narrative") {
            return "This layer overlays the peer cohort so the hospital can be interpreted relative to its nearest structural comparables.";
        }

        if (key === "focused_view_narrative") {
            return "This layer suppresses non-essential cloud density and tightens visual focus on the hospital-to-peer comparison.";
        }

        //--------------------------------------------------------------
        // Lightweight notes builders for Panel 5
        // Contract-level explanatory payloads start 
        //--------------------------------------------------------------


        if (key === "region_benchmark_notes") {
            return [
                "Compares provider against region benchmark.",
                "Useful for broad variance screening.",
                "Good first-level descriptive layer."
            ];
        }

        if (key === "peer_benchmark_notes") {
            return [
                "Compares provider against peer benchmark.",
                "Useful for same-scale comparison.",
                "Reduces distortion from broad regional averaging."
            ];
        }

        if (key === "trajectory_notes") {
            return [
                "Shows longitudinal movement over time.",
                "Useful for drift and convergence tracking.",
                "Can later feed predictive layers."
            ];
        }

        if (key === "top_comparable_providers_notes") {
            return [
                "Nearest comparable providers support peer action framing.",
                "Useful for reference cohorts and prescriptive logic."
            ];
        }
        //--------------------------------------------------------------
        // SKU5.62 icu_utilization_efficiency resolver start
        //--------------------------------------------------------------

        if (key === "icu_utilization_efficiency_notes") {
            return [
                "Compares ICU/CCU utilization and economics against regional benchmark behavior.",
                "Flags where provider intensity, utilization, or reimbursement efficiency diverges from region."
            ];
        }

        //--------------------------------------------------------------
        // SKU5.62 icu_utilization_efficiency resolver end
        //--------------------------------------------------------------




        //--------------------------------------------------------------
        // SKU5.54 cohort percentile notes resolver start
        //--------------------------------------------------------------

        if (key === "cohort_percentiles_notes") {
            return [
                "Median and percentile context sharpens distribution-based positioning."
            ];
        }

        //--------------------------------------------------------------
        // SKU5.54 cohort percentile LHS payload resolver start
        //--------------------------------------------------------------

        if (key === "cohort_percentile_metrics") {
            return await loadCohortPercentiles(entry, session);
        }

        //--------------------------------------------------------------
        // SKU5.54 cohort percentile RHS payload resolver start
        //--------------------------------------------------------------

        if (key === "cohort_percentile_metrics_rhs") {
            const json = await loadHospitalFinancialJson();
            const financialIntelligence = json?.hospital_financial_intelligence || {};

            return window.SKU5FinancialLoader?.buildCohortPercentileTablePayload
                ? window.SKU5FinancialLoader.buildCohortPercentileTablePayload(financialIntelligence)
                : { table: { columns: [], rows: [] } };
        }

        //--------------------------------------------------------------
        // SKU5.55 LHS cpt overperformance payload resolver start
        //--------------------------------------------------------------


        if (key === "overperforming_cpt_areas") {
            const rawRows = await loadOverperformingCptAreas(entry, session);

            return window.SKU5FinancialLoader?.buildOverperformingCptPayload
                ? window.SKU5FinancialLoader.buildOverperformingCptPayload(rawRows)
                : null;
        }



        //--------------------------------------------------------------
        // SKU5.55 RHS cpt overperformance payload resolver start
        //--------------------------------------------------------------




        if (key === "overperforming_cpt_areas_rhs") {
            const rawRows = await loadOverperformingCptAreas(entry, session);

            return window.SKU5FinancialLoader?.buildOverperformingCptTablePayload
                ? window.SKU5FinancialLoader.buildOverperformingCptTablePayload(rawRows)
                : { table: { columns: [], rows: [] } };
        }

        if (key === "cohort_percentile_metrics_notes") {
            return [
                "Compares provider reimbursement, utilization, service breadth, and care mix against peer hospitals and regional benchmarks.",
                "Bee indicator appears only when one metric stands out as a materially larger benchmark gap than the others."
            ];
        }

        if (key === "overperforming_cpt_notes") {
            return [
                "Highlights existing areas of strength.",
                "Can feed monetization and expansion logic."
            ];
        }

        //--------------------------------------------------------------
        // SKU5.56 underperforming CPT LHS payload resolver start
        //--------------------------------------------------------------
        if (key === "underperforming_cpt_areas") {
            const rawRows = await loadUnderperformingCptAreas(entry, session);

            return window.SKU5FinancialLoader?.buildUnderperformingCptPayload
                ? window.SKU5FinancialLoader.buildUnderperformingCptPayload(rawRows)
                : null;
        }
        //--------------------------------------------------------------
        // SKU5.56 underperforming CPT LHS payload resolver end
        //--------------------------------------------------------------


        //--------------------------------------------------------------
        // SKU5.56 underperforming CPT RHS payload resolver start
        //--------------------------------------------------------------
        if (key === "underperforming_cpt_areas_rhs") {
            const rawRows = await loadUnderperformingCptAreas(entry, session);

            return window.SKU5FinancialLoader?.buildUnderperformingCptTablePayload
                ? window.SKU5FinancialLoader.buildUnderperformingCptTablePayload(rawRows)
                : { table: { columns: [], rows: [] } };
        }
        //--------------------------------------------------------------
        // SKU5.56 underperforming CPT RHS payload resolver end
        //--------------------------------------------------------------


        //--------------------------------------------------------------
        // SKU5.56 underperforming CPT notes resolver start
        //--------------------------------------------------------------
        if (key === "underperforming_cpt_notes") {
            return [
                "Highlights CPT areas where provider reimbursement underperforms regional benchmarks.",
                "Can feed fixable CPT and prescriptive improvement layers."
            ];
        }
        //--------------------------------------------------------------
        // SKU5.56 underperforming CPT notes resolver end
        //--------------------------------------------------------------

        if (key === "fixable_cpts_notes") {
            return [
                "Focuses on CPT areas that appear operationally improvable.",
                "Ideal bridge into prescriptive actions."
            ];
        }

        if (key === "monetizable_cpts_notes") {
            return [
                "Focuses on reimbursement-linked growth opportunities."
            ];
        }

        if (key === "cpt_leakage_notes") {
            return [
                "Identifies areas where potential value is being lost."
            ];
        }




        if (key === "cpt_concentration_risk_notes") {
            return [
                "Measures dependency risk from overly concentrated CPT mix."
            ];
        }

        if (key === "cpt_reimbursement_risk_notes") {
            return [
                "Measures exposure to reimbursement fragility and payment volatility."
            ];
        }


        //--------------------------------------------------------------
        // Lightweight notes builders for Panel 5
        // Contract-level explanatory payloads - end
        //--------------------------------------------------------------

        if (key === "data1" || key === "graphs1") {
            return await loadProviderVsRegionBenchmark(entry, session);
        }

        if (key === "data2" || key === "graphs2") {
            return await loadProviderVsPeerBenchmark(entry, session);
        }

        if (key === "data3") {
            const payload = await loadComparablePeersView(entry, session);
            return payload.peer_table_rows || [];
        }

        if (key === "graphs3") {
            return await loadComparablePeersView(entry, session);
        }

        if (key === "data4" || key === "graphs4") {
            return await loadCohortPercentiles(entry, session);
        }

        if (key === "data5" || key === "graphs5") {
            return await loadOverperformingCptAreas(entry, session);
        }

        if (key === "data6" || key === "graphs6") {
            return await loadUnderperformingCptAreas(entry, session);
        }

        if (key === "data7" || key === "graphs7") {
            return await loadFixableCpts(entry, session);
        }

        if (key === "data8" || key === "graphs8") {
            return await loadMonetizableCpts(entry, session);
        }

        if (key === "data9" || key === "graphs9") {
            return await loadCptLeakageAreas(entry, session);
        }

        if (key === "data10" || key === "graphs10") {
            return await loadCptConcentrationRisk(entry, session);
        }

        if (key === "data11" || key === "graphs11") {
            return await loadCptReimbursementRisk(entry, session);
        }

        warn(`No resolver found for binding key: ${key}`);
        return null;
    }

    // ------------------------------------------------------------
    // Canonical loaders
    // ------------------------------------------------------------

    async function loadCanonicalAxesCenter(entry, session) {
        const axesContract = await loadRegionAxesContractJson();
        const regionCloud = await loadRegionCloudSampleJson();

        const selectedNpi = normalizeNpi(
            session?.selectedNpi ||
            getProviderNpi()
        );

        const rows = Array.isArray(regionCloud?.rows) ? regionCloud.rows : [];

        const hospitalRow = rows.find(row => {
            const rowNpi = normalizeNpi(
                row.hospital_npi || row.npi || row.provider_npi || ""
            );
            return rowNpi === selectedNpi;
        }) || null;

        const comparablePeers = await loadTopComparableProviders(entry, session);
        const topPeer = Array.isArray(comparablePeers) && comparablePeers.length
            ? comparablePeers[0]
            : null;

        const hospitalPoint = buildHospitalPointFromRow(hospitalRow);
        const peerCohortPoint = buildPeerCohortPointFromPeer(topPeer);
        const canonicalCloudRows = buildCanonicalCloudRows(regionCloud);

        return {
            type: "canonical_axes_center",
            axes: buildAxesFromContract(axesContract),
            center_point: buildCenterPointFromContract(axesContract),
            hospital_point: hospitalPoint,
            peer_cohort_point: peerCohortPoint,
            provider_peer_connector: buildProviderPeerConnector(hospitalPoint, peerCohortPoint),
            axis_semantics: buildAxisSemanticsFromContract(axesContract),
            axis_ranges: buildAxisRangesFromContract(axesContract),
            camera_defaults: buildCameraDefaultsFromContract(axesContract),
            provenance: buildProvenanceFromContract(axesContract),
            canonical_cloud_rows: canonicalCloudRows
        };
    }

    async function loadCanonicalCloud(entry, session) {
        const axesContract = await loadRegionAxesContractJson();
        const json = await loadRegionCloudSampleJson();

        return {
            type: "canonical_cloud",
            region: getRegion(),
            sku_id: json.sku_id || "",
            sku_name: json.sku_name || "",
            axes: buildAxesFromContract(axesContract),
            center_point: buildCenterPointFromContract(axesContract),
            axis_semantics: buildAxisSemanticsFromContract(axesContract),
            axis_ranges: buildAxisRangesFromContract(axesContract),
            camera_defaults: buildCameraDefaultsFromContract(axesContract),
            provenance: buildProvenanceFromContract(axesContract),
            canonical_cloud_rows: buildCanonicalCloudRows(json),
            cloud_point_count: Number(json.row_count || 0),
            cloud_density: "sample",
            summary: `Regional cloud sample loaded with ${json.row_count || 0} points.`
        };
    }

    async function loadCanonicalTrajectory(entry, session) {
        const axesContract = await loadRegionAxesContractJson();
        const json = await loadTrajectoryJson();

        return {
            type: "canonical_trajectory",
            region: json.region || getRegion(),
            benchmark_basis: json.benchmark_basis || "",
            grain: json.grain || "",
            hospital_npi: json.hospital_npi || "",
            hospital_classifier_label: json.hospital_classifier_label || "",
            hospital_primary_taxonomy_group: json.hospital_primary_taxonomy_group || "",
            peer_cluster_id: json.peer_cluster_id || null,
            start_month: json.timeline_start_month || "",
            end_month: json.timeline_end_month || "",
            timeline_point_count: json.timeline_point_count || 0,
            trajectory_points: Array.isArray(json.timeline) ? json.timeline : [],
            axes: buildAxesFromContract(axesContract),
            center_point: buildCenterPointFromContract(axesContract),
            axis_semantics: buildAxisSemanticsFromContract(axesContract),
            axis_ranges: buildAxisRangesFromContract(axesContract),
            camera_defaults: buildCameraDefaultsFromContract(axesContract),
            provenance: buildProvenanceFromContract(axesContract),
            summary: json.timeline_point_count
                ? `Trajectory found for hospital ${json.hospital_npi}.`
                : `No trajectory found for hospital ${json.hospital_npi}.`
        };
    }

    async function loadTrajectoryMetrics(entry, session) {
        const json = await loadTrajectoryJson();
        const timeline = Array.isArray(json.timeline) ? json.timeline : [];
        const first = timeline[0] || {};
        const latest = timeline[timeline.length - 1] || {};

        const timelineStartMonth =
            json.timeline_start_month ||
            first.month ||
            "N/A";

        const timelineEndMonth =
            json.timeline_end_month ||
            latest.month ||
            "N/A";

        const latestPeerTrend =
            latest.peer_gap_trend ||
            "N/A";

        const latestRegionTrend =
            latest.region_gap_trend ||
            "N/A";

        return [
            { metric: "Hospital NPI", value: json.hospital_npi || "" },
            { metric: "Hospital Classification", value: json.hospital_classifier_label || "" },
            { metric: "Peer Cluster ID", value: json.peer_cluster_id ?? "" },
            { metric: "Start Month", value: timelineStartMonth },
            { metric: "End Month", value: timelineEndMonth },
            { metric: "Timeline Points", value: json.timeline_point_count || 0 },
            { metric: "Current Care Economic Intensity", value: latest.C1 ?? "" },
            { metric: "Current Utilization Structure", value: latest.C2 ?? "" },
            { metric: "Current Provider Scale / Structural Activity", value: latest.C3 ?? "" },
            { metric: "Current Status vs Peer", value: latest.status_vs_peer || "" },
            { metric: "Current Status vs Region", value: latest.status_vs_region || "" },
            { metric: "Latest Peer Trend", value: latestPeerTrend },
            { metric: "Latest Region Trend", value: latestRegionTrend },
            { metric: "Total Claims", value: latest.total_claims ?? "" },
            { metric: "Total Paid", value: latest.total_paid ?? "" },
            { metric: "Unique CPT Count", value: latest.unique_hcpcs_count ?? "" },
            { metric: "Paid per Claim", value: latest.paid_per_claim ?? "" },
            { metric: "Paid per Beneficiary", value: latest.paid_per_beneficiary ?? "" },
            { metric: "Claims per Beneficiary", value: latest.claims_per_beneficiary ?? "" }
        ];
    }

    async function loadComparablePeersView(entry, session) {
        const axesContract = await loadRegionAxesContractJson();
        const regionCloud = await loadRegionCloudFullJson();

        const selectedNpi = normalizeNpi(getProviderNpi());
        const rows = Array.isArray(regionCloud?.rows) ? regionCloud.rows : [];

        const peerRowsRaw = await loadTopComparableProviders(entry, session);

        const byNpi = new Map(
            rows.map(row => [normalizeNpi(row.hospital_npi || row.npi || ""), row])
        );

        const hospitalRow = byNpi.get(selectedNpi) || null;

        const peerPoints = (Array.isArray(peerRowsRaw) ? peerRowsRaw : [])
            .map(peer => ({
                npi: String(peer.peer_npi || peer.npi || ""),
                provider_name: peer.provider_name || "",
                rank: peer.rank ?? null,
                similarity: peer.similarity_score ?? null,
                revenue: peer.revenue ?? null,
                intensity: peer.intensity ?? null,
                utilization: peer.utilization ?? null,
                x: Number(peer.x ?? 0),
                y: Number(peer.y ?? 0),
                z: Number(peer.z ?? 0)
            }));

        return {
            type: "comparable_peers_view",
            axes: buildAxesFromContract(axesContract),
            center_point: buildCenterPointFromContract(axesContract),
            axis_semantics: buildAxisSemanticsFromContract(axesContract),
            axis_ranges: buildAxisRangesFromContract(axesContract),
            camera_defaults: buildCameraDefaultsFromContract(axesContract),
            provenance: buildProvenanceFromContract(axesContract),
            canonical_cloud_rows: buildCanonicalCloudRows(regionCloud),
            hospital_point: buildHospitalPointFromRow(hospitalRow),
            peer_points: peerPoints,
            peer_table_rows: peerPoints.map(p => ({
                rank: p.rank,
                provider_name: p.provider_name,
                npi: p.npi,
                similarity: p.similarity,
                revenue: p.revenue,
                intensity: p.intensity,
                utilization: p.utilization
            })),
            peer_cohort_percentiles: [
                {
                    metric: "Revenue Intensity Percentile",
                    percentile: 88,
                    provider_value: "5.55x",
                    cohort_median: "1.09x",
                    badge: "Top Tier"
                },
                {
                    metric: "Utilization Percentile",
                    percentile: 44,
                    provider_value: "1.03x",
                    cohort_median: "1.04x",
                    badge: "Median"
                },
                {
                    metric: "Service Breadth Percentile",
                    percentile: 72,
                    provider_value: "184 HCPCS",
                    cohort_median: "133 HCPCS",
                    badge: "Above Median"
                },
                {
                    metric: "Case Mix Complexity Percentile",
                    percentile: 81,
                    provider_value: "High",
                    cohort_median: "Moderate",
                    badge: "Top Tier"
                },
                {
                    metric: "Specialty Concentration Percentile",
                    percentile: 39,
                    provider_value: "Focused",
                    cohort_median: "Balanced",
                    badge: "Below Median"
                },
                {
                    metric: "Historical Stability Percentile",
                    percentile: 64,
                    provider_value: "Stable",
                    cohort_median: "Moderate",
                    badge: "Above Median"
                }
            ],
            summary: peerPoints.length
                ? `Found ${peerPoints.length} comparable peers for hospital ${getProviderNpi()}.`
                : `No comparable peers found for hospital ${getProviderNpi()}.`
        };
    }

    // ------------------------------------------------------------
    // Benchmark / descriptive loaders
    // ------------------------------------------------------------

    async function loadProviderVsRegionBenchmark(entry, session) {
        const json = await loadHospitalFinancialJson();
        const intelligence = json.hospital_financial_intelligence || {};
        const b = intelligence.hospital_vs_region_benchmark || null;

        if (!b) return [];

        return [
            { metric: "C1 Position", provider: b.hospital_c1, region: b.region_median_c1, delta: b.delta_c1 },
            { metric: "Total Paid", provider: b.hospital_total_paid, region: b.region_avg_total_paid, delta: b.delta_total_paid },
            { metric: "Paid per Claim", provider: b.hospital_paid_per_claim, region: b.region_paid_per_claim, delta: b.delta_paid_per_claim },
            { metric: "Claims per Beneficiary", provider: b.hospital_claims_per_beneficiary, region: b.region_claims_per_beneficiary, delta: b.delta_claims_per_beneficiary },
            { metric: "ICU Share", provider: b.hospital_icu_share, region: b.region_avg_icu_share, delta: b.delta_icu_share },
            { metric: "CCU Share", provider: b.hospital_ccu_share, region: b.region_avg_ccu_share, delta: b.delta_ccu_share },
            { metric: "Unique HCPCS Count", provider: b.hospital_unique_hcpcs_count, region: b.region_avg_unique_hcpcs_count, delta: b.delta_unique_hcpcs_count }
        ];
    }

    async function loadProviderVsPeerBenchmark(entry, session) {
        const json = await loadHospitalFinancialJson();
        const intelligence = json.hospital_financial_intelligence || {};
        const b = intelligence.hospital_vs_peer_benchmark || null;

        if (!b) return [];

        return [
            { metric: "C1 Position", provider: b.hospital_c1, peer: b.peer_median_c1, delta: b.delta_c1 },
            { metric: "Total Paid", provider: b.hospital_total_paid, peer: b.peer_avg_total_paid, delta: b.delta_total_paid },
            { metric: "Paid per Claim", provider: b.hospital_paid_per_claim, peer: b.peer_paid_per_claim, delta: b.delta_paid_per_claim },
            { metric: "Claims per Beneficiary", provider: b.hospital_claims_per_beneficiary, peer: b.peer_claims_per_beneficiary, delta: b.delta_claims_per_beneficiary },
            { metric: "ICU Share", provider: b.hospital_icu_share, peer: b.peer_avg_icu_share, delta: b.delta_icu_share },
            { metric: "CCU Share", provider: b.hospital_ccu_share, peer: b.peer_avg_ccu_share, delta: b.delta_ccu_share },
            { metric: "Unique HCPCS Count", provider: b.hospital_unique_hcpcs_count, peer: b.peer_avg_unique_hcpcs_count, delta: b.delta_unique_hcpcs_count }
        ];
    }

    async function loadTopComparableProviders(entry, session) {
        const regionCloud = await loadRegionCloudFullJson();
        const selectedNpi = normalizeNpi(getProviderNpi());
        const rows = Array.isArray(regionCloud?.rows) ? regionCloud.rows : [];

        const hospitalRow = rows.find(
            row => normalizeNpi(row.hospital_npi || row.npi || "") === selectedNpi
        );

        if (!hospitalRow) {
            return [];
        }

        const hx = Number(hospitalRow.C1 ?? 0);
        const hy = Number(hospitalRow.C2 ?? 0);
        const hz = Number(hospitalRow.C3 ?? 0);

        function distance3d(a, b, c, x, y, z) {
            const dx = a - x;
            const dy = b - y;
            const dz = c - z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        }

        return rows
            .filter(row => normalizeNpi(row.hospital_npi || row.npi || "") !== selectedNpi)
            .map(row => {
                const x = Number(row.C1 ?? 0);
                const y = Number(row.C2 ?? 0);
                const z = Number(row.C3 ?? 0);
                const dist = distance3d(hx, hy, hz, x, y, z);

                return {
                    peer_npi: String(row.hospital_npi || row.npi || ""),
                    provider_name: row.hospital_classifier_label || "Comparable Provider",
                    region: row.hospital_state || "",
                    canonical_distance: dist,
                    similarity_score: 1 / (1 + dist),
                    revenue: Number(row.total_paid ?? 0),
                    intensity: Number(row.paid_per_claim ?? 0),
                    utilization: Number(row.claims_per_beneficiary ?? 0),
                    scale: Number(row.unique_hcpcs_count ?? 0),
                    icu_share: Number(row.icu_like_claim_share ?? 0),
                    ccu_share: Number(row.ccu_like_claim_share ?? 0),
                    x,
                    y,
                    z
                };
            })
            .sort((a, b) => a.canonical_distance - b.canonical_distance)
            .slice(0, 10)
            .map((row, idx) => ({
                rank: idx + 1,
                ...row
            }));
    }

    async function loadCohortPercentiles(entry, session) {
        const json = await loadHospitalFinancialJson();
        const financialIntelligence = json?.hospital_financial_intelligence || {};

        if (!window.SKU5FinancialIntelligenceLoader) {
            throw new Error("SKU5FinancialIntelligenceLoader is not loaded.");
        }

        return window.SKU5FinancialIntelligenceLoader.buildCohortPercentilePayload(
            financialIntelligence
        );
    }

    // ------------------------------------------------------------
    // CPT loaders
    // ------------------------------------------------------------

    // ------------------------------------------------------------
    // SKU5.54 — Cohort Median and Percentile Metrics
    // ------------------------------------------------------------
    async function loadCohortPercentiles(entry, session) {
        const json = await loadHospitalFinancialJson();
        const financialIntelligence = json?.hospital_financial_intelligence || {};

        if (!window.SKU5FinancialIntelligenceLoader) {
            throw new Error("SKU5FinancialIntelligenceLoader is not loaded.");
        }

        return window.SKU5FinancialIntelligenceLoader.buildCohortPercentilePayload(
            financialIntelligence
        );
    }



    async function loadOverperformingCptAreas(entry, session) {
        const json = await loadHospitalFinancialJson();
        console.log("[SKU5.55 raw loader] json top keys =", Object.keys(json || {}));

        console.log(

            "[SKU5.55 raw loader] hfi keys =",

            Object.keys(json?.hospital_financial_intelligence || {})

        );

        console.log(

            "[SKU5.55 raw loader] overperforming branch =",

            json?.hospital_financial_intelligence?.overperforming_cpt_areas

        );
        return json.hospital_financial_intelligence?.overperforming_cpt_areas || [];
    }

    async function loadUnderperformingCptAreas(entry, session) {
        const json = await loadHospitalFinancialJson();
        return json.hospital_financial_intelligence?.underperforming_cpt_areas || [];
    }

    async function loadFixableCpts(entry, session) {
        const json = await loadHospitalFinancialJson();
        return json.hospital_financial_intelligence?.fixable_cpts || [];
    }

    async function loadMonetizableCptAreas(entry, session) {
        const json = await loadHospitalFinancialJson();
        return json.hospital_financial_intelligence?.monetizable_cpts || [];
    }

    async function loadCptLeakageAreas(entry, session) {
        const json = await loadHospitalFinancialJson();
        return json.hospital_financial_intelligence?.cpt_leakage_areas || [];
    }

    async function loadCptConcentrationRisk(entry, session) {
        const json = await loadHospitalFinancialJson();
        return json.hospital_financial_intelligence?.cpt_concentration_risk || [];
    }

    async function loadCptReimbursementRisk(entry, session) {
        const json = await loadHospitalFinancialJson();
        return json.hospital_financial_intelligence?.cpt_reimbursement_risk || [];
    }

    // ------------------------------------------------------------
    // Narrative merge helpers
    // ------------------------------------------------------------

    function mergeNarrativePayloads({ entry, payload }) {
        const contracts = [
            entry.panel_1_contract,
            entry.panel_2_contract,
            entry.panel_3_contract,
            entry.panel_4_contract,
            entry.panel_5_contract
        ];

        for (const contract of contracts) {
            const narrativeKey = contract?.props?.narrative_key;
            if (!narrativeKey) continue;

            if (!(narrativeKey in payload)) {
                payload[narrativeKey] = "Narrative not available.";
            }
        }
    }

    // ------------------------------------------------------------
    // Accumulation helpers
    // ------------------------------------------------------------

    function buildAccumulationState({ entry, session, payload }) {
        return {
            enabled: true,
            source_sku_id: entry.sku_id,
            previous_sku_id: session.previousSkuId || null,
            traces: session.accumulatedTraces || [],
            legends: session.accumulatedLegends || []
        };
    }

    // ------------------------------------------------------------
    // Context readers
    // ------------------------------------------------------------

    function readContextValue(key) {
        const ctx = global.SKU4_ENTRY_CONTEXT || global.SKU5_ENTRY_CONTEXT || {};

        if (key === "region") return ctx.region || "";
        if (key === "model") return ctx.family || ctx.model || "";
        if (key === "provider") return ctx.npi || ctx.provider || "";
        if (key === "npi") return ctx.npi || "";
        if (key === "provider_npi") return ctx.provider || ctx.npi || "";

        return "";
    }

    // ------------------------------------------------------------
    // Logging
    // ------------------------------------------------------------

    function log(message, data) {
        if (!DEBUG) return;
        if (typeof data === "undefined") {
            console.log(`[SKU5][loader] ${message}`);
        } else {
            console.log(`[SKU5][loader] ${message}`, data);
        }
    }

    function warn(message, data) {
        if (typeof data === "undefined") {
            console.warn(`[SKU5][loader] ${message}`);
        } else {
            console.warn(`[SKU5][loader] ${message}`, data);
        }
    }

    // ------------------------------------------------------------
    // Export
    // ------------------------------------------------------------

    global.SKU5Loader = {
        loadSkuPayload
    };
    window.SKU5Loader = window.SKU5Loader || {};
    window.SKU5Loader.loadCptPortfolioRisk = loadCptPortfolioRisk;

})(window);