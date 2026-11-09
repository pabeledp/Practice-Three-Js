import * as THREE from 'three';

export class StudioEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.speakerCones = [];

    this.initLighting();
    this.initAcousticBackdrop();
    this.initDeskAndProps();
    this.initStudioMonitors();
  }

  initLighting() {
    // Ambient deep room base
    const ambientLight = new THREE.AmbientLight(0x0c1017, 1.4);
    this.group.add(ambientLight);

    // Overhead Key Softbox (Cool clean 5600K balanced light)
    const keySoftbox = new THREE.DirectionalLight(0xf1f5f9, 2.2);
    keySoftbox.position.set(0, 9, 4);
    keySoftbox.castShadow = true;
    keySoftbox.shadow.mapSize.width = 2048;
    keySoftbox.shadow.mapSize.height = 2048;
    keySoftbox.shadow.bias = -0.0002;
    keySoftbox.shadow.camera.near = 0.5;
    keySoftbox.shadow.camera.far = 25;
    keySoftbox.shadow.camera.left = -10;
    keySoftbox.shadow.camera.right = 10;
    keySoftbox.shadow.camera.top = 10;
    keySoftbox.shadow.camera.bottom = -10;
    this.group.add(keySoftbox);

    // Cyan Neon Studio Rim Light (Left)
    const cyanRim = new THREE.DirectionalLight(0x0284c7, 3.2);
    cyanRim.position.set(-10, 4, -4);
    this.group.add(cyanRim);

    // Warm Amber Studio Accent (Right)
    const amberRim = new THREE.DirectionalLight(0xf97316, 2.2);
    amberRim.position.set(10, 3, -5);
    this.group.add(amberRim);

    // Soft overhead softbox visual mesh
    const softboxGeo = new THREE.BoxGeometry(6, 0.15, 3);
    const softboxMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const softboxMesh = new THREE.Mesh(softboxGeo, softboxMat);
    softboxMesh.position.set(0, 8.8, 3.8);
    this.group.add(softboxMesh);
  }

  initAcousticBackdrop() {
    // 1. Dark reflective studio floor
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x07090e,
      roughness: 0.18,
      metalness: 0.85
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.4;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Subtle floor grid
    const grid = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
    grid.position.y = -1.39;
    this.group.add(grid);

    // 2. Rear Acoustic Slat Wall
    const wallGroup = new THREE.Group();
    wallGroup.position.set(0, 3.2, -6.5);

    // Dark acoustic backing felt
    const feltGeo = new THREE.PlaneGeometry(28, 10);
    const feltMat = new THREE.MeshStandardMaterial({
      color: 0x06080c,
      roughness: 0.95
    });
    const felt = new THREE.Mesh(feltGeo, feltMat);
    wallGroup.add(felt);

    // Vertical wooden acoustic slats
    const slatWidth = 0.12;
    const slatDepth = 0.08;
    const slatHeight = 9.5;
    const slatGap = 0.28;
    const slatCount = 55;

    const slatGeo = new THREE.BoxGeometry(slatWidth, slatHeight, slatDepth);
    const slatMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917, // Dark walnut / smoked ash
      roughness: 0.55,
      metalness: 0.15
    });

    const startX = -(slatCount * slatGap) / 2;
    for (let i = 0; i < slatCount; i++) {
      const slat = new THREE.Mesh(slatGeo, slatMat);
      slat.position.set(startX + i * slatGap, 0, 0.04);
      wallGroup.add(slat);
    }

    // Horizontal illuminated RGB accent strip behind slats
    const ledGeo = new THREE.BoxGeometry(26, 0.06, 0.04);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const ledStrip = new THREE.Mesh(ledGeo, ledMat);
    ledStrip.position.set(0, -1.8, 0.06);
    wallGroup.add(ledStrip);

    this.group.add(wallGroup);
  }

  initDeskAndProps() {
    // Heavy Ergonomic Solid Oak / Anodized Aluminum Studio Desk
    const deskTopGeo = new THREE.BoxGeometry(16.5, 0.28, 6.2);
    const deskTopMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.65
    });
    const deskTop = new THREE.Mesh(deskTopGeo, deskTopMat);
    deskTop.position.set(0, -0.65, 0.5);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    this.group.add(deskTop);

    // Desk Neon Edge Glow (Front chamfer)
    const frontEdgeGeo = new THREE.BoxGeometry(16.52, 0.04, 0.04);
    const frontEdgeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const frontEdge = new THREE.Mesh(frontEdgeGeo, frontEdgeMat);
    frontEdge.position.set(0, -0.52, 3.6);
    this.group.add(frontEdge);

    // Heavy Industrial Desk Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5, metalness: 0.8 });
    const legGeo = new THREE.BoxGeometry(0.3, 1.8, 5.0);

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-7.5, -1.4, 0.5);
    this.group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(7.5, -1.4, 0.5);
    this.group.add(rightLeg);

    // Aluminum Headphone Stand on right side of desk
    const hpStand = new THREE.Group();
    hpStand.position.set(6.8, -0.5, 1.2);

    const baseGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.05, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    const hpBase = new THREE.Mesh(baseGeo, baseMat);
    hpStand.add(hpBase);

    const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 16);
    const rod = new THREE.Mesh(rodGeo, baseMat);
    rod.position.y = 0.6;
    hpStand.add(rod);

    // Headphone Arch
    const archGeo = new THREE.TorusGeometry(0.28, 0.04, 16, 32, Math.PI);
    const arch = new THREE.Mesh(archGeo, baseMat);
    arch.rotation.z = Math.PI;
    arch.position.set(0, 1.2, 0);
    hpStand.add(arch);

    // Ear Cups
    const cupGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 24);
    cupGeo.rotateX(Math.PI / 2);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });

    const leftCup = new THREE.Mesh(cupGeo, cupMat);
    leftCup.position.set(-0.25, 0.9, 0);
    hpStand.add(leftCup);

    const rightCup = new THREE.Mesh(cupGeo, cupMat);
    rightCup.position.set(0.25, 0.9, 0);
    hpStand.add(rightCup);

    this.group.add(hpStand);
  }

  initStudioMonitors() {
    // Dual Genelec-Style Nearfield Studio Reference Monitors
    const createSpeaker = (x, rotY) => {
      const spk = new THREE.Group();
      spk.position.set(x, 0.45, -0.8);
      spk.rotation.y = rotY;

      // Isolation Wedge Pad (Foam)
      const padGeo = new THREE.BoxGeometry(1.2, 0.12, 1.2);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.y = -0.45;
      spk.add(pad);

      // Curved Matte Cast-Aluminum Cabinet
      const cabinetGeo = new THREE.BoxGeometry(1.1, 1.7, 1.1);
      const cabinetMat = new THREE.MeshStandardMaterial({
        color: 0x1a202c,
        roughness: 0.35,
        metalness: 0.6
      });
      const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
      cabinet.castShadow = true;
      spk.add(cabinet);

      // Tweeter Dome (Coaxial)
      const tweeterGeo = new THREE.SphereGeometry(0.12, 24, 16);
      const tweeterMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
      const tweeter = new THREE.Mesh(tweeterGeo, tweeterMat);
      tweeter.position.set(0, 0.45, 0.56);
      spk.add(tweeter);

      // Bass Woofer Cone (Pulsates with audio)
      const wooferGeo = new THREE.CylinderGeometry(0.36, 0.12, 0.15, 32);
      wooferGeo.rotateX(Math.PI / 2);
      const wooferMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.4,
        metalness: 0.5
      });
      const woofer = new THREE.Mesh(wooferGeo, wooferMat);
      woofer.position.set(0, -0.15, 0.54);
      spk.add(woofer);

      // Power LED status (Green/Cyan)
      const ledGeo = new THREE.SphereGeometry(0.025, 12, 12);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, -0.68, 0.56);
      spk.add(led);

      this.speakerCones.push(woofer);
      this.group.add(spk);
    };

    // Left Speaker angled inward 24 degrees
    createSpeaker(-5.8, Math.PI * 0.12);
    // Right Speaker angled inward -24 degrees
    createSpeaker(5.8, -Math.PI * 0.12);
  }

  update(delta, audioLevel = 0.1) {
    // Subtle pulsating bass driver vibration
    const pulse = 1.0 + audioLevel * 0.22;
    this.speakerCones.forEach(cone => {
      cone.scale.set(1.0, 1.0, pulse);
    });
  }
}
