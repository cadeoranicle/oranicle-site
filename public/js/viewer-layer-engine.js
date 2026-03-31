window.ViewerLayerEngine = (() => {
    let currentConfig = [];
    let currentStepIndex = 0;

    function getCurrentStep() {
        if (!currentConfig.length) return null;
        return currentConfig[currentStepIndex] || null;
    }

    function buildAccumulatedStep() {
        const traces = [];
        const legends = [];
        const seenTraces = new Set();
        const seenLegends = new Set();

        for (let i = 0; i <= currentStepIndex; i++) {
            const step = currentConfig[i];
            if (!step) continue;

            (step.traces || []).forEach(trace => {
                if (!seenTraces.has(trace)) {
                    seenTraces.add(trace);
                    traces.push(trace);
                }
            });

            (step.legends || []).forEach(legend => {
                if (!seenLegends.has(legend)) {
                    seenLegends.add(legend);
                    legends.push(legend);
                }
            });
        }

        return {
            id: currentConfig[currentStepIndex]?.id || "",
            label: currentConfig[currentStepIndex]?.label || "",
            button_label: currentConfig[currentStepIndex]?.button_label || "Next Layer",
            traces,
            legends
        };
    }


    function applyCurrentStep() {
        const accumulatedStep = buildAccumulatedStep();
        if (!accumulatedStep) return;

        console.log("Applying viewer layer step:", accumulatedStep);

        if (window.SKU3Viewer?.applyLayerVisibility) {
            window.SKU3Viewer.applyLayerVisibility(accumulatedStep);
        }

        const toggleBtn = document.getElementById("viewerLayerToggleBtn");
        if (toggleBtn) {
            toggleBtn.textContent = accumulatedStep.button_label || "Next Layer";
        }

        const layerLabel = document.getElementById("viewerLayerLabel");
        if (layerLabel) {
            layerLabel.textContent = accumulatedStep.label || "";
        }
    }

    function loadConfig(configArray) {
        currentConfig = Array.isArray(configArray) ? configArray : [];
        currentStepIndex = 0;

        console.log("ViewerLayerEngine config loaded", currentConfig);

        applyCurrentStep();
    }

    function nextStep() {
        if (!currentConfig.length) return;

        currentStepIndex++;

        if (currentStepIndex >= currentConfig.length) {
            currentStepIndex = 0;
        }

        applyCurrentStep();
    }

    function reset() {
        currentStepIndex = 0;
        applyCurrentStep();
    }

    return {
        loadConfig,
        nextStep,
        reset,
        getCurrentStep,
        getState() {
            return {
                currentIndex: currentStepIndex,
                totalLayers: currentConfig.length
            };
        }
    };
})();

console.log("viewer-layer-engine.js loaded");