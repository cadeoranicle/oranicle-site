window.SKU4CanonicalInterpretation = (() => {
    function safeNumber(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    function describeDistance(relativeToMean) {
        const d = safeNumber(relativeToMean);

        if (d == null) return "distance from centroid unavailable";
        if (d < 0.75) return "provider is structurally close to the regional centroid";
        if (d < 1.25) return "provider is within the expected structural envelope of the regional centroid";
        if (d < 2.0) return "provider is moderately displaced from the regional centroid";
        return "provider is materially displaced from the regional centroid";
    }

    function describeRarity(rarityClass) {
        if (!rarityClass) return "rarity classification unavailable";

        const key = String(rarityClass).toLowerCase();

        if (key.includes("common")) return "provider sits in a common CPT behavioral zone";
        if (key.includes("core")) return "provider sits in a core CPT behavioral zone";
        if (key.includes("transitional")) return "provider sits in a transitional CPT behavioral zone";
        if (key.includes("rare")) return "provider sits in a rare CPT behavioral zone";
        if (key.includes("frontier")) return "provider sits near a frontier CPT behavioral zone";

        return `provider rarity class: ${rarityClass}`;
    }

    function describeFrontier(frontierClass) {
        if (!frontierClass) return "frontier relationship unavailable";

        const key = String(frontierClass).toLowerCase();

        if (key.includes("interior")) return "provider appears structurally interior to the canonical";
        if (key.includes("edge")) return "provider appears near the edge of the canonical";
        if (key.includes("frontier")) return "provider appears near a canonical frontier";
        if (key.includes("boundary")) return "provider appears near a canonical boundary";

        return `frontier relation: ${frontierClass}`;
    }

    function describeAnchor(anchorLabel) {
        if (!anchorLabel) return "nearest anchor unavailable";
        return `nearest structural anchor is ${anchorLabel}`;
    }

    function interpret(canonicalMetrics = null) {
        if (!canonicalMetrics) {
            return {
                narrative: "Canonical interpretation unavailable.",
                components: {
                    region: "canonical region unavailable",
                    rarity: "rarity unavailable",
                    frontier: "frontier unavailable",
                    anchor: "anchor unavailable",
                    centroid: "centroid distance unavailable"
                }
            };
        }

        const region = canonicalMetrics.canonical_region || {};
        const rarity = canonicalMetrics.density_rarity || {};
        const frontier = canonicalMetrics.frontier_relation || {};
        const anchor = canonicalMetrics.nearest_anchor || {};
        const centroid = canonicalMetrics.centroid_distance || {};

        const regionText = region.region_id
            ? `provider maps into canonical region ${region.region_id}`
            : "canonical region unavailable";

        const rarityText = describeRarity(rarity.rarity_class);
        const frontierText = describeFrontier(frontier.frontier_class);
        const anchorText = describeAnchor(anchor.label);
        const centroidText = describeDistance(centroid.relative_to_mean);

        const narrative = [
            regionText,
            rarityText,
            frontierText,
            anchorText,
            centroidText
        ].join("; ") + ".";

        return {
            narrative,
            components: {
                region: regionText,
                rarity: rarityText,
                frontier: frontierText,
                anchor: anchorText,
                centroid: centroidText
            }
        };
    }

    return {
        interpret
    };
})();

console.log("sku4-canonical-interpretation.js loaded");