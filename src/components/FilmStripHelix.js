import * as THREE from 'three';

/**
 * 3D Floating Film Strip & Helix Tunnel:
 * Procedural continuous celluloid film ribbon with glowing perforations,
 * accompanied by floating curved video canvases along a 3D spline.
 */
export class FilmStripHelix {
  constructor(scene, projects) {
    this.scene = scene;
    this.projects = projects;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.projectScreens = [];
    this.splinePoints = [];
    this.curve = null;

    this.initSpline();
    this.initPerforatedRibbon();
    this.initFloatingVideoSlabs();
    this.initAmbientGlowLights();
  }

  initSpline() {
    // 3D Helix Path winding through space
    const points = [];
    const count = 120;
    const radius = 6.2;
    const length = 55; // Total depth along Z

    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 4.5; // ~2.25 full helix rotations
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle * 0.8) * 2.4;
      const z = -t * length; // Extends back into -Z
      points.push(new THREE.Vector3(x, y, z));
    }

    this.curve = new THREE.CatmullRomCurve3(points);
    this.curve.curveType = 'centripetal';
  }

  initPerforatedRibbon() {
    // Generate film perforation texture (35mm IMAX style)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Film border rails
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, 22);
    ctx.fillRect(0, canvas.height - 22, canvas.width, 22);

    // Sprocket Holes (Perforations)
    ctx.fillStyle = '#0284c7';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    const numHoles = 24;
    const holeW = 12;
    const holeH = 15;
    const step = canvas.width / numHoles;

    for (let i = 0; i < numHoles; i++) {
      const hx = i * step + 4;
      ctx.fillRect(hx, 3, holeW, holeH);
      ctx.fillRect(hx, canvas.height - 18, holeW, holeH);
    }

    const filmTexture = new THREE.CanvasTexture(canvas);
    filmTexture.wrapS = THREE.RepeatWrapping;
    filmTexture.wrapT = THREE.ClampToEdgeWrapping;
    filmTexture.repeat.set(45, 1);

    // Tube or extruded ribbon along the helix spline
    const ribbonGeo = new THREE.TubeGeometry(this.curve, 300, 0.45, 8, false);
    const ribbonMat = new THREE.MeshStandardMaterial({
      map: filmTexture,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25
    });

    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    this.group.add(ribbon);
  }

  initFloatingVideoSlabs() {
    const totalProjects = this.projects.length;

    this.projects.forEach((proj, idx) => {
      // Sample position along the spline (spread from t = 0.08 to 0.92)
      const t = 0.08 + (idx / (totalProjects - 1)) * 0.82;
      const point = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t);

      const slabGroup = new THREE.Group();
      slabGroup.position.copy(point);

      // Align slab orientation with the spline tangent
      slabGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      // Face slightly toward incoming camera
      slabGroup.rotateY(Math.PI * 0.15);

      // 1. Curved Cinematic Video Screen Mesh
      const screenWidth = 6.2;
      const screenHeight = 3.5;
      const screenGeo = new THREE.PlaneGeometry(screenWidth, screenHeight, 32, 1);

      // Curve the plane inward slightly along X for curved IMAX screen look
      const pos = screenGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const curveDepth = (x * x) * 0.035;
        pos.setZ(i, -curveDepth);
      }
      screenGeo.computeVertexNormals();

      // Screen Material mapped to project's video canvas/texture
      const screenMat = new THREE.MeshBasicMaterial({
        map: proj.texture,
        side: THREE.DoubleSide
      });

      const screenMesh = new THREE.Mesh(screenGeo, screenMat);
      slabGroup.add(screenMesh);

      // 2. Glass Frame & Frosted Chamfered Bezel
      const frameGeo = new THREE.BoxGeometry(screenWidth + 0.3, screenHeight + 0.3, 0.12);
      const frameMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        roughness: 0.15,
        metalness: 0.8,
        transmission: 0.75,
        thickness: 0.2,
        ior: 1.52
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.z = -0.08;
      slabGroup.add(frameMesh);

      // 3. Glowing Neon Accent Frame
      const wireGeo = new THREE.EdgesGeometry(frameGeo);
      const wireMat = new THREE.LineBasicMaterial({
        color: proj.themeColor || 0x38bdf8,
        linewidth: 2
      });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      wire.position.z = -0.08;
      slabGroup.add(wire);

      // 4. Point Light for Volumetric Screen Bleed
      const pointLight = new THREE.PointLight(proj.themeColor || 0x38bdf8, 2.5, 9, 1.8);
      pointLight.position.set(0, 0, 1.2);
      slabGroup.add(pointLight);

      slabGroup.userData = {
        isProjectSlab: true,
        project: proj,
        index: idx,
        splineT: t,
        initialRotation: slabGroup.rotation.clone(),
        screenMesh: screenMesh,
        wireMat: wireMat,
        pointLight: pointLight
      };

      this.group.add(slabGroup);
      this.projectScreens.push(slabGroup);
    });
  }

  initAmbientGlowLights() {
    // Cosmic tunnel accent lights
    const colors = [0x38bdf8, 0xf59e0b, 0xf43f5e, 0x8b5cf6];
    colors.forEach((col, idx) => {
      const light = new THREE.PointLight(col, 2.0, 20, 1.5);
      const t = 0.15 + (idx / colors.length) * 0.7;
      const p = this.curve.getPointAt(t);
      light.position.set(p.x * 1.5, p.y + 2, p.z);
      this.group.add(light);
    });
  }

  update(delta, hoveredIndex, mouseNormalized) {
    this.projectScreens.forEach((slab, idx) => {
      // Gentle zero-gravity idle float
      const time = performance.now() * 0.001;
      const bob = Math.sin(time * 1.5 + idx * 2.0) * 0.08;
      slab.position.y += bob * delta;

      // Magnetic tilt if hovered
      if (idx === hoveredIndex && mouseNormalized) {
        slab.rotation.y = slab.userData.initialRotation.y + mouseNormalized.x * 0.2;
        slab.rotation.x = slab.userData.initialRotation.x - mouseNormalized.y * 0.15;
        slab.userData.wireMat.color.setHex(0xffffff);
        slab.userData.pointLight.intensity = 4.0;
      } else {
        slab.rotation.y = THREE.MathUtils.lerp(slab.rotation.y, slab.userData.initialRotation.y, delta * 3);
        slab.rotation.x = THREE.MathUtils.lerp(slab.rotation.x, slab.userData.initialRotation.x, delta * 3);
        slab.userData.wireMat.color.setHex(slab.userData.project.themeColor || 0x38bdf8);
        slab.userData.pointLight.intensity = 2.0;
      }
    });
  }
}
