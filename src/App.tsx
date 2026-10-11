import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import * as THREE from 'three';
import { LevelManager, BOLT_CAPACITY, NUT_COLORS_MAP } from './engine/levelManager';
import { PuzzleSolver } from './engine/puzzleSolver';
import { SoundEngine } from './engine/soundEngine';
import { MoveRecord } from './types/game';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState<number>(1);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [boardState, setBoardState] = useState<number[][]>([]);
  const [completedBolts, setCompletedBolts] = useState<number>(0);
  const [totalColors, setTotalColors] = useState<number>(3);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [showLevels, setShowLevels] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Engines
  const soundRef = useRef<SoundEngine | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const boltMeshesRef = useRef<THREE.Group[]>([]);
  const nutMeshesRef = useRef<THREE.Mesh[][]>([]);
  const boltPositionsRef = useRef<THREE.Vector3[]>([]);
  const selectionRingRef = useRef<THREE.Mesh | null>(null);
  const hintRingRef = useRef<THREE.Mesh | null>(null);
  const hexNutGeomRef = useRef<THREE.BufferGeometry | null>(null);
  const nutMaterialsRef = useRef<Record<number, THREE.MeshStandardMaterial>>({});

  const selectedBoltIndexRef = useRef<number | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const moveHistoryRef = useRef<MoveRecord[]>([]);

  // Init storage & sound
  useEffect(() => {
    soundRef.current = new SoundEngine();
    try {
      const savedUnlocked = localStorage.getItem('cj_nuts_unlocked');
      if (savedUnlocked) setUnlockedLevel(Math.max(1, parseInt(savedUnlocked, 10)));
      const savedLvl = localStorage.getItem('cj_nuts_current_level');
      if (savedLvl) setLevel(Math.max(1, parseInt(savedLvl, 10)));
    } catch {}
  }, []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [level]);

  // Three.js Mount
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1117);
    scene.fog = new THREE.FogExp2(0x0e1117, 0.022);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    keyLight.position.set(6, 16, 9);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7090b0, 0.6);
    fillLight.position.set(-8, 10, -6);
    scene.add(fillLight);

    // Table
    const tableGeom = new THREE.BoxGeometry(45, 1.2, 35);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.65, metalness: 0.15 });
    const tableMesh = new THREE.Mesh(tableGeom, tableMat);
    tableMesh.position.y = -0.6;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // Rings
    const ringGeom = new THREE.RingGeometry(1.25, 1.55, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const selRing = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({ color: 0xffb703, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    selRing.position.y = 0.12;
    selRing.visible = false;
    scene.add(selRing);
    selectionRingRef.current = selRing;

    const hintRing = new THREE.Mesh(ringGeom.clone(), new THREE.MeshBasicMaterial({ color: 0x06d6a0, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    hintRing.position.y = 0.12;
    hintRing.visible = false;
    scene.add(hintRing);
    hintRingRef.current = hintRing;

    // Nut geometry
    const shape = new THREE.Shape();
    const outerR = 1.12, innerR = 0.48;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = outerR * Math.cos(angle);
      const y = outerR * Math.sin(angle);
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const nutGeom = new THREE.ExtrudeGeometry(shape, { depth: 0.76, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.06, bevelThickness: 0.06 });
    nutGeom.center();
    nutGeom.rotateX(Math.PI / 2);
    nutGeom.computeVertexNormals();
    hexNutGeomRef.current = nutGeom;

    // Load initial level
    setupLevel(level, scene, camera);

    // Animation tick
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // Setup Level
  const setupLevel = (lvlIndex: number, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
    const puzzle = LevelManager.generateLevel(lvlIndex);
    const bolts = puzzle.bolts.map(b => [...b]);
    setBoardState(bolts);
    setTotalColors(puzzle.colorsCount);
    setMovesCount(0);
    setTimerSeconds(0);
    setCanUndo(false);
    moveHistoryRef.current = [];
    selectedBoltIndexRef.current = null;
    isAnimatingRef.current = false;

    // Clear old meshes
    boltMeshesRef.current.forEach(b => scene.remove(b));
    boltMeshesRef.current = [];
    nutMeshesRef.current.forEach(stack => stack.forEach(n => scene.remove(n)));
    nutMeshesRef.current = [];

    // Calculate positions
    const count = puzzle.totalBolts;
    const positions: THREE.Vector3[] = [];
    const spacingX = 3.3;
    if (count <= 4) {
      const startX = -((count - 1) * spacingX) / 2;
      for (let i = 0; i < count; i++) positions.push(new THREE.Vector3(startX + i * spacingX, 0, 0));
    } else {
      const cols = Math.ceil(count / 2);
      const startX = -((cols - 1) * spacingX) / 2;
      const spacingZ = 4.2;
      let idx = 0;
      for (let c = 0; c < cols && idx < count; c++, idx++) positions.push(new THREE.Vector3(startX + c * spacingX, 0, -spacingZ / 2));
      for (let c = 0; c < cols && idx < count; c++, idx++) positions.push(new THREE.Vector3(startX + c * spacingX, 0, spacingZ / 2));
    }
    boltPositionsRef.current = positions;

    // Camera
    const dist = count <= 5 ? 14 : 17;
    camera.position.set(0, dist * 1.05, dist * 1.35);
    camera.lookAt(0, 1.8, 0);

    // Create bolts & nuts
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.28 });
    for (let i = 0; i < count; i++) {
      const pos = positions[i];
      const boltGroup = new THREE.Group();
      boltGroup.position.copy(pos);

      const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, 0.3, 16), steelMat);
      baseMesh.position.y = 0.15;
      baseMesh.receiveShadow = true;
      boltGroup.add(baseMesh);

      const shaftMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 4.8, 16), steelMat);
      shaftMesh.position.y = 2.65;
      shaftMesh.receiveShadow = true;
      boltGroup.add(shaftMesh);

      scene.add(boltGroup);
      boltMeshesRef.current.push(boltGroup);

      const nutStack: THREE.Mesh[] = [];
      const stackData = bolts[i];
      for (let s = 0; s < stackData.length; s++) {
        const colorId = stackData[s];
        if (!nutMaterialsRef.current[colorId]) {
          const colorDef = NUT_COLORS_MAP[colorId] || NUT_COLORS_MAP[1];
          nutMaterialsRef.current[colorId] = new THREE.MeshStandardMaterial({ color: colorDef.hex, metalness: 0.82, roughness: 0.22 });
        }
        const nutMesh = new THREE.Mesh(hexNutGeomRef.current!, nutMaterialsRef.current[colorId]);
        nutMesh.position.set(pos.x, 0.72 + s * 0.88, pos.z);
        scene.add(nutMesh);
        nutStack.push(nutMesh);
      }
      nutMeshesRef.current.push(nutStack);
    }

    if (selectionRingRef.current) selectionRingRef.current.visible = false;
    if (hintRingRef.current) hintRingRef.current.visible = false;

    // Check completed count
    let completed = 0;
    bolts.forEach(b => { if (LevelManager.isBoltComplete(b)) completed++; });
    setCompletedBolts(completed);
  };

  const loadNewLevel = (newLevel: number) => {
    setLevel(newLevel);
    setShowLevels(false);
    setShowVictory(false);
    setHintText(null);
    if (sceneRef.current && cameraRef.current) {
      setupLevel(newLevel, sceneRef.current, cameraRef.current);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimatingRef.current || showVictory || showLevels || showSettings || showRules) return;
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // Check hit against bolt positions
    let hitIndex: number | null = null;
    let minDistance = 2.4;
    boltPositionsRef.current.forEach((pos, idx) => {
      const ray = raycaster.ray;
      const dist = ray.distanceToPoint(new THREE.Vector3(pos.x, 2.5, pos.z));
      if (dist < minDistance) {
        minDistance = dist;
        hitIndex = idx;
      }
    });

    if (hitIndex === null) return;

    const fromIdx = selectedBoltIndexRef.current;
    if (fromIdx === null) {
      // Select source
      if (boardState[hitIndex].length === 0) {
        soundRef.current?.playInvalid();
        return;
      }
      selectedBoltIndexRef.current = hitIndex;
      soundRef.current?.playSelect();
      soundRef.current?.playLift();

      if (selectionRingRef.current) {
        const p = boltPositionsRef.current[hitIndex];
        selectionRingRef.current.position.set(p.x, 0.12, p.z);
        selectionRingRef.current.visible = true;
      }

      // Lift nut
      const topNut = nutMeshesRef.current[hitIndex][nutMeshesRef.current[hitIndex].length - 1];
      if (topNut) topNut.position.y = 5.85;
    } else if (fromIdx === hitIndex) {
      // Deselect
      selectedBoltIndexRef.current = null;
      if (selectionRingRef.current) selectionRingRef.current.visible = false;
      const topNut = nutMeshesRef.current[hitIndex][nutMeshesRef.current[hitIndex].length - 1];
      if (topNut) topNut.position.y = 0.72 + (boardState[hitIndex].length - 1) * 0.88;
      soundRef.current?.playSelect();
    } else {
      // Destination
      const toIdx = hitIndex;
      const fromStack = boardState[fromIdx];
      const toStack = boardState[toIdx];
      const nutColor = fromStack[fromStack.length - 1];

      const isLegal = toStack.length < BOLT_CAPACITY && (toStack.length === 0 || toStack[toStack.length - 1] === nutColor);

      if (!isLegal) {
        soundRef.current?.playInvalid();
        return;
      }

      // Execute Move
      isAnimatingRef.current = true;
      if (selectionRingRef.current) selectionRingRef.current.visible = false;
      selectedBoltIndexRef.current = null;

      const nutMesh = nutMeshesRef.current[fromIdx].pop()!;
      const destPos = boltPositionsRef.current[toIdx];
      const destY = 0.72 + toStack.length * 0.88;

      nutMesh.position.set(destPos.x, destY, destPos.z);
      nutMeshesRef.current[toIdx].push(nutMesh);

      const nextState = boardState.map(b => [...b]);
      nextState[fromIdx].pop();
      nextState[toIdx].push(nutColor);
      setBoardState(nextState);

      moveHistoryRef.current.push({ from: fromIdx, to: toIdx, color: nutColor });
      setMovesCount(c => c + 1);
      setCanUndo(true);

      soundRef.current?.playDrop();

      let completed = 0;
      nextState.forEach(b => { if (LevelManager.isBoltComplete(b)) completed++; });
      setCompletedBolts(completed);

      isAnimatingRef.current = false;

      if (LevelManager.isSolved(nextState)) {
        soundRef.current?.playWin();
        if (level >= unlockedLevel && level < 30) {
          setUnlockedLevel(level + 1);
          try { localStorage.setItem('cj_nuts_unlocked', (level + 1).toString()); } catch {}
        }
        setShowVictory(true);
      }
    }
  };

  const handleUndo = () => {
    if (moveHistoryRef.current.length === 0 || isAnimatingRef.current) return;
    const last = moveHistoryRef.current.pop()!;
    const nutMesh = nutMeshesRef.current[last.to].pop()!;
    const fromPos = boltPositionsRef.current[last.from];
    const fromY = 0.72 + (boardState[last.from].length) * 0.88;

    nutMesh.position.set(fromPos.x, fromY, fromPos.z);
    nutMeshesRef.current[last.from].push(nutMesh);

    const nextState = boardState.map(b => [...b]);
    nextState[last.to].pop();
    nextState[last.from].push(last.color);
    setBoardState(nextState);

    setMovesCount(c => Math.max(0, c - 1));
    setCanUndo(moveHistoryRef.current.length > 0);
    soundRef.current?.playLift();
  };

  const handleHint = () => {
    const hint = PuzzleSolver.findHint(boardState);
    if (!hint) {
      setHintText("No legal progress found. Try Undo!");
      return;
    }
    const colorDef = NUT_COLORS_MAP[hint.color];
    setHintText(`Hint: Move ${colorDef?.name || 'Nut'} from Bolt ${hint.from + 1} to Bolt ${hint.to + 1}`);
    soundRef.current?.playSelect();
  };

  return (
    <div className="game-container" onPointerDown={handlePointerDown}>
      <div ref={containerRef} className="canvas-viewport" />

      <div className="ui-layer">
        <header className="top-bar">
          <div className="brand-section">
            <svg className="brand-icon" viewBox="0 0 24 24" fill="none">
              <polygon points="12,2 20.66,7 20.66,17 12,22 3.34,17 3.34,7" fill="#ffb703" stroke="#ffd166" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="4.5" fill="#141824" stroke="#ffb703" strokeWidth="1"/>
            </svg>
            <span className="brand-title">CJ NUTS</span>
          </div>

          <button className="level-badge" onClick={() => setShowLevels(true)}>
            <span>LVL {level}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>

          <div className="top-actions">
            <button className="icon-btn" onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (soundRef.current) soundRef.current.enabled = next;
            }}>
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <button className="icon-btn" onClick={() => setShowSettings(true)}>⚙</button>
          </div>
        </header>

        <div className="hud-panel">
          <div className="hud-item"><span className="hud-label">Moves</span><span className="hud-value">{movesCount}</span></div>
          <div className="hud-divider"></div>
          <div className="hud-item"><span className="hud-label">Time</span><span className="hud-value">{Math.floor(timerSeconds/60).toString().padStart(2,'0')}:{(timerSeconds%60).toString().padStart(2,'0')}</span></div>
          <div className="hud-divider"></div>
          <div className="hud-item"><span className="hud-label">Sorted</span><span className="hud-value">{completedBolts}/{totalColors}</span></div>
        </div>

        {hintText && <div className="hint-banner">{hintText}</div>}

        <div style={{ flex: 1 }} />

        <footer className="bottom-controls">
          <button className="action-btn" onClick={handleUndo} disabled={!canUndo}>
            <span>Undo</span>
          </button>
          <button className="action-btn" onClick={handleHint}>
            <span>Hint</span>
          </button>
          <button className="action-btn" onClick={() => loadNewLevel(level)}>
            <span>Restart</span>
          </button>
          <button className="action-btn" onClick={() => setShowRules(true)}>
            <span>Rules</span>
          </button>
        </footer>
      </div>

      {showVictory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="victory-title">LEVEL COMPLETE!</h2>
            <div className="stars-row">
              <span className="star-icon filled">★</span>
              <span className="star-icon filled">★</span>
              <span className="star-icon filled">★</span>
            </div>
            <button className="primary-btn" onClick={() => loadNewLevel(level + 1)}>NEXT LEVEL</button>
            <button className="secondary-btn" onClick={() => loadNewLevel(level)}>Play Again</button>
          </div>
        </div>
      )}

      {showLevels && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Select Level</h3>
              <button className="close-btn" onClick={() => setShowLevels(false)}>✕</button>
            </div>
            <div className="levels-grid">
              {Array.from({ length: 30 }, (_, i) => i + 1).map(l => (
                <div
                  key={l}
                  className={`level-cell ${l === level ? 'current' : ''} ${l > unlockedLevel ? 'locked' : ''}`}
                  onClick={() => l <= unlockedLevel && loadNewLevel(l)}
                >
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Settings</h3>
              <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <button className="secondary-btn" onClick={() => {
              setUnlockedLevel(1);
              loadNewLevel(1);
              setShowSettings(false);
            }}>Reset Progress</button>
          </div>
        </div>
      )}

      {showRules && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">How To Play</h3>
              <button className="close-btn" onClick={() => setShowRules(false)}>✕</button>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Sort the colorful metallic nuts so that each occupied bolt holds only one color.
              Tap a bolt to lift its top nut, then tap an empty bolt or a bolt with a matching top color to drop it.
            </p>
            <button className="primary-btn" onClick={() => setShowRules(false)}>GOT IT</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
