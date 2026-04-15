window.PROVIDER_CPT_VIEWER_LAYER_CONFIG = [
    {
        id: "SKU4.1",
        label: "Region Axes",
        breadcrumb_label: "Region Axes",
        rhs_enabled: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid"
        ],
        visible_legends: [
            "legend-regional-centroid"
        ]

    },

    {
        id: "SKU4.2",
        label: "Canonical Cloud",
        breadcrumb_label: "Canonical Cloud",
        rhs_enabled: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "canonical_cloud"
        ],
        visible_legends: [
            "legend-regional-centroid",
            "legend-manifold"
        ]

    },

    {
        id: "SKU4.3",
        label: "Provider Position",
        breadcrumb_label: "Provider Position",
        rhs_enabled: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "canonical_cloud",
            "provider_point"
        ],
        visible_legends: [
            "legend-regional-centroid",
            "legend-manifold",
            "legend-provider"
        ]

    },

    {
        id: "SKU4.4",
        label: "Provider Focus",
        breadcrumb_label: "Provider Focus",
        rhs_enabled: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "provider_point"
        ],
        visible_legends: [
            "legend-regional-centroid",
            "legend-provider"
        ]

    },

    {
        id: "SKU4.5",
        label: "Zone Centroid",
        breadcrumb_label: "Zone Centroid",
        rhs_enabled: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "provider_point",
            "zonal_centroid"
        ],
        visible_legends: [
            "legend-regional-centroid",
            "legend-provider",
            "legend-zone-centroid"
        ]

    },

    {
        id: "SKU4.6",
        label: "Provider to Zone Link",
        breadcrumb_label: "Provider to Zone Link",
        rhs_enabled: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector"
        ],
        visible_legends: [
            "legend-regional-centroid",
            "legend-provider",
            "legend-zone-centroid",
            "legend-provider-zone-link"
        ]
    },

    {
        id: "SKU4.7",
        label: "Provider Longitudinal Movement",
        breadcrumb_label: "Provider Longitudinal Movement",
        rhs_enabled: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector",
            "provider_trajectory"
        ],
        visible_legends: [
            "legend-regional-centroid",
            "legend-provider",
            "legend-zone-centroid",
            "legend-provider-zone-link",
            "legend-provider-trajectory"
        ]
    },

    {
        id: "SKU4.8",
        label: "Regional Benchmark",
        breadcrumb_label: "Regional Benchmark",
        rhs_enabled: true,
        viewer_persistent: true,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector"
        ],
        visible_legends: [
            "legend-regional-centroid",
            "legend-manifold",
            "legend-provider",
            "legend-zone-centroid",
            "legend-provider-zone-link"
        ]
    },

    {
        id: "SKU4.9",
        label: "Peer Cohort Context",
        breadcrumb_label: "Peer Cohort Context",
        rhs_enabled: true,
        viewer_persistent: true,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector"
        ],
        visible_legends: [
            "legend-regional-centroid",
            "legend-provider",
            "legend-zone-centroid",
            "legend-provider-zone-link"
        ]
    },




    {
        id: "SKU4P.1",
        label: "Nearest Neighbor Peer",
        breadcrumb_label: "Nearest Neighbor Peer",
        rhs_enabled: true,
        viewer_persistent: true,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "provider_point",
            "peer_neighbor_points",
            "zonal_centroid",
            "zone_provider_connector"
        ]
    },

    {
        id: "SKU4P.3",
        label: "Peer Similarity Drivers",
        breadcrumb_label: "Peer Similarity Drivers",
        rhs_enabled: true,
        viewer_persistent: true,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "provider_point",
            "peer_neighbor_points",
            "zonal_centroid",
            "zone_provider_connector"
        ]
    },

    {
        id: "SKU4P.4",
        label: "Top Comparable Providers",
        breadcrumb_label: "Top Comparable Providers",
        rhs_enabled: true,
        viewer_persistent: true,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "provider_point",
            "peer_neighbor_points",
            "peer_comparable_points",
            "zonal_centroid",
            "zone_provider_connector"
        ]
    },

    {
        id: "SKU4P.5",
        label: "Cohort Position",
        breadcrumb_label: "Cohort Position",
        rhs_enabled: true,
        viewer_persistent: true,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector"
        ]
    },

    {
        id: "SKU4I.1",
        label: "Overperforming CPT Areas",
        breadcrumb_label: "Overperforming CPT Areas",
        rhs_enabled: true,
        viewer_persistent: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "canonical_cloud",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector"
        ]
    },

    {
        id: "SKU4I.2",
        label: "Underperforming CPT Areas",
        breadcrumb_label: "Underperforming CPT Areas",
        rhs_enabled: true,
        viewer_persistent: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "canonical_cloud",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector"
        ]
    },

    {
        id: "SKU4I.3",
        label: "Fixable CPT Areas",
        breadcrumb_label: "Fixable CPT Areas",
        rhs_enabled: true,
        viewer_persistent: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "canonical_cloud",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector"
        ]
    },

    {
        id: "SKU4I.4",
        label: "Monetizable CPT Areas",
        breadcrumb_label: "Monetizable CPT Areas",
        rhs_enabled: true,
        viewer_persistent: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "canonical_cloud",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector"
        ]
    },

    {
        id: "SKU4I.5",
        label: "CPT Leakage Areas",
        breadcrumb_label: "CPT Leakage Areas",
        rhs_enabled: true,
        viewer_persistent: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "canonical_cloud",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector"
        ]
    },

    {
        id: "SKU4I.7",
        label: "CPT Reimbursement Risk",
        breadcrumb_label: "CPT Reimbursement Risk",
        rhs_enabled: true,
        viewer_persistent: false,
        visible_traces: [
            "axis_u1",
            "axis_u2",
            "axis_u3",
            "region_centroid",
            "canonical_cloud",
            "provider_point",
            "zonal_centroid",
            "zone_provider_connector"
        ]
    }
];

console.log("provider-cpt-viewer-layer-config.js loaded");
console.log("provider-cpt-viewer-layer-config.js loaded", window.PROVIDER_CPT_VIEWER_LAYER_CONFIG.length);