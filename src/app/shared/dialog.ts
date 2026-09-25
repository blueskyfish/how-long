import type { ComponentType } from '@angular/cdk/portal';
import { firstValueFrom } from 'rxjs';
import { HlmDialogService } from '@spartan-ng/helm/dialog';

/**
 * Opens a Spartan dialog and resolves with its result, or `undefined` when the
 * user dismissed it. Keeps the `closed$` plumbing out of the feature components.
 */
export function openDialog<TResult, TContext extends object>(
  service: HlmDialogService,
  component: ComponentType<unknown>,
  context: TContext,
): Promise<TResult | undefined> {
  const ref = service.open<TResult, TContext>(component, {
    context,
    // A tall form (the appointment dialog, say) must scroll rather than run off
    // a phone screen. The cap is measured against the viewport minus the safe
    // areas: `max-h-full` would resolve against the CDK's auto-height panes and
    // therefore be ignored.
    contentClass:
      'sm:max-w-lg max-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-2rem)] overflow-y-auto',
  });
  return firstValueFrom(ref.closed$);
}
