window.SKU4Interpretation = (() => {
    function safeNumber(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    function pctDelta(providerValue, benchmarkValue) {
        const p = safeNumber(providerValue);
        const b = safeNumber(benchmarkValue);

        if (p == null || b == null || b === 0) return null;
        return ((p - b) / b) * 100;
    }

    function classifyDelta(delta) {
        if (delta == null) {
            return {
                level: "unknown",
                direction: "neutral",
                label: "Unavailable"
            };
        }

        const abs = Math.abs(delta);

        if (abs < 5) {
            return {
                level: "aligned",
                direction: "neutral",
                label: "Broadly aligned"
            };
        }

        if (abs < 15) {
            return {
                level: "moderate",
                direction: delta > 0 ? "higher" : "lower",
                label: delta > 0 ? "Moderately above benchmark" : "Moderately below benchmark"
            };
        }

        return {
            level: "strong",
            direction: delta > 0 ? "higher" : "lower",
            label: delta > 0 ? "Materially above benchmark" : "Materially below benchmark"
        };
    }

    function buildNarrative(metricName, delta, higherMeaning, lowerMeaning) {
        const c = classifyDelta(delta);

        if (c.level === "unknown") {
            return `${metricName}: insufficient data for interpretation.`;
        }

        if (c.level === "aligned") {
            return `${metricName}: provider is broadly aligned with benchmark behavior.`;
        }

        if (c.direction === "higher") {
            return `${metricName}: ${higherMeaning}`;
        }

        return `${metricName}: ${lowerMeaning}`;
    }

    function buildSummary(parts) {
        return parts.filter(Boolean).join(" ");
    }

    function interpret(provider = {}, benchmark = {}) {
        const providerRevenue = safeNumber(provider.revenue);
        const providerIntensity = safeNumber(provider.intensity);
        const providerUtilization = safeNumber(provider.utilization);

        const benchmarkRevenue = safeNumber(benchmark.revenue);
        const benchmarkIntensity = safeNumber(benchmark.intensity);
        const benchmarkUtilization = safeNumber(benchmark.utilization);

        const revenueDelta = pctDelta(providerRevenue, benchmarkRevenue);
        const intensityDelta = pctDelta(providerIntensity, benchmarkIntensity);
        const utilizationDelta = pctDelta(providerUtilization, benchmarkUtilization);

        const revenueClass = classifyDelta(revenueDelta);
        const intensityClass = classifyDelta(intensityDelta);
        const utilizationClass = classifyDelta(utilizationDelta);

        const intensityNarrative = buildNarrative(
            "$/Claim",
            intensityDelta,
            "provider appears to monetize procedures above benchmark levels.",
            "provider appears to monetize procedures below benchmark levels."
        );

        const utilizationNarrative = buildNarrative(
            "Claims per Beneficiary",
            utilizationDelta,
            "provider shows higher utilization density than benchmark.",
            "provider shows lower utilization density than benchmark."
        );

        const revenueNarrative = buildNarrative(
            "Revenue",
            revenueDelta,
            "provider generates higher total revenue than benchmark.",
            "provider generates lower total revenue than benchmark."
        );

        const summary = buildSummary([
            intensityClass.level === "aligned" && utilizationClass.level === "aligned" && revenueClass.level === "aligned"
                ? "Provider is broadly aligned with benchmark across CPT economics."
                : null,

            intensityClass.direction === "higher" && utilizationClass.direction === "higher"
                ? "Provider shows both stronger monetization and stronger utilization than benchmark."
                : null,

            intensityClass.direction === "higher" && utilizationClass.direction === "lower"
                ? "Provider appears to monetize above benchmark while operating with lower utilization density."
                : null,

            intensityClass.direction === "lower" && utilizationClass.direction === "higher"
                ? "Provider appears to monetize below benchmark while operating with higher utilization density."
                : null,

            intensityClass.direction === "lower" && utilizationClass.direction === "lower"
                ? "Provider trails benchmark on both monetization and utilization density."
                : null,

            revenueClass.direction === "higher"
                ? "Overall revenue profile is above benchmark."
                : revenueClass.direction === "lower"
                    ? "Overall revenue profile is below benchmark."
                    : null
        ]) || "CPT benchmark interpretation available.";

        return {
            summary,
            deltas: {
                revenue_pct: revenueDelta,
                intensity_pct: intensityDelta,
                utilization_pct: utilizationDelta
            },
            classifications: {
                revenue: revenueClass,
                intensity: intensityClass,
                utilization: utilizationClass
            },
            narratives: {
                revenue: revenueNarrative,
                intensity: intensityNarrative,
                utilization: utilizationNarrative
            }
        };
    }

    return {
        interpret
    };
})();

console.log("sku4-interpretation.js loaded");