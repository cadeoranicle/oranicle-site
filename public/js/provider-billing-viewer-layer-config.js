window.PROVIDER_BILLING_VIEWER_LAYER_CONFIG = [
    {
        id: "base_view",
        label: "Base View",
        button_label: "Show Regional Cloud",
        traces: [
            "axes",
            "provider",
            "regional-centroid"
        ],
        legends: [
            "legend-provider",
            "legend-regional-centroid"
        ]
    },
    {
        id: "regional_cloud",
        label: "Regional Cloud",
        button_label: "Show Regional Lattice",
        traces: [
            "manifold"
        ],
        legends: [
            "legend-manifold"
        ]
    },
    {
        id: "regional_lattice",
        label: "Regional Lattice",
        button_label: "Show Current Zone",
        traces: [
            "lattice"
        ],
        legends: [
            "legend-zone-centroid"
        ]
    },

    {
        id: "current_zone_box",
        label: "Current Zone Box",
        button_label: "Show Current Zone",
        traces: [
            "current-zone-box"
        ],
        legends: [
            "legend-current-zone"
        ]
    },

    {
        id: "zone_centroid",
        label: "Zone Centroid",
        button_label: "Show Provider-Zone Link",
        traces: [
            "zone-centroid"
        ],
        legends: [
            "legend-zone-centroid"
        ]
    },

    {
        id: "provider_zone_link",
        label: "Provider-Zone Link",
        button_label: "Show Adjacent Zones",
        traces: [
            "provider-zone-link"
        ],
        legends: [
            "legend-provider-zone-link"
        ]
    },
    {
        id: "adjacent_zones",
        label: "Adjacent Zones",
        button_label: "Restart Layers",
        traces: [
            "adjacent-zones",
            "adjacent-links"
        ],
        legends: [
            "legend-adjacent-zones",
            "legend-adjacent-links"
        ]
    }
];

console.log("provider-billing-viewer-layer-config.js loaded");