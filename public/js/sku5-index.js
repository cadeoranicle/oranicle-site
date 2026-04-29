// sku5-index.js
// SKU5 super orchestrator
// Responsibilities:
// 1. Resolve current SKU
// 2. Read registry entry
// 3. Build runtime session
// 4. Call loader
// 5. Call panel engine
// 6. Handle previous / next / direct navigation

(function initSKU5Index(global) {
    "use strict";

    const DEBUG = true;

    function applyUrlContextOverrides() {
        const params = new URLSearchParams(global.location.search);

        const existing = global.SKU5_ENTRY_CONTEXT || {};

        const npi =
            params.get("npi") ||
            params.get("hospital_npi") ||
            existing.npi ||
            existing.provider ||
            "";

        global.SKU5_ENTRY_CONTEXT = {
            ...existing,
            region: params.get("region") || existing.region || "NYNJCT",
            family: params.get("family") || existing.family || "",
            model: params.get("model") || existing.model || existing.family || "",
            npi,
            provider: npi
        };

        console.log("[SKU5][index] URL context override", global.SKU5_ENTRY_CONTEXT);
    }


    // ------------------------------------------------------------
    // Public bootstrap
    // ------------------------------------------------------------

    async function initSKU5() {

        try {
            applyUrlContextOverrides();
            log("initSKU5() start");

            assertDependencies();

            const currentSkuId = resolveInitialSkuId();
            const entry = getRegistryEntryOrThrow(currentSkuId);

            global.SKU5Session = buildSession(entry);

            log("registry entry resolved", entry);
            log("session created", global.SKU5Session);

            await renderCurrentSku();

            bindGlobalNavigationHandlers();

            log("initSKU5() complete");
        } catch (error) {
            console.error("[SKU5][fatal]", error);
            renderFatalState(error);
        }
    }

    // ------------------------------------------------------------
    // Dependency checks
    // ------------------------------------------------------------

    function assertDependencies() {
        if (!global.SKU5Registry) {
            throw new Error("SKU5Registry is not loaded.");
        }

        if (!global.SKU5Registry.getSkuEntry) {
            throw new Error("SKU5Registry.getSkuEntry is missing.");
        }

        if (!global.SKU5Registry.getNextSkuId) {
            throw new Error("SKU5Registry.getNextSkuId is missing.");
        }

        if (!global.SKU5Registry.getPreviousSkuId) {
            throw new Error("SKU5Registry.getPreviousSkuId is missing.");
        }

        if (!global.SKU5Loader || typeof global.SKU5Loader.loadSkuPayload !== "function") {
            throw new Error("SKU5Loader.loadSkuPayload is not available.");
        }

        if (!global.SKU5PanelEngine || typeof global.SKU5PanelEngine.renderPanels !== "function") {
            throw new Error("SKU5PanelEngine.renderPanels is not available.");
        }
    }

    // ------------------------------------------------------------
    // SKU resolution
    // ------------------------------------------------------------

    function resolveInitialSkuId() {
        const skuFromUrl = getSkuIdFromUrl();
        if (skuFromUrl && hasRegistryEntry(skuFromUrl)) {
            return skuFromUrl;
        }

        const skuFromSession = getSkuIdFromSessionStorage();
        if (skuFromSession && hasRegistryEntry(skuFromSession)) {
            return skuFromSession;
        }

        return global.SKU5Registry.getDefaultSkuId();
    }

    function getSkuIdFromUrl() {
        const params = new URLSearchParams(global.location.search);
        return params.get("sku");
    }

    function getSkuIdFromSessionStorage() {
        try {
            return global.sessionStorage.getItem("sku5_current_sku_id");
        } catch (error) {
            warn("sessionStorage unavailable", error);
            return null;
        }
    }

    function hasRegistryEntry(skuId) {
        return !!global.SKU5Registry.getSkuEntry(skuId);
    }

    function getRegistryEntryOrThrow(skuId) {
        const entry = global.SKU5Registry.getSkuEntry(skuId);
        if (!entry) {
            throw new Error(`No registry entry found for ${skuId}`);
        }
        return entry;
    }

    // ------------------------------------------------------------
    // Session builder
    // ------------------------------------------------------------

    function buildSession(entry) {
        return {
            currentSkuId: entry.sku_id,
            currentSequence: entry.sequence,
            activePill: entry.pill_label || "",
            currentBreadcrumb: entry.breadcrumb_label || "",
            currentStatusLabel: entry.status_label || entry.pill_label || "",
            nextStatusLabel: entry.next_status_label || "",
            nextCtaLabel: entry.next_cta_label || "",
            visitedSkuIds: [entry.sku_id],

            previousSkuId:
                entry.previous_sku_id !== undefined
                    ? entry.previous_sku_id
                    : global.SKU5Registry.getPreviousSkuId(entry.sku_id),

            nextSkuId:
                entry.next_sku_id !== undefined
                    ? entry.next_sku_id
                    : global.SKU5Registry.getNextSkuId(entry.sku_id),

            accumulatedTraces: [],
            accumulatedLegends: [],
            panelState: {
                panel1: {},
                panel2: {},
                panel3: {},
                panel4: {},
                panel5: {}
            }
        };
    }

    function updateSessionForEntry(entry) {
        const session = global.SKU5Session || buildSession(entry);

        session.currentSkuId = entry.sku_id;
        session.currentSequence = entry.sequence;
        session.activePill = entry.pill_label || "";
        session.currentBreadcrumb = entry.breadcrumb_label || "";


        session.previousSkuId =
            entry.previous_sku_id !== undefined
                ? entry.previous_sku_id
                : global.SKU5Registry.getPreviousSkuId(entry.sku_id);

        session.nextSkuId =
            entry.next_sku_id !== undefined
                ? entry.next_sku_id
                : global.SKU5Registry.getNextSkuId(entry.sku_id);

        session.currentStatusLabel = entry.status_label || entry.pill_label || "";
        session.nextStatusLabel = entry.next_status_label || "";
        session.nextCtaLabel = entry.next_cta_label || "";

        if (!Array.isArray(session.visitedSkuIds)) {
            session.visitedSkuIds = [];
        }

        if (!session.visitedSkuIds.includes(entry.sku_id)) {
            session.visitedSkuIds.push(entry.sku_id);
        }

        if (!Array.isArray(session.accumulatedTraces)) {
            session.accumulatedTraces = [];
        }

        if (!Array.isArray(session.accumulatedLegends)) {
            session.accumulatedLegends = [];
        }

        if (!session.panelState) {
            session.panelState = {
                panel1: {},
                panel2: {},
                panel3: {},
                panel4: {},
                panel5: {}
            };
        }

       // window.SKU4Payload = payload;
        //console.log("[SKU4] exposed payload", payload);
        // ------------------------------------------------------------
        // BUILD JOURNEY MODEL (🔥 THIS WAS MISSING)
        // ------------------------------------------------------------

        const allEntries = global.SKU5Registry.getAllSkuEntries();
        session.journey = allEntries.map(e => {
            let state = "future";

            if (session.currentSkuId === e.sku_id) {
                state = "active";
            } else if (session.visitedSkuIds.includes(e.sku_id)) {
                state = "visited";
            }

            return {
                sku_id: e.sku_id,
                label: e.pill_label || e.sku_id,
                sequence: e.sequence,
                range_group: e.range_group,
                state
            };
        });

        global.SKU5Session = session;
        if (typeof persistCurrentSkuId === "function") {
            persistCurrentSkuId(entry.sku_id);
        }
        session.journey = buildJourneyModel();
        return session;
    }

    function buildJourneyModel() {
        const session = global.SKU5Session;

        // 🔥 IMPORTANT: use registry API, not raw object
        const allSkus = global.SKU5Registry?.getAllSkuEntries
            ? global.SKU5Registry.getAllSkuEntries()
            : [];

        if (!Array.isArray(allSkus) || !allSkus.length) {
            console.warn("[SKU5][journey] registry empty");
            return [];
        }

        const currentSeq = session.currentSequence;

        return allSkus
            .sort((a, b) => a.sequence - b.sequence)
            .map(sku => ({
                sku_id: sku.sku_id,
                label: sku.pill_label,
                sequence: sku.sequence,
                state:
                    sku.sequence < currentSeq ? "visited" :
                        sku.sequence === currentSeq ? "active" :
                            "locked"
            }));
    }

    // ------------------------------------------------------------
    // Main render pipeline
    // ------------------------------------------------------------

    async function renderCurrentSku() {
        const session = global.SKU5Session;
        if (!session || !session.currentSkuId) {
            throw new Error("SKU5Session is missing currentSkuId.");
        }

        const entry = getRegistryEntryOrThrow(session.currentSkuId);
        updateSessionForEntry(entry);

        log("renderCurrentSku() -> entry", entry);
        log("renderCurrentSku() -> session", global.SKU5Session);
        log("renderCurrentSku() -> panel contracts", {
            panel_1_contract: entry.panel_1_contract,
            panel_2_contract: entry.panel_2_contract,
            panel_3_contract: entry.panel_3_contract,
            panel_4_contract: entry.panel_4_contract,
            panel_5_contract: entry.panel_5_contract
        });

        renderLoadingState(entry);

        const payload = await global.SKU5Loader.loadSkuPayload({
            entry,
            session: global.SKU5Session
        });

        log("loader payload", payload);

        await global.SKU5PanelEngine.renderPanels({
            entry,
            session: global.SKU5Session,
            payload,
            panelContracts: {
                panel1: entry.panel_1_contract,
                panel2: entry.panel_2_contract,
                panel3: entry.panel_3_contract,
                panel4: entry.panel_4_contract,
                panel5: entry.panel_5_contract
            }
        });

        clearLoadingState();
        syncUrlWithCurrentSku(entry.sku_id);
        updateJourneyControls(entry);

        log("renderCurrentSku() complete");
    }

    function syncUrlWithCurrentSku(skuId) {
        try {
            const url = new URL(global.location.href);
            url.searchParams.set("sku", skuId);
            global.history.replaceState({}, "", url.toString());
        } catch (error) {
            warn("Unable to sync URL with current SKU", error);
        }
    }



    // ------------------------------------------------------------
    // Navigation
    // ------------------------------------------------------------

    async function goToSku(skuId) {
        if (!skuId) return;

        const entry = getRegistryEntryOrThrow(skuId);
        updateSessionForEntry(entry);

        log("goToSku()", skuId);

        await renderCurrentSku();
    }

    async function goToNextSku() {
        const session = global.SKU5Session;
        if (!session || !session.nextSkuId) {
            warn("No next SKU available");
            return;
        }

        await goToSku(session.nextSkuId);
    }

    async function goToPreviousSku() {
        const session = global.SKU5Session;
        if (!session || !session.previousSkuId) {
            warn("No previous SKU available");
            return;
        }

        await goToSku(session.previousSkuId);
    }

    // ------------------------------------------------------------
    // UI / navigation handler binding
    // ------------------------------------------------------------

    function bindGlobalNavigationHandlers() {
        document.addEventListener("click", async (event) => {
            const nextBtn = event.target.closest("[data-sku5-action='next']");
            if (nextBtn) {
                event.preventDefault();
                await goToNextSku();
                return;
            }

            const prevBtn = event.target.closest("[data-sku5-action='previous']");
            if (prevBtn) {
                event.preventDefault();
                await goToPreviousSku();
                return;
            }

            const skuBtn = event.target.closest("[data-sku5-sku-id]");
            if (skuBtn) {
                event.preventDefault();
                const skuId = skuBtn.getAttribute("data-sku5-sku-id");
                await goToSku(skuId);
            }
        });
    }

    function updateJourneyControls(entry) {
        const prevBtn = document.querySelector("[data-sku5-role='prev-button']");
        const nextBtn = document.querySelector("[data-sku5-role='next-button']");
        const breadcrumbNode = document.querySelector("[data-sku5-role='breadcrumb']");
        const ctaNode = document.querySelector("[data-sku5-role='cta-label']");

        const previousEntry = global.SKU5Session?.previousSkuId
            ? global.SKU5Registry.getSkuEntry(global.SKU5Session.previousSkuId)
            : null;

        const nextEntry = global.SKU5Session?.nextSkuId
            ? global.SKU5Registry.getSkuEntry(global.SKU5Session.nextSkuId)
            : null;

        if (prevBtn) {
            prevBtn.disabled = !global.SKU5Session?.previousSkuId;
            prevBtn.textContent = previousEntry?.pill_label
                ? `Back`
                : "Previous";
        }

        if (nextBtn) {
            nextBtn.disabled = !global.SKU5Session?.nextSkuId;
        }

        if (breadcrumbNode) {
            breadcrumbNode.textContent =
                global.SKU5Session?.currentStatusLabel ||
                entry?.breadcrumb_label ||
                "";
        }

        if (ctaNode) {
            ctaNode.textContent =
                global.SKU5Session?.nextCtaLabel ||
                (nextEntry?.pill_label ? `View ${nextEntry.pill_label}` : "Complete");
        }
    }

    // ------------------------------------------------------------
    // Loading / error states
    // ------------------------------------------------------------

    function renderLoadingState(entry) {
        const root = document.querySelector("[data-sku5-root]");
        if (!root) return;

        root.setAttribute("data-sku5-loading", "true");
        root.setAttribute("data-current-sku", entry.sku_id || "");
    }

    function clearLoadingState() {
        const root = document.querySelector("[data-sku5-root]");
        if (!root) return;

        root.setAttribute("data-sku5-loading", "false");
    }

    function renderFatalState(error) {
        const root = document.querySelector("[data-sku5-root]") || document.body;
        root.innerHTML = `
      <div class="sku5-fatal-state">
        <h2>SKU5 failed to initialize</h2>
        <pre>${escapeHtml(error?.message || "Unknown error")}</pre>
      </div>
    `;
    }

    // ------------------------------------------------------------
    // Utilities
    // ------------------------------------------------------------

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function log(message, data) {
        if (!DEBUG) return;
        if (typeof data === "undefined") {
            console.log(`[SKU5][index] ${message}`);
        } else {
            console.log(`[SKU5][index] ${message}`, data);
        }
    }

    function warn(message, data) {
        if (typeof data === "undefined") {
            console.warn(`[SKU5][index] ${message}`);
        } else {
            console.warn(`[SKU5][index] ${message}`, data);
        }
    }

    // ------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------

    global.SKU5Index = {
        initSKU5,
        renderCurrentSku,
        goToSku,
        goToNextSku,
        goToPreviousSku
    };

    // ------------------------------------------------------------
    // Auto bootstrap
    // ------------------------------------------------------------

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSKU5);
    } else {
        initSKU5();
    }

})(window);