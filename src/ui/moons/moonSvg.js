/** 0..1 -> bucket (0..7) : new, wax-cres, first-q, wax-gib, full, wane-gib, last-q, wane-cres */
export function phaseBucket(p) {
  const n = ((p % 1) + 1) % 1;
  if (n < 0.0625 || n >= 0.9375) return 0; // new
  if (n < 0.1875) return 1; // waxing crescent
  if (n < 0.3125) return 2; // first quarter
  if (n < 0.4375) return 3; // waxing gibbous
  if (n < 0.5625) return 4; // full
  if (n < 0.6875) return 5; // waning gibbous
  if (n < 0.8125) return 6; // last quarter
  return 7; // waning crescent
}

export function labelForBucket(bucket, t = (s) => s) {
  // You can replace these with i18n keys later.
  switch (bucket) {
    case 0: return t("New");
    case 1: return t("Waxing crescent");
    case 2: return t("First quarter");
    case 3: return t("Waxing gibbous");
    case 4: return t("Full");
    case 5: return t("Waning gibbous");
    case 6: return t("Last quarter");
    default: return t("Waning crescent");
  }
}

/**
 * Returns an SVGElement (not a string) for a moon icon.
 * bucket: 0..7
 * color: fill color of the moon disk
 * size: px (default 20)
 */
export function createMoonSvg({ bucket, color = "#ffffff", title = "", size = 20 }) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.style.display = "inline-block";
  svg.style.verticalAlign = "middle";

  const defs = document.createElementNS(NS, "defs");

  // Mask
  const mask = document.createElementNS(NS, "mask");
  const maskId = `m${Math.random().toString(36).slice(2)}`;
  mask.setAttribute("id", maskId);

  const mBase = document.createElementNS(NS, "circle");
  mBase.setAttribute("cx", "8");
  mBase.setAttribute("cy", "8");
  mBase.setAttribute("r", "7");
  mBase.setAttribute("fill", "white");
  mask.appendChild(mBase);

  const mShade = document.createElementNS(NS, "circle");
  mShade.setAttribute("cx", "8");
  mShade.setAttribute("cy", "8");
  mShade.setAttribute("r", "7.2");
  mShade.setAttribute("fill", "black");

  const shift = [0, 2.6, 4.0, 5.1, 8.5, -5.1, -4.0, -2.6][bucket] ?? 0;

  // Full moon -> no shade in mask
  if (bucket !== 4) {
    mShade.setAttribute("transform", `translate(${shift},0)`);
    mask.appendChild(mShade);
  }

  defs.appendChild(mask);

  // Radial highlight (use stop-opacity for better SVG compatibility)
  const grad = document.createElementNS(NS, "radialGradient");
  const gradId = `g${Math.random().toString(36).slice(2)}`;
  grad.setAttribute("id", gradId);
  grad.setAttribute("cx", "35%");
  grad.setAttribute("cy", "35%");
  grad.setAttribute("r", "65%");

  const stop1 = document.createElementNS(NS, "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#ffffff");
  stop1.setAttribute("stop-opacity", "0.35");

  const stop2 = document.createElementNS(NS, "stop");
  stop2.setAttribute("offset", "100%");
  stop2.setAttribute("stop-color", "#ffffff");
  stop2.setAttribute("stop-opacity", "0");

  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);

  svg.appendChild(defs);

  // Colored disk (tinted!)
  const disk = document.createElementNS(NS, "circle");
  disk.setAttribute("cx", "8");
  disk.setAttribute("cy", "8");
  disk.setAttribute("r", "7");
  disk.setAttribute("fill", color || "#fff");
  disk.setAttribute("mask", `url(#${maskId})`);
  disk.setAttribute("stroke", "rgba(0,0,0,0.22)");
  disk.setAttribute("stroke-width", "0.5");
  svg.appendChild(disk);

  // Highlight
  const shine = document.createElementNS(NS, "circle");
  shine.setAttribute("cx", "8");
  shine.setAttribute("cy", "8");
  shine.setAttribute("r", "7");
  shine.setAttribute("fill", `url(#${gradId})`);
  shine.setAttribute("mask", `url(#${maskId})`);
  svg.appendChild(shine);

  if (title) {
    const tt = document.createElementNS(NS, "title");
    tt.textContent = title;
    svg.appendChild(tt);
  }

  return svg;
}

/**
 * Simple preview phase calculator if you *don't* want the service.
 * - dayNumber: any integer (e.g. day-of-year, or absolute day)
 * - cycle: days per cycle
 * - offset: day offset
 * Returns phase in [0..1)
 */
export function calcPhase({ dayNumber = 0, cycle = 30, offset = 0 }) {
  const c = Math.max(1, Math.floor(Number(cycle) || 30));
  const o = Math.floor(Number(offset) || 0);
  const d = Math.floor(Number(dayNumber) || 0);
  const raw = (d + o) / c;
  return ((raw % 1) + 1) % 1;
}