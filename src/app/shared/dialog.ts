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
    contentClass: 'sm:max-w-lg',
  });
  return firstValueFrom(ref.closed$);
}
