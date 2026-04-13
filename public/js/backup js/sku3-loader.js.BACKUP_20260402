window.SKU3Loader = (() => {
    const REGION_MANIFESTS = {
        southeast: "/southeast_region/southeast_sku3_geometry_overlay_manifest.json",
        NYNJCT: "/canonical/regions/NYNJCT/v1/manifest.json"
    };

    const REGION_FOLDERS = {
        southeast: "southeast_region",
        NYNJCT: "canonical/regions/NYNJCT/v1"
    };

    const REGION_PROVIDER_INDEX = {
        NYNJCT: "provider_index.json",
        southeast: "southeast_provider_index.json",
    };

    function regionFolder(region) {
        const folder = REGION_FOLDERS[region];
        if (!folder) throw new Error(`No folder mapping configured for region: ${region}`);
        return folder;
    }

    async function fetchJson(url) {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load JSON: ${url}`);
        return res.json();
    }

    function resolvePath(region, fileName) {
        if (!fileName) return null;
        if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
            return fileName;
        }
        return `/${regionFolder(region)}/${fileName}`;
    }

    async function loadManifest(region) {
        const manifestUrl = REGION_MANIFESTS[region];
        if (!manifestUrl) throw new Error(`No SKU3 manifest configured for region: ${region}`);
        return fetchJson(manifestUrl);
    }

    async function loadProviderIndex(region) {
        const indexFile = REGION_PROVIDER_INDEX[region];
        if (!indexFile) throw new Error(`No provider index configured for region: ${region}`);

        if (region === "NYNJCT") {
            return fetchJson(`/canonical/regions/NYNJCT/v1/providers/${indexFile}`);
        }

        if (region === "southeast") {
            return fetchJson(`/southeast_region/southeast_region_providers/${indexFile}`);
        }

        throw new Error(`No provider index path configured for region: ${region}`);
    }


    async function loadProviderMetrics(region, npi) {
        if (region === "NYNJCT") {
            return fetchJson(`/canonical/regions/NYNJCT/v1/providers/provider_business_metrics_${npi}.json`);
        }

        if (region === "southeast") {
            return null;
        }

        return null;
    }

    async function loadProviderCanonicalMetrics(region, npi) {
        if (region === "NYNJCT") {
            return fetchJson(`/canonical/regions/NYNJCT/v1/providers/provider_metrics_${npi}.json`);
        }

        if (region === "southeast") {
            return null;
        }

        return null;
    }

    async function loadRegionLattice(region) {
        if (region === "NYNJCT") {
            return fetchJson(`/canonical/regions/NYNJCT/v1/geometry/region_lattice.json`);
        }

        return null;
    }

    async function loadProviderJson(region, npi) {
        const index = await loadProviderIndex(region);

        const supported = index.supported_npis || [];
        const isSupported = supported.includes(String(npi));
        if (!isSupported) return null;

        const folder = regionFolder(region);

        const rawGeometry = await fetchJson(`/${folder}/providers/provider_geometry_${npi}.json`);

        let rawBusinessMetrics = null;
        try {
            rawBusinessMetrics = await loadProviderMetrics(region, npi);
        } catch (err) {
            console.warn(`Provider business metrics not found for ${npi}`, err);
        }

        let rawCanonicalMetrics = null;
        try {
            rawCanonicalMetrics = await loadProviderCanonicalMetrics(region, npi);
        } catch (err) {
            console.warn(`Provider canonical metrics not found for ${npi}`, err);
        }

        const businessMetrics = rawBusinessMetrics?.business_metrics || {};

        const revenue = businessMetrics.revenue ?? null;
        const intensity = businessMetrics.intensity ?? null;
        const utilization = businessMetrics.utilization ?? null;

        return {
            provider_npi: rawGeometry.npi,
            region: region,
            point_count: 1,
            positions: [
                {
                    provider_npi: rawGeometry.npi,
                    pca_3d: {
                        x: rawGeometry.position_3D.C1,
                        y: rawGeometry.position_3D.C2,
                        z: rawGeometry.position_3D.C3
                    },
                    revenue: revenue,
                    intensity: intensity,
                    utilization: utilization
                }
            ],
            metrics: {
                revenue,
                intensity,
                utilization
            },
            canonical_metrics: rawCanonicalMetrics?.canonical_metrics || null
        };
    }

    async function loadZoneMetrics(region) {
        const path = `/canonical/regions/${region}/v1/metrics/zone_metrics.json`;

        try {
            const res = await fetch(path, { cache: "no-store" });
            if (!res.ok) throw new Error(`Failed to load zone metrics: ${path}`);
            return await res.json();
        } catch (e) {
            console.error("Failed to load zone metrics:", e);
            return null;
        }
    }

    async function loadBundle(region, npi = "") {
        const manifest = await loadManifest(region);

        const geometryJsonPath = resolvePath(
            region,
            manifest.base_geometry?.canonical_geometry_json
        );

        const umapGeometryPath = resolvePath(
            region,
            manifest.base_geometry?.umap_geometry_json
        );

        const overlayJsonPath = manifest.overlays?.archetype_overlay_json
            ? resolvePath(region, manifest.overlays.archetype_overlay_json)
            : null;

        const metadataPath = resolvePath(
            region,
            manifest.base_geometry?.canonical_geometry_metadata
        );

        const [geometry, umapGeometry, overlay, metadata, providerData, lattice] = await Promise.all([
            geometryJsonPath ? fetchJson(geometryJsonPath) : Promise.resolve(null),
            umapGeometryPath ? fetchJson(umapGeometryPath) : Promise.resolve(null),
            overlayJsonPath ? fetchJson(overlayJsonPath) : Promise.resolve(null),
            metadataPath ? fetchJson(metadataPath) : Promise.resolve(null),
            npi ? loadProviderJson(region, npi) : Promise.resolve(null),
            loadRegionLattice(region)
        ]);

        return {
            region,
            manifest,
            geometry,
            umapGeometry,
            overlay,
            metadata,
            providerData,
            lattice
        };
    }

    return {
        loadManifest,
        loadBundle,
        loadProviderIndex,
        loadProviderJson,
        loadZoneMetrics
    };
})();



console.log("sku3-loader.js loaded");