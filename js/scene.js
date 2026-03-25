/**
 * Scene module - Three.js scene setup and management
 */
const SceneManager = (() => {
  let scene, camera, renderer;
  let container;
  let telescope = null;
  let nebulaMeshes = [];
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let isWebGLAvailable = true;

  function checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function init() {
    if (!checkWebGL()) {
      isWebGLAvailable = false;
      document.getElementById('fallback').classList.add('active');
      document.getElementById('loading-screen').classList.add('hidden');
      return false;
    }

    container = document.getElementById('canvas-container');

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000011, 0.0008);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 100);

    // Renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000005);
    container.appendChild(renderer.domElement);

    // Stars
    const stars = StarsManager.create();
    scene.add(stars);

    // Telescope
    createTelescope();

    // Nebula particles
    createNebula();

    // Ambient light
    const ambient = new THREE.AmbientLight(0x222244, 0.5);
    scene.add(ambient);

    // Point lights
    const light1 = new THREE.PointLight(0x4a9eff, 1, 300);
    light1.position.set(50, 30, 50);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x8b5cf6, 0.8, 300);
    light2.position.set(-50, -20, 30);
    scene.add(light2);

    // Mouse tracking
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return true;
  }

  function createTelescope() {
    const group = new THREE.Group();

    // Materials
    const whiteMat = new THREE.MeshPhongMaterial({
      color: 0xc8c8d4,
      specular: 0xffffff,
      shininess: 80,
      emissive: 0x1a1a28,
      emissiveIntensity: 0.15
    });
    const darkMat = new THREE.MeshPhongMaterial({
      color: 0x2a2a38,
      specular: 0x555568,
      shininess: 60
    });
    const silverMat = new THREE.MeshPhongMaterial({
      color: 0x8888a0,
      specular: 0xbbbbcc,
      shininess: 90
    });

    // === TUBE ASSEMBLY (will be tilted to face camera) ===
    const tubeAssembly = new THREE.Group();

    // Main tube (white, along local Y axis)
    const tubeGeo = new THREE.CylinderGeometry(1.0, 1.2, 16, 32);
    const tube = new THREE.Mesh(tubeGeo, whiteMat);
    tubeAssembly.add(tube);

    // Front cap (dark ring) - at top of tube
    const frontCapGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.7, 32);
    const frontCap = new THREE.Mesh(frontCapGeo, darkMat);
    frontCap.position.y = 8.35;
    tubeAssembly.add(frontCap);

    // Lens glass inside front cap
    const lensMat = new THREE.MeshPhongMaterial({
      color: 0x0a1a3a,
      emissive: 0x1a3366,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      specular: 0x99ccff,
      shininess: 200
    });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(1.15, 32), lensMat);
    lens.position.y = 8.7;
    lens.rotation.x = Math.PI / 2;
    tubeAssembly.add(lens);

    // Subtle lens glow
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.8, 32), glowMat);
    glow.position.y = 8.8;
    glow.rotation.x = Math.PI / 2;
    tubeAssembly.add(glow);

    // Rear cap (dark)
    const rearCap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.25, 0.5, 32), darkMat
    );
    rearCap.position.y = -8;
    tubeAssembly.add(rearCap);

    // Focuser + eyepiece (sticks out perpendicular near the rear)
    const focuser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 2, 16), silverMat
    );
    focuser.position.set(0, -5, 1.4);
    focuser.rotation.x = Math.PI / 2;
    tubeAssembly.add(focuser);

    const eyepiece = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.32, 1.8, 16), darkMat
    );
    eyepiece.position.set(0, -5, 2.9);
    eyepiece.rotation.x = Math.PI / 2;
    tubeAssembly.add(eyepiece);

    // Finder scope (small tube on top of main tube)
    const finder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.13, 3.5, 12), darkMat
    );
    finder.position.set(0.6, 1, -1.1);
    tubeAssembly.add(finder);

    // Tilt tube: rotate so the lens end (local +Y) points towards camera (+Z)
    // rotation.x = -PI/2 makes it point along +Z, then tilt up slightly
    tubeAssembly.rotation.x = -Math.PI / 2 + 0.3; // ~73 degrees, lens faces camera, slightly up
    tubeAssembly.position.y = 2;
    group.add(tubeAssembly);

    // === MOUNT ===
    const mountHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.0, 1.5, 16), silverMat
    );
    mountHead.position.y = -1.5;
    group.add(mountHead);

    // Center column
    const column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 6, 8), silverMat
    );
    column.position.y = -5;
    group.add(column);

    // === TRIPOD LEGS (always vertical/splayed, not affected by tube tilt) ===
    const legMat = new THREE.MeshPhongMaterial({
      color: 0x666678,
      specular: 0x999aaa,
      shininess: 60
    });

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 6;
      const splay = 0.22;
      const legGeo = new THREE.CylinderGeometry(0.13, 0.09, 14, 8);
      const leg = new THREE.Mesh(legGeo, legMat);

      leg.position.set(
        Math.sin(angle) * 1.5,
        -14,
        Math.cos(angle) * 1.5
      );
      leg.rotation.x = Math.cos(angle) * splay;
      leg.rotation.z = -Math.sin(angle) * splay;
      group.add(leg);
    }

    group.position.set(0, -6, 68);
    group.scale.set(0.8, 0.8, 0.8);
    scene.add(group);
    telescope = group;
  }

  function createNebula() {
    const nebulaGeo = new THREE.BufferGeometry();
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 200;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = Math.sin(angle) * radius - 100;

      const c = Math.random();
      if (c < 0.5) {
        colors[i3] = 0.3; colors[i3+1] = 0.5; colors[i3+2] = 1.0;
      } else {
        colors[i3] = 0.5; colors[i3+1] = 0.3; colors[i3+2] = 0.9;
      }

      sizes[i] = Math.random() * 15 + 5;
    }

    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create soft circle texture for nebula
    const nebulaCanvas = document.createElement('canvas');
    nebulaCanvas.width = 64;
    nebulaCanvas.height = 64;
    const nCtx = nebulaCanvas.getContext('2d');
    const grad = nCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,0.3)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    nCtx.fillStyle = grad;
    nCtx.fillRect(0, 0, 64, 64);
    const nebulaTexture = new THREE.CanvasTexture(nebulaCanvas);

    const nebulaMat = new THREE.PointsMaterial({
      size: 12,
      map: nebulaTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const nebula = new THREE.Points(nebulaGeo, nebulaMat);
    scene.add(nebula);
    nebulaMeshes.push(nebula);
  }

  function onMouseMove(e) {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function update(time) {
    if (!renderer || !scene || !camera) return;

    // Smooth mouse follow for parallax
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Subtle camera sway from mouse
    camera.rotation.y = -mouseX * 0.02;
    camera.rotation.x = -mouseY * 0.02;

    // Telescope floating animation
    if (telescope) {
      telescope.rotation.y = Math.sin(time * 0.3) * 0.1;
      telescope.position.y = -5 + Math.sin(time * 0.5) * 0.3;
    }

    // Nebula rotation
    nebulaMeshes.forEach((n, i) => {
      n.rotation.y = time * 0.02 * (i + 1);
    });

    renderer.render(scene, camera);
  }

  function getCamera() { return camera; }
  function getTelescope() { return telescope; }
  function getScene() { return scene; }
  function isAvailable() { return isWebGLAvailable; }

  return { init, update, getCamera, getTelescope, getScene, isAvailable };
})();
