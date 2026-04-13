let sku4Supported = new Set();
let sku4LayerInitialized = false;
let sku4LayerStepCount = 0;
let sku4LayerMaxSteps = 0;

function cleanNpi(value) {
    return String(value || "").replace(/\D/g, "");
}

function updateViewButtonLabel(viewBtn) {
    if (!viewBtn) return;

    if (sku4LayerInitialized && sku4LayerMaxSteps > 0) {
        viewBtn.textContent = `View ${sku4LayerStepCount}/${sku4LayerMaxSteps}`;
    } else {
        viewBtn.textContent = "View";
    }
}

function clearActiveChevron() {
    document.querySelectorAll(".metric-btn").forEach(btn => {
        btn.classList.remove("cta-next");
    });
}

function setActiveChevron(buttonId) {
    clearActiveChevron();
    if (!buttonId) return;
    const btn = document.getElementById(buttonId);
    if (btn) btn.classList.add("cta-next");
}

function applySku4Assets(skuId) {
    const allowed = new Set((window.SKU4_REGISTRY?.[skuId]?.assets) || []);

    document.querySelectorAll("[data-asset-id]").forEach(el => {
        const id = el.getAttribute("data-asset-id");
        if (!id) return;

        if (id.startsWith("legend-")) return;

        el.style.display = allowed.has(id) ? "" : "none";
    });
}

function applySku4FlowUi(flowId) {
    const flow =
        window.SKU4_REGISTRY?.[flowId]?.flow_ui ||
        window.SKU4_FLOW_STATES?.[flowId] ||
        window.SKU4_FLOW_STATES?.PRE_VIEW ||
        {};

    const ctaChevron = document.getElementById("ctaChevron");

    if (ctaChevron && flow.next_message) {
        ctaChevron.setAttribute("title", flow.next_message || "");
    }

    setActiveChevron(flow.highlight_target || null);
}

async function resolveEntryValidation(npi, npiStatus, viewBtn) {
    sku4LayerInitialized = false;
    sku4LayerStepCount = 0;
    sku4LayerMaxSteps = 0;
    updateViewButtonLabel(viewBtn);
    viewBtn.disabled = true;
    viewBtn.removeAttribute("data-npi");

    if (!npi || npi.length !== 10) {
        npiStatus.className = "npi-status warn";
        npiStatus.textContent = "Invalid or missing 10-digit NPI";
        applySku4FlowUi("POST_CHECK_INVALID");
        return false;
    }

    if (sku4Supported.size > 0 && sku4Supported.has(String(npi))) {
        npiStatus.className = "npi-status ok";
        npiStatus.textContent = "Provider found in CPT canonical";
        viewBtn.disabled = false;
        viewBtn.setAttribute("data-npi", npi);
        applySku4FlowUi("POST_CHECK_VALID");
        return true;
    }

    npiStatus.className = "npi-status";
    npiStatus.textContent = "Checking provider...";

    try {
        const probe = await window.SKU4Loader.loadProvider(npi);

        if (probe) {
            npiStatus.className = "npi-status ok";
            npiStatus.textContent = "Provider found in CPT canonical";
            viewBtn.disabled = false;
            viewBtn.setAttribute("data-npi", npi);
            applySku4FlowUi("POST_CHECK_VALID");
            return true;
        }
    } catch (err) {
        console.warn("SKU4 direct provider probe failed", err);
    }

    npiStatus.className = "npi-status warn";
    npiStatus.textContent = "Provider not yet mapped in current CPT canonical";
    applySku4FlowUi("POST_CHECK_INVALID");
    return false;
}

async function initSku4() {
    console.log("initSku4 running", new Date().toISOString());

    const viewBtn = document.getElementById("viewBtn");
    const homeBtn = document.getElementById("homeBtn");
    const npiStatus = document.getElementById("npiStatus");

    const entryRegion = document.getElementById("entryRegion");
    const entryFamily = document.getElementById("entryFamily");
    const entryNpi = document.getElementById("entryNpi");

    if (!viewBtn || !homeBtn || !npiStatus || !entryRegion || !entryFamily || !entryNpi) {
        console.warn("initSku4: missing DOM elements");
        return;
    }

    const entry = window.SKU4_ENTRY_CONTEXT || {};
    const region = String(entry.region || "NYNJCT");
    const family = String(entry.family || "Billing-CPT");
    const npi = cleanNpi(entry.npi || "");

    entryRegion.textContent = region || "-";
    entryFamily.textContent = family || "-";
    entryNpi.textContent = npi || "-";

    const viewerTitleRegion = document.getElementById("viewerTitleRegion");
    if (viewerTitleRegion) {
        viewerTitleRegion.textContent = region || "NYNJCT";
    }

    if (window.SKU4Viewer) {
        window.SKU4Viewer.init("sku4Viewer");
    }

    try {
        await window.SKU4Viewer.initBase();
    } catch (err) {
        console.error("Failed to initialize SKU4 base viewer", err);
        npiStatus.className = "npi-status warn";
        npiStatus.textContent = "Failed to load CPT canonical base.";
        return;
    }

    try {
        const providerIndex = await window.SKU4Loader.loadProviderIndex();

        console.log("providerIndex =", providerIndex);
        console.log("providerIndex keys =", Object.keys(providerIndex || {}));
        console.log("supported_npis exists =", Array.isArray(providerIndex.supported_npis));
        console.log("supported_npis count =", providerIndex.supported_npis?.length);
        console.log("first 10 supported_npis =", providerIndex.supported_npis?.slice(0, 10));
        console.log(
            "contains exact target =",
            (providerIndex.supported_npis || [])
                .map(v => String(v).trim())
                .includes("1366778920")
        );

        sku4Supported = new Set(
            (providerIndex.supported_npis || []).map(v => String(v).trim())
        );

        console.log("SKU4 provider index loaded", sku4Supported.size);
    } catch (err) {
        console.error("SKU4 provider index unavailable", err);
    }

    updateViewButtonLabel(viewBtn);
    applySku4FlowUi("PRE_VIEW");
    applySku4Assets("SKU4.1");

    await resolveEntryValidation(npi, npiStatus, viewBtn);

    homeBtn.onclick = () => {
        window.location.href = "index.html";
    };

    viewBtn.onclick = async () => {
        const selectedNpi = viewBtn.getAttribute("data-npi");
        if (!selectedNpi) return;

        if (sku4LayerInitialized && window.ViewerLayerEngine) {
            const stateBefore = window.ViewerLayerEngine.getState();
            const currentLayerBefore =
                window.PROVIDER_CPT_VIEWER_LAYER_CONFIG?.[stateBefore.currentIndex];

            console.log("==== VIEW CLICK DEBUG: BEFORE NEXT STEP ====");
            console.log("stateBefore.currentIndex =", stateBefore.currentIndex);
            console.log("stateBefore.totalLayers =", stateBefore.totalLayers);
            console.log("currentLayerBefore.id =", currentLayerBefore?.id);
            console.log("currentLayerBefore.label =", currentLayerBefore?.label);

            if (currentLayerBefore?.stop_progression) {
                console.log("Terminal layer reached:", currentLayerBefore.id);
                return;
            }

            if (stateBefore.currentIndex < stateBefore.totalLayers - 1) {
                window.ViewerLayerEngine.nextStep();
            }

            const state = window.ViewerLayerEngine.getState();
            const currentLayer = window.PROVIDER_CPT_VIEWER_LAYER_CONFIG[state.currentIndex];

            console.log("==== VIEW CLICK DEBUG: AFTER NEXT STEP ====");
            console.log("stateAfter.currentIndex =", state.currentIndex);
            console.log("stateAfter.totalLayers =", state.totalLayers);
            console.log("currentLayerAfter.id =", currentLayer?.id);
            console.log("currentLayerAfter.label =", currentLayer?.label);

            sku4LayerStepCount = state.currentIndex + 1;
            sku4LayerMaxSteps = state.totalLayers;
            updateViewButtonLabel(viewBtn);

            console.log("CLICK CURRENT LAYER:", currentLayer?.id, "INDEX:", state.currentIndex);

            if (currentLayer) {
                window.SKU4Viewer.applyLayerVisibility(currentLayer);

                applySku4Assets(currentLayer.id);
                applySku4FlowUi(currentLayer.id);

                if (window.SKU4Viewer.renderCustomLegend) {
                    window.SKU4Viewer.renderCustomLegend(currentLayer.visible_legends || []);
                }

                if (window.SKU4RhsBinder) {
                    console.log("RHS BIND FOR LAYER =", currentLayer?.id);
                    window.SKU4RhsBinder.renderSkuPayload(currentLayer.id);
                }

                if (state.currentIndex >= 6) {
                    setTimeout(() => {
                        const rhsStack = document.getElementById("rhsBlockStack");
                        const lastBlock = rhsStack?.lastElementChild;

                        if (lastBlock) {
                            const top =
                                lastBlock.getBoundingClientRect().top +
                                window.pageYOffset -
                                220;

                            window.scrollTo({
                                top,
                                behavior: "smooth"
                            });
                        }
                    }, 120);
                }
            }

            return;
        }
    };

    try {
        npiStatus.className = "npi-status";
        npiStatus.textContent = "Loading region geometry...";

        await window.SKU4Viewer.loadProvider(npi);

        const publish = await window.SKU4Loader.loadProviderPublish(npi);
        const providerCptIntelligence = await window.SKU4Loader.loadProviderCptIntelligence(npi);
        const opportunityPublish = await window.SKU4Loader.loadProviderCptOpportunityPublish(npi);

        window.SKU4State = window.SKU4State || {};
        window.SKU4State.rhsPayload = publish;
        window.SKU4State.providerCptIntelligence = providerCptIntelligence;
        window.SKU4State.opportunityPayload = opportunityPublish;
        window.SKU4State.entryContext = {
            region,
            family,
            npi
        };

        console.log("publish keys =", Object.keys(publish || {}));
        console.log("publish.overperforming_cpt_areas =", publish?.overperforming_cpt_areas);
        console.log("publish.underperforming_cpt_areas =", publish?.underperforming_cpt_areas);

        console.log("SKU4State.rhsPayload =", window.SKU4State.rhsPayload);
        console.log("SKU4State.providerCptIntelligence =", window.SKU4State.providerCptIntelligence);
        console.log("SKU4State.opportunityPayload =", window.SKU4State.opportunityPayload);

        if (window.ViewerLayerEngine && window.PROVIDER_CPT_VIEWER_LAYER_CONFIG) {
            window.ViewerLayerEngine.loadConfig(window.PROVIDER_CPT_VIEWER_LAYER_CONFIG);

            sku4LayerInitialized = true;
            sku4LayerStepCount = 1;
            sku4LayerMaxSteps = window.PROVIDER_CPT_VIEWER_LAYER_CONFIG.length;
            updateViewButtonLabel(viewBtn);

            const firstLayer = window.PROVIDER_CPT_VIEWER_LAYER_CONFIG[0];

            if (firstLayer) {
                console.log("Applying first viewer layer", firstLayer);

                window.SKU4Viewer.applyLayerVisibility(firstLayer);

                applySku4Assets(firstLayer.id);
                applySku4FlowUi(firstLayer.id);

                if (window.SKU4Viewer.renderCustomLegend) {
                    window.SKU4Viewer.renderCustomLegend(firstLayer.visible_legends || []);
                }

                if (window.SKU4RhsBinder) {
                    window.SKU4RhsBinder.clearRhsStack();
                    window.SKU4RhsBinder.renderSkuPayload(firstLayer.id);
                }
            }
        }

        npiStatus.className = "npi-status ok";
        npiStatus.textContent = "Geometry view ready";
    }

    catch (err) {
        console.error("SKU4 layer init failed", err);
        npiStatus.className = "npi-status warn";
        npiStatus.textContent = "Failed to load CPT geometry view.";
    }
};


if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initSku4);
} else {
    initSku4();
}