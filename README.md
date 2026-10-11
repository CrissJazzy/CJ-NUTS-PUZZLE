# CJ Nuts Puzzle

A realistic 3D metallic color-sorting nut puzzle game set in an industrial workshop environment.

## Features
- **Mechanics**: Real nut-sorting logic, smooth multi-stage 3D movement animations (lift, arc, slide down), legal move enforcement.
- **3D Graphics**: PBR Metallic materials, authentic hexagonal nuts with central cylindrical opening, steel threaded bolt shafts, rich wooden workbench table, soft directional shadows.
- **Progressive Levels**: 30 solvable levels generated from solved configurations with legal scrambles.
- **Solver & Hints**: Integrated BFS solver to guarantee solutions and provide hints.
- **Undo & Restart**: Full move history stack and level reset.
- **Audio & Haptics**: Procedural metallic sound synthesis via Web Audio API (no external downloads needed) and Android haptic feedback bridge.
- **Platforms**:
  - **Android**: Edge-to-edge hardware-accelerated WebView with native haptics integration.
  - **Web**: React + TypeScript + Three.js + Vite ready for Netlify / Vercel / GitHub Pages.

## Building and Running

### Android Application
Compile and build the APK via Gradle:
```bash
gradle assembleDebug
```

### Web Application (Vite / Netlify)
Install dependencies and run local dev server:
```bash
npm install
npm run dev
```

Build production static bundle for Netlify / web hosting:
```bash
npm run build
```
The output directory will be in `dist/`.
