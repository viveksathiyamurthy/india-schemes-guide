# India Schemes Guide

A website that explains Indian government schemes, subsidies and concessions for MSMEs, farmers, home seekers / house owners, students and women. Every scheme links to its official government source. Tamil Nadu is the pilot state.

Built with Next.js (App Router) and TypeScript. The scheme data starts as a copy of the "India Schemes Guide - Data" Google Sheet.

## The four screens

1. **Welcome** (`/`): welcome text, search bar, choose a state.
2. **Persona** (`/tamil-nadu`): choose who you are.
3. **Scheme list** (`/tamil-nadu/woman`): all relevant schemes. Searching from screen 1 or 2 goes to `/search?q=...` (with `&state=...` once a state is chosen).
4. **Scheme detail** (`/scheme/pm-kisan`): full details and the button to the official government website.

## Rules built into the code

- Once a state is chosen, every search is limited to that state's schemes and Union/Central Government schemes. Before a state is chosen, search covers all states and the Union/Central Government (`src/lib/search.ts`).
- A scheme is published only if its status is Active, its review status is Verified and it has an official link.
- Tamil text falls back to English, with a short note, wherever the Tamil column is still empty.
- The disclaimer strip is on every page. No government emblems or logos are used.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Update scheme data

Edit `src/data/schemes.ts` (one entry per sheet row). Field names follow the sheet columns. To add a state or a persona, edit `src/data/config.ts`. Interface text in English and Tamil is in `src/lib/ui.ts`.

The Tamil interface text was written by Claude and needs review by a native Tamil speaker.

## Tests

`tests/logic.test.ts` checks the search and scope rules (`npx tsx tests/logic.test.ts`). `tests/harness` runs the real components in a browser without Next.js, for flow checks.

## Screen 1 globe

`src/components/EarthIntro.tsx` draws the Earth with WebGL: it turns to face India, zooms onto the five southern states, keeps those sharp and blurs the rest slightly. Devices without WebGL get the flat map (`StateMap`), and reduced-motion settings skip the intro.

The images in `public/earth/` are NASA Blue Marble imagery (public domain, visibleearth.nasa.gov), made by `scripts/build-earth-textures.py`. The state outlines in `src/data/southGeo.ts` come from `scripts/build-south-geo.mjs`.
