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
    // Both dimensions are measured against the viewport rather than the pane:
    // the CDK sizes its panes to their content, so the `w-full` / `max-h-full`
    // the dialog itself carries resolve against that content box and are
    // effectively ignored. Width fills a phone screen bar a small margin; height
    // leaves the safe areas free and lets a tall form scroll.
    contentClass:
      'w-[min(92vw,32rem)] max-w-[92vw] sm:max-w-[32rem] max-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-2rem)] overflow-y-auto',
  });
  return firstValueFrom(ref.closed$);
}
