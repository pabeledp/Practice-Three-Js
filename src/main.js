import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { ColorGradeShader } from './shaders/ColorGradeShader.js';
import { StudioAudioEngine } from './components/AudioEngine.js';

// Setup Audio Engine
const audio = new StudioAudioEngine();

// Scene, Camera, Renderer
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 150);
camera.position.set(5, 2, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// Controls (Orbit mode)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.7, 0);
controls.enabled = false; // Enabled only in Free Orbit shot

// Sky and Atmospheric Lighting (From three.js keyframes example)
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const uniforms = sky.material.uniforms;
uniforms['turbidity'].value = 0;
uniforms['rayleigh'].value = 3;
uniforms['mieDirectionalG'].value = 0.7;
uniforms['cloudElevation'].value = 1;
uniforms['sunPosition'].value.set(-0.8, 0.19, 0.56);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environment = pmremGenerator.fromScene(sky).texture;
scene.environment = environment;

// Directional Sun Light
const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
sunLight.position.set(-8, 6, 5);
sunLight.castShadow = true;
scene.add(sunLight);

// Subtle Cyan Ambient Fill
const fillLight = new THREE.AmbientLight(0x0284c7, 0.6);
scene.add(fillLight);

// Post-Processing Pipeline
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const colorGradePass = new ShaderPass(ColorGradeShader);
composer.addPass(colorGradePass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// Animation State
let mixer = null;
let clipAction = null;
let clipDuration = 10.0;
let isPlaying = true;
let playbackSpeed = 1.0;

// Director Camera Presets
const SHOTS = [
  { name: 'SHOT 01: MASTER', pos: new THREE.Vector3(5, 2, 8), target: new THREE.Vector3(0, 0.7, 0) },
  { name: 'SHOT 02: TRACKING', pos: new THREE.Vector3(2.4, 1.1, 2.8), target: new THREE.Vector3(0.2, 0.8, 0.1) },
  { name: 'SHOT 03: ROOFTOP', pos: new THREE.Vector3(-3.8, 3.4, 4.2), target: new THREE.Vector3(0, 1.2, 0) },
  { name: 'FREE ORBIT', pos: new THREE.Vector3(5, 2, 8), target: new THREE.Vector3(0, 0.7, 0) }
];

let activeShotIndex = 0;
const targetCamPos = SHOTS[0].pos.clone();
const targetCamLook = SHOTS[0].target.clone();
const currentCamLook = SHOTS[0].target.clone();

// Load Animated Model: LittlestTokyo.glb
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./draco/gltf/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load(
  './models/gltf/LittlestTokyo.glb',
  (gltf) => {
    const model = gltf.scene;
    model.position.set(1, 1, 0);
    model.scale.set(0.01, 0.01, 0.01);
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);
    if (gltf.animations && gltf.animations.length > 0) {
      clipAction = mixer.clipAction(gltf.animations[0]);
      clipAction.play();
      clipDuration = gltf.animations[0].duration;
    }
  },
  undefined,
  (err) => console.error('GLTF loading error:', err)
);

// Timeline Scrubber & UI Bindings
const timelineTrack = document.getElementById('timeline-track');
const playheadNeedle = document.getElementById('playhead-needle');
const tcDisplay = document.getElementById('tc-display');
const btnPlay = document.getElementById('btn-play');
const btnRw = document.getElementById('btn-rw');
const btnFf = document.getElementById('btn-ff');
const speedBadge = document.getElementById('speed-badge');
const soundBtn = document.getElementById('sound-btn');
const soundLabel = document.getElementById('sound-label');
const drawer = document.getElementById('case-drawer');
const drawerBtn = document.getElementById('drawer-btn');
const closeDrawerBtn = document.getElementById('close-drawer-btn');

let isScrubbing = false;

function scrubToX(clientX) {
  if (!clipAction) return;
  const rect = timelineTrack.getBoundingClientRect();
  const rawProgress = (clientX - rect.left) / rect.width;
  const progress = Math.max(0, Math.min(1, rawProgress));

  clipAction.time = progress * clipDuration;
  mixer.update(0); // Immediately evaluate frame

  playheadNeedle.style.left = `${progress * 100}%`;
  updateTimecode(clipAction.time);
  audio.playScrubTick();
}

timelineTrack.addEventListener('pointerdown', (e) => {
  isScrubbing = true;
  scrubToX(e.clientX);
});

window.addEventListener('pointermove', (e) => {
  if (isScrubbing) scrubToX(e.clientX);
});

window.addEventListener('pointerup', () => {
  isScrubbing = false;
});

// Clickable Keyframe Diamonds
document.querySelectorAll('.keyframe-diamond').forEach(kf => {
  kf.addEventListener('click', (e) => {
    e.stopPropagation();
    const pct = parseFloat(kf.style.left) / 100;
    if (clipAction) {
      clipAction.time = pct * clipDuration;
      mixer.update(0);
      playheadNeedle.style.left = `${pct * 100}%`;
      updateTimecode(clipAction.time);
      audio.playClick(1800);
    }
  });
});

// Playback Transport Controls
function togglePlay() {
  isPlaying = !isPlaying;
  btnPlay.textContent = isPlaying ? '⏸' : '▶';
  audio.playClick();
}

btnPlay.addEventListener('click', togglePlay);

btnRw.addEventListener('click', () => {
  playbackSpeed = playbackSpeed === -1.0 ? -2.0 : -1.0;
  speedBadge.textContent = `${playbackSpeed}x`;
  audio.playClick(900);
});

btnFf.addEventListener('click', () => {
  playbackSpeed = playbackSpeed === 1.0 ? 2.0 : (playbackSpeed === 2.0 ? 4.0 : 1.0);
  speedBadge.textContent = `${playbackSpeed}x`;
  audio.playClick(1500);
});

// J-K-L Video Editing Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlay();
  } else if (e.code === 'KeyK') {
    isPlaying = false;
    btnPlay.textContent = '▶';
  } else if (e.code === 'KeyL') {
    isPlaying = true;
    playbackSpeed = Math.min(4.0, playbackSpeed > 0 ? playbackSpeed * 2 : 1.0);
    speedBadge.textContent = `${playbackSpeed}x`;
    btnPlay.textContent = '⏸';
  } else if (e.code === 'KeyJ') {
    isPlaying = true;
    playbackSpeed = Math.max(-4.0, playbackSpeed < 0 ? playbackSpeed * 2 : -1.0);
    speedBadge.textContent = `${playbackSpeed}x`;
    btnPlay.textContent = '⏸';
  } else if (e.key >= '1' && e.key <= '4') {
    const idx = parseInt(e.key) - 1;
    selectShot(idx);
  }
});

// Shot Switcher Buttons
const shotButtons = document.querySelectorAll('.shot-btn');
shotButtons.forEach((btn, idx) => {
  btn.addEventListener('click', () => selectShot(idx));
});

function selectShot(idx) {
  if (idx < 0 || idx >= SHOTS.length) return;
  activeShotIndex = idx;
  shotButtons.forEach(b => b.classList.remove('active'));
  shotButtons[idx].classList.add('active');

  const shot = SHOTS[idx];
  targetCamPos.copy(shot.pos);
  targetCamLook.copy(shot.target);

  if (idx === 3) {
    // Free Orbit
    controls.enabled = true;
    controls.target.copy(shot.target);
  } else {
    controls.enabled = false;
  }

  audio.playClick(1600);
}

// LUT Color Grading Toggles
const lutButtons = document.querySelectorAll('.lut-btn');
lutButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    lutButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const lutMode = parseInt(btn.dataset.lut);
    colorGradePass.uniforms.uGradeMode.value = lutMode;
    audio.playClick(1200);
  });
});

// Post FX Checkboxes
document.getElementById('scanlines-chk').addEventListener('change', (e) => {
  colorGradePass.uniforms.uScanlines.value = e.target.checked ? 1.0 : 0.0;
});

document.getElementById('grain-chk').addEventListener('change', (e) => {
  colorGradePass.uniforms.uGrain.value = e.target.checked ? 0.04 : 0.0;
});

// Audio & Drawer Toggles
soundBtn.addEventListener('click', () => {
  const ok = audio.unlock();
  if (ok) {
    soundLabel.textContent = 'ACTIVE';
    soundBtn.style.borderColor = '#22c55e';
    soundBtn.style.color = '#22c55e';
  }
});

drawerBtn.addEventListener('click', () => drawer.classList.add('open'));
closeDrawerBtn.addEventListener('click', () => drawer.classList.remove('open'));

function updateTimecode(seconds) {
  const total = Math.max(0, seconds);
  const mins = String(Math.floor(total / 60)).padStart(2, '0');
  const secs = String(Math.floor(total % 60)).padStart(2, '0');
  const frames = String(Math.floor((total * 24) % 24)).padStart(2, '0');
  tcDisplay.textContent = `00:${mins}:${secs}:${frames}`;
}

// Resize Listener
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  colorGradePass.uniforms.uTime.value += delta;

  // Update AnimationMixer
  if (mixer && isPlaying && !isScrubbing) {
    const step = delta * playbackSpeed;
    mixer.update(step);

    if (clipAction) {
      // Loop wrapping
      if (clipAction.time > clipDuration) clipAction.time %= clipDuration;
      if (clipAction.time < 0) clipAction.time = clipDuration + (clipAction.time % clipDuration);

      const progress = clipAction.time / clipDuration;
      playheadNeedle.style.left = `${progress * 100}%`;
      updateTimecode(clipAction.time);
    }
  }

  // Camera Director Interpolation (When not in free orbit)
  if (activeShotIndex !== 3) {
    const lerpFactor = 1.0 - Math.exp(-6.0 * delta);
    camera.position.lerp(targetCamPos, lerpFactor);
    currentCamLook.lerp(targetCamLook, lerpFactor);
    camera.lookAt(currentCamLook);
  } else {
    controls.update();
  }

  composer.render();
}

animate();
