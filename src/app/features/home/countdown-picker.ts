import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { LocalDatePipe } from '../../core/i18n/local-date.pipe';
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
  imports: [HlmDropdownMenuImports, LocalDatePipe, NgIcon, TranslatePipe],
  templateUrl: './countdown-picker.html',
})
export class CountdownPicker {
  readonly countdowns = input.required<readonly Countdown[]>();
  readonly selected = input.required<Countdown>();

  readonly selectedChange = output<Countdown>();

  protected readonly hasChoice = computed(() => this.countdowns().length > 1);
}
