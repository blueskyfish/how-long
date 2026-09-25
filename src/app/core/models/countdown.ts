/** A target date the application counts down to. */
export interface Countdown {
  id?: number;
  /** Local calendar day in ISO format (`yyyy-mm-dd`). */
  date: string;
  description?: string;
}
