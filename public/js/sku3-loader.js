window.SKU3Loader = (() => {
    const REGION_MANIFESTS = {
        southeast: "/southeast_region/southeast_sku3_geometry_overlay_manifest.json",
    };

    const REGION_FOLDERS = {
        southeast: "southeast_region",
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
        return `/${regionFolder(region)}/${fileName}`;
    }

    async function loadManifest(region) {
        const manifestUrl = REGION_MANIFESTS[region];
        if (!manifestUrl) throw new Error(`No SKU3 manifest configured for region: ${region}`);
        return fetchJson(manifestUrl);
    }

    async function loadProviderIndex(region) {
        const folder = regionFolder(region);
        return fetchJson(`/${folder}/${folder}_providers/southeast_provider_index.json`);
    }

    async function loadProviderJson(region, npi) {
        const index = await loadProviderIndex(region);
        const hit = (index.providers || []).find(
            (p) => String(p.provider_npi) === String(npi)
        );
        if (!hit) return null;

        const folder = regionFolder(region);
        const fileName = hit.file.split("/").pop();
        return fetchJson(`/${folder}/${folder}_providers/${fileName}`);
    }

    async function loadBundle(region, npi = "") {
        const manifest = await loadManifest(region);

        const geometryJsonPath = resolvePath(
            region,
            manifest.base_geometry?.canonical_geometry_json
        );

        const overlayJsonPath = resolvePath(
            region,
            manifest.overlays?.archetype_overlay_json
        );

        const metadataPath = resolvePath(
            region,
            manifest.base_geometry?.canonical_geometry_metadata
        );

        const [geometry, overlay, metadata, providerData] = await Promise.all([
            geometryJsonPath ? fetchJson(geometryJsonPath) : Promise.resolve(null),
            overlayJsonPath ? fetchJson(overlayJsonPath) : Promise.resolve(null),
            metadataPath ? fetchJson(metadataPath) : Promise.resolve(null),
            npi ? loadProviderJson(region, npi) : Promise.resolve(null),
        ]);

        return {
            region,
            manifest,
            geometry,
            overlay,
            metadata,
            providerData,
        };
    }

    return {
        loadManifest,
        loadBundle,
        loadProviderIndex,
        loadProviderJson,
    };
})();

console.log("sku3-loader.js loaded");