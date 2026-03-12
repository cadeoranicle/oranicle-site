async function getDemoPasskeyFromEdgeConfig() {
    const connectionString = process.env.EDGE_CONFIG;
    if (!connectionString) {
        throw new Error('EDGE_CONFIG is not configured.');
    }

    const base = new URL(connectionString);
    const itemUrl = new URL(base.pathname.replace(/\/$/, '') + '/item/demo_passkey', base.origin);
    itemUrl.search = base.search;

    const res = await fetch(itemUrl.toString(), {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!res.ok) {
        throw new Error(`Edge Config fetch failed with status ${res.status}`);
    }

    return await res.json();
}