async function initIndex() {
    const input = document.getElementById("npiInput");
    const checkBtn = document.getElementById("checkBtn");
    const viewBtn = document.getElementById("viewBtn");
    const statusBox = document.getElementById("statusBox");
    const statusTitle = document.getElementById("statusTitle");
    const statusText = document.getElementById("statusText");

    let supported = new Set();

    try {
        const res = await fetch("providers/provider_index.json", { cache: "no-store" });
        const data = await res.json();
        supported = new Set(data.supported_npis || []);
    } catch (err) {
        statusBox.className = "status-card error";
        statusTitle.textContent = "Provider index unavailable";
        statusText.textContent = "The provider lookup index could not be loaded.";
        statusBox.classList.remove("hidden");
        return;
    }

    function cleanNpi(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function resetViewButton() {
        viewBtn.disabled = true;
        viewBtn.removeAttribute("data-npi");
    }

    checkBtn.addEventListener("click", () => {
        const npi = cleanNpi(input.value);
        resetViewButton();

        if (npi.length !== 10) {
            statusBox.className = "status-card warn";
            statusTitle.textContent = "Enter a valid 10-digit NPI";
            statusText.textContent = "The current canonical supports provider lookup by 10-digit NPI.";
            statusBox.classList.remove("hidden");
            return;
        }

        if (supported.has(npi)) {
            statusBox.className = "status-card success";
            statusTitle.textContent = "Provider found in NY NJ CT canonical";
            statusText.textContent = "This provider is present in the current tri-state canonical. You can now view the provider position in the system map.";
            statusBox.classList.remove("hidden");

            viewBtn.disabled = false;
            viewBtn.setAttribute("data-npi", npi);
            return;
        }

        statusBox.className = "status-card warn";
        statusTitle.textContent = "Provider not yet mapped in current NY NJ CT canonical";
        statusText.textContent = "You may still explore the tri-state canonical, but personal positioning is available only for supported providers in the current regional set.";
        statusBox.classList.remove("hidden");
    });

    viewBtn.addEventListener("click", () => {
        const npi = viewBtn.getAttribute("data-npi");
        if (!npi) return;
        window.location.href = `sku2.html?npi=${encodeURIComponent(npi)}`;
    });
}

window.addEventListener("DOMContentLoaded", initIndex);