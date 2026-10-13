# Router Resource Migration Plan

**Status:** Implemented  
**Scope:** Replace route-driven data subscriptions with Angular Router Resources while
preserving live IndexedDB updates and current navigation behavior.

## Context

The application uses Angular 22.2.2 and hash-based routing. `routerFeatures` in
`src/app/app.config.ts` is also used by the routing spec. Route-dependent data is currently
loaded in page components through `toSignal`, `toObservable`, and the repository's Dexie
`liveQuery` streams:

- The home page reads the `countdown` query parameter and loads the selected countdown list
  and its appointments.
- The admin detail page reads the `:id` path parameter and loads one countdown and its
  appointments.
- The admin overview loads the countdown list without a route parameter.

Angular Router's `withRouterResources()` and route `resources` API are marked Developer
Preview in the installed Angular 22.2.2 types. Router resources are therefore an opt-in
preview API, not a stable replacement for the existing subscriptions.

## Proposed scope

Migrate the home page and both admin pages. The home page and admin overview consume the live
countdown list; the admin detail page consumes the live countdown and appointment list.

Enable router resources in the shared `routerFeatures` configuration so the application and
routing tests exercise the same router setup. Bind the non-blocking resources to page inputs
with the existing component-input binding feature, then read their values through the
resource signals.

Use RxJS-backed resources over the repository's Dexie `liveQuery` methods. This keeps
subsequent IndexedDB updates observable rather than turning the route load into a one-time
snapshot. Mark these resources non-blocking so route navigation does not wait for an initial
database emission.

## Migration steps

1. Add `withRouterResources()` to `routerFeatures`.
2. Define route resources for the home and admin overview countdown lists, and the admin
   detail countdown and appointments, using the route's query/path parameter signals where
   applicable.
3. Bind returned values to explicit component inputs and remove the corresponding
   component-owned route-to-observable subscriptions.
4. Preserve existing behavior:
   - Home selection precedence remains URL selection, remembered valid selection, then the
     next countdown due.
   - Missing or invalid detail IDs continue to show the existing not-found state.
   - Parameter changes switch to the matching live data without requiring component
     recreation.
   - Loading does not block navigation, and live updates continue after initial resolution.
   - Repository validation and mutation behavior remain unchanged.
5. Extend routing and page specs to cover direct navigation, changed route/query parameters,
   live updates, missing data, and loading behavior.
6. Run targeted specs, the full unit suite, formatting, and the production build.

## Risks and decisions

- **Developer Preview:** The router resource APIs may change in a future Angular release.
  Approval is needed to take this API dependency.
- **Missing records:** The admin detail currently displays a not-found state both when a
  valid ID has no matching record and for non-integer IDs. The resource must preserve this
  behavior and must not turn a missing record into an unhandled resource error.
- **Loading state:** The current pages render with initial values (`[]` or `undefined`)
  while IndexedDB resolves. The migration should keep navigation non-blocking and retain
  sensible existing empty/loading presentation.
- **Reactive updates:** Resources must remain subscribed to Dexie live queries for the
  lifetime of their route context and correctly replace subscriptions when parameters
  change.

## Approval questions

1. Approve using Angular Router's Developer Preview resource API in this app?
   **Recommendation:** Yes, with the API isolated to route configuration and focused tests.
2. Approve migrating both the home page and admin detail page, while leaving the admin
   overview unchanged?
   **Recommendation:** Yes; this matches the route-dependent data and keeps scope bounded.
3. Approve preserving current non-blocking initial rendering and live-update behavior?
   **Recommendation:** Yes; this avoids changing user-visible navigation and data behavior.

The implementation uses the preview API, migrates both route-dependent pages, and preserves
non-blocking navigation and live Dexie updates. Focused page and routing specs cover the
migrated behavior.
