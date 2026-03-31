window.SKU3CanonicalInterpretation = (() => {
    function safeNumber(v) {
        return typeof v === "number" && !Number.isNaN(v) ? v : null;
    }

    function interpretDensity(rarityClass) {
        if (!rarityClass) return null;

        if (rarityClass === "sparse") {
            return {
                label: "low-density niche",
                meaning: "Provider sits in a relatively uncommon structural neighborhood."
            };
        }

        if (rarityClass === "dense") {
            return {
                label: "dense cluster",
                meaning: "Provider sits in a common and highly populated structural neighborhood."
            };
        }

        return {
            label: rarityClass,
            meaning: "Provider occupies a structurally distinct canonical zone."
        };
    }

    function interpretFrontier(frontierClass) {
        if (!frontierClass) return null;

        if (frontierClass === "near_frontier") {
            return {
                label: "frontier-adjacent",
                meaning: "Behavior is closer to the outer edge of the regional manifold."
            };
        }

        if (frontierClass === "deep_interior") {
            return {
                label: "deep interior",
                meaning: "Behavior sits well inside established regional norms."
            };
        }

        return {
            label: frontierClass,
            meaning: "Behavior has a measurable frontier relationship inside the manifold."
        };
    }

    function interpretAnchor(anchorLabel) {
        if (!anchorLabel) return null;

        if (anchorLabel.includes("A1_min")) {
            return "closest to low billing-intensity edge";
        }
        if (anchorLabel.includes("A1_max")) {
            return "closest to high billing-intensity edge";
        }
        if (anchorLabel.includes("A2_min")) {
            return "closest to low utilization edge";
        }
        if (anchorLabel.includes("A2_max")) {
            return "closest to high utilization edge";
        }
        if (anchorLabel.includes("A3_min")) {
            return "closest to low revenue-scale edge";
        }
        if (anchorLabel.includes("A3_max")) {
            return "closest to high revenue-scale edge";
        }

        return `closest to anchor ${anchorLabel}`;
    }

    function interpretCentroidDistance(relativeToMean) {
        const v = safeNumber(relativeToMean);
        if (v == null) return null;

        if (v < 0.70) {
            return {
                label: "highly aligned",
                meaning: "Provider is closer than average to the regional centroid."
            };
        }

        if (v < 1.25) {
            return {
                label: "moderately aligned",
                meaning: "Provider sits near the regional behavioral norm."
            };
        }

        if (v < 1.75) {
            return {
                label: "meaningfully differentiated",
                meaning: "Provider is noticeably offset from the regional norm."
            };
        }

        return {
            label: "strongly differentiated",
            meaning: "Provider is materially distant from the regional centroid."
        };
    }

    function classifyZone(canonicalMetrics) {
        const region = canonicalMetrics?.canonical_region || {};
        const density = canonicalMetrics?.density_rarity || {};
        const frontier = canonicalMetrics?.frontier_relation || {};
        const anchor = canonicalMetrics?.nearest_anchor || {};
        const centroid = canonicalMetrics?.centroid_distance || {};

        const densityView = interpretDensity(density.rarity_class);
        const frontierView = interpretFrontier(frontier.frontier_class);
        const anchorView = interpretAnchor(anchor.label);
        const centroidView = interpretCentroidDistance(centroid.relative_to_mean);

        let zoneType = "mixed_structural_zone";
        let summary = "Mixed structural position relative to the regional benchmark.";

        if (density.rarity_class === "sparse" && frontier.frontier_class === "deep_interior") {
            zoneType = "rare_but_stable_zone";
            summary = "Rare but internally stable niche position.";
        } else if (density.rarity_class === "dense" && frontier.frontier_class === "deep_interior") {
            zoneType = "mainstream_core_zone";
            summary = "Mainstream, high-density regional core.";
        } else if (frontier.frontier_class === "near_frontier") {
            zoneType = "edge_position";
            summary = "Edge-of-manifold position with stronger structural differentiation.";
        } else if (centroidView?.label === "highly aligned") {
            zoneType = "centroid_aligned_zone";
            summary = "Provider is structurally close to the regional norm.";
        }

        return {
            zoneType,
            summary,
            densityView,
            frontierView,
            anchorView,
            centroidView,
            regionId: region.region_id || null,
            bands:
                region.a1_band != null && region.a2_band != null && region.a3_band != null
                    ? `${region.a1_band}/${region.a2_band}/${region.a3_band}`
                    : null,
            regionPointCount: region.region_point_count ?? null
        };
    }

    function buildNarrative(zone) {
        if (!zone) return { headline: "-", narrative: "-" };

        const parts = [];

        // 🧠 HEADLINE (short, strong)
        let headline = zone.summary;

        if (zone.zoneType === "mainstream_core_zone") {
            headline = "Mainstream cluster positioning";
        } else if (zone.zoneType === "rare_but_stable_zone") {
            headline = "Niche but stable positioning";
        } else if (zone.zoneType === "edge_position") {
            headline = "Edge-of-manifold positioning";
        } else if (zone.zoneType === "centroid_aligned_zone") {
            headline = "Highly aligned with regional norm";
        }

        // 🧠 Narrative construction

        // Density
        if (zone.density === "dense cluster") {
            parts.push("The provider operates within a highly populated and competitive regional cluster.");
        } else if (zone.density === "low-density niche") {
            parts.push("The provider operates within a relatively niche and less crowded structural segment.");
        }

        // Alignment
        if (zone.centroidMeaning === "highly aligned") {
            parts.push("Overall behavior is closely aligned with the regional norm.");
        } else if (zone.centroidMeaning === "moderately aligned") {
            parts.push("Behavior remains broadly aligned with regional peers.");
        } else if (zone.centroidMeaning === "meaningfully differentiated") {
            parts.push("Behavior shows meaningful differentiation from typical regional patterns.");
        } else if (zone.centroidMeaning === "strongly differentiated") {
            parts.push("Behavior is significantly differentiated from the regional baseline.");
        }

        // Anchor (THIS is key business signal)
        if (zone.anchorMeaning) {
            if (zone.anchorMeaning.includes("high revenue-scale")) {
                parts.push("Within its neighborhood, the provider trends toward higher revenue-scale positioning.");
            } else if (zone.anchorMeaning.includes("low revenue-scale")) {
                parts.push("Within its neighborhood, the provider trends toward lower revenue-scale positioning.");
            } else if (zone.anchorMeaning.includes("high utilization")) {
                parts.push("Within its neighborhood, the provider trends toward higher utilization intensity.");
            } else if (zone.anchorMeaning.includes("low utilization")) {
                parts.push("Within its neighborhood, the provider trends toward lower utilization levels.");
            } else if (zone.anchorMeaning.includes("high billing")) {
                parts.push("Within its neighborhood, the provider trends toward higher billing intensity.");
            } else if (zone.anchorMeaning.includes("low billing")) {
                parts.push("Within its neighborhood, the provider trends toward lower billing intensity.");
            }
        }

        // Frontier (softened language)
        if (zone.frontier === "frontier-adjacent") {
            parts.push("The position is closer to the outer edge of the regional behavior spectrum.");
        }

        const narrative = parts.join(" ").trim();

        return {
            headline,
            narrative: narrative || headline
        };
    }

    function interpret(canonicalMetrics) {
        if (!canonicalMetrics) return null;

        const zone = classifyZone(canonicalMetrics);
        const narrativeBlock = buildNarrative(zone);

        return {
            zoneType: zone.zoneType,
            summary: narrativeBlock.headline,
            narrative: narrativeBlock.narrative,
            regionId: zone.regionId,
            bands: zone.bands,
            regionPointCount: zone.regionPointCount,
            density: zone.densityView?.label || null,
            frontier: zone.frontierView?.label || null,
            anchorMeaning: zone.anchorView || null,
            centroidMeaning: zone.centroidView?.label || null
        };
    }

    return {
        interpret
    };
})();