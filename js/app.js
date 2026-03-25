/**
 * App module - Main entry point, orchestrates all modules
 */
(function() {
  'use strict';

  let loadProgress = 0;
  const loadingBar = document.getElementById('loading-bar');
  const loadingScreen = document.getElementById('loading-screen');

  // Cursor particle trail
  const cursorParticles = [];
  const MAX_PARTICLES = 15;
  let mouseX = 0, mouseY = 0;

  function updateLoadProgress(amount) {
    loadProgress = Math.min(100, loadProgress + amount);
    loadingBar.style.width = loadProgress + '%';
  }

  function preloadImages() {
    return new Promise((resolve) => {
      const images = ['assets/abril.png', 'assets/agosto.png'];
      let loaded = 0;

      images.forEach(src => {
        const img = new Image();
        img.onload = () => {
          loaded++;
          updateLoadProgress(20);
          if (loaded === images.length) resolve();
        };
        img.onerror = () => {
          loaded++;
          updateLoadProgress(20);
          if (loaded === images.length) resolve();
        };
        img.src = src;
      });
    });
  }

  function initCursorTrail() {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function spawnParticle() {
      if (cursorParticles.length >= MAX_PARTICLES) {
        const old = cursorParticles.shift();
        if (old.el.parentNode) old.el.parentNode.removeChild(old.el);
      }

      const el = document.createElement('div');
      el.className = 'cursor-particle';
      el.style.left = mouseX + 'px';
      el.style.top = mouseY + 'px';
      document.body.appendChild(el);

      const particle = {
        el,
        x: mouseX,
        y: mouseY,
        life: 1
      };

      cursorParticles.push(particle);

      gsap.to(el, {
        opacity: 0.6,
        duration: 0.1,
        onComplete: () => {
          gsap.to(el, {
            opacity: 0,
            x: (Math.random() - 0.5) * 30,
            y: (Math.random() - 0.5) * 30,
            scale: 0,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => {
              if (el.parentNode) el.parentNode.removeChild(el);
              const idx = cursorParticles.indexOf(particle);
              if (idx > -1) cursorParticles.splice(idx, 1);
            }
          });
        }
      });
    }

    setInterval(spawnParticle, 80);
  }

  function initDownloadButtons() {
    document.getElementById('dl-aries').addEventListener('click', () => {
      generatePoster('assets/abril.png', 'juan', '11 de abril de 2003', 'JUAN', '#4a9eff', 'Aries');
    });
    document.getElementById('dl-leo').addEventListener('click', () => {
      generatePoster('assets/agosto.png', 'mafe', '21 de agosto de 2005', 'MAFE', '#8b5cf6', 'Leo');
    });
    document.getElementById('dl-juntos').addEventListener('click', () => {
      generateDualPoster();
    });
  }

  function generatePoster(imgSrc, name, dateText, sign, color, zodiac) {
    const canvas = document.createElement('canvas');
    const W = 1080, H = 1920;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#020210');
    grad.addColorStop(0.5, '#06061a');
    grad.addColorStop(1, '#020210');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Small stars
    for (let i = 0; i < 200; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.5 + 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.5 + 0.2) + ')';
      ctx.fill();
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Circular map in center
      const size = 600;
      const cx = W / 2, cy = H / 2 - 50;

      // Glow behind
      const glow = ctx.createRadialGradient(cx, cy, size * 0.3, cx, cy, size * 0.7);
      glow.addColorStop(0, color + '22');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - size, cy - size, size * 2, size * 2);

      // Clip circle and draw image
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
      ctx.restore();

      // Circle border
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.strokeStyle = color + '44';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sign name (top)
      ctx.fillStyle = color;
      ctx.font = '600 28px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '8px';
      ctx.fillText(sign, cx, cy - size / 2 - 60);

      // Date
      ctx.fillStyle = '#f0f0f0';
      ctx.font = '300 42px "Space Grotesk", sans-serif';
      ctx.fillText(dateText, cx, cy + size / 2 + 70);

      // Subtitle
      ctx.fillStyle = '#8892b0';
      ctx.font = '300 22px "Inter", sans-serif';
      ctx.fillText(zodiac || '', cx, cy + size / 2 + 110);

      // Download
      const link = document.createElement('a');
      link.download = 'mapa-estelar-' + name + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = imgSrc;
  }

  function generateDualPoster() {
    const canvas = document.createElement('canvas');
    const W = 1920, H = 1080;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#020210');
    grad.addColorStop(0.5, '#08081e');
    grad.addColorStop(1, '#020210');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 300; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.5 + 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.5 + 0.2) + ')';
      ctx.fill();
    }

    let loaded = 0;
    const img1 = new Image();
    const img2 = new Image();
    img1.crossOrigin = 'anonymous';
    img2.crossOrigin = 'anonymous';

    function drawWhenReady() {
      loaded++;
      if (loaded < 2) return;

      const size = 380;
      const gap = 200;
      const cx1 = W / 2 - gap, cy = H / 2;
      const cx2 = W / 2 + gap;

      // Glows
      const glow1 = ctx.createRadialGradient(cx1, cy, size * 0.2, cx1, cy, size * 0.65);
      glow1.addColorStop(0, 'rgba(74,158,255,0.12)');
      glow1.addColorStop(1, 'transparent');
      ctx.fillStyle = glow1;
      ctx.fillRect(cx1 - size, cy - size, size * 2, size * 2);

      const glow2 = ctx.createRadialGradient(cx2, cy, size * 0.2, cx2, cy, size * 0.65);
      glow2.addColorStop(0, 'rgba(139,92,246,0.12)');
      glow2.addColorStop(1, 'transparent');
      ctx.fillStyle = glow2;
      ctx.fillRect(cx2 - size, cy - size, size * 2, size * 2);

      // Draw images in circles
      [{ img: img1, cx: cx1 }, { img: img2, cx: cx2 }].forEach(item => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(item.cx, cy, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(item.img, item.cx - size / 2, cy - size / 2, size, size);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(item.cx, cy, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Connection line between maps
      ctx.beginPath();
      ctx.moveTo(cx1 + size / 2 + 10, cy);
      ctx.lineTo(cx2 - size / 2 - 10, cy);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4a9eff';
      ctx.font = '600 18px "Space Grotesk", sans-serif';
      ctx.fillText('JUAN', cx1, cy - size / 2 - 40);
      ctx.fillStyle = '#8b5cf6';
      ctx.fillText('MAFE', cx2, cy - size / 2 - 40);

      ctx.fillStyle = '#ccccdd';
      ctx.font = '300 20px "Space Grotesk", sans-serif';
      ctx.fillText('11 de abril de 2003', cx1, cy + size / 2 + 40);
      ctx.fillText('21 de agosto de 2005', cx2, cy + size / 2 + 40);

      // Center text
      ctx.fillStyle = '#f0f0f0';
      ctx.font = '300 18px "Inter", sans-serif';
      ctx.fillText('Escritos en las estrellas', W / 2, cy + size / 2 + 85);

      const link = document.createElement('a');
      link.download = 'mapa-estelar-juntos.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }

    img1.onload = drawWhenReady;
    img2.onload = drawWhenReady;
    img1.src = 'assets/abril.png';
    img2.src = 'assets/agosto.png';
  }

  function initAudioToggle() {
    const btn = document.getElementById('audio-toggle');
    gsap.to(btn, { opacity: 1, duration: 1, delay: 3 });

    btn.addEventListener('click', () => {
      const muted = AudioManager.toggleMute();
      btn.classList.toggle('muted', muted);
    });
  }

  // Main render loop
  let startTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);
    const time = (performance.now() - startTime) / 1000;

    StarsManager.update(time, AnimationsManager.getWarpFactor());
    SceneManager.update(time);
  }

  // Init
  async function start() {
    updateLoadProgress(10);

    // Preload images
    await preloadImages();
    updateLoadProgress(20);

    // Init Three.js scene
    const webglOk = SceneManager.init();
    updateLoadProgress(30);

    if (!webglOk) return;

    // Init audio (prepare, don't play yet)
    AudioManager.init();
    updateLoadProgress(10);

    // Start render loop
    animate();
    updateLoadProgress(10);

    // Hide loading screen
    await new Promise(r => setTimeout(r, 600));
    loadingScreen.classList.add('hidden');

    // Wait for loading screen to fade
    await new Promise(r => setTimeout(r, 1200));

    // Init animations and interactions
    AnimationsManager.init();
    initCursorTrail();
    initAudioToggle();
    initDownloadButtons();
  }

  // Kick it off
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
