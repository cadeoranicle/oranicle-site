document.addEventListener("DOMContentLoaded", () => {
    let selected = "sku4";

    const pill4 = document.getElementById("pill-sku4");
    const pill5 = document.getElementById("pill-sku5");
    const launchBtn = document.getElementById("launchBtn");
    const npiInput = document.getElementById("npiInput");
    const errorBox = document.getElementById("errorBox");

    function showError(msg) {
        if (!errorBox) return;
        errorBox.textContent = msg;
        errorBox.classList.remove("hidden");
    }

    function clearError() {
        if (!errorBox) return;
        errorBox.classList.add("hidden");
    }

    function selectSku(sku) {
        selected = sku;

        pill4?.classList.toggle("active", sku === "sku4");
        pill5?.classList.toggle("active", sku === "sku5");
    }

    function routeToSku(sku, npi) {
        if (sku === "sku4") {
            window.location.href =
                `sku4.html?region=NYNJCT&family=provider_cpt&model=CPT%20Billing&npi=${encodeURIComponent(npi)}`;
            return;
        }

        if (sku === "sku5") {
            window.location.href =
                `sku5.html?sku=SKU5.01&region=NYNJCT&family=hospital_canonical&npi=${encodeURIComponent(npi)}`;
        }
    }

    pill4?.addEventListener("click", () => selectSku("sku4"));
    pill5?.addEventListener("click", () => selectSku("sku5"));

    launchBtn?.addEventListener("click", () => {
        clearError();

        const npi = (npiInput?.value || "").replace(/\D/g, "");

        if (npi.length !== 10) {
            showError("Enter valid 10-digit NPI.");
            return;
        }

        routeToSku(selected, npi);
    });

    npiInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            launchBtn?.click();
        }
    });

    document.querySelectorAll(".demo-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const sku = btn.dataset.sku;
            const npi = btn.dataset.npi;

            if (!sku || !npi) {
                showError("Demo preset is missing SKU or NPI.");
                return;
            }

            routeToSku(sku, npi);
        });
    });

    selectSku("sku4");
    console.log("[Oranical] hero router loaded");
});