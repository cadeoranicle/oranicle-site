let viewerLayerInitialized = false;
let viewerLayerStepCount = 0;
let viewerLayerMaxSteps = 0;

window.ACTOR_CONTEXT = {
    is_registered: false,
    auth_otp_verified: false,
    payment_completed: false,
    payment_otp_verified: false
};

function evaluateSkuAccess(skuId, actor = {}) {
    const def = window.SKU_REGISTRY?.[skuId];
    if (!def) {
        return { status: "denied", skuId, reason: "Unknown SKU" };
    }

    const policy = def.access_policy || {};
    const user = {
        is_registered: actor.is_registered ?? false,
        auth_otp_verified: actor.auth_otp_verified ?? false,
        payment_completed: actor.payment_completed ?? false,
        payment_otp_verified: actor.payment_otp_verified ?? false
    };

    if (policy.registration === "required" && !user.is_registered) {
        return { status: "register_required", skuId };
    }

    if (policy.auth_otp === "required" && !user.auth_otp_verified) {
        return { status: "auth_otp_required", skuId };
    }

    if (policy.payment === "required" && !user.payment_completed) {
        return { status: "payment_required", skuId };
    }

    if (policy.payment_otp === "required" && !user.payment_otp_verified) {
        return { status: "payment_otp_required", skuId };
    }

    return { status: "allow", skuId };
}

function handleSkuCTA(skuId, actor = window.ACTOR_CONTEXT) {
    const result = evaluateSkuAccess(skuId, actor);
    console.log("CTA decision", skuId, result);

    switch (result.status) {
        case "allow":
            return { action: "render", skuId };
        case "register_required":
            return { action: "show_register", skuId };
        case "auth_otp_required":
            return { action: "show_auth_otp", skuId };
        case "payment_required":
            return { action: "show_payment", skuId };
        case "payment_otp_required":
            return { action: "show_payment_otp", skuId };
        default:
            return { action: "deny", skuId };
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

function updateViewButtonLabel(viewBtn) {
    if (!viewBtn) return;

    if (viewerLayerInitialized && viewerLayerMaxSteps > 0) {
        viewBtn.textContent = `View ${viewerLayerStepCount}/${viewerLayerMaxSteps}`;
    } else {
        viewBtn.textContent = "View";
    }
}

function renderFlowUi(skuId) {
    const flow =
        window.SKU_FLOW_STATES?.[skuId] ||
        window.SKU_REGISTRY?.[skuId]?.flow_ui ||
        {};

    const chevEl = document.getElementById("ctaChevron");
    if (chevEl) {
        chevEl.textContent = "";
    }

    setActiveChevron(flow.highlight_target || null);
}

function applyCtaView(viewId) {
    const visible = new Set();

    if (viewId === "SKU3.1") {
        visible.add("rhs-region-context");
    }

    if (viewId === "SKU3.2") {
        visible.add("rhs-region-context");
        visible.add("rhs-provider-region-benchmark");
        visible.add("rhs-provider-region-interpretation");
    }

    if (viewId === "SKU3.3") {
        visible.add("rhs-peer-context");
    }

    if (viewId === "SKU3.4") {
        visible.add("rhs-peer-context");
        visible.add("rhs-provider-peer-benchmark");
    }

    document.querySelectorAll("[data-asset-id]").forEach(el => {
        const id = el.getAttribute("data-asset-id");
        if (!id || !id.startsWith("rhs-")) return;
        el.style.display = visible.has(id) ? "" : "none";
    });
}

async function initIndex() {
    console.log("initIndex running", new Date().toISOString());

    const input = document.getElementById("npiInput");
    const checkBtn = document.getElementById("checkBtn");
    const viewBtn = document.getElementById("viewBtn");
    const regionSelect = document.getElementById("regionSelect");
    const geometryMode = document.getElementById("geometryMode");
    const npiStatus = document.getElementById("npiStatus");

    const ctaSku32 = document.getElementById("ctaSku32");
    const ctaSku33 = document.getElementById("ctaSku33");
    const ctaSku34 = document.getElementById("ctaSku34");

    const ctaActionsCard = document.getElementById("ctaActionsCard");
    const ctaStatusCard = document.getElementById("ctaStatusCard");

    if (!input || !checkBtn || !viewBtn || !regionSelect || !geometryMode || !npiStatus) {
        console.warn("initIndex: missing DOM elements");
        return;
    }

    function applyCtaProgression(skuId) {
        const allButtons = ["ctaSku32", "ctaSku33", "ctaSku34"];

        const flow =
            window.SKU_FLOW_STATES?.[skuId] ||
            window.SKU_REGISTRY?.[skuId]?.flow_ui ||
            {};

        const revealButtons = flow.reveal_buttons || [];
        const showActionsPanel = flow.show_actions_panel ?? true;
        const showStatusPanel = flow.show_status_panel ?? false;

        if (ctaActionsCard) {
            ctaActionsCard.style.display = showActionsPanel ? "" : "none";
        }

        if (ctaStatusCard) {
            ctaStatusCard.style.display = showStatusPanel ? "" : "none";
        }

        allButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = "none";
        });

        revealButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = "";
        });
    }

    function cleanNpi(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function resetViewButton() {
        viewBtn.disabled = true;
        viewBtn.removeAttribute("data-npi");

        viewerLayerInitialized = false;
        viewerLayerStepCount = 0;
        viewerLayerMaxSteps = 0;

        updateViewButtonLabel(viewBtn);
    }

    function resetValidation() {
        input.classList.remove("valid", "invalid");
        npiStatus.className = "npi-status";
        npiStatus.textContent = "";
    }

    function applyRegionRules() {
        const region = regionSelect.value;

        if (region === "NYNJCT") {
            geometryMode.value = "pca3d";
            geometryMode.disabled = true;
        } else if (region === "southeast") {
            geometryMode.disabled = false;
        }
    }

    function applySKUAssets(skuPrefix) {
        const allowed = new Set();

        Object.entries(window.SKU_REGISTRY || {}).forEach(([skuId, def]) => {
            if (skuId.startsWith(skuPrefix) && def?.assets) {
                def.assets.forEach(a => allowed.add(a));
            }
        });

        document.querySelectorAll("[data-asset-id]").forEach(el => {
            const id = el.getAttribute("data-asset-id");
            if (!id) return;
            if (id.startsWith("rhs-")) return;

            const show = allowed.has(id);
            el.style.display = show ? "" : "none";
        });
    }

    let supported = new Set();
    let southeastProviderSet = new Set();

    try {
        const res = await fetch("/canonical/regions/NYNJCT/v1/providers/provider_index.json", { cache: "no-store" });
        const data = await res.json();
        supported = new Set((data.supported_npis || []).map(String));
    } catch (err) {
        console.error("NYNJCT provider index unavailable", err);
    }

    try {
        const southeastIndex = await window.SKU3Loader.loadProviderIndex("southeast");
        const southeastNpis = (southeastIndex.providers || []).map(p => String(p.provider_npi));
        southeastProviderSet = new Set(southeastNpis);
    } catch (err) {
        console.error("Southeast provider index unavailable", err);
    }

    applyRegionRules();
    resetViewButton();
    resetValidation();
    updateViewButtonLabel(viewBtn);
    applyCtaView("PRE_VIEW");
    applyCtaProgression("PRE_VIEW");
    clearActiveChevron();

    regionSelect.onchange = () => {
        resetViewButton();
        resetValidation();
        applyRegionRules();
        applyCtaView("PRE_VIEW");
        applyCtaProgression("PRE_VIEW");
        clearActiveChevron();
    };

    checkBtn.onclick = () => {
        console.log("CHECK CLICKED", input.value, regionSelect.value);

        const npi = cleanNpi(input.value);
        const region = regionSelect.value;

        resetViewButton();
        resetValidation();
        applyCtaView("PRE_VIEW");
        applyCtaProgression("PRE_VIEW");
        clearActiveChevron();

        if (npi.length !== 10) {
            input.classList.add("invalid");
            npiStatus.className = "npi-status warn";
            npiStatus.textContent = "Enter a valid 10-digit NPI";
            return;
        }

        if (region === "NYNJCT") {
            if (supported.has(npi)) {
                input.classList.add("valid");
                viewBtn.disabled = false;
                viewBtn.setAttribute("data-npi", npi);
                setActiveChevron("viewBtn");
            } else {
                input.classList.add("invalid");
                npiStatus.className = "npi-status warn";
                npiStatus.textContent = "Provider not yet mapped in current NYNJCT canonical";
            }
            return;
        }

        if (region === "southeast") {
            if (southeastProviderSet.has(npi)) {
                input.classList.add("valid");
                viewBtn.disabled = false;
                viewBtn.setAttribute("data-npi", npi);
                setActiveChevron("viewBtn");
            } else {
                input.classList.add("invalid");
                npiStatus.className = "npi-status warn";
                npiStatus.textContent = "Provider not yet available in Southeast pilot index";
            }
        }
    };

    if (ctaSku32) {
        ctaSku32.onclick = () => {
            handleSkuCTA("SKU3.2");
            applyCtaView("SKU3.2");
            applyCtaProgression("SKU3.2");
            renderFlowUi("SKU3.2");
        };
    }

    if (ctaSku33) {
        ctaSku33.onclick = () => {
            handleSkuCTA("SKU3.3");
            applyCtaView("SKU3.3");
            applyCtaProgression("SKU3.3");
            renderFlowUi("SKU3.3");
        };
    }

    if (ctaSku34) {
        ctaSku34.onclick = () => {
            handleSkuCTA("SKU3.4");
            applyCtaView("SKU3.4");
            applyCtaProgression("SKU3.4");
            renderFlowUi("SKU3.4");
        };
    }

    viewBtn.onclick = async () => {
        console.log("VIEW CLICKED", viewBtn.getAttribute("data-npi"), regionSelect.value);

        const npi = viewBtn.getAttribute("data-npi");
        const region = regionSelect.value;

        if (!npi) return;

        // Viewer already loaded -> step layers
        if (viewerLayerInitialized && window.ViewerLayerEngine) {
            window.ViewerLayerEngine.nextStep();

            const state = window.ViewerLayerEngine.getState();

            viewerLayerStepCount = state.currentIndex + 1;
            viewerLayerMaxSteps = state.totalLayers;

            updateViewButtonLabel(viewBtn);

            // First time final layer reached -> unlock CTA flow
            if (viewerLayerStepCount === viewerLayerMaxSteps) {
                applyCtaView("SKU3.1");
                applyCtaProgression("SKU3.1");
                renderFlowUi("SKU3.1");
            }

            return;
        }

        try {
            if (region === "NYNJCT") {
                await window.SKU3Viewer.loadRegion(region, geometryMode.value, npi, true);

                if (
                    window.ViewerLayerEngine &&
                    window.PROVIDER_BILLING_VIEWER_LAYER_CONFIG
                ) {
                    window.ViewerLayerEngine.loadConfig(
                        window.PROVIDER_BILLING_VIEWER_LAYER_CONFIG
                    );
                    

                    viewerLayerInitialized = true;
                    viewerLayerStepCount = 1;
                    viewerLayerMaxSteps = window.PROVIDER_BILLING_VIEWER_LAYER_CONFIG.length;

                    updateViewButtonLabel(viewBtn);
                }

                applySKUAssets("SKU3");
                applyCtaView("PRE_VIEW");
                applyCtaProgression("PRE_VIEW");
                renderFlowUi("PRE_VIEW");

                return;
            }

            if (region === "southeast") {
                await window.SKU3Viewer.loadRegion(region, geometryMode.value, npi, true);

                if (
                    window.ViewerLayerEngine &&
                    window.PROVIDER_BILLING_VIEWER_LAYER_CONFIG
                ) {
                    window.ViewerLayerEngine.loadConfig(
                        window.PROVIDER_BILLING_VIEWER_LAYER_CONFIG
                    );
                    

                    viewerLayerInitialized = true;
                    viewerLayerStepCount = 1;
                    viewerLayerMaxSteps = window.PROVIDER_BILLING_VIEWER_LAYER_CONFIG.length;

                    updateViewButtonLabel(viewBtn);
                }

                applySKUAssets("SKU3");
                applyCtaView("PRE_VIEW");
                applyCtaProgression("PRE_VIEW");
                renderFlowUi("PRE_VIEW");
            }

        } catch (err) {
            console.error(err);
            npiStatus.className = "npi-status warn";
            npiStatus.textContent = "Viewer failed to load canonical.";
        }
    };
}

if (viewBtn) {
    viewBtn.textContent = `View ${viewerLayerStepCount}/${viewerLayerMaxSteps}`;
}

if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initIndex);
} else {
    initIndex();
}