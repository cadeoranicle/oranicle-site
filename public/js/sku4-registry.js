// ======================================================
// SKU4 Registry
// Geometry-first contract
// Flow UI owned here, not in index.js
// ======================================================

window.SKU4_FLOW_STATES = {
    PRE_VIEW: {
        reveal_buttons: [],
        highlight_target: null,
        next_message: "",
        chevrons: 0,
        show_actions_panel: false,
        show_status_panel: false
    },

    POST_CHECK_VALID: {
        reveal_buttons: [],
        highlight_target: "viewBtn",
        next_message: 'Provider found. Click "View" to begin geometry layers.',
        chevrons: 1,
        show_actions_panel: false,
        show_status_panel: true
    },

    POST_CHECK_INVALID: {
        reveal_buttons: [],
        highlight_target: "npiInput",
        next_message: "Provider not found in current CPT canonical.",
        chevrons: 1,
        show_actions_panel: false,
        show_status_panel: true
    }
};

window.SKU4_FEATURE_GATES = {
    enable_auth_gates: false,
    enable_payment_gates: false
};

window.SKU4_REGISTRY = {
    "SKU4.1": {
        parent_sku: "SKU4",
        tier: "viewer",
        category: "Geometry Layer",
        focus: "Region centroid and axes",
        requires_auth: false,
        requires_payment: false,

        title: "Provider Canonical Position",
        view_stage: "canonical",
        data_binding_key: null,


        assets: [
            "legend-regional-centroid"
        ],

        flow_ui: {
            next_message: 'Next: Click "View" to add region cloud.',
            chevrons: 1,
            highlight_target: "viewBtn",
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },


    "SKU4.2": {
        parent_sku: "SKU4",
        tier: "viewer",
        category: "Geometry Layer",
        focus: "Region cloud",
        requires_auth: false,
        requires_payment: false,

        assets: [
            "legend-regional-centroid",
            "legend-manifold"
        ],

        title: "Provider Canonical Position",
        view_stage: "canonical",
        data_binding_key: null,


        flow_ui: {
            next_message: 'Next: Click "View" to add provider position.',
            chevrons: 1,
            highlight_target: "viewBtn",
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },

    "SKU4.3": {
        parent_sku: "SKU4",
        tier: "viewer",
        category: "Geometry Layer",
        focus: "Provider position",
        requires_auth: false,
        requires_payment: false,

        assets: [
            "legend-regional-centroid",
            "legend-manifold",
            "legend-provider"
        ],

        title: "Provider Canonical Position",
        view_stage: "canonical",
        data_binding_key: null,


        flow_ui: {
            next_message: 'Next: Click "View" to add current zone centroid.',
            chevrons: 1,
            highlight_target: "viewBtn",
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },

    "SKU4.4": {
        parent_sku: "SKU4",
        tier: "viewer",
        category: "Geometry Layer",
        focus: "Current provider zone centroid",
        requires_auth: false,
        requires_payment: false,

        assets: [
            "legend-regional-centroid",
            "legend-manifold",
            "legend-provider",
            "legend-zone-centroid"
        ],

        title: "Provider Canonical Position",
        view_stage: "canonical",
        data_binding_key: null,


        flow_ui: {
            next_message: 'Next: Click "View" to connect provider to zone.',
            chevrons: 1,
            highlight_target: "viewBtn",
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },

    "SKU4.5": {
        parent_sku: "SKU4",
        tier: "viewer",
        category: "Geometry Layer",
        focus: "Provider to zone link",
        requires_auth: false,
        requires_payment: false,

        assets: [
            "legend-regional-centroid",
            "legend-manifold",
            "legend-provider",
            "legend-zone-centroid",
            "legend-provider-zone-link"
        ],

        title: "Provider Canonical Position",
        view_stage: "canonical",
        data_binding_key: null,


        flow_ui: {
            next_message: 'Next: Click "View" for full geometry emphasis.',
            chevrons: 1,
            highlight_target: "viewBtn",
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },

    "SKU4.6": {
        parent_sku: "SKU4",
        tier: "viewer",
        category: "Geometry Layer",
        focus: "Full geometry",
        requires_auth: false,
        requires_payment: false,

        assets: [
            "legend-regional-centroid",
            "legend-manifold",
            "legend-provider",
            "legend-zone-centroid",
            "legend-provider-zone-link"
        ],

        title: "Provider Canonical Position",
        view_stage: "canonical",
        data_binding_key: null,


        flow_ui: {
            next_message: "Geometry complete.",
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },

    "SKU4.7": {
        parent_sku: "SKU4",
        tier: "viewer",
        category: "Geometry Layer",
        focus: "Geometry complete and regional benchmark unlocked",
        requires_auth: false,
        requires_payment: false,




        assets: [
            "legend-regional-centroid",
            "legend-manifold",
            "legend-provider",
            "legend-zone-centroid",
            "legend-provider-zone-link",
            "rhs-region-context",
            "rhs-provider-region-benchmark",
            "rhs-provider-region-interpretation"
        ],

        title: "Provider vs Region Benchmark",
        view_stage: "actionable",
        data_binding_key: null,

        flow_ui: {
            next_message: 'Regional benchmark unlocked.',
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },


    "SKU4.8": {
        parent_sku: "SKU4",
        tier: "viewer",
        category: "Peer / Benchmark Intelligence",
        focus: "Provider vs zone benchmark",
        requires_auth: false,
        requires_payment: false,

        semantic_ref: "E4.2",
        data_binding_key: "provider_vs_zone_benchmark",

        assets: [
            "legend-regional-centroid",
            "legend-manifold",
            "legend-provider",
            "legend-zone-centroid",
            "legend-provider-zone-link",
            "rhs-peer-context",
            "rhs-provider-peer-benchmark"
        ],

        title: "Provider vs Peer Cohort",
        view_stage: "actionable",
        data_binding_key: "provider_vs_region_benchmark",

        flow_ui: {
            next_message: "Zone benchmark unlocked.",
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },

    "SKU4.9": {
        parent_sku: "SKU4",
        tier: "viewer",
        category: "Peer / Benchmark Intelligence",
        focus: "Peer cohort context",
        requires_auth: false,
        requires_payment: false,

        data_binding_key: "provider_vs_zone_benchmark",

        assets: [
            "legend-regional-centroid",
            "legend-provider",
            "legend-zone-centroid",
            "legend-provider-zone-link",
            "rhs-peer-context"
        ],

        title: "Peer Cohort Context",
        view_stage: "peer_benchmark",

        flow_ui: {
            next_message: "Peer cohort context unlocked.",
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },

    "SKU4P.1": {
        parent_sku: "SKU4P",
        tier: "viewer",
        category: "Peer Benchmark Layer",
        focus: "Nearest-neighbor peer engine",
        requires_auth: false,
        requires_payment: false,
        data_binding_key: "nearest_neighbor_peer_pack",
        assets: [],
        title: "Peer Benchmark",
        view_stage: "peer_benchmark"
    },

    "SKU4P.2": {
        parent_sku: "SKU4P",
        tier: "viewer",
        category: "Peer Benchmark Layer",
        focus: "Peer distance scores",
        requires_auth: false,
        requires_payment: false,
        data_binding_key: "nearest_neighbor_peer_pack",
        assets: [],
        title: "Peer Benchmark",
        view_stage: "peer_benchmark"
    },
    "SKU4P.3": {
        parent_sku: "SKU4P",
        tier: "viewer",
        category: "Peer Benchmark Layer",
        focus: "Peer similarity drivers",
        requires_auth: false,
        requires_payment: false,
        data_binding_key: "peer_similarity_drivers",
        assets: [],
        title: "Peer Benchmark",
        view_stage: "peer_benchmark"
    },
    "SKU4P.4": {
        parent_sku: "SKU4P",
        tier: "viewer",
        category: "Peer Benchmark Layer",
        focus: "Top comparable providers",
        requires_auth: false,
        requires_payment: false,
        data_binding_key: "top_comparable_providers",
        assets: [],
        title: "Peer Benchmark",
        view_stage: "peer_benchmark"
    },
    "SKU4P.5": {
        parent_sku: "SKU4P",
        tier: "viewer",
        category: "Peer Benchmark Layer",
        focus: "Cohort median and percentile metrics",
        requires_auth: false,
        requires_payment: false,
        data_binding_key: "cohort_percentiles",
        assets: [],
        title: "Peer Benchmark",
        view_stage: "peer_benchmark"
    },

    "SKU4I.1": {
        parent_sku: "SKU4I",
        tier: "viewer",
        category: "Interpretation Layer",
        focus: "Overperforming CPT areas",
        requires_auth: false,
        requires_payment: false,

        data_binding_key: "overperforming_cpt_areas",

        title: "Overperforming CPT Areas",

        flow_ui: {
            next_message: "Review provider strengths.",
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },
    "SKU4I.2": {
        parent_sku: "SKU4I",
        tier: "viewer",
        category: "Interpretation Layer",
        focus: "Underperforming CPT areas",
        requires_auth: false,
        requires_payment: false,

        data_binding_key: "underperforming_cpt_areas",

        title: "Underperforming CPT Areas",

        flow_ui: {
            next_message: "Review provider weakness areas.",
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },

    "SKU4I.3": {
        parent_sku: "SKU4I",
        tier: "viewer",
        category: "Interpretation Layer",
        focus: "Fixable CPT areas",
        requires_auth: false,
        requires_payment: false,

        payload_source: "opportunityPayload",
        data_binding_key: "fixable_cpt_areas",
        infograph_type: "cpt_recovery_bars",

        title: "Fixable CPT Areas",

        flow_ui: {
            next_message: "Review recoverable CPT opportunities.",
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },


    "SKU4I.4": {
        parent_sku: "SKU4I",
        tier: "viewer",
        category: "Interpretation Layer",
        focus: "Monetizable CPT areas",
        requires_auth: false,
        requires_payment: false,
        payload_source: "opportunityPayload",
        data_binding_key: "monetizable_cpt_areas",
        infograph_type: "cpt_upside_bars",
        title: "Monetizable CPT Areas",
        flow_ui: {
            next_message: "Review CPT monetization opportunities.",
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },
    "SKU4I.5": {
        parent_sku: "SKU4I",
        tier: "viewer",
        category: "Revenue Opportunity Layer",
        focus: "CPT leakage areas",
        requires_auth: false,
        requires_payment: false,

        data_binding_key: "cpt_leakage_areas",

        binder_key: "template_1_opportunity",
        binder_variant: "cpt_leakage",
        template_type: "template_1_cpt_opportunity_fullscreen",
        use_template_renderer: true,

        title: "CPT Leakage Areas",
        flow_ui: {
            next_message: "Review missing CPT revenue areas.",
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },

    "SKU4I.7": {
        parent_sku: "SKU4I",
        tier: "viewer",
        category: "Revenue Opportunity Layer",
        focus: "CPT reimbursement risk",
        requires_auth: false,
        requires_payment: false,
        data_binding_key: "cpt_reimbursement_risk",

        binder_key: "template_1_opportunity",
        binder_variant: "cpt_reimbursement_risk",
        template_type: "template_1_cpt_opportunity_fullscreen",
        use_template_renderer: true,

        title: "CPT Reimbursement Risk",
        flow_ui: {
            next_message: "Review CPT reimbursement risk areas.",
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: [],
            show_actions_panel: false,
            show_status_panel: true
        }
    },
}






window.checkSku4Access = function (sku, context = {}) {
    const def = window.SKU4_REGISTRY?.[sku];
    if (!def) return true;

    if (!window.SKU4_FEATURE_GATES.enable_auth_gates && !window.SKU4_FEATURE_GATES.enable_payment_gates) {
        return true;
    }

    const actor = {
        logged_in: false,
        entitlements: context.entitlements || []
    };

    if (def.requires_auth && !actor.logged_in) {
        return false;
    }

    if (def.requires_payment && !actor.entitlements.includes(sku)) {
        return false;
    }

    return true;
};

console.log("sku4-registry.js loaded"); 