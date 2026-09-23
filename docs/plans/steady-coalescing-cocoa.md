# Plan: Remove Timóteo References Without Breaking Functionality

## Context
The repository currently contains references to specific municipal entities ("Timóteo", `termometro.timoteo.mg.gov.br`, `br.gov.mg.timoteo...`) in documentation, README files, package names (`@timoteo/pwa-builder-sdk`), and unit/E2E test suites. To make the SDK generic and reusable for any PWA project, we need to replace all Timóteo-specific references with generic placeholders (`example.com`, `pwa-builder-sdk`, generic package IDs, and company names) while preserving all functionality, assertions, and test passing state.

## Proposed Approach
1. **Package Name Update**:
   - Update `package.json` name from `@timoteo/pwa-builder-sdk` to `pwa-builder-sdk`.
   - Update imports in documentation and README files accordingly.

2. **Documentation & README Updates**:
   - Replace `https://termometro.timoteo.mg.gov.br` with `https://example.com` or `https://my-pwa.example.com` across `README.md`, `docs/`, and guides.
   - Update certificate common names and display names in docs (e.g., `CN=PrefeituraMunicipalDeTimoteo` → `CN=ExampleCompany`).

3. **Test Suite & Value Objects Updates**:
   - Update unit and E2E tests (`tests/unit/`, `tests/e2e/`) to use generic test URLs (`https://example.com`), generic package IDs (`com.example.pwa.twa`), generic Windows package IDs (`ExampleCorp.Pwa`), and generic certificate common names (`CN=ExampleCompany`).
   - Ensure all domain validation rules and logic remain fully tested and intact.

## Critical Files to be Modified
- `package.json`
- `README.md`
- `docs/README.md`
- `docs/adr/0001-pwabuilder-sdk-architecture.md`
- `docs/api-reference.md`
- `docs/cli-usage.md`
- `docs/nextjs-react-integration.md`
- `tests/e2e/live-pipeline.e2e.test.ts`
- `tests/unit/cli.test.ts`
- `tests/unit/domain/collections.test.ts`
- `tests/unit/domain/value-objects.test.ts`
- `tests/unit/packaging/android-packager.test.ts`
- `tests/unit/packaging/ios-packager.test.ts`
- `tests/unit/packaging/windows-packager.test.ts`
- `tests/unit/report/report-client.test.ts`

## Verification Strategy
- Run `pnpm test` (unit tests and e2e mocks) to verify all tests pass with the new generic identifiers.
- Run `pnpm build` and `pnpm typecheck` to ensure type safety and build correctness.
- Perform a final `git grep -i timoteo` check to confirm zero remaining references.
