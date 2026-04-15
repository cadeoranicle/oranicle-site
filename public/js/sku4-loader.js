window.SKU4Loader = (() => {
    const DEFAULT_REGION = "NYNJCT";

    const REGION_CONFIG = {
        NYNJCT: {
            localBase: "/canonical/regions/NYNJCT/provider-cpt/v1",
            remoteBase: "https://pub-6dde7e3865604b0aa28903cdbc0f2627.r2.dev/canonical/regions/NYNJCT/v1/provider_cpt_publish",
            r2Base: "https://pub-6dde7e3865604b0aa28903cdbc0f2627.r2.dev"
        },
        southeast: {
            localBase: null,
            remoteBase: null,
            r2Base: "https://pub-6dde7e3865604b0aa28903cdbc0f2627.r2.dev"
        }
    };

    let providerIndexCache = {};
    let intelligenceSampleCache = {};
    let intelligenceSampleMap = {};

    function getEntryContext() {
        return window.SKU4_ENTRY_CONTEXT || {};
    }

    function getRegion() {
        const entryRegion = String(getEntryContext().region || "").trim();
        return entryRegion || DEFAULT_REGION;
    }

    function getConfig(region = getRegion()) {
        const cfg = REGION_CONFIG[region];
        if (!cfg) {
            throw new Error(`Unsupported SKU4 region: ${region}`);
        }
        return cfg;
    }

    async function fetchJson(url) {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            throw new Error(`Failed to fetch ${url}: ${res.status}`);
        }
        return await res.json();
    }

    async function loadClusterCentroidsUmap(region = getRegion()) {
        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }
        return await fetchJson(`${cfg.remoteBase}/nynjct_cluster_centroids_umap.json`);
    }

    async function loadRegionCentroids(region = getRegion()) {
        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }
        return await fetchJson(`${cfg.remoteBase}/nynjct_region_centroids.json`);
    }

    async function loadRegionCloud(region = getRegion()) {
        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }
        return await fetchJson(`${cfg.remoteBase}/nynjct_region_cloud_sample_50k.json`);
    }

    async function loadProviderIndex(region = getRegion()) {
        if (providerIndexCache[region]) return providerIndexCache[region];

        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }

        providerIndexCache[region] = await fetchJson(`${cfg.remoteBase}/provider_index.json`);
        return providerIndexCache[region];
    }

    async function loadProviderGeometry(npi, region = getRegion()) {
        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }
        return await fetchJson(`${cfg.remoteBase}/provider_geometry/provider_cpt_geometry_${npi}.json`);
    }

    async function loadProviderMetrics(npi, region = getRegion()) {
        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }
        return await fetchJson(`${cfg.remoteBase}/provider_metrics/provider_cpt_metrics_${npi}.json`);
    }

    async function loadProviderBusinessMetrics(npi, region = getRegion()) {
        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }
        return await fetchJson(`${cfg.remoteBase}/provider_business_metrics/provider_cpt_business_metrics_${npi}.json`);
    }

    async function loadProviderProfile(npi, region = getRegion()) {
        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }
        return await fetchJson(`${cfg.remoteBase}/provider_profiles/provider_cpt_profile_${npi}.json`);
    }

    async function loadProviderIntelligenceSample(region = getRegion()) {
        if (intelligenceSampleCache[region]) return intelligenceSampleCache[region];

        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }

        const url = `${cfg.remoteBase}/provider_intelligence_metrics_sample_10.json`;
        const data = await fetchJson(url);

        intelligenceSampleCache[region] = data;
        intelligenceSampleMap[region] = {};

        for (const row of (data.providers || [])) {
            intelligenceSampleMap[region][String(row.provider_npi)] = row;
        }

        return data;
    }

    async function loadProviderIntelligence(npi, region = getRegion()) {
        await loadProviderIntelligenceSample(region);
        return intelligenceSampleMap?.[region]?.[String(npi)] || null;
    }

    async function loadProviderPeerIntelligence(npi, region = getRegion()) {
        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }

        const url = `${cfg.remoteBase}/provider_intelligence_metrics_sample_10.sku4_3_peer.json`;
        const data = await fetchJson(url);
        const providers = Array.isArray(data?.providers) ? data.providers : [];

        return providers.find(p => String(p.provider_npi) === String(npi)) || null;
    }

    async function loadProvider(npi, region = getRegion()) {
        const [geometry, metrics, business, profile] = await Promise.all([
            loadProviderGeometry(npi, region),
            loadProviderMetrics(npi, region),
            loadProviderBusinessMetrics(npi, region),
            loadProviderProfile(npi, region)
        ]);

        return {
            provider_npi: String(npi),
            region,
            geometry,
            metrics,
            business,
            profile
        };
    }

    async function loadProviderPublish(npi, region = getRegion()) {
        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }

        const url = `${cfg.remoteBase}/provider_intelligence_metrics_sample_10.publish.json`;
        const data = await fetchJson(url);
        const providers = Array.isArray(data?.providers) ? data.providers : [];

        return providers.find(p => String(p.provider_npi) === String(npi)) || null;
    }

    async function loadProviderCptIntelligence(npi, region = getRegion()) {
        const cleanNpi = String(npi || "").replace(/\D/g, "");
        if (!cleanNpi) {
            throw new Error("Missing NPI for CPT intelligence load");
        }

        const cfg = getConfig(region);
        if (!cfg.r2Base) {
            throw new Error(`No r2Base configured for region: ${region}`);
        }

        const url =
            `${cfg.r2Base}/canonical/regions/${region}/v1/provider_cpt_publish/Provider_CPT_intelligence/provider_cpt_intelligence_${cleanNpi}.json`;

        console.log("Loading provider CPT intelligence:", url);
        return await fetchJson(url);
    }

    async function loadProviderCptOpportunityPublish(npi, region = getRegion()) {
        const cfg = getConfig(region);
        if (!cfg.remoteBase) {
            throw new Error(`No remoteBase configured for region: ${region}`);
        }

        const url = `${cfg.remoteBase}/provider_cpt_opportunity_sample_10.publish.json`;
        const data = await fetchJson(url);
        const providers = Array.isArray(data?.providers) ? data.providers : [];

        return providers.find(p => String(p.provider_npi) === String(npi)) || null;
    }

    return {
        DEFAULT_REGION,
        getRegion,
        loadClusterCentroidsUmap,
        loadRegionCentroids,
        loadRegionCloud,
        loadProviderIndex,
        loadProvider,
        loadProviderIntelligenceSample,
        loadProviderIntelligence,
        loadProviderPublish,
        loadProviderPeerIntelligence,
        loadProviderCptIntelligence,
        loadProviderCptOpportunityPublish
    };
})();

console.log("sku4-loader.js loaded");