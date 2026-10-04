# Coorvanta Release Register

## Coorvanta Cloud v1.1.1 — October 4, 2026

Customer-workspace flow correction.

- Adds an immediate, prominent **Start a free link review** action on the signed-in customer workspace.
- Adds a direct sales-pricing contact from the workspace.
- Replaces the empty-account instruction with the actual next step for a new customer.
- Does not change the pre-purchase boundary: detailed technical results remain unavailable until payment and service activation are configured and verified.

## Coorvanta Cloud v1.1.0 — October 5, 2026

Launch-safe public website update.

- Replaces the misleading automatic pre-purchase check with a real free link-review request flow while the production availability engine is being connected.
- Removes public access to the simulated customer workspace from the primary website journey.
- Adds 71–76 GHz, 81–86 GHz, and other 70–90 GHz requests to the free-review form for human engineering review.
- Adds pricing clarity: $399 per bidirectional polarized channel pair; standard H/V routes are two pairs ($798).
- Adds an explicit FCC-approval FAQ and preserves the independent-platform disclaimer.
- Corrects lint failures on the account, sign-in, registration, and link-review pages.

**Production condition:** This release may be deployed as a sales and review-request website. Automated availability, account activation, payment checkout, and paid-study delivery remain disabled until their database, payment, email, and engineering-service settings are configured and verified.

## Coorvanta Cloud v1.0.0 — September 14, 2026

First formal release baseline for the Coorvanta customer portal and cloud-account services.

Included scope:

- Public Coorvanta platform website and customer-portal demonstration.
- Suite catalog for Path, Spectrum, Coordinate, Filing, Reports, and Cloud.
- Demonstration sign-in, account controls, licensing/entitlement interface, download workflow, and enterprise inquiry workflow.
- Cloud-service positioning for installers, license verification, account controls, and optional secure services.

Important product boundary:

- This release is the cloud portal and customer-account layer.
- The installed engineering application remains a separate product line and retains its own version number.

## Related installed products

| Product | Current release | Scope |
| --- | --- | --- |
| Coorvanta Engineering Suite | v24.6.0 | Installed microwave engineering and FCC-data processing application. |
| Coorvanta Cloud | v1.0.0 | Customer portal, licensing, updates, account services, and future cloud workflows. |

## Versioning policy

Use semantic versioning for Coorvanta Cloud:

- **Major** (`v2.0.0`): major commercial, data-model, security, or workflow change.
- **Minor** (`v1.1.0`): backward-compatible customer features, integrations, or portal capabilities.
- **Patch** (`v1.0.1`): bug fixes, copy changes, security patches, and non-breaking improvements.

Each production release must have a date, a short change summary, and a tested deployment reference.
