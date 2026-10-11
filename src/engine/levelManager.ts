import { LevelConfig, PuzzleData } from '../types/game';

export const BOLT_CAPACITY = 4;

export const NUT_COLORS_MAP: Record<number, { id: number; name: string; hex: number; color: string }> = {
  1: { id: 1, name: 'Emerald', hex: 0x10b981, color: '#10b981' },
  2: { id: 2, name: 'Gold', hex: 0xf59e0b, color: '#f59e0b' },
  3: { id: 3, name: 'Ruby', hex: 0xe63946, color: '#e63946' },
  4: { id: 4, name: 'Sapphire', hex: 0x2563eb, color: '#2563eb' },
  5: { id: 5, name: 'Amethyst', hex: 0x8b5cf6, color: '#8b5cf6' },
  6: { id: 6, name: 'Cyan', hex: 0x06b6d4, color: '#06b6d4' },
  7: { id: 7, name: 'Copper', hex: 0xf97316, color: '#f97316' }
};

export function createSeededRandom(seed: number) {
  let s = Math.sin(seed) * 10000;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export class LevelManager {
  static getLevelConfig(levelIndex: number): LevelConfig {
    let colorsCount: number, emptyBoltsCount: number, scrambles: number;
    if (levelIndex === 1) {
      colorsCount = 3; emptyBoltsCount = 1; scrambles = 7;
    } else if (levelIndex === 2) {
      colorsCount = 3; emptyBoltsCount = 1; scrambles = 12;
    } else if (levelIndex === 3) {
      colorsCount = 3; emptyBoltsCount = 2; scrambles = 16;
    } else if (levelIndex === 4) {
      colorsCount = 4; emptyBoltsCount = 1; scrambles = 15;
    } else if (levelIndex === 5) {
      colorsCount = 4; emptyBoltsCount = 2; scrambles = 20;
    } else if (levelIndex <= 10) {
      colorsCount = 4; emptyBoltsCount = (levelIndex % 2 === 0) ? 1 : 2; scrambles = 20 + levelIndex * 3;
    } else if (levelIndex <= 15) {
      colorsCount = 5; emptyBoltsCount = 2; scrambles = 30 + (levelIndex - 10) * 4;
    } else if (levelIndex <= 20) {
      colorsCount = 5; emptyBoltsCount = 2; scrambles = 45 + (levelIndex - 15) * 4;
    } else if (levelIndex <= 25) {
      colorsCount = 6; emptyBoltsCount = 2; scrambles = 55 + (levelIndex - 20) * 5;
    } else {
      colorsCount = 6; emptyBoltsCount = 2; scrambles = 70 + (levelIndex - 25) * 6;
    }
    return { colorsCount, emptyBoltsCount, scrambles };
  }

  static generateLevel(levelIndex: number): PuzzleData {
    const config = this.getLevelConfig(levelIndex);
    const totalBolts = config.colorsCount + config.emptyBoltsCount;
    const rng = createSeededRandom(levelIndex * 7919 + 42);

    const bolts: number[][] = [];
    for (let c = 1; c <= config.colorsCount; c++) {
      bolts.push([c, c, c, c]);
    }
    for (let e = 0; e < config.emptyBoltsCount; e++) {
      bolts.push([]);
    }

    let lastFrom = -1;
    let lastTo = -1;
    let movesApplied = 0;
    const maxAttempts = config.scrambles * 8;
    let attempts = 0;

    while (movesApplied < config.scrambles && attempts < maxAttempts) {
      attempts++;
      const fromIdx = Math.floor(rng() * totalBolts);
      if (bolts[fromIdx].length === 0) continue;

      const toIdx = Math.floor(rng() * totalBolts);
      if (toIdx === fromIdx) continue;
      if (bolts[toIdx].length >= BOLT_CAPACITY) continue;

      if (fromIdx === lastTo && toIdx === lastFrom) continue;

      const nut = bolts[fromIdx].pop()!;
      bolts[toIdx].push(nut);
      lastFrom = fromIdx;
      lastTo = toIdx;
      movesApplied++;
    }

    if (this.isSolved(bolts)) {
      if (bolts[0].length > 0 && bolts[1].length > 0) {
        const temp = bolts[0].pop()!;
        bolts[1].push(temp);
      }
    }

    return {
      levelNumber: levelIndex,
      bolts: bolts.map(b => [...b]),
      colorsCount: config.colorsCount,
      totalBolts: totalBolts
    };
  }

  static isSolved(bolts: number[][]): boolean {
    for (let i = 0; i < bolts.length; i++) {
      const stack = bolts[i];
      if (stack.length === 0) continue;
      if (stack.length !== BOLT_CAPACITY) return false;
      const color = stack[0];
      for (let j = 1; j < stack.length; j++) {
        if (stack[j] !== color) return false;
      }
    }
    return true;
  }

  static isBoltComplete(stack: number[]): boolean {
    if (stack.length !== BOLT_CAPACITY) return false;
    const c = stack[0];
    return stack.every(x => x === c);
  }
}
