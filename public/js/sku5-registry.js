// sku5-registry.js
// SKU5 permanent truth registry
// Registry = structural truth
// Session = runtime truth

(function initSKU5Registry(global) {
    "use strict";

    // ------------------------------------------------------------
    // Shared enums / constants
    // ------------------------------------------------------------

    const RANGE_GROUPS = {
        CANONICAL: "canonical",
        DESCRIPTIVE: "descriptive",
        PRESCRIPTIVE: "prescriptive",
        PREDICTIVE: "predictive",
        OPERATIONAL_SUPPORT: "operational_support"
    };

    const INTELLIGENCE_CLASS = {
        DESCRIPTIVE: "descriptive",
        PRESCRIPTIVE: "prescriptive",
        PREDICTIVE: "predictive",
        OPERATIONAL: "operational_support"
    };

    const PANEL_TYPES = {
        HEADER: "header",
        JOURNEY: "journey",
        VIEWER: "viewer",
        GRAPH: "graph",
        DATA_TABLE: "data_table",
        NARRATIVE: "narrative",
        KPI_CARDS: "kpi_cards",
        HYBRID: "hybrid",
        NOTES: "notes",
        EMPTY: "empty"
    };

    const LAYOUT_MODES = {
        CANONICAL_FOCUS: "canonical_focus",
        DATA_GRAPH_SPLIT: "data_graph_split",
        GRAPH_DATA_SPLIT: "graph_data_split",
        VIEWER_DATA_SPLIT: "viewer_data_split",
        NARRATIVE_GRAPH_SPLIT: "narrative_graph_split",
        FULL_FINANCIAL_PANEL: "full_financial_panel",
        DUAL_ANALYTICS: "dual_analytics",
        EMPTY_STATE: "empty_state"
    };

    const VIEWER_MODES = {
        NONE: "none",
        CANONICAL_3D: "canonical_3d",
        CANONICAL_TRAJECTORY: "canonical_trajectory",
        CANONICAL_PEER: "canonical_peer"
    };

    const GRAPH_TYPES = {
        NONE: "none",
        BAR: "bar",
        GROUPED_BAR: "grouped_bar",
        DELTA_BAR: "delta_bar",
        LINE: "line",
        TRAJECTORY: "trajectory",
        SCATTER: "scatter",
        WATERFALL: "waterfall",
        PARETO: "pareto",
        HEATMAP: "heatmap",
        KPI_COMPOSITE: "kpi_composite",
        DISTRIBUTION: "distribution",
        RISK_BAR: "risk_bar"
    };

    const LEGEND_MODES = {
        NONE: "none",
        MINIMAL: "minimal",
        STANDARD: "standard",
        EXPANDED: "expanded"
    };

    // ------------------------------------------------------------
    // Shared contract builders
    // ------------------------------------------------------------

    function makePanelContract({
        panel_type,
        component = null,
        data_binding_key = null,
        title = "",
        subtitle = "",
        visible = true,
        empty_state_message = "",
        props = {}
    }) {
        return {
            panel_type,
            component,
            data_binding_key,
            title,
            subtitle,
            visible,
            empty_state_message,
            props
        };
    }

    function makeHeaderContract({
        title,
        subtitle = "",
        shell_theme = "sku5-default",
        accent_color = "red"
    }) {
        return makePanelContract({
            panel_type: PANEL_TYPES.HEADER,
            component: "sku5-header-shell",
            title,
            subtitle,
            props: {
                shell_theme,
                accent_color,
                show_region: true,
                show_model: true,
                show_provider: true,
                show_sku_title: true
            }
        });
    }

    function makeJourneyContract({
        breadcrumb_label,
        pill_label,
        cta_label = "View",
        show_back = true,
        show_next = true
    }) {
        return makePanelContract({
            panel_type: PANEL_TYPES.JOURNEY,
            component: "sku5-journey-shell",
            title: breadcrumb_label,
            props: {
                breadcrumb_label,
                pill_label,
                cta_label,
                show_back,
                show_next,
                show_pills: true,
                show_breadcrumb: true,
                show_cta: true
            }
        });
    }

    function makeViewerContract({
        title,
        data_binding_key = null,
        viewer_mode = VIEWER_MODES.NONE,
        legend_mode = LEGEND_MODES.STANDARD,
        accumulate_from_previous = false,
        visible = true,
        props = {}
    }) {
        return makePanelContract({
            panel_type: PANEL_TYPES.VIEWER,
            component: "sku5-viewer",
            data_binding_key,
            title,
            visible,
            props: {
                viewer_mode,
                legend_mode,
                accumulate_from_previous,
                ...props
            }
        });
    }

    function makeNarrativeContract({
        title,
        narrative_key = null,
        data_binding_key = null,
        visible = true,
        props = {}
    }) {
        return makePanelContract({
            panel_type: PANEL_TYPES.NARRATIVE,
            component: "sku5-narrative",
            data_binding_key,
            title,
            visible,
            props: {
                narrative_key,
                ...props
            }
        });
    }

    function makeNotesContract({
        title = "Operational Notes",
        notes_key = null,
        visible = true,
        props = {}
    }) {
        return makePanelContract({
            panel_type: PANEL_TYPES.NOTES,
            component: "sku5-notes",
            data_binding_key: notes_key,
            title,
            visible,
            props: {
                ...props
            }
        });
    }

    function makeGraphContract({
        title,
        data_binding_key = null,
        graph_type = GRAPH_TYPES.NONE,
        visible = true
    }) {
        return makePanelContract({
            panel_type: PANEL_TYPES.GRAPH,
            component: "sku5-graph",
            data_binding_key,
            title,
            visible,
            props: {
                graph_type
            }
        });
    }

    function makeDataTableContract({
        title,
        data_binding_key = null,
        visible = true
    }) {
        return makePanelContract({
            panel_type: PANEL_TYPES.DATA_TABLE,
            component: "sku5-data-table",
            data_binding_key,
            title,
            visible
        });
    }



    function makeHybridContract({
        title,
        data_binding_key = null,
        narrative_key = null,
        graph_type = GRAPH_TYPES.NONE,
        visible = true
    }) {
        return makePanelContract({
            panel_type: PANEL_TYPES.HYBRID,
            component: "sku5-hybrid-block",
            data_binding_key,
            title,
            visible,
            props: {
                narrative_key,
                graph_type
            }
        });
    }


    // ------------------------------------------------------------
    // Shared defaults
    // ------------------------------------------------------------

    function withBase(entry) {
        return Object.freeze({
            auth_required: false,
            payment_required: false,
            token_cost: 0,

            shell_theme: "sku5-default",
            accent_color: "red",
            viewer_mode: VIEWER_MODES.NONE,
            rhs_visible: true,
            lhs_visible: true,
            graph_visible: false,
            graph_type: GRAPH_TYPES.NONE,
            legend_mode: LEGEND_MODES.STANDARD,
            layout_mode: LAYOUT_MODES.DATA_GRAPH_SPLIT,
            accumulate_from_previous: false,
            viewer_layers: [],

            panel_1_contract: null,
            panel_2_contract: null,
            panel_3_contract: null,
            panel_4_contract: null,
            panel_5_contract: null,

            ...entry
        });
    }

    // ------------------------------------------------------------
    // Registry entries
    // ------------------------------------------------------------

    const entries = [
        // ============================================================
        // CANONICAL RANGE
        // ============================================================

        withBase({
            sku_id: "SKU5.01",
            sequence: 1,
            range_group: RANGE_GROUPS.CANONICAL,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Canonical Positioning Foundation",
            breadcrumb_label: "Canonical Foundation",
            pill_label: "Canonical",
            cta_label: "View Position",

            previous_sku_id: null,
            next_sku_id: "SKU5.50",
            status_label: "Canonical Cloud",
            next_status_label: "View Benchmark with Deltas",
            next_cta_label: "Next",

            lhs_contract: "canonical_axes_center",
            rhs_contract: "narrative_1",
            notes: "Canonical Layer 1",

            viewer_mode: VIEWER_MODES.CANONICAL_3D,
            graph_visible: false,
            layout_mode: LAYOUT_MODES.CANONICAL_FOCUS,
            legend_mode: LEGEND_MODES.MINIMAL,

            viewer_layers: [
                "axis_u1",
                "axis_u2",
                "axis_u3",
                "region_centroid",
                "hospital_point",
                "peer_cohort_point",
                "provider_peer_connector",
                "canonical_cloud"
            ],

            panel_1_contract: makeHeaderContract({
                title: "SKU5.01 — Canonical Positioning Foundation",
                subtitle: "Establish the hospital position inside the regional canonical frame"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Canonical Foundation",
                pill_label: "Positioning",
                cta_label: "View Position"
            }),

            panel_3_contract: makeViewerContract({
                title: "Canonical Positioning",
                data_binding_key: "canonical_axes_center",
                viewer_mode: VIEWER_MODES.CANONICAL_3D,
                legend_mode: LEGEND_MODES.MINIMAL
            }),

            panel_4_contract: makeNarrativeContract({
                title: "Canonical Positioning Narrative",
                narrative_key: "narrative_1",
                data_binding_key: "narrative_1"
            }),

            panel_5_contract: makeNotesContract({
                title: "Canonical Positioning Notes",
                notes_key: "canonical_layer_1_notes"
            })
        }),
/* 
        withBase({
            sku_id: "SKU5.02",
            sequence: 2,
            range_group: RANGE_GROUPS.CANONICAL,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Canonical Cloud",
            breadcrumb_label: "Canonical Foundation",
            pill_label: "Cloud",
            cta_label: "View Cloud",

            lhs_contract: "canonical_cloud",
            rhs_contract: "narrative_2",
            notes: "Canonical Layer 2",

            viewer_mode: VIEWER_MODES.CANONICAL_3D,
            graph_visible: false,
            layout_mode: LAYOUT_MODES.CANONICAL_FOCUS,
            legend_mode: LEGEND_MODES.STANDARD,
            accumulate_from_previous: true,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.02 — Canonical Cloud",
                subtitle: "Add regional hospital cloud structure"
            }),
            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Canonical Foundation",
                pill_label: "Cloud",
                cta_label: "View Cloud"
            }),
            panel_3_contract: makeViewerContract({
                title: "Canonical Cloud",
                data_binding_key: "canonical_cloud",
                viewer_mode: VIEWER_MODES.CANONICAL_3D,
                legend_mode: LEGEND_MODES.STANDARD,
                accumulate_from_previous: true
            }),
            panel_4_contract: makeNarrativeContract({
                title: "Cloud Narrative",
                narrative_key: "narrative_2",
                data_binding_key: "narrative_2"
            }),
            panel_5_contract: makeNotesContract({
                title: "Canonical Layer Notes",
                notes_key: "canonical_layer_2_notes"
            })
        }),

        withBase({
            sku_id: "SKU5.03",
            sequence: 3,
            range_group: RANGE_GROUPS.CANONICAL,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Hospital Dot",
            breadcrumb_label: "Canonical Position",
            pill_label: "Hospital",
            cta_label: "View Hospital",

            lhs_contract: "canonical_axes_center",
            rhs_contract: "narrative_3",
            notes: "Canonical Layer 3",

            viewer_mode: VIEWER_MODES.CANONICAL_3D,
            layout_mode: LAYOUT_MODES.CANONICAL_FOCUS,
            accumulate_from_previous: true,

            viewer_layers: [
                "axis_u1",
                "axis_u2",
                "axis_u3",
                "region_centroid",
                "hospital_point"
            ],

            panel_1_contract: makeHeaderContract({
                title: "SKU5.03 — Hospital Dot",
                subtitle: "Place the hospital in canonical space"
            }),
            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Canonical Position",
                pill_label: "Hospital",
                cta_label: "View Hospital"
            }),
            panel_3_contract: makeViewerContract({
                title: "Hospital Position",
                data_binding_key: "canonical_axes_center",
                viewer_mode: VIEWER_MODES.CANONICAL_3D,
                accumulate_from_previous: true
            }),
            panel_4_contract: makeNarrativeContract({
                title: "Hospital Narrative",
                narrative_key: "narrative_3",
                data_binding_key: "narrative_3"
            }),
            panel_5_contract: makeNotesContract({
                title: "Canonical Layer Notes",
                notes_key: "canonical_layer_3_notes"
            })
        }),

        withBase({
            sku_id: "SKU5.04",
            sequence: 4,
            range_group: RANGE_GROUPS.CANONICAL,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Peer Cohort Dot",
            breadcrumb_label: "Peer Context",
            pill_label: "Peer Cohort",
            cta_label: "View Peers",

            lhs_contract: "canonical_axes_center",
            rhs_contract: "peer_context_narrative",
            notes: "Canonical Layer 4",

            viewer_mode: VIEWER_MODES.CANONICAL_PEER,
            layout_mode: LAYOUT_MODES.CANONICAL_FOCUS,
            accumulate_from_previous: true,

            viewer_layers: [
                "axis_u1",
                "axis_u2",
                "axis_u3",
                "region_centroid",
                "hospital_point",
                "peer_cohort_point"
            ],

            panel_1_contract: makeHeaderContract({
                title: "SKU5.04 — Peer Cohort Dot",
                subtitle: "Overlay peer cohort reference position"
            }),
            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Peer Context",
                pill_label: "Peer Cohort",
                cta_label: "View Peers"
            }),
            panel_3_contract: makeViewerContract({
                title: "Peer Cohort Position",
                data_binding_key: "canonical_axes_center",
                viewer_mode: VIEWER_MODES.CANONICAL_PEER,
                accumulate_from_previous: true
            }),
            panel_4_contract: makeNarrativeContract({
                title: "Peer Context Narrative",
                narrative_key: "peer_context_narrative",
                data_binding_key: "peer_context_narrative"
            }),
            panel_5_contract: makeNotesContract({
                title: "Canonical Layer Notes",
                notes_key: "canonical_layer_4_notes"
            })
        }),

        withBase({
            sku_id: "SKU5.05",
            sequence: 5,
            range_group: RANGE_GROUPS.CANONICAL,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Focused Canonical View",
            breadcrumb_label: "Canonical Focus",
            pill_label: "Focus",
            cta_label: "Focus View",

            previous_sku_id: "sku5.01",
            next_sku_id: "SKU5.51",
            status_label: "Canonical Cloud",
            next_status_label: "Next",
            next_cta_label: "View Peer Benchmarks with deltas",

            lhs_contract: "canonical_axes_center",
            rhs_contract: "focused_view_narrative",
            notes: "Canonical Layer 5 - cloud disappears and focus tightens",

            viewer_mode: VIEWER_MODES.CANONICAL_PEER,
            layout_mode: LAYOUT_MODES.CANONICAL_FOCUS,
            legend_mode: LEGEND_MODES.MINIMAL,
            accumulate_from_previous: false,

            viewer_layers: [
                "axis_u1",
                "axis_u2",
                "axis_u3",
                "region_centroid",
                "hospital_point",
                "peer_cohort_point",
                "provider_peer_connector"
            ],

            panel_1_contract: makeHeaderContract({
                title: "SKU5.05 — Focused Canonical View",
                subtitle: "Suppress cloud and tighten hospital-peer comparison"
            }),
            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Canonical Focus",
                pill_label: "Focus",
                cta_label: "Focus View"
            }),
            panel_3_contract: makeViewerContract({
                title: "Focused Canonical View",
                data_binding_key: "canonical_axes_center",
                viewer_mode: VIEWER_MODES.CANONICAL_PEER,
                legend_mode: LEGEND_MODES.MINIMAL
            }),
            panel_4_contract: makeNarrativeContract({
                title: "Focused View Narrative",
                narrative_key: "focused_view_narrative",
                data_binding_key: "focused_view_narrative"
            }),
            panel_5_contract: makeNotesContract({
                title: "Canonical Layer Notes",
                notes_key: "canonical_layer_5_notes"
            })
        }), */

        // ============================================================
        // DESCRIPTIVE RANGE
        // ============================================================

        withBase({
            sku_id: "SKU5.50",
            sequence: 50,
            range_group: RANGE_GROUPS.DESCRIPTIVE,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Region Benchmark",
            breadcrumb_label: "Descriptive Intelligence",
            pill_label: "Region Benchmark",
            cta_label: "View Region",

            previous_sku_id: "SKU5.01",
            next_sku_id: "SKU5.51",
            status_label: "Region Benchmark",
            next_status_label: "View Peer Benchmark with Deltas",
            next_cta_label: "Next",

            lhs_contract: "graphs1",
            rhs_contract: "data1",
            notes: "Region benchmark",

            graph_visible: true,
            graph_type: GRAPH_TYPES.DELTA_BAR,
            layout_mode: LAYOUT_MODES.DATA_GRAPH_SPLIT,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.50 — Region Benchmark",
                subtitle: "Hospital compared with region-wide benchmark"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Descriptive Intelligence",
                pill_label: "Region Benchmark",
                cta_label: "View Region"
            }),

            panel_3_contract: makeGraphContract({
                title: "Region Benchmark Graph",
                data_binding_key: "provider_vs_region_benchmark",
                graph_type: GRAPH_TYPES.DELTA_BAR
            }),

            panel_4_contract: makeDataTableContract({
                title: "Region Benchmark Data",
                data_binding_key: "provider_vs_region_benchmark"
            }),

            panel_5_contract: makeNotesContract({
                title: "Benchmark Notes",
                notes_key: "region_benchmark_notes"
            })
        }),


        withBase({
            sku_id: "SKU5.51",
            sequence: 51,
            range_group: RANGE_GROUPS.DESCRIPTIVE,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Peer Benchmark",
            breadcrumb_label: "Descriptive Intelligence",
            pill_label: "Peer Benchmark",
            cta_label: "View Peer",

            previous_sku_id: "SKU5.50",
            next_sku_id: "SKU5.52",
            status_label: "Peer Benchmark",
            next_status_label: "View Canonical Trajectory",
            next_cta_label: "Next",

            lhs_contract: "graphs2",
            rhs_contract: "data2",
            notes: "Peer benchmark",

            graph_visible: true,
            graph_type: GRAPH_TYPES.DELTA_BAR,
            layout_mode: LAYOUT_MODES.DATA_GRAPH_SPLIT,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.51 — Peer Benchmark",
                subtitle: "Hospital compared with peer cohort benchmark"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Descriptive Intelligence",
                pill_label: "Peer Benchmark",
                cta_label: "View Peer"
            }),

            panel_3_contract: makeGraphContract({
                title: "Peer Benchmark Graph",
                data_binding_key: "provider_vs_peer_benchmark",
                graph_type: GRAPH_TYPES.DELTA_BAR
            }),

            panel_4_contract: makeDataTableContract({
                title: "Peer Benchmark Data",
                data_binding_key: "provider_vs_peer_benchmark"
            }),

            panel_5_contract: makeNotesContract({
                title: "Benchmark Notes",
                notes_key: "peer_benchmark_notes"
            })
        }),

        withBase({
            sku_id: "SKU5.52",
            sequence: 52,
            range_group: RANGE_GROUPS.DESCRIPTIVE,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Canonical Trajectory",
            breadcrumb_label: "Descriptive Intelligence",
            pill_label: "Trajectory",
            cta_label: "View Trajectory",

            previous_sku_id: "SKU5.51",
            next_sku_id: "SKU5.53",
            status_label: "Canonical Trajectory",
            next_status_label: "View Top Comparable Providers",
            next_cta_label: "Next",

            lhs_contract: "canonical_trajectory",
            rhs_contract: "trajectory_metrics",
            notes: "Trajectory",

            viewer_mode: VIEWER_MODES.CANONICAL_TRAJECTORY,
            layout_mode: LAYOUT_MODES.VIEWER_DATA_SPLIT,
            graph_visible: false,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.52 — Canonical Trajectory",
                subtitle: "Longitudinal movement across canonical space"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Descriptive Intelligence",
                pill_label: "Trajectory",
                cta_label: "View Trajectory"
            }),

            panel_3_contract: makeViewerContract({
                title: "Canonical Trajectory Viewer",
                data_binding_key: "canonical_trajectory",
                viewer_mode: VIEWER_MODES.CANONICAL_TRAJECTORY,
                props: {
                    panel_role: "viewer_only",
                    legend_items: [
                        { color: "#00c853", label: "Progress vs Peer" },
                        { color: "#ff3b30", label: "Regression vs Peer" },
                        { color: "#ffcc00", label: "No Change / Flat" },
                        { color: "#9aa6b2", label: "No Trend / Insufficient Signal" }
                    ]
                }
            }),

            panel_4_contract: makeDataTableContract({
                title: "Trajectory Data",
                data_binding_key: "trajectory_metrics"
            }),

            panel_5_contract: makeNotesContract({
                title: "Trajectory Notes",
                notes_key: "trajectory_notes"
            })
        }),


        withBase({
            sku_id: "SKU5.53",
            sequence: 53,
            range_group: RANGE_GROUPS.DESCRIPTIVE,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Top Comparable Providers",
            breadcrumb_label: "Descriptive Intelligence",
            pill_label: "Comparable Providers",
            cta_label: "View Comparable Providers",

            previous_sku_id: "SKU5.52",
            next_sku_id: "SKU5.54",
            status_label: "Top Comparable Providers",
            next_status_label: "Cohort & Percentile",
            next_cta_label: "Next",

            lhs_contract: "top_comparable_providers",
            rhs_contract: "top_comparable_providers_table",
            notes: "Comparable Providers",

            viewer_mode: VIEWER_MODES.COMPARABLE_PROVIDERS,
            layout_mode: LAYOUT_MODES.VIEWER_DATA_SPLIT,
            graph_visible: false,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.53 — Top Comparable Providers",
                subtitle: "Closest comparable providers around the selected hospital"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Descriptive Intelligence",
                pill_label: "Comparable Providers",
                cta_label: "View Comparable Providers"
            }),

            panel_3_contract: makeGraphContract({
                title: "Comparable Providers Viewer",
                data_binding_key: "top_comparable_providers",
                viewer_mode: VIEWER_MODES.COMPARABLE_PROVIDERS,
                props: {
                    panel_role: "viewer_only",
                    legend_items: [
                        { color: "#ff4d4f", label: "Selected Hospital" },
                        { color: "#ffd54f", label: "Comparable Providers" },
                        { color: "rgba(120,140,170,0.18)", label: "Hospital Cloud" }
                    ]
                }
            }),

            panel_4_contract: makeDataTableContract({
                title: "Comparable Providers Table",
                data_binding_key: "top_comparable_providers_table"
            }),

            panel_5_contract: makeNotesContract({
                title: "Comparable Provider Notes",
                notes_key: "top_comparable_providers_notes"
            })
        }),

        withBase({
            sku_id: "SKU5.54",
            sequence: 54,
            range_group: RANGE_GROUPS.DESCRIPTIVE,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Cohort Median and Percentile Metrics",
            breadcrumb_label: "Descriptive Intelligence",
            pill_label: "Benchmark Metrics",
            cta_label: "View Benchmark Metrics",

            previous_sku_id: "SKU5.53",
            next_sku_id: "SKU5.55",
            status_label: "Cohort Median and Percentile Metrics",
            next_status_label: "CPT Overperformance",
            next_cta_label: "Next",

            lhs_contract: "cohort_percentile_metrics",
            rhs_contract: "cohort_percentile_metrics_rhs",
            notes: "Benchmark Metrics",

            viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
            layout_mode: LAYOUT_MODES.VIEWER_DATA_SPLIT,
            graph_visible: true,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.54 — Cohort Median and Percentile Metrics",
                subtitle: "Compare reimbursement, utilization, service breadth, and care mix against peer hospitals and regional benchmarks"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Descriptive Intelligence",
                pill_label: "Benchmark Metrics",
                cta_label: "View Benchmark Metrics"
            }),

            panel_3_contract: makeGraphContract({
                title: "Benchmark Metrics Viewer",
                data_binding_key: "cohort_percentile_metrics",
                viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
                props: {
                    panel_role: "viewer_only",
                    legend_items: [
                        { color: "#ff4d4f", label: "Provider" },
                        { color: "#ffd54f", label: "Peer Median" },
                        { color: "#7ea6ff", label: "Region Median" }
                    ]
                }
            }),

            panel_4_contract: makeDataTableContract({
                title: "Benchmark Metrics Table",
                data_binding_key: "cohort_percentile_metrics_rhs"
            }),

            panel_5_contract: makeNotesContract({
                title: "Benchmark Metric Notes",
                notes_key: "cohort_percentile_metrics_notes"
            })
        }),
        // ------------------------------------------------------------
        // SKU5.55
        // Overperforming CPT Areas
        // Descriptive CPT performance SKU highlighting areas where
        // provider-level CPT economics outperform benchmark patterns.
        // ------------------------------------------------------------
        withBase({
            sku_id: "SKU5.55",
            sequence: 55,
            range_group: RANGE_GROUPS.DESCRIPTIVE,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Overperforming CPT Areas",
            breadcrumb_label: "Descriptive Intelligence",
            pill_label: "CPT Strengths",
            cta_label: "View CPT Strengths",

            previous_sku_id: "SKU5.54",
            next_sku_id: "SKU5.56",
            status_label: "Overperforming CPT Areas",
            next_status_label: "View Next SKU",
            next_cta_label: "Next",

            lhs_contract: "overperforming_cpt_areas",
            rhs_contract: "overperforming_cpt_areas_rhs",
            notes: "Overperforming CPT Notes",

            viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
            layout_mode: LAYOUT_MODES.VIEWER_DATA_SPLIT,
            graph_visible: true,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.55 — Overperforming CPT Areas",
                subtitle: "Identify CPTs where the provider is outperforming peer and benchmark patterns across reimbursement and economic strength"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Descriptive Intelligence",
                pill_label: "CPT Strengths",
                cta_label: "View CPT Strengths"
            }),

            panel_3_contract: makeGraphContract({
                title: "Overperforming CPT Viewer",
                data_binding_key: "overperforming_cpt_areas",
                viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
                props: {
                    panel_role: "viewer_only",
                    legend_items: [
                        { color: "#ff4d4f", label: "Provider Advantage" },
                        { color: "#ffd54f", label: "Benchmark" },
                        { color: "#7ea6ff", label: "Top CPT Areas" }
                    ]
                }
            }),

            panel_4_contract: makeDataTableContract({
                title: "Overperforming CPT Table",
                data_binding_key: "overperforming_cpt_areas_rhs"
            }),

            panel_5_contract: makeNotesContract({
                title: "Overperforming CPT Notes",
                notes_key: "overperforming_cpt_notes"
            })
        }),



        withBase({
            sku_id: "SKU5.56",
            sequence: 56,
            range_group: RANGE_GROUPS.DESCRIPTIVE,
            intelligence_class: INTELLIGENCE_CLASS.DESCRIPTIVE,

            title: "Underperforming CPT Areas",
            breadcrumb_label: "Descriptive Intelligence",
            pill_label: "CPT Weaknesses",
            cta_label: "View CPT Weaknesses",

            previous_sku_id: "SKU5.55",
            next_sku_id: "SKU5.58",
            status_label: "Underperforming CPT Areas",
            next_status_label: "Monetizable CPT's",
            next_cta_label: "Next",

            lhs_contract: "underperforming_cpt_areas",
            rhs_contract: "underperforming_cpt_areas_rhs",
            notes: "Underperforming CPT Notes",

            viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
            layout_mode: LAYOUT_MODES.VIEWER_DATA_SPLIT,
            graph_visible: true,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.56 — Underperforming CPT Areas",
                subtitle: "Identify CPTs where the provider is underperforming regional benchmark patterns across reimbursement and economic strength"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Descriptive Intelligence",
                pill_label: "CPT Weaknesses",
                cta_label: "View CPT Weaknesses"
            }),

            panel_3_contract: makeGraphContract({
                title: "Underperforming CPT Viewer",
                data_binding_key: "underperforming_cpt_areas",
                viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
                props: {
                    panel_role: "viewer_only",
                    legend_items: [
                        { color: "#ff4d4f", label: "Provider Weakness" },
                        { color: "#ffd54f", label: "Benchmark" },
                        { color: "#7ea6ff", label: "Underperforming CPT Areas" }
                    ]
                }
            }),

            panel_4_contract: makeDataTableContract({
                title: "Underperforming CPT Table",
                data_binding_key: "underperforming_cpt_areas_rhs"
            }),

            panel_5_contract: makeNotesContract({
                title: "Underperforming CPT Notes",
                notes_key: "underperforming_cpt_notes"
            })
        }),

        withBase({
            sku_id: "SKU5.58",
            sequence: 58,
            range_group: RANGE_GROUPS.PRESCRIPTIVE,
            intelligence_class: INTELLIGENCE_CLASS.PRESCRIPTIVE,

            title: "Monetizable CPT Areas",
            breadcrumb_label: "Prescriptive Intelligence",
            pill_label: "CPT Growth",
            cta_label: "View Monetizable CPTs",

            previous_sku_id: "SKU5.56",
            next_sku_id: "SKU5.60",
            status_label: "Monetizable CPT Areas",
            next_status_label: "CPT Risk",
            next_cta_label: "Next",

            lhs_contract: "monetizable_cpt_areas",
            rhs_contract: "monetizable_cpt_areas_rhs",
            notes: "Monetizable CPT Notes",

            viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
            layout_mode: LAYOUT_MODES.VIEWER_DATA_SPLIT,
            graph_visible: true,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.58 — Monetizable CPT Areas",
                subtitle: "Identify CPTs with positive reimbursement spread and scalable growth potential across provider operations"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Prescriptive Intelligence",
                pill_label: "CPT Growth",
                cta_label: "View Monetizable CPTs"
            }),

            panel_3_contract: makeGraphContract({
                title: "Monetizable CPT Viewer",
                data_binding_key: "monetizable_cpt_areas",
                viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
                props: {
                    panel_role: "viewer_only",
                    legend_items: [
                        { color: "#34c759", label: "Growth Opportunity" },
                        { color: "#ffd54f", label: "Benchmark" },
                        { color: "#7ea6ff", label: "Monetizable CPT Areas" }
                    ]
                }
            }),

            panel_4_contract: makeDataTableContract({
                title: "Monetizable CPT Table",
                data_binding_key: "monetizable_cpt_areas_rhs"
            }),

            panel_5_contract: makeNotesContract({
                title: "Monetizable CPT Notes",
                notes_key: "monetizable_cpt_notes"
            })
        }),


        withBase({
            sku_id: "SKU5.60",
            sequence: 60,
            range_group: RANGE_GROUPS.PREDICTIVE,
            intelligence_class: INTELLIGENCE_CLASS.PREDICTIVE,

            title: "CPT Portfolio Risk",
            breadcrumb_label: "Predictive Intelligence",
            pill_label: "CPT Risk",
            cta_label: "View CPT Risk",

            previous_sku_id: "SKU5.58",
            next_sku_id: "SKU5.62",
            status_label: "CPT Portfolio Risk",
            next_status_label: "ICU Efficiency",
            next_cta_label: "Next",

            lhs_contract: "cpt_portfolio_risk",
            rhs_contract: "cpt_portfolio_risk_rhs",
            notes: "CPT Portfolio Risk Notes",

            viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
            layout_mode: LAYOUT_MODES.VIEWER_DATA_SPLIT,
            graph_visible: true,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.60 — CPT Portfolio Risk",
                subtitle: "Identify CPT exposure where concentration and reimbursement fragility combine into portfolio risk"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Predictive Intelligence",
                pill_label: "CPT Risk",
                cta_label: "View CPT Risk"
            }),

            panel_3_contract: makeGraphContract({
                title: "CPT Risk Viewer",
                data_binding_key: "cpt_portfolio_risk",
                viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
                props: {
                    panel_role: "viewer_only",
                    legend_items: [
                        { color: "#ff8a65", label: "Risk Exposure" },
                        { color: "#ffd54f", label: "Benchmark Sensitivity" },
                        { color: "#7ea6ff", label: "CPT Portfolio Risk" }
                    ]
                }
            }),

            panel_4_contract: makeDataTableContract({
                title: "CPT Risk Table",
                data_binding_key: "cpt_portfolio_risk_rhs"
            }),

            panel_5_contract: makeNotesContract({
                title: "CPT Portfolio Risk Notes",
                notes_key: "cpt_portfolio_risk_notes"
            })
        }),


        withBase({
            sku_id: "SKU5.62",
            sequence: 62,
            range_group: RANGE_GROUPS.PREDICTIVE,
            intelligence_class: INTELLIGENCE_CLASS.PREDICTIVE,

            title: "ICU Utilization Efficiency",
            breadcrumb_label: "Predictive Intelligence",
            pill_label: "ICU Efficiency",
            cta_label: "View ICU Efficiency",

            previous_sku_id: "SKU5.60",
            next_sku_id: "SKU5.64",
            status_label: "ICU Utilization Efficiency",
            next_status_label: "Coding Integrity Risk",
            next_cta_label: "Next",

            lhs_contract: "icu_utilization_efficiency",
            rhs_contract: "icu_utilization_efficiency_rhs",
            notes: "ICU Utilization Efficiency Notes",

            viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
            layout_mode: LAYOUT_MODES.VIEWER_DATA_SPLIT,
            graph_visible: true,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.62 — ICU Utilization Efficiency",
                subtitle: "Evaluate ICU/CCU utilization intensity and reimbursement efficiency relative to regional benchmark behavior"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Predictive Intelligence",
                pill_label: "ICU Efficiency",
                cta_label: "View ICU Efficiency"
            }),

            panel_3_contract: makeGraphContract({
                title: "ICU Utilization Viewer",
                data_binding_key: "icu_utilization_efficiency",
                viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
                props: {
                    panel_role: "viewer_only",
                    legend_items: [
                        { color: "#34c759", label: "Provider" },
                        { color: "#ffd54f", label: "Region Benchmark" },
                        { color: "#7ea6ff", label: "Efficiency Comparison" }
                    ]
                }
            }),

            panel_4_contract: makeDataTableContract({
                title: "ICU Utilization Table",
                data_binding_key: "icu_utilization_efficiency_rhs"
            }),

            panel_5_contract: makeNotesContract({
                title: "ICU Utilization Notes",
                notes_key: "icu_utilization_efficiency_notes"
            })
        }),


        withBase({
            sku_id: "SKU5.64",
            sequence: 64,
            range_group: RANGE_GROUPS.PREDICTIVE,
            intelligence_class: INTELLIGENCE_CLASS.PREDICTIVE,

            title: "Coding Integrity Risk",
            breadcrumb_label: "Predictive Intelligence",
            pill_label: "Coding Risk",
            cta_label: "View Coding Risk",

            previous_sku_id: "SKU5.62",
            next_sku_id: null,   // update later if you add SKU5.66
            status_label: "Coding Integrity Risk",
            next_status_label: "",
            next_cta_label: "Next",

            lhs_contract: "coding_integrity_risk",
            rhs_contract: "coding_integrity_risk_rhs",
            notes: "Coding Integrity Risk Notes",

            viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
            layout_mode: LAYOUT_MODES.VIEWER_DATA_SPLIT,
            graph_visible: true,

            panel_1_contract: makeHeaderContract({
                title: "SKU5.64 — Coding Integrity Risk",
                subtitle: "Identify CPTs where reimbursement gaps and claim volume indicate potential undercoding, documentation gaps, or coding leakage"
            }),

            panel_2_contract: makeJourneyContract({
                breadcrumb_label: "Predictive Intelligence",
                pill_label: "Coding Risk",
                cta_label: "View Coding Risk"
            }),

            panel_3_contract: makeGraphContract({
                title: "Coding Risk Viewer",
                data_binding_key: "coding_integrity_risk",
                viewer_mode: VIEWER_MODES.FINANCIAL_INTELLIGENCE,
                props: {
                    panel_role: "viewer_only",
                    legend_items: [
                        { color: "#ff6b6b", label: "High Risk" },
                        { color: "#ffd54f", label: "Moderate Risk" },
                        { color: "#34c759", label: "Low Risk" }
                    ]
                }
            }),

            panel_4_contract: makeDataTableContract({
                title: "Coding Risk Table",
                data_binding_key: "coding_integrity_risk_rhs"
            }),

            panel_5_contract: makeNotesContract({
                title: "Coding Risk Notes",
                notes_key: "coding_integrity_risk_notes"
            })
        }),



    ];









    // ------------------------------------------------------------
    // Registry maps and helpers
    // ------------------------------------------------------------

    const byId = Object.freeze(
        entries.reduce((acc, entry) => {
            acc[entry.sku_id] = entry;
            return acc;
        }, {})
    );

    const orderedEntries = Object.freeze(
        [...entries].sort((a, b) => a.sequence - b.sequence)
    );

    function getSkuEntry(skuId) {
        return byId[skuId] || null;
    }

    function getAllSkuEntries() {
        return orderedEntries.slice();
    }

    function getEntriesByRange(rangeGroup) {
        return orderedEntries.filter(entry => entry.range_group === rangeGroup);
    }

    function getNextSkuId(currentSkuId) {
        const idx = orderedEntries.findIndex(entry => entry.sku_id === currentSkuId);
        if (idx < 0 || idx >= orderedEntries.length - 1) return null;
        return orderedEntries[idx + 1].sku_id;
    }

    function getPreviousSkuId(currentSkuId) {
        const idx = orderedEntries.findIndex(entry => entry.sku_id === currentSkuId);
        if (idx <= 0) return null;
        return orderedEntries[idx - 1].sku_id;
    }

    function getDefaultSkuId() {
        return "SKU5.01";
    }

    function getFirstSkuIdByRange(rangeGroup) {
        const match = orderedEntries.find(entry => entry.range_group === rangeGroup);
        return match ? match.sku_id : null;
    }

    // ------------------------------------------------------------
    // Export
    // ------------------------------------------------------------

    const registryApi = Object.freeze({
        RANGE_GROUPS,
        INTELLIGENCE_CLASS,
        PANEL_TYPES,
        LAYOUT_MODES,
        VIEWER_MODES,
        GRAPH_TYPES,
        LEGEND_MODES,

        entries: orderedEntries,
        byId,

        getSkuEntry,
        getAllSkuEntries,
        getEntriesByRange,
        getNextSkuId,
        getPreviousSkuId,
        getDefaultSkuId,
        getFirstSkuIdByRange
    });

    global.SKU5Registry = registryApi;

})(window);