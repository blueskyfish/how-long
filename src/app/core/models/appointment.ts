/** An appointment (milestone) on the way to a countdown's target date. */
export interface Appointment {
  id?: number;
  /** Foreign key to the owning {@link Countdown}. */
  countdownId: number;
  /** Local calendar day in ISO format (`yyyy-mm-dd`). */
  date: string;
  title: string;
  /** CSS colour, stored as a hex string (`#rrggbb`). */
  color: string;
  /** Material Symbols ligature name, e.g. `flag`. */
  icon: string;
}
