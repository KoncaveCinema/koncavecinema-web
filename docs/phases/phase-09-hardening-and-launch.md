# Phase F9: Hardening, Observability & Launch

## Deliverables

- **Observability**: Sentry (errors, performance, session replay with all inputs masked) tagged
  with the API `X-Request-Id`; Web Vitals reporting; player telemetry (time to first frame,
  rebuffer ratio) for the PRD SLOs (TTFF under 1.8 s, buffer ratio under 1.5%).
- **Security**: CSP with nonces site-wide, Subresource Integrity where possible, dependency audit
  in CI, review of every `NEXT_PUBLIC_*` variable.
- **Privacy**: cookie preference banner (GDPR / NDPA), privacy notice, account deletion request
  once the API exposes it.
- **Quality**: Playwright journeys across Chromium, Firefox and WebKit (desktop and mobile
  viewports); Lighthouse CI budgets; axe accessibility checks in CI.
- **Resilience**: offline and slow-network states, retry UI, maintenance page.
- **PWA**: manifest, icons, install prompt (no offline video).
- **Deployment**: preview deployments per pull request, staging and production environments,
  custom domains `koncavecinema.com` and `staging.koncavecinema.com`, same-site with the API.
- **Premiere readiness**: load the lobby and authorization flow under the API's Phase 8 load test.
