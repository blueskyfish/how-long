import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { Countdown } from '../../core/models';

/**
 * The target date under the day counter, doubling as the switch between
 * countdowns. With only one stored there is nothing to pick, so it renders as
 * plain text rather than an inert dropdown.
 *
 * The menu is capped at half the safe viewport height. The CDK flips it above or
 * below the trigger depending on which side has more room, but measures that
 * against the raw viewport — so anything taller could be clamped under the notch.
 * At half the safe height one side always fits, whatever the scroll position.
 */
@Component({
  selector: 'app-countdown-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmDropdownMenuImports, NgIcon],
  template: `
    @if (hasChoice()) {
      <button
        [hlmDropdownMenuTrigger]="menu"
        align="center"
        class="hover:bg-accent focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xl tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-none"
        data-testid="target-date"
        [attr.aria-label]="'Countdown ' + selected().date + ', pick another'"
      >
        {{ selected().date }}
        <ng-icon name="lucideChevronDown" class="text-muted-foreground text-base" />
      </button>

      <ng-template #menu>
        <div
          hlmDropdownMenu
          class="max-h-[calc(50dvh-var(--safe-top)-var(--safe-bottom))] min-w-64"
          data-testid="countdown-menu"
        >
          @for (countdown of countdowns(); track countdown.id) {
            <button
              hlmDropdownMenuItem
              class="w-full"
              [attr.aria-current]="countdown.id === selected().id"
              [attr.data-testid]="'countdown-option-' + countdown.id"
              (click)="selectedChange.emit(countdown)"
            >
              <ng-icon
                name="lucideCheck"
                class="text-base"
                [class.invisible]="countdown.id !== selected().id"
              />
              <span class="flex min-w-0 flex-col items-start">
                <span class="font-mono tabular-nums">{{ countdown.date }}</span>
                @if (countdown.description) {
                  <span class="text-muted-foreground truncate text-xs">
                    {{ countdown.description }}
                  </span>
                }
              </span>
            </button>
          }
        </div>
      </ng-template>
    } @else {
      <p class="font-mono text-xl tabular-nums" data-testid="target-date">{{ selected().date }}</p>
    }
  `,
})
export class CountdownPicker {
  readonly countdowns = input.required<readonly Countdown[]>();
  readonly selected = input.required<Countdown>();

  readonly selectedChange = output<Countdown>();

  protected readonly hasChoice = computed(() => this.countdowns().length > 1);
}
