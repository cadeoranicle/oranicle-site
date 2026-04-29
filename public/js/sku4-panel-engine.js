(function initSKU4PanelEngine(global) {
    "use strict";

    const DEBUG = true;

    // ------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------

    async function renderPanels({ entry, session, payload, panelContracts }) {
        assertRenderInputs({ entry, session, payload, panelContracts });

        log("renderPanels() start", {
            skuId: entry?.sku_id,
            panelContracts
        });

        const containers = resolvePanelContainers();

        await renderSinglePanel({
            panelName: "panel1",
            container: containers.panel1,
            contract: panelContracts.panel1,
            entry,
            session,
            payload
        });

        await renderSinglePanel({
            panelName: "panel2",
            container: containers.panel2,
            contract: panelContracts.panel2,
            entry,
            session,
            payload
        });

        await renderSinglePanel({
            panelName: "panel3",
            container: containers.panel3,
            contract: panelContracts.panel3,
            entry,
            session,
            payload
        });

        await renderSinglePanel({
            panelName: "panel4",
            container: containers.panel4,
            contract: panelContracts.panel4,
            entry,
            session,
            payload
        });

        await renderSinglePanel({
            panelName: "panel5",
            container: containers.panel5,
            contract: panelContracts.panel5,
            entry,
            session,
            payload
        });

        log("renderPanels() complete", { skuId: entry?.sku_id });
    }

    // ------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------

    function assertRenderInputs({ entry, session, payload, panelContracts }) {
        if (!entry) {
            throw new Error("Panel engine missing entry.");
        }

        if (!session) {
            throw new Error("Panel engine missing session.");
        }

        if (!panelContracts) {
            throw new Error("Panel engine missing panel contracts.");
        }
    }

    // ------------------------------------------------------------
    // Container resolution
    // ------------------------------------------------------------

    function resolvePanelContainers() {
        const containers = {
            panel1: document.querySelector("[data-sku4-panel='panel1']"),
            panel2: document.querySelector("[data-sku4-panel='panel2']"),
            panel3: document.querySelector("[data-sku4-panel='panel3']"),
            panel4: document.querySelector("[data-sku4-panel='panel4']"),
            panel5: document.querySelector("[data-sku4-panel='panel5']")
        };

        const missing = Object.entries(containers)
            .filter(([, el]) => !el)
            .map(([name]) => name);

        if (missing.length) {
            throw new Error(`Missing SKU4 panel containers: ${missing.join(", ")}`);
        }

        return containers;
    }

    // ------------------------------------------------------------
    // Single panel render
    // ------------------------------------------------------------

    async function renderSinglePanel({
        panelName,
        container,
        contract,
        entry,
        session,
        payload
    }) {
        clearPanel(container);
        container.innerHTML = "";
        if (!contract || contract.visible === false) {
            renderEmptyPanel(container, {
                title: `${panelName} hidden`,
                message: "No contract supplied or panel hidden."
            });

            setPanelState(session, panelName, {
                status: "hidden",
                panelType: null,
                contract: contract || null
            });

            return;
        }

        setContainerMeta(container, { panelName, contract, entry });

        log("renderSinglePanel()", {
            panelName,
            panelType: contract.panel_type,
            component: contract.component,
            dataBindingKey: contract.data_binding_key
        });

        try {
            switch (contract.panel_type) {
                case "header":
                    renderHeaderPanel(container, contract, entry, session, payload);
                    break;

                case "journey":
                    renderJourneyPanel(container, contract, entry, session, payload);
                    break;

                case "viewer":
                    await renderViewerPanel(container, contract, entry, session, payload);
                    break;

                case "narrative":
                    renderNarrativePanel(container, contract, entry, session, payload);
                    break;

                case "notes":
                    renderNotesPanel(container, contract, entry, session, payload);
                    break;

                case "data_table":
                    renderDataTablePanel(container, contract, entry, session, payload);
                    break;

                case "graph":
                    renderGraphPanel(container, contract, entry, session, payload);
                    break;

                case "empty":
                    renderEmptyPanel(container, {
                        title: contract.title || "Empty panel",
                        message: contract.empty_state_message || "No content available."
                    });
                    break;

                default:
                    renderUnsupportedPanel(container, contract);
                    break;
            }

            setPanelState(session, panelName, {
                status: "rendered",
                panelType: contract.panel_type,
                component: contract.component || null,
                contract
            });

        } catch (error) {
            renderPanelError(container, {
                title: contract.title || `${panelName} render error`,
                message: error?.message || "Unknown panel render error"
            });

            setPanelState(session, panelName, {
                status: "error",
                panelType: contract.panel_type,
                component: contract.component || null,
                contract,
                error: error?.message || "Unknown error"
            });

            console.error(`[SKU4][panel-engine][${panelName}]`, error);
        }
    }

    // ------------------------------------------------------------
    // Header panel
    // ------------------------------------------------------------

    function renderHeaderPanel(container, contract, entry) {
        const title = contract?.title || entry?.title || "";
        const subtitle = contract?.subtitle || "";

        container.innerHTML = `
        <div class="sku4-panel sku4-panel-header">
            <div class="sku4-header-shell">
                <div class="sku4-header-row">
                    <div class="sku4-header-main">
                       
                        <h1 class="sku4-header-title">${escapeHtml(title)}</h1>
                        <div class="sku4-header-subtitle">${escapeHtml(subtitle)}</div>
                    </div>

                    <div class="sku4-header-meta sku4-header-meta-inline">
                        <div class="sku4-meta-chip">
                            <span class="sku4-meta-label">Region</span>
                            <span class="sku4-meta-value">${escapeHtml(readContextValue("region"))}</span>
                        </div>

                        <div class="sku4-meta-chip">
                            <span class="sku4-meta-label">Model</span>
                            <span class="sku4-meta-value">${escapeHtml(readContextValue("model"))}</span>
                        </div>

                        <div class="sku4-meta-chip">
                            <span class="sku4-meta-label">Provider</span>
                            <span class="sku4-meta-value">${escapeHtml(readContextValue("provider"))}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    // ------------------------------------------------------------
    // Journey panel
    // ------------------------------------------------------------

    function renderJourneyPanel(container, contract, entry, session) {
        const props = contract?.props || {};

        const nextEntry = session?.nextSkuId && global.SKU4Registry
            ? global.SKU4Registry.getSkuEntry(session.nextSkuId)
            : null;

        const prevEntry = session?.previousSkuId && global.SKU4Registry
            ? global.SKU4Registry.getSkuEntry(session.previousSkuId)
            : null;

        const currentStatusLabel =
            session?.currentStatusLabel ||
            entry?.status_label ||
            props.breadcrumb_label ||
            entry?.breadcrumb_label ||
            "";

        const nextStatusLabel =
            session?.nextStatusLabel ||
            entry?.next_status_label ||
            nextEntry?.title ||
            "";

        const nextCtaLabel =
            session?.nextCtaLabel ||
            entry?.next_cta_label ||
            "Next";

        container.innerHTML = `
            <div class="sku4-panel sku4-panel-journey">
                <div class="sku4-journey-shell">
                    <div class="sku4-journey-left">
                        

                ${(() => {
                const journey = session?.journey || [];

                return `
                        <div class="sku4-journey-strip">
                            ${journey.map(item => `
                                <span 
                                    class="sku4-pill sku4-pill-${item.state}"
                                    data-sku4-sku-id="${item.sku_id}"
                                        ${item.state === "future" ? "style='pointer-events:none;'" : ""}
                                    >
                                        ${escapeHtml(item.label || item.sku_id)}
                                    </span>
                                `).join("")}
                            </div>
                    `;
            })()}
            
                    </div>

                    <div class="sku4-journey-right">
                        <button
                            type="button"
                            class="sku4-btn sku4-btn-secondary"
                            data-sku4-action="previous"
                            ${session?.previousSkuId ? "" : "disabled"}
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            class="sku4-btn sku4-btn-primary sku4-tooltip-anchor"
                            data-sku4-action="next"
                            data-sku4-role="next-button"
                            data-tooltip="${escapeHtml(nextStatusLabel)}"
                            ${session.nextSkuId ? "" : "disabled"}
                        >
                            <span data-sku4-role="cta-label">${escapeHtml(nextCtaLabel)} &#8250;</span>
                        
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ------------------------------------------------------------
    // Viewer panel LHS for  SKU4.01 SKU4.52
    // ------------------------------------------------------------

    async function renderViewerPanel(container, contract, entry, session, payload) {
        const panelShell = createContentShell({
            title: contract?.title,
            subtitle: contract?.subtitle,
            panelType: "viewer"
        });


        container.appendChild(panelShell.root);

        const contentTarget = panelShell.content;
        const data = resolveContractData(contract, payload);



        const viewerLayers = Array.isArray(entry?.viewer_layers)
            ? entry.viewer_layers
            : [];

        const shouldShow = layerKey => viewerLayers.includes(layerKey);



        // ------------------------------------------------------------
        // Start Dispatcher for SKU4.01
        // ------------------------------------------------------------



        if (entry?.sku_id === "SKU4.01") {
            log("dispatching SKU4.01 viewer", {
                skuId: entry.sku_id,
                viewerLayers,
                data
            });

            const enrichedData =
                window.SKU4LoaderIntelligence?.enrichSKU401Payload
                    ? window.SKU4LoaderIntelligence.enrichSKU401Payload(data)
                    : data;

            if (!global.SKU401Renderer || typeof global.SKU401Renderer.renderViewer !== "function") {
                renderFallbackJson(contentTarget, {
                    title: contract?.title || "Viewer",
                    data: enrichedData
                });
                return;
            }

            global.SKU401Renderer.renderViewer({
                payload: enrichedData,
                targetEl: contentTarget,
                entry,
                contract,
                viewerLayers,
                shouldShow
            });

            return;
        }

        // ------------------------------------------------------------
        // End Dispatcher for SKU4.01 
        // ------------------------------------------------------------













        // ------------------------------------------------------------
        // Start LHS  Dispatcher for SKU4.52
        // ------------------------------------------------------------


        if (
            contract?.data_binding_key === "canonical_trajectory" &&
            window.SKU452Renderer?.render
        ) {
            console.log("[SKU4][panel-engine] dispatch -> SKU4.52", {
                bindingKey: contract?.data_binding_key
            });

            window.SKU452Renderer.render({
                targetEl: contentTarget,
                payload:
                    payload?.canonical_trajectory ||
                    payload?.payload?.canonical_trajectory ||
                    {},
                contract,
                entry,
                session
            });
            return;
        }

        // ------------------------------------------------------------
        // End  LHS Dispatcher for SKU4.52
        // ------------------------------------------------------------
    }



    // ------------------------------------------------------------
    // Narrative panel
    // ------------------------------------------------------------

    function renderNarrativePanel(container, contract, entry, session, payload) {
        const panelShell = createContentShell({
            title: contract?.title,
            subtitle: contract?.subtitle,
            panelType: "narrative"
        });

        container.appendChild(panelShell.root);

        const contentTarget = panelShell.content;

        if (
            entry?.sku_id === "SKU4.01" &&
            contract?.data_binding_key === "narrative_1"
        ) {
            const canonicalPayload = payload?.canonical_axes_center || {};
            const enrichedData =
                window.SKU4LoaderIntelligence?.enrichSKU401Payload
                    ? window.SKU4LoaderIntelligence.enrichSKU401Payload(canonicalPayload)
                    : canonicalPayload;

            if (global.SKU401Renderer?.renderNarrative) {
                global.SKU401Renderer.renderNarrative({
                    payload: enrichedData,
                    targetEl: contentTarget,
                    entry,
                    contract
                });
                return;
            }

            renderFallbackJson(contentTarget, {
                title: contract?.title || "Narrative",
                data: enrichedData
            });
            return;
        }

        const data = resolveContractData(contract, payload);
        const narrativeText = resolveNarrativeText(contract, payload, data);

        const block = document.createElement("div");
        block.className = "sku4-narrative-block";
        block.innerHTML = `
            <div class="sku4-narrative-text">${escapeHtml(narrativeText)}</div>
        `;

        contentTarget.appendChild(block);
    }

    //---------------------------
    // RHS data formatter 
    //---------------------------

    function formatBenchmarkMetricLabel(metric) {
        const map = {
            "C1 Position": "Care Economic Intensity",
            "Total Paid": "Total Paid",
            "Paid per Claim": "Paid per Claim",
            "Claims per Beneficiary": "Claims per Beneficiary",
            "ICU Share": "ICU Share",
            "CCU Share": "CCU Share",
            "Unique HCPCS Count": "Unique CPT Count"
        };

        return map[metric] || metric;
    }

    function formatNumberFixed(value, decimals = 2) {
        const num = Number(value);
        if (!Number.isFinite(num)) return "";
        return num.toFixed(decimals);
    }

    function formatCurrency(value) {
        const num = Number(value);
        if (!Number.isFinite(num)) return "";
        return num.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatPercent(value) {
        const num = Number(value);
        if (!Number.isFinite(num)) return "";
        return `${(num * 100).toFixed(2)}%`;
    }

    function formatInteger(value) {
        const num = Number(value);
        if (!Number.isFinite(num)) return "";
        return `${Math.round(num)}`;
    }




    // ------------------------------------------------------------
    // Notes panel
    // ------------------------------------------------------------

    function renderNotesPanel(container, contract, entry, session, payload) {
        const panelShell = createContentShell({
            title: contract?.title || "Notes",
            subtitle: contract?.subtitle,
            panelType: "notes"
        });

        container.appendChild(panelShell.root);

        const contentTarget = panelShell.content;
        const data = resolveContractData(contract, payload);

        if (Array.isArray(data) && data.length) {
            const ul = document.createElement("ul");
            ul.className = "sku4-notes-list";

            data.forEach(item => {
                const li = document.createElement("li");
                li.textContent = typeof item === "string" ? item : JSON.stringify(item);
                ul.appendChild(li);
            });

            contentTarget.appendChild(ul);
            return;
        }

        if (typeof data === "string" && data.trim()) {
            const note = document.createElement("div");
            note.className = "sku4-note-block";
            note.textContent = data;
            contentTarget.appendChild(note);
            return;
        }

        renderEmptyPanel(contentTarget, {
            title: contract?.title || "Notes",
            message: "No notes available."
        });
    }

    // ------------------------------------------------------------
    // Data table panel renderdata panel RHS blocks sit here 
    // ------------------------------------------------------------

    function renderDataTablePanel(container, contract, entry, session, payload) {
        container.innerHTML = "";
        const panelShell = createContentShell({
            title: contract?.title,
            subtitle: contract?.subtitle,
            panelType: "data_table"
        });

        container.appendChild(panelShell.root);

        const contentTarget = panelShell.content;
        const data = resolveContractData(contract, payload);


        // ------------------------------------------------------------
        // SKU4.50 Provider vs Region Benchmark
        // Panel 4 RHS table renderer
        // ----------------------------------------------------------------------------------------4.50 RHS disptaher start

        if (
            entry?.sku_id === "SKU4.50" &&
            contract?.data_binding_key === "provider_vs_region_benchmark_rhs"
        ) {
            window.SKU450Renderer?.renderTable({
                targetEl: contentTarget,
                data,
                contract
            });
            return;
        }

        // ------------------------------------------------------------
        // SKU4.50 Provider vs Region Benchmark
        // Panel 4 RHS table renderer
        // ----------------------------------------------------------------------------------------4.50 RHS disptaher end


        //-----------------------------------------------------------------------------------------4.52 RHS Trajectory dispatcher start 
        if (contract?.data_binding_key === "trajectory_metrics") {
            console.log("[SKU4][panel-engine] dispatch RHS -> SKU4.52", {
                bindingKey: contract?.data_binding_key
            });

            if (window.SKU452Renderer?.renderRHS) {
                window.SKU452Renderer.renderRHS({
                    targetEl: contentTarget,
                    payload:
                        payload?.trajectory_metrics ||
                        payload?.payload?.trajectory_metrics ||
                        {},
                    contract,
                    entry,
                    session
                });
            } else {
                contentTarget.innerHTML =
                    "<div class='sku4-empty-state'>SKU4.52 RHS renderer not loaded.</div>";
            }

            return;
        }
        //-----------------------------------------------------------------------------------------4.52 RHS trajectory disptacher end





        // sku4.53 dispatcher RHS start //

        if (
            contract?.data_binding_key === "top_comparable_providers_table" &&
            window.SKU453Renderer?.renderRHSBlock
        ) {
            console.log("[SKU4][panel-engine] dispatch RHS -> SKU4.53", {
                bindingKey: contract?.data_binding_key
            });

            window.SKU453Renderer.renderRHSBlock({
                targetEl: contentTarget,
                payload: payload?.top_comparable_providers || {},
                contract
            });
            return;
        }
        // sku4.53 dispatcher RHS end //


        // ------------------------------------------------------------
        // SKU4.54 RHS Dispatcher (Cohort Percentile Metrics)
        // ------------------------------------------------------------
        if (
            contract?.data_binding_key === "cohort_percentile_metrics_rhs" &&
            window.SKU454Renderer?.renderRHSBlock
        ) {
            console.log("[SKU4][panel-engine] dispatch RHS -> SKU4.54", {
                bindingKey: contract?.data_binding_key,
                rowCount: Array.isArray(data?.table?.rows) ? data.table.rows.length : 0
            });

            window.SKU454Renderer.renderRHSBlock({
                targetEl: contentTarget,
                payload: data,   // ✅ IMPORTANT: pass full payload (NOT remapped)
                contract
            });

            return;
        }
        // ------------------------------------------------------------








        // ------------------------------------------------------------
        // SKU4.58 RHS renderer dispatch
        // Renders monetizable CPT growth summary/cards on right panel.
        // ------------------------------------------------------------

        if (
            contract?.data_binding_key === "monetizable_cpt_areas_rhs" &&
            window.SKU458Renderer?.renderRHSBlock
        ) {
            console.log("[SKU4][panel-engine] dispatch RHS -> SKU4.58", {
                skuId: entry?.sku_id,
                bindingKey: contract?.data_binding_key
            });

            window.SKU458Renderer.renderRHSBlock({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }

        // ------------------------------------------------------------
        // SKU4.60 RHS renderer dispatch
        // Renders CPT portfolio risk summary/table on right panel.
        // ------------------------------------------------------------

        if (
            contract?.data_binding_key === "cpt_portfolio_risk_rhs" &&
            window.SKU460Renderer?.renderRHSBlock
        ) {
            console.log("[SKU4][panel-engine] dispatch RHS -> SKU4.60", {
                skuId: entry?.sku_id,
                bindingKey: contract?.data_binding_key
            });

            window.SKU460Renderer.renderRHSBlock({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }




        // sku4.54 dispatcher RHS start //

        if (
            contract?.data_binding_key === "cohort_percentile_metrics_rhs" &&
            window.SKU454Renderer?.renderRHSBlock
        ) {
            console.log("[SKU4][panel-engine] dispatch RHS -> SKU4.54", {
                bindingKey: contract?.data_binding_key
            });

            window.SKU454Renderer.renderRHSBlock({
                targetEl: contentTarget,
                payload: {
                    ...data,
                    notes: payload?.cohort_percentile_metrics_notes || []
                },
                contract
            });

            return;
        }

        // sku4.54 dispatcher RHS end //




        // ------------------------------------------------------------
        // SKU4.55 RHS dispatch
        // Renders ranked CPT strengths and interpretation on right panel.start
        // ------------------------------------------------------------
        // ------------------------------------------------------------
        // SKU4.55 RHS renderer dispatch
        // Uses SKU4.55.js to render the RHS CPT summary/table block.
        // ------------------------------------------------------------


        if (
            contract?.data_binding_key === "overperforming_cpt_areas_rhs" &&
            window.SKU455Renderer?.renderRHSBlock
        ) {
            console.log("[SKU4][panel-engine] dispatch RHS -> SKU4.55", {
                bindingKey: contract?.data_binding_key
            });

            window.SKU455Renderer.renderRHSBlock({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }


        // ------------------------------------------------------------
        // SKU4.55 RHS dispatch
        // Renders ranked CPT strengths and interpretation on right panel.end
        // ------------------------------------------------------------



        // ------------------------------------------------------------
        // SKU4.56 RHS renderer dispatch
        // Renders CPT underperformance leakage summary/table on right panel.
        // ------------------------------------------------------------

        if (
            contract?.data_binding_key === "underperforming_cpt_areas_rhs" &&
            window.SKU456Renderer?.renderRHSBlock
        ) {
            console.log("[SKU4][panel-engine] dispatch RHS -> SKU4.56", {
                skuId: entry?.sku_id,
                bindingKey: contract?.data_binding_key
            });

            window.SKU456Renderer.renderRHSBlock({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }

        // ------------------------------------------------------------
        // start Dispatcher for SKU4.62 RHS
        // ------------------------------------------------------------

        if (
            contract?.data_binding_key === "icu_utilization_efficiency_rhs" &&
            window.SKU462Renderer?.renderRHSBlock
        ) {
            console.log("[SKU4][panel-engine] dispatch RHS -> SKU4.62", {
                bindingKey: contract?.data_binding_key
            });

            window.SKU462Renderer.renderRHSBlock({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }

        // ------------------------------------------------------------
        // end Dispatcher for SKU4.62 RHS
        // ------------------------------------------------------------

        // ------------------------------------------------------------
        // start Dispatcher for SKU4.64 RHS
        // ------------------------------------------------------------

        if (
            contract?.data_binding_key === "coding_integrity_risk_rhs" &&
            window.SKU464Renderer?.renderRHSBlock
        ) {
            console.log("[SKU4][panel-engine] dispatch RHS -> SKU4.64", {
                bindingKey: contract?.data_binding_key
            });

            window.SKU464Renderer.renderRHSBlock({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }

        // ------------------------------------------------------------
        // end Dispatcher for SKU4.64 RHS
        // ------------------------------------------------------------

        // ------------------------------------------------------------
        // Generic normalized table contract renderer
        // Supports:
        // data.table.columns + data.table.rows start
        // ------------------------------------------------------------
        if (
            data &&
            data.table &&
            Array.isArray(data.table.columns) &&
            Array.isArray(data.table.rows)
        ) {
            const columns = data.table.columns;
            const rows = data.table.rows;

            if (!rows.length) {
                renderEmptyPanel(contentTarget, {
                    title: contract?.title || "Data Table",
                    message: "No rows available."
                });
                return;
            }

            const table = document.createElement("table");
            table.className = "sku4-table";

            const thead = document.createElement("thead");
            const headRow = document.createElement("tr");

            columns.forEach(col => {
                const th = document.createElement("th");
                th.textContent = col?.label || col?.key || "";
                headRow.appendChild(th);
            });

            thead.appendChild(headRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");

            rows.forEach(row => {
                const tr = document.createElement("tr");

                columns.forEach(col => {
                    const td = document.createElement("td");
                    const key = col?.key || "";
                    const value = row?.[key];

                    td.textContent =
                        value === null || typeof value === "undefined"
                            ? ""
                            : String(value);

                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            const tableWrap = document.createElement("div");
            tableWrap.className = "sku4-table-wrap";
            tableWrap.appendChild(table);
            contentTarget.appendChild(tableWrap);
            return;
        }

        // ------------------------------------------------------------
        // Generic normalized table contract renderer
        // Supports:
        // data.table.columns + data.table.rows end
        // ------------------------------------------------------------


        if (!Array.isArray(data)) {
            renderFallbackJson(contentTarget, {
                title: contract?.title || "Data Table",
                data
            });
            return;
        }

        if (!data.length) {
            renderEmptyPanel(contentTarget, {
                title: contract?.title || "Data Table",
                message: "No rows available."
            });
            return;
        }

        const columns = Object.keys(data[0] || {});
        const table = document.createElement("table");
        table.className = "sku4-table";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");

        columns.forEach(col => {
            const th = document.createElement("th");
            th.textContent = col;
            headRow.appendChild(th);
        });

        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        data.forEach(row => {
            const tr = document.createElement("tr");

            columns.forEach(col => {
                const td = document.createElement("td");
                td.textContent = formatTableCell(col, row[col], row);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        contentTarget.appendChild(table);

    }


    // ------------------------------------------------------------
    // Graph panel
    // ------------------------------------------------------------

    function renderGraphPanel(container, contract, entry, session, payload) {
        const panelShell = createContentShell({
            title: contract?.title,
            subtitle: contract?.subtitle,
            panelType: "graph"
        });

        container.appendChild(panelShell.root);

        const contentTarget = panelShell.content;
        const data = resolveContractData(contract, payload);


        // ------------------------------------------------------------
        // SKU4.50 Provider vs Region Benchmark
        // Panel 3 graph renderer
        // ----------------------------------------------------------------------------------------4.50 LHS disptaher start
        if (
            entry?.sku_id === "SKU4.50" &&
            contract?.data_binding_key === "provider_vs_region_benchmark"
        ) {
            console.log("[SKU4.50] LHS dispatcher fired", {
                sku: entry?.sku_id,
                key: contract?.data_binding_key,
                data
            });

            window.SKU450Renderer?.render({
                targetEl: contentTarget,
                data,
                contract,
                helpers: {
                    formatBenchmarkMetricLabel,
                    formatTableCell
                }
            });
            return;
        }

        // ------------------------------------------------------------
        // SKU4.50 Provider vs Region Benchmark
        // Panel 3 graph renderer
        // ----------------------------------------------------------------------------------------4.50 LHS disptaher end

        // ------------------------------------------------------------
        // SKU4.51 Provider vs Peer Benchmark
        // Panel 3 graph renderer
        // ------------------------------------------------------------
        if (
            entry?.sku_id === "SKU4.51" &&
            contract?.data_binding_key === "provider_vs_peer_benchmark"
        ) {
            console.log("[SKU4.51 DISPATCH HIT]", {
                data,
                contract,
                entry
            });

            window.SKU451Renderer?.render({
                targetEl: contentTarget,
                data,
                contract,
                helpers: {
                    formatBenchmarkMetricLabel,
                    formatTableCell
                }
            });

            return;
        }


        // ------------------------------------------------------------
        // Start Dispatcher for SKU4.54 (LHS)-----------------------------------------------------------------------------LHS 4.54 dispatcher start
        // ------------------------------------------------------------
        if (
            contract?.data_binding_key === "cohort_percentile_metrics" &&
            window.SKU454Renderer?.render
        ) {
            console.log("[SKU4][panel-engine] dispatch -> SKU4.54", {
                bindingKey: contract?.data_binding_key,
                payloadType: data?.type || null,
                metricCount: Array.isArray(data?.metrics)
                    ? data.metrics.length
                    : Array.isArray(data?.table?.rows)
                        ? data.table.rows.length
                        : 0
            });

            window.SKU454Renderer.render({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }
        // ------------------------------------------------------------
        // End Dispatcher for SKU4.54-------------------------------------------------------------------------------------LHS 4.54 dispatcher end
        // ------------------------------------------------------------

        // ------------------------------------------------------------
        // SKU4.55 LHS renderer dispatch                                --------------------------------------------------LHS 4.55 Disptacher start
        // Renders CPT overperformance chart/viewer on left panel.
        // ------------------------------------------------------------

        if (
            contract?.data_binding_key === "overperforming_cpt_areas" &&
            window.SKU455Renderer?.render
        ) {
            console.log("[SKU4][panel-engine] dispatch LHS -> SKU4.55", {
                bindingKey: contract?.data_binding_key
            });

            window.SKU455Renderer.render({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }
        // ------------------------------------------------------------
        // SKU4.56 LHS renderer dispatch
        // Renders CPT underperformance chart/viewer on left panel.
        // ------------------------------------------------------------

        if (
            contract?.data_binding_key === "underperforming_cpt_areas" &&
            window.SKU456Renderer?.render
        ) {
            console.log("[SKU4][panel-engine] dispatch LHS -> SKU4.56", {
                skuId: entry?.sku_id,
                bindingKey: contract?.data_binding_key
            });

            window.SKU456Renderer.render({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }


        // ------------------------------------------------------------
        // Start Dispatcher for SKU4.58 LHS
        // ------------------------------------------------------------
        if (
            contract?.data_binding_key === "monetizable_cpt_areas" &&
            window.SKU458Renderer?.render
        ) {
            console.log("[SKU4][panel-engine] dispatch LHS -> SKU4.58", {
                skuId: entry?.sku_id,
                bindingKey: contract?.data_binding_key
            });

            window.SKU458Renderer.render({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }
        // ------------------------------------------------------------
        // End Dispatcher for SKU4.58 LHS
        // ------------------------------------------------------------

        // ------------------------------------------------------------
        // SKU4.60 LHS renderer dispatch
        // Renders CPT portfolio risk viewer on left panel.
        // ------------------------------------------------------------

        if (
            contract?.data_binding_key === "cpt_portfolio_risk" &&
            window.SKU460Renderer?.render
        ) {
            console.log("[SKU4][panel-engine] dispatch LHS -> SKU4.60", {
                skuId: entry?.sku_id,
                bindingKey: contract?.data_binding_key
            });

            window.SKU460Renderer.render({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }

        // ------------------------------------------------------------
        // start Dispatcher for SKU4.62 LHS (Graph)
        // ------------------------------------------------------------

        if (
            entry?.sku_id === "SKU4.62" &&
            contract?.data_binding_key === "icu_utilization_efficiency" &&
            window.SKU462Renderer?.render
        ) {
            console.log("[SKU4][panel-engine] dispatch LHS -> SKU4.62", {
                bindingKey: contract?.data_binding_key
            });

            window.SKU462Renderer.render({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }

        // ------------------------------------------------------------
        // end Dispatcher for SKU4.62 LHS
        // ------------------------------------------------------------

        // ------------------------------------------------------------
        // start Dispatcher for SKU4.64 LHS
        // ------------------------------------------------------------

        if (
            entry?.sku_id === "SKU4.64" &&
            window.SKU464Renderer?.render
        ) {
            window.SKU464Renderer.render({
                targetEl: contentTarget,
                payload: data,
                contract
            });

            return;
        }

        // ------------------------------------------------------------
        // end Dispatcher for SKU4.64 LHS
        // ------------------------------------------------------------

        // ------------------------------------------------------------
        // SKU4.64 Viewer Dispatch (Panel 3)
        // ------------------------------------------------------------
        if (
            entry?.sku_id === "SKU4.64" &&
            contract?.data_binding_key === "coding_integrity_risk"
        ) {
            if (window.SKU464Renderer?.render) {
                window.SKU464Renderer.render({
                    targetEl: contentTarget,
                    payload,
                    contract
                });
            }
            return;
        }
        // ------------------------------------------------------------
        // SKU4.64 Viewer Dispatch End
        // ------------------------------------------------------------



        // ------------------------------------------------------------
        // Start Dispatcher for SKU4.53
        // ------------------------------------------------------------

        // ------------------------------------------------------------
        // Start Dispatcher for SKU4.53
        // ------------------------------------------------------------
        if (
            contract?.data_binding_key === "top_comparable_providers" &&
            window.SKU453Renderer?.render
        ) {
            console.log("[SKU4][panel-engine] dispatch -> SKU4.53", {
                bindingKey: contract?.data_binding_key,
                payloadType: data?.type || null,
                peerCount: Array.isArray(data?.peer_points) ? data.peer_points.length : 0
            });

            window.SKU453Renderer.render({
                targetEl: contentTarget,
                payload: data,
                contract
            });
            return;
        }
        // ------------------------------------------------------------
        // End Dispatcher for SKU4.53
        // ------------------------------------------------------------




        if (!window.Plotly) {
            renderPanelError(contentTarget, {
                title: contract?.title || "Graph",
                message: "Plotly is not loaded."
            });
            return;
        }

        const graphType = contract?.props?.graph_type || "bar";
        const graphWrap = document.createElement("div");
        graphWrap.className = "sku4-tooltip-target";
        graphWrap.style.position = "relative";
        graphWrap.style.width = "100%";
        graphWrap.style.height = "520px";
        contentTarget.appendChild(graphWrap);

        const graphHost = document.createElement("div");
        graphHost.style.width = "100%";
        graphHost.style.height = "100%";
        graphWrap.appendChild(graphHost);

        const marker = document.createElement("div");
        marker.className = "sku4-tooltip-marker";
        marker.classList.add("sku4-graph-bee-marker");
        graphWrap.appendChild(marker);

        if (graphType === "delta_bar") {

            if (
                contract?.data_binding_key === "provider_vs_region_benchmark" &&
                window.SKU450Renderer?.render
            ) {
                window.SKU450Renderer.render({
                    targetEl: contentTarget,
                    data,
                    contract,
                    helpers: {
                        formatBenchmarkMetricLabel,
                        formatTableCell
                    }
                });
                return;
            }
            const x = data.map(row => formatBenchmarkMetricLabel(row.metric || ""));
            const y = data.map(row => {
                const provider = Number(row.provider ?? 0);
                const benchmark = Number((row.region ?? row.peer) ?? 0);

                if (!Number.isFinite(provider) || !Number.isFinite(benchmark) || benchmark === 0) {
                    return 0;
                }

                return ((provider - benchmark) / Math.abs(benchmark)) * 100;
            });

            const metricLabels = x;
            const deltaValues = y;

            const topIndex = deltaValues.reduce((bestIdx, value, idx, arr) => {
                return Math.abs(value) > Math.abs(arr[bestIdx]) ? idx : bestIdx;
            }, 0);

            const metricDescriptions = {
                "C1 Position": "Relative economic intensity position in canonical space.",
                "Total Paid": "Total reimbursement volume across the observed period.",
                "Paid per Claim": "Average reimbursement per claim.",
                "Claims per Beneficiary": "Utilization intensity per beneficiary.",
                /* "ICU Share": "Share of claims associated with ICU-like activity.",
                "CCU Share": "Share of claims associated with CCU-like activity.", */
                "Unique HCPCS Count": "Breadth of CPT / HCPCS activity."
            };

            const customdata = data.map(row => [
                formatTableCell("provider", row.provider, row),
                formatTableCell("region", row.region ?? row.peer, row),
                formatTableCell("delta", row.delta, row),
                metricDescriptions[row.metric] || ""
            ]);

            const deltaTrace = {
                type: "bar",
                orientation: "h",
                name: "Delta %",
                x: deltaValues,
                y: metricLabels,
                customdata,
                hovertemplate:
                    "<b>%{y}</b><br>" +
                    "Delta vs Benchmark: %{x:.2f}%<br>" +
                    "Hospital: %{customdata[0]}<br>" +
                    "Benchmark: %{customdata[1]}<br>" +
                    "Delta Value: %{customdata[2]}<br>" +
                    "%{customdata[3]}" +
                    "<extra></extra>"
            };

            window.Plotly.newPlot(
                graphHost,
                [deltaTrace],
                {
                    margin: { l: 180, r: 30, t: 20, b: 80 },
                    paper_bgcolor: "#06101c",
                    plot_bgcolor: "#06101c",
                    font: { color: "#d9e2f1" },
                    xaxis: {
                        title: "Delta vs Benchmark (%)",
                        automargin: true,
                        zeroline: true
                    },
                    yaxis: {
                        automargin: true
                    },
                    showlegend: false,
                    hoverlabel: {
                        bgcolor: "#0b1626",
                        bordercolor: "rgba(255,255,255,0.12)",
                        font: {
                            color: "#e7eef8",
                            size: 22
                        },
                        align: "left",
                        namelength: -1
                    },
                    annotations: [
                        {
                            xref: "x",
                            yref: "y",
                            x: deltaValues[topIndex],
                            y: metricLabels[topIndex],
                            text: "🐝",
                            showarrow: false,
                            font: {
                                size: 16
                            },
                            xanchor: deltaValues[topIndex] >= 0 ? "left" : "right",
                            yanchor: "middle",
                            xshift: deltaValues[topIndex] >= 0 ? 12 : -12
                        }
                    ]
                },
                {
                    responsive: true,
                    displaylogo: false,
                    scrollZoom: true
                }
            );

            return;
        }

        if (
            contract?.data_binding_key === "provider_vs_peer_benchmark" &&
            window.SKU451Renderer?.render
        ) {
            console.log("[SKU4][panel-engine] dispatch -> SKU4.51", {
                bindingKey: contract?.data_binding_key
            });

            window.SKU451Renderer.render({
                targetEl: contentTarget,
                data,
                contract,
                helpers: {
                    formatBenchmarkMetricLabel,
                    formatTableCell
                }
            });
            return;
        }


        if (graphType === "grouped_bar") {
            const metricDescriptions = {
                "C1 Position": "Relative economic intensity position in canonical space.",
                "Total Paid": "Total reimbursement volume across the observed period.",
                "Paid per Claim": "Average reimbursement per claim.",
                "Claims per Beneficiary": "Utilization intensity per beneficiary.",
                /*     "ICU Share": "Share of claims associated with ICU-like activity.",
                    "CCU Share": "Share of claims associated with CCU-like activity.", */
                "Unique HCPCS Count": "Breadth of CPT / HCPCS activity."
            };

            const x = data.map(row => formatBenchmarkMetricLabel(row.metric || ""));

            const providerTrace = {
                type: "bar",
                name: "Hospital",
                x,
                y: data.map(row => Number(row.provider ?? 0)),
                customdata: data.map(row => [
                    formatTableCell("provider", row.provider, row),
                    formatTableCell("region", row.region, row),
                    formatTableCell("delta", row.delta, row),
                    metricDescriptions[row.metric] || ""
                ]),
                hovertemplate:
                    "<b>%{x}</b><br>" +
                    "Hospital: %{customdata[0]}<br>" +
                    "Region: %{customdata[1]}<br>" +
                    "Delta: %{customdata[2]}<br>" +
                    "%{customdata[3]}" +
                    "<extra></extra>"
            };

            const regionTrace = {
                type: "bar",
                name: "Region",
                x,
                y: data.map(row => Number(row.region ?? 0)),
                customdata: data.map(row => [
                    formatTableCell("provider", row.provider, row),
                    formatTableCell("region", row.region, row),
                    formatTableCell("delta", row.delta, row),
                    metricDescriptions[row.metric] || ""
                ]),
                hovertemplate:
                    "<b>%{x}</b><br>" +
                    "Region: %{customdata[1]}<br>" +
                    "Hospital: %{customdata[0]}<br>" +
                    "Delta: %{customdata[2]}<br>" +
                    "%{customdata[3]}" +
                    "<extra></extra>"
            };

            window.Plotly.newPlot(
                graphHost,
                [providerTrace, regionTrace],
                {
                    barmode: "group",
                    margin: { l: 50, r: 20, t: 20, b: 170 },
                    paper_bgcolor: "#06101c",
                    plot_bgcolor: "#06101c",
                    font: { color: "#d9e2f1" },
                    xaxis: {
                        tickangle: -25,
                        automargin: true
                    },
                    yaxis: {
                        automargin: true,
                        zeroline: true
                    },
                    legend: {
                        orientation: "h",
                        y: -0.35,
                        x: 0,
                        xanchor: "left"
                    },
                    hoverlabel: {
                        bgcolor: "#0b1626",
                        bordercolor: "rgba(255,255,255,0.12)",
                        font: {
                            color: "#e7eef8",
                            size: 22
                        },
                        align: "left",
                        namelength: -1
                    }
                },
                {
                    responsive: true,
                    displaylogo: false,
                    scrollZoom: true
                }
            );

            return;
        }



        // ------------------------------------------------------------
        // Generic normalized chart contract renderer
        // Supports:
        // 1. single-series chart.labels + chart.values
        // 2. grouped chart.labels + chart.provider_values/peer_values/region_values start 
        // ------------------------------------------------------------
        if (data?.chart && Array.isArray(data.chart.labels)) {
            const chart = data.chart;

            // single-series bar contract
            if (Array.isArray(chart.values)) {
                const labels = chart.labels.map(label => String(label || ""));
                const values = chart.values.map(value => Number(value || 0));

                const hoverText = Array.isArray(chart.text) ? chart.text : [];

                window.Plotly.newPlot(
                    graphHost,
                    [
                        {
                            type: "bar",
                            x: labels,
                            y: values,
                            text: hoverText,
                            hovertemplate: hoverText.length
                                ? "%{text}<extra></extra>"
                                : "<b>%{x}</b><br>Value: %{y}<extra></extra>"
                        }
                    ],
                    {
                        margin: { l: 50, r: 20, t: 20, b: 80 },
                        paper_bgcolor: "#06101c",
                        plot_bgcolor: "#06101c",
                        font: { color: "#d9e2f1" },
                        xaxis: {
                            type: "category",
                            tickangle: -25,
                            automargin: true
                        },
                        yaxis: {
                            automargin: true,
                            zeroline: true
                        },
                        showlegend: false
                    },
                    {
                        responsive: true,
                        displaylogo: false,
                        scrollZoom: true
                    }
                );

                return;
            }

            // grouped bar contract
            if (
                Array.isArray(chart.provider_values) &&
                Array.isArray(chart.peer_values) &&
                Array.isArray(chart.region_values)
            ) {
                const labels = chart.labels.map(label => String(label || ""));
                const providerValues = chart.provider_values.map(v => Number(v || 0));
                const peerValues = chart.peer_values.map(v => Number(v || 0));
                const regionValues = chart.region_values.map(v => Number(v || 0));

                const beeIndex =
                    Number.isInteger(chart.bee_index) ? chart.bee_index : -1;

                const annotations =
                    beeIndex >= 0 &&
                        beeIndex < labels.length &&
                        beeIndex < providerValues.length
                        ? [
                            {
                                xref: "x",
                                yref: "y",
                                x: labels[beeIndex],
                                y: providerValues[beeIndex],
                                text: "🐝",
                                showarrow: false,
                                font: { size: 16 },
                                xanchor: "center",
                                yanchor: "bottom",
                                yshift: 12
                            }
                        ]
                        : [];

                const providerTrace = {
                    type: "bar",
                    name: "Provider",
                    x: labels,
                    y: providerValues,
                    hovertemplate: "<b>%{x}</b><br>Provider: %{y}<extra></extra>"
                };

                const peerTrace = {
                    type: "bar",
                    name: "Peer Median",
                    x: labels,
                    y: peerValues,
                    hovertemplate: "<b>%{x}</b><br>Peer Median: %{y}<extra></extra>"
                };

                const regionTrace = {
                    type: "bar",
                    name: "Region Median",
                    x: labels,
                    y: regionValues,
                    hovertemplate: "<b>%{x}</b><br>Region Median: %{y}<extra></extra>"
                };

                window.Plotly.newPlot(
                    graphHost,
                    [providerTrace, peerTrace, regionTrace],
                    {
                        barmode: "group",
                        margin: { l: 50, r: 20, t: 20, b: 120 },
                        paper_bgcolor: "#06101c",
                        plot_bgcolor: "#06101c",
                        font: { color: "#d9e2f1" },
                        xaxis: {
                            type: "category",
                            tickangle: -25,
                            automargin: true
                        },
                        yaxis: {
                            automargin: true,
                            zeroline: true
                        },
                        legend: {
                            orientation: "h",
                            y: 1.12
                        },
                        hoverlabel: {
                            bgcolor: "#0b1626",
                            bordercolor: "rgba(255,255,255,0.12)",
                            font: {
                                color: "#e7eef8",
                                size: 16
                            },
                            align: "left",
                            namelength: -1
                        },
                        annotations
                    },
                    {
                        responsive: true,
                        displaylogo: false,
                        scrollZoom: true
                    }
                );

                return;
            }
        }

        // ------------------------------------------------------------
        // Generic normalized chart contract renderer
        // Supports:
        // 1. single-series chart.labels + chart.values
        // 2. grouped chart.labels + chart.provider_values/peer_values/region_values end
        // ------------------------------------------------------------

        renderFallbackJson(contentTarget, {
            title: contract?.title || "Graph",
            data
        });
    }


    // ------------------------------------------------------------
    // Shared shell builders
    // ------------------------------------------------------------

    function createContentShell({ title, subtitle = "", panelType = "" }) {
        const root = document.createElement("div");
        root.className = `sku4-panel sku4-panel-content sku4-panel-type-${panelType}`;

        root.innerHTML = `
            <div class="sku4-content-shell">
                <div class="sku4-content-header">
                    <div class="sku4-content-title">${escapeHtml(title || "")}</div>
                    <div class="sku4-content-subtitle">${escapeHtml(subtitle || "")}</div>
                </div>
                <div class="sku4-content-body"></div>
            </div>
        `;

        return {
            root,
            content: root.querySelector(".sku4-content-body")
        };
    }

    // ------------------------------------------------------------
    // Data resolution
    // ------------------------------------------------------------

    function resolveContractData(contract, payload) {
        if (!contract) return null;
        if (!payload) return null;

        const key = contract.data_binding_key;
        if (!key) return payload;

        return payload[key] ?? null;
    }

    function resolveNarrativeText(contract, payload, data) {
        const narrativeKey = contract?.props?.narrative_key;

        if (narrativeKey && payload && typeof payload[narrativeKey] === "string") {
            return payload[narrativeKey];
        }

        if (typeof data === "string") {
            return data;
        }

        if (data && typeof data.summary === "string") {
            return data.summary;
        }

        return "Narrative not available.";
    }

    function formatTableCell(column, value, row = null) {
        if (value === null || typeof value === "undefined") return "";
        if (typeof value === "object") return JSON.stringify(value);

        const metric = row?.metric || "";

        if (column === "metric") {
            return formatBenchmarkMetricLabel(String(value));
        }

        if (metric === "Total Paid" || metric === "Paid per Claim") {
            return formatCurrency(value);
        }

        /*  if (metric === "ICU Share" || metric === "CCU Share") {
             return formatPercent(value);
         } */

        if (metric === "Unique HCPCS Count") {
            return formatInteger(value);
        }

        if (metric === "Claims per Beneficiary" || metric === "C1 Position") {
            return formatNumberFixed(value, 2);
        }

        if (typeof value === "number") {
            return formatNumberFixed(value, 2);
        }

        return String(value);
    }

    // ------------------------------------------------------------
    // Session state tracking
    // ------------------------------------------------------------

    function setPanelState(session, panelName, state) {
        if (!session.panelState) {
            session.panelState = {};
        }

        session.panelState[panelName] = {
            ...(session.panelState[panelName] || {}),
            ...state
        };
    }

    // ------------------------------------------------------------
    // Fallbacks / empty / error
    // ------------------------------------------------------------

    function renderUnsupportedPanel(container, contract) {
        container.innerHTML = `
            <div class="sku4-panel sku4-panel-unsupported">
                <div class="sku4-panel-error-title">Unsupported panel type</div>
                <pre class="sku4-json-preview">${escapeHtml(JSON.stringify(contract, null, 2))}</pre>
            </div>
        `;
    }

    function renderPanelError(container, { title, message }) {
        container.innerHTML = `
            <div class="sku4-panel sku4-panel-error">
                <div class="sku4-panel-error-title">${escapeHtml(title || "Panel error")}</div>
                <div class="sku4-panel-error-message">${escapeHtml(message || "Unknown panel error")}</div>
            </div>
        `;
    }

    function renderEmptyPanel(container, { title, message }) {
        if (!container) return;

        if (container instanceof Element) {
            container.innerHTML = `
                <div class="sku4-panel sku4-panel-empty">
                    <div class="sku4-panel-empty-title">${escapeHtml(title || "Empty panel")}</div>
                    <div class="sku4-panel-empty-message">${escapeHtml(message || "No content available.")}</div>
                </div>
            `;
        }
    }

    function renderFallbackJson(container, { title, data }) {
        const box = document.createElement("div");
        box.className = "sku4-fallback-json";
        box.innerHTML = `
            <div class="sku4-fallback-title">${escapeHtml(title || "Fallback Data")}</div>
            <pre class="sku4-json-preview">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
        `;

        container.appendChild(box);
    }

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------

    function clearPanel(container) {
        container.innerHTML = "";
    }

    function setContainerMeta(container, { panelName, contract, entry }) {
        container.setAttribute("data-panel-name", panelName);
        container.setAttribute("data-panel-type", contract?.panel_type || "");
        container.setAttribute("data-panel-component", contract?.component || "");
        container.setAttribute("data-panel-sku", entry?.sku_id || "");
    }

    function readContextValue(key) {
        const ctx = global.SKU4_ENTRY_CONTEXT || global.SKU4_ENTRY_CONTEXT || {};

        if (key === "region") return ctx.region || "";
        if (key === "model") return ctx.family || ctx.model || "";
        if (key === "provider") return ctx.npi || ctx.provider || "";

        return "";
    }

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function log(message, data) {
        if (!DEBUG) return;

        if (typeof data === "undefined") {
            console.log(`[SKU4][panel-engine] ${message}`);
        } else {
            console.log(`[SKU4][panel-engine] ${message}`, data);
        }
    }

    // ------------------------------------------------------------
    // Export
    // ------------------------------------------------------------

    global.SKU4PanelEngine = {
        renderPanels
    };

})(window);