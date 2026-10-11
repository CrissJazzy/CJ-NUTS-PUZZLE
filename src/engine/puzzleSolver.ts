import { HintResult } from '../types/game';
import { BOLT_CAPACITY, LevelManager } from './levelManager';

export class PuzzleSolver {
  static stateToString(bolts: number[][]): string {
    return bolts.map(b => b.join(',')).sort().join('|');
  }

  static findHint(bolts: number[][]): HintResult | null {
    const queue: { state: number[][]; firstMove: HintResult | null; depth: number }[] = [];
    const visited = new Set<string>();
    const initialCanonical = this.stateToString(bolts);

    queue.push({
      state: bolts.map(b => [...b]),
      firstMove: null,
      depth: 0
    });
    visited.add(initialCanonical);

    let bestHeuristicMove: HintResult | null = null;
    let bestHeuristicScore = -Infinity;

    let statesChecked = 0;
    const MAX_STATES = 2000;

    while (queue.length > 0 && statesChecked < MAX_STATES) {
      statesChecked++;
      const current = queue.shift()!;

      if (LevelManager.isSolved(current.state)) {
        return current.firstMove;
      }

      const numBolts = current.state.length;
      for (let from = 0; from < numBolts; from++) {
        if (current.state[from].length === 0) continue;
        const nutColor = current.state[from][current.state[from].length - 1];

        if (LevelManager.isBoltComplete(current.state[from])) continue;

        for (let to = 0; to < numBolts; to++) {
          if (to === from) continue;
          const destStack = current.state[to];
          if (destStack.length >= BOLT_CAPACITY) continue;

          const isMatch = (destStack.length === 0) || (destStack[destStack.length - 1] === nutColor);
          if (!isMatch) continue;

          const fromStack = current.state[from];
          const allSameInFrom = fromStack.every(c => c === nutColor);
          if (destStack.length === 0 && allSameInFrom) continue;

          if (current.depth === 0) {
            let score = 0;
            if (destStack.length > 0 && destStack[destStack.length - 1] === nutColor) {
              score += 50 + destStack.length * 10;
            }
            if (fromStack.length === 1) score += 25;
            if (destStack.length === 0) score -= 10;
            if (score > bestHeuristicScore) {
              bestHeuristicScore = score;
              bestHeuristicMove = { from, to, color: nutColor };
            }
          }

          const nextState = current.state.map(b => [...b]);
          const moved = nextState[from].pop()!;
          nextState[to].push(moved);

          const canonical = this.stateToString(nextState);
          if (!visited.has(canonical)) {
            visited.add(canonical);
            queue.push({
              state: nextState,
              firstMove: current.firstMove || { from, to, color: nutColor },
              depth: current.depth + 1
            });
          }
        }
      }
    }

    return bestHeuristicMove;
  }
}
