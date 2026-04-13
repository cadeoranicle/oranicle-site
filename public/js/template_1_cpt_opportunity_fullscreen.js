// template_1_cpt_opportunity_fullscreen.js
// First shared full-screen template for CPT opportunity-style SKUs.
// This file is intentionally template-only.
// It should NOT contain SKU-specific binder logic.

function formatCurrency(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPct(value) {
  const n = Number(value || 0);
  return `${n.toFixed(1)}%`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBandClass(band) {
  const key = String(band || '').toLowerCase();
  if (key.includes('high')) return 't1-band-high';
  if (key.includes('moderate')) return 't1-band-moderate';
  if (key.includes('low')) return 't1-band-low';
  return 't1-band-default';
}

function buildVerticalBars(items) {
  const safeItems = Array.isArray(items) ? items : [];
  const maxValue = Math.max(
    1,
    ...safeItems.flatMap((item) => [
      Number(item.provider_paid || 0),
      Number(item.peer_paid || 0),
      Number(item.revenue_gap || 0),
    ])
  );

  return `
    <div class="t1-chart-wrap">
      <div class="t1-chart">
        ${safeItems
      .map((item) => {
        const providerPaid = Number(item.provider_paid || 0);
        const peerPaid = Number(item.peer_paid || 0);
        const revenueGap = Number(item.revenue_gap || Math.max(peerPaid - providerPaid, 0));

        const providerHeight = Math.max(8, (providerPaid / maxValue) * 240);
        const peerHeight = Math.max(8, (peerPaid / maxValue) * 240);
        const gapHeight = Math.max(0, ((peerPaid - providerPaid) / maxValue) * 240);

        return `
              <div class="t1-col">
                <div class="t1-col-top">
                  <div class="t1-gap-label">${formatCurrency(revenueGap)}</div>
                  <div class="t1-band ${getBandClass(item.opportunity_band || item.band)}">
                    ${escapeHtml(item.opportunity_band || item.band || 'Opportunity')}
                  </div>
                </div>

                <div class="t1-bar-zone">
                  <div class="t1-peer-bar" style="height:${peerHeight}px;"></div>
                  <div class="t1-provider-bar" style="height:${providerHeight}px;"></div>
                  ${gapHeight > 0 ? `<div class="t1-gap-cap" style="height:${gapHeight}px;"></div>` : ''}
                </div>

                <div class="t1-col-meta">
                  <div class="t1-cpt">${escapeHtml(item.cpt_code || '-')}</div>
                  <div class="t1-sub">Provider ${formatCurrency(providerPaid)}</div>
                  <div class="t1-sub">Peer ${formatCurrency(peerPaid)}</div>
                </div>
              </div>
            `;
      })
      .join('')}
      </div>
    </div>
  `;
}

function buildMetricCards(summary) {
  const metrics = [
    {
      label: 'Total Opportunity',
      value: formatCurrency(summary.total_opportunity_value),
    },
    {
      label: 'Largest Gap',
      value: formatCurrency(summary.largest_gap_value),
    },
    {
      label: 'Top CPT Count',
      value: formatNumber(summary.top_cpt_count),
    },
    {
      label: 'Avg. Paid Ratio',
      value: formatPct(summary.avg_paid_ratio_pct),
    },
  ];

  return `
    <div class="t1-metrics-row">
      ${metrics
      .map(
        (metric) => `
            <div class="t1-metric-card">
              <div class="t1-metric-label">${escapeHtml(metric.label)}</div>
              <div class="t1-metric-value">${escapeHtml(metric.value)}</div>
            </div>
          `
      )
      .join('')}
    </div>
  `;
}

function buildNarrative(payload) {
  const bullets = Array.isArray(payload?.narrative?.bullets)
    ? payload.narrative.bullets
    : [];

  return `
    <section class="t1-narrative">
      <div class="t1-section-title">Narrative</div>
      <div class="t1-narrative-text">${escapeHtml(payload?.narrative?.summary || '')}</div>
      ${bullets.length
      ? `
          <ul class="t1-bullets">
            ${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
          </ul>
        `
      : ''}
    </section>
  `;
}

function buildDetailTable(items) {
  const safeItems = Array.isArray(items) ? items : [];

  return `
    <section class="t1-detail-table-wrap">
      <div class="t1-section-title">Top CPT Details</div>
      <table class="t1-detail-table">
        <thead>
          <tr>
            <th>CPT</th>
            <th>Provider Paid</th>
            <th>Peer Paid</th>
            <th>Revenue Gap</th>
            <th>Paid Ratio</th>
            <th>Claims Ratio</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          ${safeItems
      .map(
        (item) => `
                <tr>
                  <td>${escapeHtml(item.cpt_code || '-')}</td>
                  <td>${formatCurrency(item.provider_paid)}</td>
                  <td>${formatCurrency(item.peer_paid)}</td>
                  <td>${formatCurrency(item.revenue_gap || Math.max(Number(item.peer_paid || 0) - Number(item.provider_paid || 0), 0))}</td>
                  <td>${formatPct(item.paid_ratio_pct)}</td>
                  <td>${formatPct(item.claim_ratio_pct)}</td>
                  <td>${formatNumber(item.leakage_score || item.score || 0)}</td>
                </tr>
              `
      )
      .join('')}
        </tbody>
      </table>
    </section>
  `;
}

function renderTemplate1CptOpportunityFullscreen(payload) {
  const items = Array.isArray(payload?.chart_items) ? payload.chart_items : [];
  const summary = payload?.summary || {};
  const skuTitle = payload?.sku_title || 'CPT Opportunity';
  const skuSubtitle = payload?.sku_subtitle || '';
  const providerName = payload?.provider_name || '';
  const providerNpi = payload?.provider_npi || '';
  const regionLabel = payload?.region_label || '';
  const skuCounter = payload?.sku_counter || '';

  return `
    <section class="t1-screen">
      <header class="t1-header">
        <div class="t1-header-left">
          
          <h1 class="t1-title">${escapeHtml(skuTitle)}</h1>
          
        </div>
        <div class="t1-header-right">
          <div class="t1-provider">${escapeHtml(providerName)}</div>
          <div class="t1-provider-meta">NPI ${escapeHtml(providerNpi)} · ${escapeHtml(regionLabel)}</div>
          <div class="t1-sku-counter">${escapeHtml(skuCounter)}</div>
        </div>
      </header>

      ${buildMetricCards(summary)}

      <div class="t1--main-grid">
            <div class="t1--left-column">
        <section class="t1-chart-section">
            <div class="t1-section-title">Opportunity Visualization</div>
            ${buildVerticalBars(items)}
        </section>
      </div>

      <div class="t1--right-column">
        ${buildNarrative(payload)}
      </div>
</div>

<section class="t1-lower-grid">
    ${buildDetailTable(items)}
</section>
    </section>
  `;
}

window.renderTemplate1CptOpportunityFullscreen = renderTemplate1CptOpportunityFullscreen;
console.log("template_1_cpt_opportunity_fullscreen loaded", window.renderTemplate1CptOpportunityFullscreen);
