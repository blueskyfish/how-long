/** Colour swatches offered when creating or editing an appointment. */
export const APPOINTMENT_COLORS = [
  { name: 'Azure', value: '#1e88e5' },
  { name: 'Teal', value: '#00897b' },
  { name: 'Green', value: '#43a047' },
  { name: 'Lime', value: '#c0ca33' },
  { name: 'Amber', value: '#ffb300' },
  { name: 'Orange', value: '#fb8c00' },
  { name: 'Red', value: '#e53935' },
  { name: 'Pink', value: '#d81b60' },
  { name: 'Purple', value: '#8e24aa' },
  { name: 'Indigo', value: '#3949ab' },
  { name: 'Brown', value: '#6d4c41' },
  { name: 'Slate', value: '#546e7a' },
] as const;

/** Icons offered when creating or editing an appointment; names from {@link APP_ICONS}. */
export const APPOINTMENT_ICONS = [
  { name: 'Calendar', value: 'lucideCalendar' },
  { name: 'Flag', value: 'lucideFlag' },
  { name: 'Star', value: 'lucideStar' },
  { name: 'Heart', value: 'lucideHeart' },
  { name: 'Party', value: 'lucidePartyPopper' },
  { name: 'Cake', value: 'lucideCake' },
  { name: 'Gift', value: 'lucideGift' },
  { name: 'Graduation', value: 'lucideGraduationCap' },
  { name: 'Work', value: 'lucideBriefcase' },
  { name: 'Flight', value: 'lucidePlane' },
  { name: 'Hotel', value: 'lucideHotel' },
  { name: 'Car', value: 'lucideCar' },
  { name: 'Food', value: 'lucideUtensils' },
  { name: 'Trophy', value: 'lucideTrophy' },
  { name: 'Music', value: 'lucideMusic' },
  { name: 'Health', value: 'lucideStethoscope' },
  { name: 'Money', value: 'lucideBanknote' },
  { name: 'Checklist', value: 'lucideListChecks' },
  { name: 'Alarm', value: 'lucideAlarmClock' },
  { name: 'Holiday', value: 'lucideUmbrella' },
] as const;

export const DEFAULT_APPOINTMENT_COLOR: string = APPOINTMENT_COLORS[0].value;
export const DEFAULT_APPOINTMENT_ICON: string = APPOINTMENT_ICONS[0].value;
