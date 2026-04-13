// template_1_opportunity_binder.js
// Binder family for Template 1 opportunity-style SKUs.
// Outputs a common normalized payload for template_1_cpt_opportunity_fullscreen.js

function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function buildOpportunityNarrative(items, skuTitle) {
    if (!items.length) {
        return {
            summary: `No material findings were identified for ${skuTitle}.`,
            bullets: []
        };
    }

    const top = items[0];

    return {
        summary: `${top.cpt_code} shows the largest identified gap within ${skuTitle.toLowerCase()}.`,
        bullets: [
            `${top.cpt_code} is the top-ranked CPT in this view.`,
            `${items.length} CPTs were identified as material opportunity areas.`,
            `Use this screen to prioritize review of the highest-ranked CPTs first.`
        ]
    };
}

function buildOpportunityPayload({
    skuId,
    skuTitle,
    skuSubtitle,
    providerName,
    providerNpi,
    regionLabel,
    skuCounter,
    normalizedItems
}) {
    const items = safeArray(normalizedItems).slice(0, 7);

    const totalOpportunityValue = items.reduce(
        (sum, item) => sum + safeNumber(item.revenue_gap),
        0
    );

    const largestGapValue = items.length ? safeNumber(items[0].revenue_gap) : 0;

    const avgPaidRatioPct = items.length
        ? items.reduce((sum, item) => sum + safeNumber(item.paid_ratio_pct), 0) / items.length
        : 0;

    return {
        sku_id: skuId,
        sku_title: skuTitle,
        sku_subtitle: skuSubtitle,
        provider_name: providerName,
        provider_npi: providerNpi,
        region_label: regionLabel,
        sku_counter: skuCounter,

        summary: {
            total_opportunity_value: totalOpportunityValue,
            largest_gap_value: largestGapValue,
            top_cpt_count: items.length,
            avg_paid_ratio_pct: avgPaidRatioPct
        },

        narrative: buildOpportunityNarrative(items, skuTitle),

        chart_items: items
    };
}

// ======================================================
// Variant: CPT Leakage
// ======================================================
function bindTemplate1CptLeakagePayload({
    skuId,
    skuTitle,
    skuSubtitle,
    providerName,
    providerNpi,
    regionLabel,
    skuCounter,
    rawItems
}) {
    const normalizedItems = safeArray(rawItems)
        .map((rawItem) => {
            const providerPaid = safeNumber(rawItem.provider_total_paid ?? rawItem.provider_paid);
            const peerPaid = safeNumber(rawItem.peer_median_total_paid ?? rawItem.peer_paid);
            const providerClaims = safeNumber(rawItem.provider_total_claims ?? rawItem.provider_claims);
            const peerClaims = safeNumber(rawItem.peer_median_total_claims ?? rawItem.peer_claims);

            const revenueGap = safeNumber(
                rawItem.estimated_revenue_gap ??
                rawItem.estimated_upside_value ??
                rawItem.revenue_gap ??
                Math.max(peerPaid - providerPaid, 0)
            );

            const paidRatioPct = safeNumber(
                rawItem.paid_ratio_pct ??
                rawItem.provider_to_peer_paid_ratio_pct ??
                (safeNumber(rawItem.provider_to_peer_paid_ratio) * 100)
            );

            const claimRatioPct = safeNumber(
                rawItem.claim_ratio_pct ??
                rawItem.provider_to_peer_claim_ratio_pct ??
                (safeNumber(rawItem.provider_to_peer_claim_ratio) * 100)
            );

            const score = safeNumber(
                rawItem.leakage_score ??
                rawItem.fixability_score ??
                rawItem.monetizable_score ??
                rawItem.growth_score ??
                rawItem.leader_comparison_score ??
                rawItem.score
            );

            return {
                cpt_code: rawItem.cpt_code || rawItem.hcpcs_code || "-",
                provider_paid: providerPaid,
                peer_paid: peerPaid,
                revenue_gap: revenueGap,
                provider_claims: providerClaims,
                peer_claims: peerClaims,
                paid_ratio_pct: paidRatioPct,
                claim_ratio_pct: claimRatioPct,
                leakage_score: score,
                opportunity_band:
                    rawItem.opportunity_band ||
                    rawItem.growth_category ||
                    rawItem.band ||
                    "Opportunity",
                raw: rawItem,
                sku_type: "cpt_leakage"
            };
        })
        .sort((a, b) => b.revenue_gap - a.revenue_gap);

    return buildOpportunityPayload({
        skuId,
        skuTitle,
        skuSubtitle,
        providerName,
        providerNpi,
        regionLabel,
        skuCounter,
        normalizedItems
    });
}

// ======================================================
// Variant: CPT Reimbursement Risk
// ======================================================
function bindTemplate1CptReimbursementRiskPayload({
    skuId,
    skuTitle,
    skuSubtitle,
    providerName,
    providerNpi,
    regionLabel,
    skuCounter,
    rawItems,

}) {


    const normalizedItems = safeArray(rawItems)
        .map((rawItem) => {
            const providerTotalPaid = safeNumber(rawItem.provider_total_paid);
            const providerClaims = safeNumber(rawItem.provider_total_claims);

            const providerPaidPerClaim = safeNumber(rawItem.provider_paid_per_claim);
            const peerPaidPerClaim = safeNumber(rawItem.peer_median_paid_per_claim);

            const reimbursementRatio = safeNumber(rawItem.reimbursement_ratio);
            const reimbursementGapPct = safeNumber(rawItem.reimbursement_gap_pct);
            const riskScore = safeNumber(rawItem.risk_score);

            const paidPerClaimGap = Math.max(peerPaidPerClaim - providerPaidPerClaim, 0);
            const totalReimbursementAtRisk = paidPerClaimGap * providerClaims;

            console.log("RISK MATH LIVE", {
                cpt: rawItem.cpt_code,
                providerClaims,
                providerPaidPerClaim,
                peerPaidPerClaim,
                paidPerClaimGap,
                totalReimbursementAtRisk
            });

            return {
                cpt_code: rawItem.cpt_code || "-",

                // chart should compare paid per claim vs peer paid per claim
                provider_paid: providerPaidPerClaim,
                peer_paid: peerPaidPerClaim,

                // KPI "gap" should be dollar gap per claim, not percent gap
                revenue_gap: totalReimbursementAtRisk,

                provider_claims: providerClaims,
                peer_claims: 0,

                paid_ratio_pct: reimbursementRatio * 100,
                claim_ratio_pct: 0,

                leakage_score: riskScore,
                opportunity_band: rawItem.comparison_flag || "Reimbursement Risk",

                raw: {
                    ...rawItem,
                    provider_total_paid: providerTotalPaid,
                    provider_paid_per_claim: providerPaidPerClaim,
                    peer_median_paid_per_claim: peerPaidPerClaim,
                    reimbursement_gap_pct: reimbursementGapPct,
                    paid_per_claim_gap: paidPerClaimGap,
                    total_reimbursement_at_risk: totalReimbursementAtRisk
                },

                sku_type: "cpt_reimbursement_risk"
            };
        })
        .sort((a, b) => b.leakage_score - a.leakage_score);

    return buildOpportunityPayload({
        skuId,
        skuTitle,
        skuSubtitle,
        providerName,
        providerNpi,
        regionLabel,
        skuCounter,
        normalizedItems
    });
}

// ======================================================
// Family dispatcher
// ======================================================
function bindCptOpportunityPayload({
    binderVariant,
    skuId,
    skuTitle,
    skuSubtitle,
    providerName,
    providerNpi,
    regionLabel,
    skuCounter,
    rawItems
}) {
    if (binderVariant === "cpt_leakage") {
        return bindTemplate1CptLeakagePayload({
            skuId,
            skuTitle,
            skuSubtitle,
            providerName,
            providerNpi,
            regionLabel,
            skuCounter,
            rawItems
        });
    }

    if (binderVariant === "cpt_reimbursement_risk") {
        return bindTemplate1CptReimbursementRiskPayload({
            skuId,
            skuTitle,
            skuSubtitle,
            providerName,
            providerNpi,
            regionLabel,
            skuCounter,
            rawItems
        });
    }

    return null;
}

window.bindCptOpportunityPayload = bindCptOpportunityPayload;
console.log("cpt_opportunity_binder loaded v3-risk-total", window.bindCptOpportunityPayload);