/**
 * Stars module - Creates and manages the star field particles
 */
const StarsManager = (() => {
  const STAR_COUNT = 6000;
  const STAR_SPREAD = 800;
  let geometry = null;
  let material = null;
  let points = null;
  let velocities = [];

  function create() {
    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const colors = new Float32Array(STAR_COUNT * 3);
    velocities = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * STAR_SPREAD;
      positions[i3 + 1] = (Math.random() - 0.5) * STAR_SPREAD;
      positions[i3 + 2] = (Math.random() - 0.5) * STAR_SPREAD;

      sizes[i] = Math.random() * 3 + 1.5;

      // Color variation: white, blue-white, warm
      const colorType = Math.random();
      if (colorType < 0.6) {
        colors[i3] = 0.9 + Math.random() * 0.1;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 1.0;
      } else if (colorType < 0.85) {
        colors[i3] = 0.6 + Math.random() * 0.2;
        colors[i3 + 1] = 0.7 + Math.random() * 0.2;
        colors[i3 + 2] = 1.0;
      } else {
        colors[i3] = 1.0;
        colors[i3 + 1] = 0.8 + Math.random() * 0.15;
        colors[i3 + 2] = 0.6 + Math.random() * 0.2;
      }

      velocities.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.002,
        twinkleSpeed: Math.random() * 2 + 1,
        twinkleOffset: Math.random() * Math.PI * 2,
        baseSize: sizes[i]
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uWarpFactor: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uWarpFactor;

        void main() {
          vColor = color;
          vec3 pos = position;

          // Warp stretch effect
          if (uWarpFactor > 0.0) {
            float dist = length(pos.xy);
            pos.z += pos.z * uWarpFactor * 3.0;
            pos.xy *= 1.0 - uWarpFactor * 0.3 * (1.0 - dist / 400.0);
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          float dist = -mvPosition.z;
          vAlpha = smoothstep(600.0, 50.0, dist);

          gl_PointSize = size * uPixelRatio * (200.0 / dist);
          gl_PointSize = max(gl_PointSize, 0.5);

          // Warp makes stars streak
          if (uWarpFactor > 0.0) {
            gl_PointSize += uWarpFactor * 8.0;
          }

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uWarpFactor;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);

          // Circular star with glow
          float alpha = smoothstep(0.5, 0.0, dist);
          float glow = smoothstep(0.5, 0.1, dist) * 0.3;

          // During warp, stars become streaks
          if (uWarpFactor > 0.0) {
            float streak = smoothstep(0.5, 0.0, abs(center.y)) *
                          smoothstep(0.5, 0.0, abs(center.x) * (1.0 - uWarpFactor * 0.8));
            alpha = mix(alpha, streak, uWarpFactor);
          }

          float finalAlpha = (alpha + glow) * vAlpha;
          if (finalAlpha < 0.01) discard;

          gl_FragColor = vec4(vColor, finalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    points = new THREE.Points(geometry, material);
    return points;
  }

  function update(time, warpFactor) {
    if (!geometry || !material) return;

    material.uniforms.uTime.value = time;
    material.uniforms.uWarpFactor.value = warpFactor || 0;

    const positions = geometry.attributes.position.array;
    const sizes = geometry.attributes.size.array;

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      const v = velocities[i];

      // Subtle drift
      positions[i3] += v.x;
      positions[i3 + 1] += v.y;
      positions[i3 + 2] += v.z;

      // Wrap around
      for (let j = 0; j < 3; j++) {
        if (positions[i3 + j] > STAR_SPREAD / 2) positions[i3 + j] = -STAR_SPREAD / 2;
        if (positions[i3 + j] < -STAR_SPREAD / 2) positions[i3 + j] = STAR_SPREAD / 2;
      }

      // Twinkle
      sizes[i] = v.baseSize * (0.7 + 0.3 * Math.sin(time * v.twinkleSpeed + v.twinkleOffset));
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
  }

  function getMesh() {
    return points;
  }

  return { create, update, getMesh };
})();
