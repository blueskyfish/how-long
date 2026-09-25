import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToaster } from '@spartan-ng/helm/sonner';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmToaster, RouterOutlet],
  template: `
    <router-outlet />
    <!-- Top, so toasts never sit under the floating action button, and below the notch. -->
    <hlm-toaster position="top-center" offset="calc(1rem + var(--safe-top))" richColors />
  `,
})
export class App {}
