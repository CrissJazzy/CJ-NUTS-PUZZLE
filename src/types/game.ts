export interface NutColor {
  id: number;
  name: string;
  hex: number;
  color: string;
}

export interface MoveRecord {
  from: number;
  to: number;
  color: number;
}

export interface LevelConfig {
  colorsCount: number;
  emptyBoltsCount: number;
  scrambles: number;
}

export interface PuzzleData {
  levelNumber: number;
  bolts: number[][];
  colorsCount: number;
  totalBolts: number;
}

export interface HintResult {
  from: number;
  to: number;
  color: number;
}
