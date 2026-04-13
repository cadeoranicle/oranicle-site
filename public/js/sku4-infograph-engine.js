window.SKU4InfographEngine = (() => {
    function safeNumber(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    }

    function formatNumber(value, digits = 0) {
        const num = Number(value);
        if (!Number.isFinite(num)) return "-";
        return num.toLocaleString(undefined, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        });
    }

    function pctWidth(part, whole) {
        const p = safeNumber(part);
        const w = safeNumber(whole);
        if (w <= 0) return 0;
        return Math.max(0, Math.min(100, (p / w) * 100));
    }

    function renderCptRecoveryBars(data, options = {}) {
        const rows = Array.isArray(data?.cpts) ? data.cpts.slice(0, 4) : [];

        if (!rows.length) {
            return `
                <div class="rhs-mini-empty">
                    No recovery visual available.
                </div>
            `;
        }

        const htmlRows = rows.map(row => {
            const providerPaid = safeNumber(row.provider_total_paid);
            const peerPaid = safeNumber(row.peer_median_total_paid);
            const providerClaims = safeNumber(row.provider_total_claims);
            const peerClaims = safeNumber(row.peer_median_total_claims);
            const score = safeNumber(row.fixability_score);

            const paidWidth = pctWidth(providerPaid, peerPaid);
            const claimsWidth = pctWidth(providerClaims, peerClaims);

            return `
                <div class="rhs-mini-cpt-block">
                    <div class="rhs-mini-cpt-head">
                        <div class="rhs-mini-cpt-code">${row.cpt_code || "—"}</div>
                        <div class="rhs-mini-cpt-score">Fixability ${formatNumber(score, 1)}</div>
                    </div>

                    <div class="rhs-mini-bar-group">
                        <div class="rhs-mini-bar-label">
                            <span>Paid</span>
                            <span>$${formatNumber(providerPaid, 0)} / $${formatNumber(peerPaid, 0)}</span>
                        </div>
                        <div class="rhs-mini-bar-track">
                            <div class="rhs-mini-bar-fill" style="width:${paidWidth}%;"></div>
                        </div>
                    </div>

                    <div class="rhs-mini-bar-group">
                        <div class="rhs-mini-bar-label">
                            <span>Claims</span>
                            <span>${formatNumber(providerClaims, 0)} / ${formatNumber(peerClaims, 0)}</span>
                        </div>
                        <div class="rhs-mini-bar-track">
                            <div class="rhs-mini-bar-fill rhs-mini-bar-fill-2" style="width:${claimsWidth}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        return `
            <div class="rhs-mini-chart">
                <div class="rhs-mini-chart-title">Recovery Potential Snapshot</div>
                ${htmlRows}
            </div>
        `;
    }

    function renderCptUpsideBars(data, options = {}) {
        const rows = Array.isArray(data?.cpts) ? data.cpts.slice(0, 5) : [];

        if (!rows.length) {
            return `
            <div class="rhs-mini-empty">
                No monetization visual available.
            </div>
        `;
        }

        const maxUpside = Math.max(
            ...rows.map(row => safeNumber(row.estimated_upside_value)),
            1
        );

        const htmlRows = rows.map(row => {
            const upside = safeNumber(row.estimated_upside_value);
            const score = safeNumber(row.monetizable_score);
            const width = Math.max(8, (upside / maxUpside) * 100);

            return `
            <div class="rhs-mini-cpt-block">
                <div class="rhs-mini-cpt-head">
                    <div class="rhs-mini-cpt-code">${row.cpt_code || "—"}</div>
                    <div class="rhs-mini-cpt-score">Score ${formatNumber(score, 1)}</div>
                </div>

                <div class="rhs-mini-bar-group">
                    <div class="rhs-mini-bar-label">
                        <span>Estimated Upside</span>
                        <span>$${formatNumber(upside, 0)}</span>
                    </div>

                    <div class="rhs-mini-bar-track">
                        <div
                            class="rhs-mini-bar-fill rhs-mini-bar-fill-upside"
                            style="width:${width}%;"
                        ></div>
                    </div>
                </div>
            </div>
        `;
        }).join("");

        return `
        <div class="rhs-mini-chart">
            <div class="rhs-mini-chart-title">Revenue Upside Snapshot</div>
            ${htmlRows}
        </div>
    `;
    }

    function render(type, data, options = {}) {
        switch (type) {
            case "cpt_recovery_bars":
                return renderCptRecoveryBars(data, options);

            case "cpt_upside_bars":
                return renderCptUpsideBars(data, options);

            default:
                return "";
        }
    }

    return {
        render
    };
})();