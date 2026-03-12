let canonicalData = null;
let plotDiv = null;
let message = null;
let viewerInitialized = false;
let currentProviderTraceIndex = -1;

let hullTraceIndex = -1;
let anchorTraceIndex = -1;
let regionTraceIndices = [];

function showMessage(title, text) {
    if (!message) return;
    message.style.display = "flex";

    const titleEl = message.querySelector(".title");
    const textEl = message.querySelector(".text");

    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
}

function hideMessage() {
    if (!message) return;
    message.style.display = "none";
}

async function loadCanonicalOnce() {
    if (canonicalData) return canonicalData;

    const res = await fetch("providers/canonical_master_3d_contract.json", {
        cache: "force-cache"
    });

    if (!res.ok) {
        throw new Error("Canonical master contract could not be loaded");
    }

    canonicalData = await res.json();
    return canonicalData;
}

function buildCloudTrace(canonical) {
    const pts = canonical.cloud_sample?.points || [];

    return {
        x: pts.map(p => p[0]),
        y: pts.map(p => p[1]),
        z: pts.map(p => p[2]),
        mode: "markers",
        type: "scatter3d",
        hoverinfo: "skip",
        marker: {
            size: 1.2,
            color: "deepskyblue",
            opacity: 0.10
        },
        name: "Canonical Cloud",
        showlegend: false
    };
}

function buildHullTrace(canonical) {
    const verts = canonical.hull?.vertices || [];
    const simplices = canonical.hull?.simplices || [];

    return {
        x: verts.map(p => p[0]),
        y: verts.map(p => p[1]),
        z: verts.map(p => p[2]),
        i: simplices.map(t => t[0]),
        j: simplices.map(t => t[1]),
        k: simplices.map(t => t[2]),
        type: "mesh3d",
        hoverinfo: "skip",
        opacity: 0.08,
        color: "lightgray",
        name: "Canonical Hull",
        showlegend: false
    };
}

function buildAnchorTrace(canonical) {
    const anchors = canonical.anchors || [];

    return {
        x: anchors.map(a => a.point[0]),
        y: anchors.map(a => a.point[1]),
        z: anchors.map(a => a.point[2]),
        mode: "markers+text",
        type: "scatter3d",
        text: anchors.map(a => a.label),
        textposition: "top center",
        textfont: {
            color: "white",
            size: 11
        },
        hoverinfo: "text",
        hovertext: anchors.map(a =>
            `${a.label}${a.semantic ? " — " + a.semantic : ""}`
        ),
        marker: {
            size: 4,
            color: "red",
            symbol: "diamond"
        },
        name: "Anchors",
        showlegend: false
    };
}

function buildAxisTraces(canonical) {
    const triad = canonical.geometry?.axis_triad;
    const labelPts = canonical.geometry?.axis_label_points;
    const origin = canonical.geometry?.origin || [0, 0, 0];
    const displayAxes = canonical.axes?.display_axes || ["A1", "A2", "A3"];

    if (!triad || !labelPts) {
        console.warn("Axis triad missing from canonical");
        return {
            axisA1: null,
            axisA2: null,
            axisA3: null,
            axisLabels: null,
            axisOrigin: null
        };
    }

    const commonLine = {
        mode: "lines+markers",
        type: "scatter3d",
        hoverinfo: "skip",
        showlegend: false,
        marker: {
            size: 3,
            color: "white",
            opacity: 1
        },
        line: {
            color: "white",
            width: 1
        },
        opacity: 1
    };

    const axisA1 = {
        ...commonLine,
        x: [triad.A1.start[0], origin[0], triad.A1.end[0]],
        y: [triad.A1.start[1], origin[1], triad.A1.end[1]],
        z: [triad.A1.start[2], origin[2], triad.A1.end[2]],
        name: "Axis A1"
    };

    const axisA2 = {
        ...commonLine,
        x: [triad.A2.start[0], origin[0], triad.A2.end[0]],
        y: [triad.A2.start[1], origin[1], triad.A2.end[1]],
        z: [triad.A2.start[2], origin[2], triad.A2.end[2]],
        name: "Axis A2"
    };

    const axisA3 = {
        ...commonLine,
        x: [triad.A3.start[0], origin[0], triad.A3.end[0]],
        y: [triad.A3.start[1], origin[1], triad.A3.end[1]],
        z: [triad.A3.start[2], origin[2], triad.A3.end[2]],
        name: "Axis A3"
    };

    const axisLabels = {
        x: [labelPts.A1[0], labelPts.A2[0], labelPts.A3[0]],
        y: [labelPts.A1[1], labelPts.A2[1], labelPts.A3[1]],
        z: [labelPts.A1[2], labelPts.A2[2], labelPts.A3[2]],
        mode: "text",
        type: "scatter3d",
        text: displayAxes,
        textposition: "top center",
        textfont: {
            color: "white",
            size: 10
        },
        hoverinfo: "skip",
        showlegend: false,
        name: "Axis Labels"
    };

    const axisOrigin = {
        x: [origin[0]],
        y: [origin[1]],
        z: [origin[2]],
        mode: "markers",
        type: "scatter3d",
        hoverinfo: "skip",
        marker: {
            size: 6,
            color: "white",
            opacity: 1
        },
        showlegend: false,
        name: "Axis Origin"
    };

    return { axisA1, axisA2, axisA3, axisLabels, axisOrigin };
}

function buildProviderTrace() {
    return {
        x: [],
        y: [],
        z: [],
        mode: "markers",
        type: "scatter3d",
        hovertext: [],
        hoverinfo: "text",
        marker: {
            size: 5,
            color: "#00ff73",
            opacity: 1,
            line: {
                color: "white",
                width: 2
            }
        },
        name: "Selected Provider",
        showlegend: false
    };
}

function buildCubeWireframeTrace(minCorner, maxCorner, color = "white", width = 1, name = "Region Cube") {
    const [x0, y0, z0] = minCorner;
    const [x1, y1, z1] = maxCorner;

    const vertices = [
        [x0, y0, z0], // 0
        [x1, y0, z0], // 1
        [x1, y1, z0], // 2
        [x0, y1, z0], // 3
        [x0, y0, z1], // 4
        [x1, y0, z1], // 5
        [x1, y1, z1], // 6
        [x0, y1, z1]  // 7
    ];

    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // bottom
        [4, 5], [5, 6], [6, 7], [7, 4], // top
        [0, 4], [1, 5], [2, 6], [3, 7]  // verticals
    ];

    const x = [];
    const y = [];
    const z = [];

    edges.forEach(([a, b]) => {
        x.push(vertices[a][0], vertices[b][0], null);
        y.push(vertices[a][1], vertices[b][1], null);
        z.push(vertices[a][2], vertices[b][2], null);
    });

    return {
        x,
        y,
        z,
        mode: "lines",
        type: "scatter3d",
        hoverinfo: "skip",
        line: {
            color: color,
            width: width
        },
        opacity: 1,
        name: name,
        showlegend: false,
        visible: false
    };
}

function buildRegionLatticeTraces(canonical, highlightedRegionId = null) {
    const regions = canonical.canonical_regions_3x3x3?.regions || [];
    const traces = [];

    regions.forEach((region) => {
        if (!region.min_corner || !region.max_corner) return;

        const isHighlighted = highlightedRegionId && region.region_id === highlightedRegionId;

        traces.push(
            buildCubeWireframeTrace(
                region.min_corner,
                region.max_corner,
                isHighlighted ? "red" : "white",
                isHighlighted ? 4 : 1,
                `Region ${region.region_id}`
            )
        );
    });

    return traces;
}


function buildLayout(canonical) {
    const cameraDefaults = canonical.geometry?.camera_defaults || {
        eye: { x: 1.7, y: 1.7, z: 1.3 },
        center: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 0, z: 1 }
    };

    return {
        paper_bgcolor: "black",
        plot_bgcolor: "black",
        font: { color: "white" },
        autosize: true,
        showlegend: false,
        scene: {
            bgcolor: "black",
            camera: cameraDefaults,
            xaxis: {
                title: "",
                showgrid: false,
                showticklabels: false,
                zeroline: false,
                showline: false,
                showspikes: false,
                color: "white"
            },
            yaxis: {
                title: "",
                showgrid: false,
                showticklabels: false,
                zeroline: false,
                showline: false,
                showspikes: false,
                color: "white"
            },
            zaxis: {
                title: "",
                showgrid: false,
                showticklabels: false,
                zeroline: false,
                showline: false,
                showspikes: false,
                color: "white"
            },
            aspectmode: "data"
        },
        margin: { l: 0, r: 0, t: 0, b: 0 }
    };
}

async function buildBaseViewer() {
    const canonical = await loadCanonicalOnce();

    const cloudTrace = buildCloudTrace(canonical);
    const hullTrace = buildHullTrace(canonical);
    const anchorTrace = buildAnchorTrace(canonical);
    const { axisA1, axisA2, axisA3, axisLabels, axisOrigin } = buildAxisTraces(canonical);
    const providerTrace = buildProviderTrace();
    const regionLatticeTraces = buildRegionLatticeTraces(canonical, null);
    const layout = buildLayout(canonical);

    const traces = [
        hullTrace,
        cloudTrace,
        anchorTrace,
        axisA1,
        axisA2,
        axisA3,
        axisLabels,
        axisOrigin,
        providerTrace,
        ...regionLatticeTraces
    ].filter(Boolean);

    currentProviderTraceIndex = traces.findIndex(t => t === providerTrace);
    hullTraceIndex = traces.findIndex(t => t === hullTrace);
    anchorTraceIndex = traces.findIndex(t => t === anchorTrace);
    regionTraceIndices = traces
        .map((t, idx) => (t.name && t.name.startsWith("Region ")) ? idx : -1)
        .filter(idx => idx >= 0);

    await Plotly.newPlot(
        plotDiv,
        traces,
        layout,
        {
            displayModeBar: false,
            responsive: true
        }
    );

    viewerInitialized = true;
    window.parent.postMessage({ type: "viewer_ready" }, "*");
    hideMessage();
}

async function loadProvider(npi) {
    if (!npi) {
        showMessage("Viewer waiting", "No provider NPI was supplied.");
        return;
    }

    if (!viewerInitialized) {
        await buildBaseViewer();
    }

    if (currentProviderTraceIndex >= 0) {
        await Plotly.restyle(plotDiv, {
            x: [[]],
            y: [[]],
            z: [[]],
            hovertext: [[]]
        }, [currentProviderTraceIndex]);
    }

    console.log("viewer loading provider", npi);

    const providerRes = await fetch(
        `providers/provider_position_${npi}_3D.json`,
        { cache: "no-store" }
    );


    if (!providerRes.ok) {
        throw new Error(`Provider JSON not found for NPI ${npi}`);
    }

    const provider = await providerRes.json();
    console.log("viewer provider json loaded", provider);
    const update = {
        x: [[provider.position_3D.C1]],
        y: [[provider.position_3D.C2]],
        z: [[provider.position_3D.C3]],
        hovertext: [[`NPI ${npi}`]]
    };

    if (currentProviderTraceIndex < 0) {
        throw new Error("Provider trace index could not be resolved");
    }

    await Plotly.restyle(plotDiv, update, [currentProviderTraceIndex]);
    hideMessage();
}

function setCameraPreset(presetKey) {

    if (!canonicalData || !plotDiv) return;

    const presets = canonicalData.geometry?.camera_presets || {};
    const preset = presets[presetKey];

    if (!preset) {
        console.warn("Unknown camera preset:", presetKey);
        return;
    }

    Plotly.relayout(plotDiv, {
        "scene.camera": {
            eye: preset.eye,
            center: preset.center,
            up: preset.up
        }
    });

}

function setDefaultCanonicalView() {
    if (!plotDiv) return;

    if (hullTraceIndex >= 0) {
        Plotly.restyle(plotDiv, { visible: true, opacity: 0.08 }, [hullTraceIndex]);
    }

    if (anchorTraceIndex >= 0) {
        Plotly.restyle(plotDiv, { visible: true }, [anchorTraceIndex]);
    }

    if (regionTraceIndices.length > 0) {
        Plotly.restyle(plotDiv, { visible: false }, regionTraceIndices);
    }
}

function setRegionLatticeView(regionId) {
    if (!plotDiv) return;

    if (hullTraceIndex >= 0) {
        Plotly.restyle(plotDiv, { visible: true, opacity: 0.015 }, [hullTraceIndex]);
    }

    if (anchorTraceIndex >= 0) {
        Plotly.restyle(plotDiv, { visible: false }, [anchorTraceIndex]);
    }

    if (regionTraceIndices.length > 0) {
        Plotly.restyle(plotDiv, { visible: true }, regionTraceIndices);

        regionTraceIndices.forEach((idx) => {
            const trace = plotDiv.data[idx];
            if (!trace || !trace.name) return;

            const isTarget = trace.name === `Region ${regionId}`;

            Plotly.restyle(plotDiv, {
                "line.color": isTarget ? "red" : "white",
                "line.width": isTarget ? 4 : 1
            }, [idx]);
        });
    }
}

function getInitialNpiFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("npi");
}

function installMessageListener() {
    window.addEventListener("message", async (event) => {
        const data = event.data;

        if (!data || typeof data !== "object") return;

        if (data.type === "load_provider") {
            try {
                await loadProvider(data.npi);
            } catch (err) {
                console.error(err);
                showMessage("Viewer error", "The provider visualization could not be loaded.");
            }
            return;
        }

        if (data.type === "set_camera_preset") {
            try {
                console.log("received camera preset:", data.preset);
                setCameraPreset(data.preset);
            } catch (err) {
                console.error(err);
            }
            return;
        }

        if (data.type === "show_region_lattice") {
            try {
                setRegionLatticeView(data.regionId);
            } catch (err) {
                console.error(err);
            }
            return;
        }

        if (data.type === "show_default_view") {
            try {
                setDefaultCanonicalView();
            } catch (err) {
                console.error(err);
            }
            return;
        }
    });
}

async function initCanonicalViewer() {
    plotDiv = document.getElementById("plot");
    message = document.getElementById("viewerMessage");

    if (!plotDiv) return;

    installMessageListener();

    window.addEventListener("resize", () => {
        if (plotDiv) {
            Plotly.Plots.resize(plotDiv);
        }
    });

    try {
        showMessage("Viewer loading", "Preparing canonical manifold…");
        await buildBaseViewer();

        const initialNpi = getInitialNpiFromUrl();
        if (initialNpi) {
            await loadProvider(initialNpi);
        } else {
            showMessage("Viewer waiting", "No provider NPI was supplied.");
        }
    } catch (err) {
        console.error(err);
        showMessage("Viewer error", "The provider visualization could not be loaded.");
    }
}

window.addEventListener("DOMContentLoaded", initCanonicalViewer);