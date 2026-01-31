export const DEFAULT_CALENDAR_ID = "default";

export const makeDefaultCalendarDef = () => ({

  id: DEFAULT_CALENDAR_ID,

  name: "Default Calendar",
  weekdays: ["Day"],
  months: [{ name: "Month", length: 30 }],

  hoursPerDay: 24,
  minutesPerHour: 60,

  startDate: { year: 0, monthIndex: 0, day: 1, hour: 0, minute: 0 },

  moons: [],
  seasons: [],

  options: {
    dateFormat: "{wd} {d} {m}, {y}",
    firstWeekdayIndex: 0,
    showSeasons: true,
    showMoons: true,
  }
})

export const makeDefaultCalendarState = () => ({
  current: { year: 0, monthIndex: 0, day: 1, hour: 0, minute: 0 },
  events: [
    {
      id: "evt-...",
      title: "Council meeting",
      color: "#c9593f",
      description: "...",
      isPublic: true,
      start: { year: 0, monthIndex: 2, day: 10 },
      end: { year: 0, monthIndex: 2, day: 12 },
    }
  ],
})