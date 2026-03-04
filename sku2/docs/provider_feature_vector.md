# SKU2 Provider Feature Vector (Draft)

## Entity
- Provider-month (BILLING_PROVIDER_NPI_NUM × CLAIM_FROM_MONTH) with STATE (if applicable)

## Join Keys (must match canonical PCA)
- STATE
- BILLING_PROVIDER_NPI_NUM
- CLAIM_FROM_MONTH

## Candidate Base Measures (raw)
- TOTAL_UNIQUE_BENEFICIARIES
- TOTAL_CLAIMS
- TOTAL_PAID
- PAID_PER_CLAIM = TOTAL_PAID / max(TOTAL_CLAIMS, 1)
- CLAIMS_PER_BENE = TOTAL_CLAIMS / max(TOTAL_UNIQUE_BENEFICIARIES, 1)
- PAID_PER_BENE = TOTAL_PAID / max(TOTAL_UNIQUE_BENEFICIARIES, 1)

## Transform
- LOG_* = log1p(raw)

## Output Vector (current canonical)
- LOG_TOTAL_UNIQUE_BENEFICIARIES
- LOG_TOTAL_CLAIMS
- LOG_TOTAL_PAID
- LOG_PAID_PER_CLAIM
- LOG_CLAIMS_PER_BENE
- LOG_PAID_PER_BENE

## Missingness / Safety
- If denominator is 0, use 1 for ratio denominator.
- Replace NaN/Inf with 0 before log1p.

## Next Decisions
- What is the “provider identity” for SKU2: one month, last month, or rolling window?
- Do we show trend (trajectory) vs single point?
