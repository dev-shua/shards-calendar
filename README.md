![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) [![ko-fi](https://img.shields.io/badge/Ko--fi-Support%20me-FF5E5B?logo=kofi&logoColor=white)](https://ko-fi.com/shua)

# SHARDS Calendar

A fully customizable in-world calendar for Foundry VTT. Supports custom time systems, lunar cycles, seasons, and weather — all managed by the GM, optionally visible to players.

> **Requires:** [SHARDS Core](https://github.com/dev-shua/shards-core)

---

## Features

### Calendar
Define your world's time system from scratch — custom months, weekday names, month lengths, and week start day. Multiple calendars can be created and switched at any time.

### Date management
The GM has full control over the current date. Shift+Click any day in the calendar view to set it instantly.

### Events
Create in-world events on any date — one-shot or recurring (monthly, yearly). Events can be public (visible to players) or GM-only. Multi-day events are supported.

### Moons
Define any number of moons with custom names, cycle lengths, offsets, and colors. Phases are calculated automatically and displayed in the calendar view and the date chip.

### Seasons
Define seasons with custom start dates. The current season is tracked automatically and used by the weather system.

### Weather *(optional)*
When enabled, weather is generated automatically each day based on the current season's configuration. Per-season settings include temperature ranges, daily variation, and precipitation types. The GM can override any day's weather manually.

### Date chip
A small draggable widget on the canvas showing the current in-world date and moon phases at a glance. Visibility can be restricted to GM only or shared with all players.

---

## Installation

In Foundry VTT, go to **Add-on Modules → Install Module** and paste the manifest URL:

```
https://raw.githubusercontent.com/dev-shua/shards-calendar/main/public/module.json
```

Make sure **SHARDS Core** is installed and enabled first.

---

## Settings

| Setting | Description |
|---------|-------------|
| Calendar access | Who can open the calendar view — Nobody, GM only, or All players |
| Enable weather | Toggles automatic daily weather generation |
| Display logs in chat | Posts a chat message whenever the date changes |

The full calendar configuration (structure, moons, seasons, weather, events) is accessible from **Module Settings → Open Calendar**.

---

## Compatibility

| Foundry VTT | Verified |
|-------------|----------|
| v13         | ✔        |
| v14         | ✔        |

System-agnostic — works with any game system.