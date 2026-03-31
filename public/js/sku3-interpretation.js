window.SKU3Interpretation = (() => {

    function classifyDelta(value) {
        if (value === null || value === undefined) return "neutral";

        if (value > 20) return "high_positive";
        if (value > 5) return "positive";
        if (value < -20) return "high_negative";
        if (value < -5) return "negative";
        return "neutral";
    }

    function band(delta) {
        if (delta == null) return "unknown";
        if (delta <= -40) return "very_low";
        if (delta <= -10) return "low";
        if (delta < 10) return "neutral";
        if (delta < 40) return "high";
        return "very_high";
    }

    function interpret(providerMetrics, regionMetrics) {
        if (!providerMetrics || !regionMetrics) return null;

        const p = providerMetrics;
        const r = regionMetrics;

        const deltaIntensity = ((p.intensity - r.intensity) / r.intensity) * 100;
        const deltaUtilization = ((p.utilization - r.utilization) / r.utilization) * 100;
        const deltaRevenue = ((p.revenue - r.revenue) / r.revenue) * 100;

        const signals = {
            intensity: classifyDelta(deltaIntensity),
            utilization: classifyDelta(deltaUtilization),
            revenue: classifyDelta(deltaRevenue)
        };

        // 🔵 NEW: semantic bands
        const bands = {
            intensity: band(deltaIntensity),
            utilization: band(deltaUtilization),
            revenue: band(deltaRevenue)
        };

        // 🧠 NEW: archetype classification
        let archetype = "mixed";
        let summary = "";

        if (
            (bands.intensity === "low" || bands.intensity === "very_low") &&
            (bands.utilization === "high" || bands.utilization === "very_high") &&
            (bands.revenue === "low" || bands.revenue === "very_low")
        ) {
            archetype = "under_monetized_volume";
            summary = "Under-monetized volume-driven practice";
        }

        else if (
            (bands.intensity === "low" || bands.intensity === "very_low") &&
            (bands.utilization === "high" || bands.utilization === "very_high")
        ) {
            archetype = "volume_driven";
            summary = "Volume-driven model with below-average monetization";
        }

        else if (
            (bands.intensity === "high" || bands.intensity === "very_high") &&
            (bands.utilization === "low" || bands.utilization === "very_low")
        ) {
            archetype = "specialized";
            summary = "Specialized high-value, low-volume practice";
        }

        else if (
            (bands.revenue === "high" || bands.revenue === "very_high") &&
            (bands.intensity === "high" || bands.intensity === "very_high") &&
            (bands.utilization === "high" || bands.utilization === "very_high")
        ) {
            archetype = "efficient_scale";
            summary = "High-scale, high-efficiency operator";
        }

        else if (
            bands.intensity === "neutral" &&
            bands.utilization === "neutral" &&
            bands.revenue === "neutral"
        ) {
            archetype = "balanced";
            summary = "Aligned with regional behavioral profile";
        }

        else {
            summary = "Mixed profile relative to regional benchmark";
        }

        // 🧠 NEW: narrative layer
        let narrative = summary;

        if (
            (bands.intensity === "low" || bands.intensity === "very_low") &&
            (bands.utilization === "high" || bands.utilization === "very_high")
        ) {
            narrative += ". Performance appears driven by throughput rather than claim-level economics.";
        }

        else if (
            (bands.intensity === "high" || bands.intensity === "very_high") &&
            (bands.utilization === "low" || bands.utilization === "very_low")
        ) {
            narrative += ". Provider appears to capture higher value per interaction rather than operating at scale.";
        }

        else if (bands.revenue === "high" || bands.revenue === "very_high") {
            narrative += ". Overall economic scale is strong relative to the region.";
        }

        else if (bands.revenue === "low" || bands.revenue === "very_low") {
            narrative += ". Economic footprint remains below the regional benchmark.";
        }

        return {
            deltaIntensity,
            deltaUtilization,
            deltaRevenue,
            signals,
            bands,
            archetype,
            summary,
            narrative
        };
    }

    return {
        interpret
    };

})();