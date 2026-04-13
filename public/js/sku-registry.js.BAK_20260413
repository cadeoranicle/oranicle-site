// ======================================================
// SKU Registry
// Product definition layer only
// Gates are architected now but disabled by default
// ======================================================

window.SKU_FLOW_STATES = {
    PRE_VIEW: {
        reveal_buttons: [],
        highlight_target: null,
        next_message: "",
        chevrons: 0,
        show_actions_panel: false,
        show_status_panel: false
    }
};

window.FEATURE_GATES = {
    enable_auth_gates: false,
    enable_payment_gates: false
};


window.SKU_REGISTRY = {

    // =========================
    // SKU3 Viewer Layer
    // =========================

    "SKU3.1": {
        parent_sku: "SKU3",
        tier: "viewer",
        category: "Canonical Layer",
        focus: "Market map + region context",
        requires_auth: false,
        requires_payment: false,

        assets: [
            "legend-provider",
            "legend-regional-centroid",
            "legend-manifold",
            "rhs-region-context"
        ],

        traces: [
            "manifold",
            "provider",
            "regional-centroid"
        ],

        cta: {
            label: "View Market Map",
            help: "Show provider position and high-level regional benchmark context"
        },

        access_policy: {
            registration: "none",
            auth_otp: "none",
            payment: "none",
            payment_otp: "none"
        },

        pricing: {
            price_usd: null,
            price_label: "Freemium"
        },

        delivery_scope: "region",

        flow_ui: {
            next_message: 'Next: Click "View Market Benchmark"',
            chevrons: 1,
            highlight_target: "ctaSku32",
            reveal_buttons: ["ctaSku32"],
            show_actions_panel: true,
            show_status_panel: false
        }
    },

    "SKU3.2": {
        parent_sku: "SKU3",
        tier: "viewer",
        category: "Canonical Layer",
        focus: "Provider vs regional benchmark",
        requires_auth: false,
        requires_payment: false,

        assets: [
            "rhs-region-context",
            "rhs-provider-region-benchmark",
            "rhs-provider-region-interpretation"
        ],

        traces: [
            "provider-region-link"
        ],

        cta: {
            label: "View Market Benchmark",
            help: "Compare provider performance against the regional benchmark"
        },

        access_policy: {
            registration: "none",
            auth_otp: "none",
            payment: "none",
            payment_otp: "none"
        },

        pricing: {
            price_usd: null,
            price_label: "Freemium"
        },

        delivery_scope: "region",

        flow_ui: {
            next_message: 'Next: Click "View Zonal Averages"',
            chevrons: 1,
            highlight_target: "ctaSku33",
            reveal_buttons: ["ctaSku32", "ctaSku33"],
            show_actions_panel: true,
            show_status_panel: false
        }
    },

    "SKU3.3": {
        parent_sku: "SKU3",
        tier: "viewer",
        category: "Canonical Layer",
        focus: "Peer cohort topology",
        requires_auth: false,
        requires_payment: false,

        assets: [
            "legend-zone-centroid",
            "legend-provider-zone-link",
            "legend-current-zone",
            "legend-adjacent-zones",
            "legend-adjacent-links",
            "rhs-peer-context"
        ],

        traces: [
            "zone-centroid",
            "provider-zone-link",
            "current-zone-box",
            "adjacent-zones",
            "adjacent-links"
        ],

        cta: {
            label: "View Zonal Averages",
            help: "Show zonal peer-group averages and local cohort context"
        },

        access_policy: {
            registration: "required",
            auth_otp: "required",
            payment: "none",
            payment_otp: "none"
        },

        pricing: {
            price_usd: null,
            price_label: "Auth Required"
        },

        delivery_scope: "cohort",

        flow_ui: {
            next_message: 'Next: Click "View Peer Benchmark"',
            chevrons: 1,
            highlight_target: "ctaSku34",
            reveal_buttons: ["ctaSku32", "ctaSku33", "ctaSku34"],
            show_actions_panel: true,
            show_status_panel: false
        }
    },

    "SKU3.4": {
        parent_sku: "SKU3",
        tier: "viewer",
        category: "Canonical Layer",
        focus: "Provider vs peer benchmark",
        requires_auth: false,
        requires_payment: false,

        assets: [
            "rhs-peer-context",
            "rhs-provider-peer-benchmark"
        ],

        traces: [
            "zone-centroid",
            "provider-zone-link",
            "current-zone-box",
            "adjacent-zones",
            "adjacent-links"
        ],

        cta: {
            label: "View Peer Benchmark",
            help: "Compare provider performance against peer cohort averages"
        },

        access_policy: {
            registration: "required",
            auth_otp: "required",
            payment: "none",
            payment_otp: "none"
        },

        pricing: {
            price_usd: null,
            price_label: "Auth Required"
        },

        delivery_scope: "cohort",

        flow_ui: {
            next_message: "Full intelligence unlocked",
            chevrons: 0,
            highlight_target: null,
            reveal_buttons: ["ctaSku32", "ctaSku33", "ctaSku34"],
            show_actions_panel: true,
            show_status_panel: false
        }
    },
    "SKU3.5": {
        parent_sku: "SKU3",
        tier: "viewer",
        category: "Provider Layer",
        focus: "Provider projection",
        requires_auth: false,
        requires_payment: false
    },

    "SKU3.6": {
        parent_sku: "SKU3",
        tier: "viewer",
        category: "Provider Layer",
        focus: "Provider trajectory",
        requires_auth: false,
        requires_payment: false
    },

    "SKU3.7": {
        parent_sku: "SKU3",
        tier: "viewer",
        category: "Metrics Layer",
        focus: "Region metrics",
        requires_auth: false,
        requires_payment: false
    },

    "SKU3.8": {
        parent_sku: "SKU3",
        tier: "viewer",
        category: "Metrics Layer",
        focus: "Provider metrics",
        requires_auth: false,
        requires_payment: false
    },

    // =========================
    // Financial Intelligence
    // =========================

    "A1.1": {
        parent_sku: "A1",
        tier: "intelligence",
        category: "Financial Intelligence",
        focus: "Total allowed reimbursement",
        requires_auth: false,
        requires_payment: false
    },
    "A1.2": {
        parent_sku: "A1",
        tier: "intelligence",
        category: "Financial Intelligence",
        focus: "Revenue per beneficiary",
        requires_auth: false,
        requires_payment: false
    },
    "A1.3": {
        parent_sku: "A1",
        tier: "intelligence",
        category: "Financial Intelligence",
        focus: "Revenue per encounter",
        requires_auth: false,
        requires_payment: false
    },
    "A1.4": {
        parent_sku: "A1",
        tier: "intelligence",
        category: "Financial Intelligence",
        focus: "Top CPT HCPCS cost drivers",
        requires_auth: false,
        requires_payment: false
    },
    "A1.5": {
        parent_sku: "A1",
        tier: "intelligence",
        category: "Financial Intelligence",
        focus: "Cost trend analysis",
        requires_auth: false,
        requires_payment: false
    },
    "A1.6": {
        parent_sku: "A1",
        tier: "intelligence",
        category: "Financial Intelligence",
        focus: "Service mix composition",
        requires_auth: false,
        requires_payment: false
    },

    // =========================
    // Utilization Intelligence
    // =========================

    "B1.1": {
        parent_sku: "B1",
        tier: "intelligence",
        category: "Utilization Intelligence",
        focus: "Provider coordinates",
        requires_auth: false,
        requires_payment: false
    },
    "B1.2": {
        parent_sku: "B1",
        tier: "intelligence",
        category: "Utilization Intelligence",
        focus: "Economic intensity proxy",
        requires_auth: false,
        requires_payment: false
    },
    "B1.3": {
        parent_sku: "B1",
        tier: "intelligence",
        category: "Utilization Intelligence",
        focus: "Utilization structure proxy",
        requires_auth: false,
        requires_payment: false
    },
    "B1.4": {
        parent_sku: "B1",
        tier: "intelligence",
        category: "Utilization Intelligence",
        focus: "Manifold visualization",
        requires_auth: false,
        requires_payment: false
    },
    "B1.5": {
        parent_sku: "B1",
        tier: "intelligence",
        category: "Utilization Intelligence",
        focus: "Anchor proximity analysis",
        requires_auth: false,
        requires_payment: false
    },

    // =========================
    // Structural Intelligence
    // =========================

    "C1.1": {
        parent_sku: "C1",
        tier: "intelligence",
        category: "Structural Intelligence",
        focus: "Archetype classification",
        requires_auth: false,
        requires_payment: false
    },
    "C1.2": {
        parent_sku: "C1",
        tier: "intelligence",
        category: "Structural Intelligence",
        focus: "Peer similarity detection",
        requires_auth: false,
        requires_payment: false
    },
    "C1.3": {
        parent_sku: "C1",
        tier: "intelligence",
        category: "Structural Intelligence",
        focus: "Regional centroid distance",
        requires_auth: false,
        requires_payment: false
    },
    "C1.4": {
        parent_sku: "C1",
        tier: "intelligence",
        category: "Structural Intelligence",
        focus: "Cluster stability score",
        requires_auth: false,
        requires_payment: false
    },

    // =========================
    // Behavioral Intelligence
    // =========================

    "D1.1": {
        parent_sku: "D1",
        tier: "intelligence",
        category: "Behavioral Intelligence",
        focus: "Repeat visit density rule",
        requires_auth: false,
        requires_payment: false
    },
    "D1.2": {
        parent_sku: "D1",
        tier: "intelligence",
        category: "Behavioral Intelligence",
        focus: "Payment per claim percentile",
        requires_auth: false,
        requires_payment: false
    },
    "D1.3": {
        parent_sku: "D1",
        tier: "intelligence",
        category: "Behavioral Intelligence",
        focus: "Procedure mix volatility",
        requires_auth: false,
        requires_payment: false
    },
    "D1.4": {
        parent_sku: "D1",
        tier: "intelligence",
        category: "Behavioral Intelligence",
        focus: "Monthly utilization instability",
        requires_auth: false,
        requires_payment: false
    },
    "D1.5": {
        parent_sku: "D1",
        tier: "intelligence",
        category: "Behavioral Intelligence",
        focus: "Outlier streak detection",
        requires_auth: false,
        requires_payment: false
    }
};

// ======================================================
// Access check hook
// Architecture is active, enforcement is OFF for now
// ======================================================

window.checkAccess = function (sku, context = {}) {
    const def = window.SKU_REGISTRY?.[sku];
    if (!def) return true;

    if (!window.FEATURE_GATES.enable_auth_gates && !window.FEATURE_GATES.enable_payment_gates) {
        return true;
    }

    const actor = {
        logged_in: false,
        actor_type: context.actor_type || "individual",
        country: context.country || "US",
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