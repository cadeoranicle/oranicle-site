async function initIndex() {
    const input = document.getElementById("npiInput");
    const checkBtn = document.getElementById("checkBtn");
    const viewBtn = document.getElementById("viewBtn");
    const regionSelect = document.getElementById("regionSelect");
    const geometryMode = document.getElementById("geometryMode");
    const npiStatus = document.getElementById("npiStatus");

    let supported = new Set();
    let southeastProviderSet = new Set();

    try {
        const res = await fetch("providers/provider_index.json", { cache: "no-store" });
        const data = await res.json();
        supported = new Set(data.supported_npis || []);
    } catch (err) {
        console.error(err);
    }

    try {
        const southeastIndex = await window.SKU3Loader.loadProviderIndex("southeast");
        const southeastNpis = (southeastIndex.providers || []).map(p => String(p.provider_npi));
        southeastProviderSet = new Set(southeastNpis);
    } catch (err) {
        console.error("Southeast provider index unavailable", err);
    }

    function cleanNpi(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function resetViewButton() {
        viewBtn.disabled = true;
        viewBtn.removeAttribute("data-npi");
    }

    function applyRegionRules() {
        const region = regionSelect.value;

        if (region === "tristate") {
            geometryMode.value = "pca3d";
            geometryMode.disabled = true;
        } else if (region === "southeast") {
            geometryMode.disabled = false;
        }
    }

    applyRegionRules();

    regionSelect.addEventListener("change", () => {
        resetViewButton();
        npiStatus.className = "npi-status";
        npiStatus.textContent = "";
        applyRegionRules();
    });

    checkBtn.addEventListener("click", async () => {
        const npi = cleanNpi(input.value);
        const region = regionSelect.value;

        resetViewButton();

        npiStatus.className = "npi-status";
        npiStatus.textContent = "";

        if (npi.length !== 10) {
            npiStatus.className = "npi-status warn";
            npiStatus.textContent = "Enter a valid 10-digit NPI";
            return;
        }

        if (region === "tristate") {
            if (supported.has(npi)) {
                npiStatus.className = "npi-status ok";
                npiStatus.textContent = "Provider available in Tri-State canonical";

                viewBtn.disabled = false;
                viewBtn.setAttribute("data-npi", npi);
                return;
            }

            npiStatus.className = "npi-status warn";
            npiStatus.textContent = "Provider not yet mapped in current Tri-State canonical";
            return;
        }

        if (region === "southeast") {
            if (southeastProviderSet.has(npi)) {
                npiStatus.className = "npi-status ok";
                npiStatus.textContent = "Provider available in Southeast pilot index";

                viewBtn.disabled = false;
                viewBtn.setAttribute("data-npi", npi);
                return;
            }

            npiStatus.className = "npi-status warn";
            npiStatus.textContent = "Provider not yet available in Southeast pilot index";
            return;
        }
    });

    viewBtn.addEventListener("click", async () => {
        const npi = viewBtn.getAttribute("data-npi");
        const region = regionSelect.value;

        if (!npi) return;

        if (region === "tristate") {
            window.location.href = `sku2.html?npi=${encodeURIComponent(npi)}&mode=pca3d`;
            return;
        }

        if (region === "southeast") {
            try {
                await window.SKU3Viewer.loadRegion(
                    "southeast",
                    geometryMode.value,
                    npi
                );
            } catch (err) {
                console.error(err);

                npiStatus.className = "npi-status warn";
                npiStatus.textContent = "Viewer failed to load Southeast canonical.";
            }
        }
    });
}

window.addEventListener("DOMContentLoaded", initIndex);