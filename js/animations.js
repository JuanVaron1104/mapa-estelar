/**
 * Animations module - GSAP-powered section animations and scroll storytelling
 */
const AnimationsManager = (() => {
  let currentSection = -1;
  let totalSections = 7;
  let scrollProgress = 0;
  let targetProgress = 0;
  let isTransitioning = false;
  let warpFactor = 0;
  let touchStartY = 0;
  let lastWheelTime = 0;
  let connectionAnimFrame = null;

  const sectionKeys = [
    'intro',      // 0
    'approach',   // 1
    'warp',       // 2
    'map1',       // 3
    'transition', // 4
    'map2',       // 5
    'final'       // 6
  ];

  function init() {
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    // Start at intro
    setTimeout(() => goToSection(0), 100);
  }

  function onWheel(e) {
    e.preventDefault();
    if (isTransitioning) return;

    const now = Date.now();
    if (now - lastWheelTime < 800) return;
    lastWheelTime = now;

    if (e.deltaY > 0 && currentSection < totalSections - 1) {
      goToSection(currentSection + 1);
    } else if (e.deltaY < 0 && currentSection > 0) {
      goToSection(currentSection - 1);
    }
  }

  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (isTransitioning) return;

    const diff = touchStartY - e.touches[0].clientY;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSection < totalSections - 1) {
        goToSection(currentSection + 1);
      } else if (diff < 0 && currentSection > 0) {
        goToSection(currentSection - 1);
      }
      touchStartY = e.touches[0].clientY;
    }
  }

  function onKeyDown(e) {
    if (isTransitioning) return;
    if (e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      if (currentSection < totalSections - 1) goToSection(currentSection + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentSection > 0) goToSection(currentSection - 1);
    }
  }

  function goToSection(index) {
    if (index === currentSection || isTransitioning) return;
    isTransitioning = true;

    const prevSection = currentSection;
    currentSection = index;

    // Update progress bar
    const progress = index / (totalSections - 1);
    document.getElementById('progress-bar').style.width = (progress * 100) + '%';

    // Hide scroll hint after first interaction
    if (index > 0) {
      document.getElementById('scroll-hint').classList.remove('visible');
    }

    // Fade out ALL sections (not just previous, to prevent ghost overlaps)
    for (let i = 0; i < totalSections; i++) {
      if (i !== index) {
        hideSection(i);
      }
    }

    // Animate camera and show new section
    const delay = prevSection >= 0 ? 0.4 : 0;

    setTimeout(() => {
      animateCamera(index);
      showSection(index);
    }, delay * 1000);

    // Audio intensity
    AudioManager.setIntensity(0.3 + progress * 0.7);

    setTimeout(() => {
      isTransitioning = false;
    }, getSectionDuration(index) * 1000 + 500);
  }

  function getSectionDuration(index) {
    const durations = [1.5, 1.5, 2.5, 2, 1.5, 2, 2.5];
    return durations[index] || 1.5;
  }

  function hideSection(index) {
    const key = sectionKeys[index];
    const el = document.getElementById('section-' + key);
    if (!el) return;

    // Kill any running tweens on this element AND its children to prevent ghosts
    gsap.killTweensOf(el);
    el.querySelectorAll('*').forEach(child => gsap.killTweensOf(child));
    gsap.set(el, { opacity: 0 });
    el.classList.remove('active');

    // Hide connection canvas for non-final sections
    if (index === 6) {
      gsap.to('#connection-canvas', { opacity: 0, duration: 0.5 });
      if (connectionAnimFrame) {
        cancelAnimationFrame(connectionAnimFrame);
        connectionAnimFrame = null;
      }
    }
  }

  function showSection(index) {
    const key = sectionKeys[index];
    const el = document.getElementById('section-' + key);
    if (!el) return;

    el.classList.add('active');

    switch (index) {
      case 0: animateIntro(el); break;
      case 1: animateApproach(el); break;
      case 2: animateWarp(el); break;
      case 3: animateMap1(el); break;
      case 4: animateTransition(el); break;
      case 5: animateMap2(el); break;
      case 6: animateFinal(el); break;
    }
  }

  function animateCamera(index) {
    const camera = SceneManager.getCamera();
    if (!camera) return;

    const positions = [
      { x: 0, y: 0, z: 100 },     // intro
      { x: 0, y: -2, z: 75 },     // approach
      { x: 0, y: 0, z: -50 },     // warp (fly through)
      { x: -30, y: 5, z: -120 },  // map1
      { x: 0, y: 10, z: -180 },   // transition
      { x: 30, y: -5, z: -240 },  // map2
      { x: 0, y: 0, z: -320 }     // final
    ];

    const pos = positions[index];
    const duration = index === 2 ? 2.5 : 1.8;

    gsap.to(camera.position, {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      duration: duration,
      ease: index === 2 ? 'power4.in' : 'power2.inOut'
    });
  }

  function animateIntro(el) {
    const textEl = document.getElementById('intro-text');
    const fullText = 'Antes de conocernos, el universo ya sabia que nos encontrariamos...';

    textEl.textContent = '';
    gsap.to(el, { opacity: 1, duration: 0.5 });

    // Typewriter effect
    let charIndex = 0;
    const typeInterval = setInterval(() => {
      textEl.textContent = fullText.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex >= fullText.length) {
        clearInterval(typeInterval);
        // Show scroll hint after intro text
        setTimeout(() => {
          document.getElementById('scroll-hint').classList.add('visible');
        }, 800);
      }
    }, 60);
  }

  function animateApproach(el) {
    gsap.to(el, { opacity: 1, duration: 0.8, ease: 'power2.out' });

    // Pulsating effect on text
    gsap.to('#approach-text', {
      opacity: 0.4,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  function animateWarp(el) {
    el.classList.add('active');

    const warpOverlay = document.getElementById('warp-overlay');
    const tl = gsap.timeline();

    // Show section and texts with dramatic timing
    tl.to(el, { opacity: 1, duration: 0.5 })
      .from('#warp-text1', { y: 30, opacity: 0, duration: 1, ease: 'power3.out' }, 0.3)
      .to(warpOverlay, { opacity: 0.6, duration: 0.8 }, 0.5)
      .to({}, {
        duration: 1.5,
        onUpdate: function() {
          warpFactor = this.progress();
        }
      }, 0.5)
      .from('#warp-text2', { y: 20, opacity: 0, scale: 0.9, duration: 1.2, ease: 'power3.out' }, 1.2)
      .to(warpOverlay, { opacity: 0, duration: 0.6 }, 2)
      .set({}, {
        onComplete: () => { warpFactor = 0; }
      });
  }

  function animateMap1(el) {
    const tl = gsap.timeline();

    tl.to(el, { opacity: 1, duration: 0.5 })
      .from('#date1', { y: 30, opacity: 0, duration: 1, ease: 'power3.out' }, 0.2)
      .from('#subtitle1', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.5)
      .to('#map1-img', { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, 0.3)
      .from('#map1-container', { scale: 0.8, duration: 1.2, ease: 'power2.out' }, 0.3)
      .from('#poetic1', { y: 20, opacity: 0, duration: 1, ease: 'power3.out' }, 1);

    // Animate constellation lines
    setTimeout(() => animateConstellationLines('constellation1'), 1500);
  }

  function animateMap2(el) {
    const tl = gsap.timeline();

    tl.to(el, { opacity: 1, duration: 0.5 })
      .from('#date2', { y: 30, opacity: 0, duration: 1, ease: 'power3.out' }, 0.2)
      .from('#subtitle2', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.5)
      .to('#map2-img', { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, 0.3)
      .from('#map2-container', { scale: 0.8, duration: 1.2, ease: 'power2.out' }, 0.3)
      .from('#poetic2', { y: 20, opacity: 0, duration: 1, ease: 'power3.out' }, 1);

    setTimeout(() => animateConstellationLines('constellation2'), 1500);
  }

  function animateTransition(el) {
    gsap.to(el, { opacity: 1, duration: 1, ease: 'power2.inOut' });
    gsap.from('#transition-text', { y: 20, opacity: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 });
  }

  function animateFinal(el) {
    const tl = gsap.timeline();

    tl.to(el, { opacity: 1, duration: 0.5 })
      .to('#final-img1', { opacity: 1, duration: 1, ease: 'power2.out' }, 0.3)
      .to('#final-img2', { opacity: 1, duration: 1, ease: 'power2.out' }, 0.6)
      .from('#final-text1', { y: 30, opacity: 0, duration: 1, ease: 'power3.out' }, 1)
      .from('#final-text2', { y: 30, opacity: 0, duration: 1, ease: 'power3.out' }, 1.4)
      .from('#final-text3', { y: 30, opacity: 0, duration: 1.2, ease: 'power3.out' }, 1.8)
      .from('#final-text4', { y: 20, opacity: 0, duration: 1, ease: 'power3.out' }, 2.2)
      .to('#download-buttons', { opacity: 1, duration: 1, ease: 'power2.out' }, 2.8);

    // Start connection animation
    setTimeout(() => startConnectionAnimation(), 2000);
  }

  function animateConstellationLines(svgId) {
    const svg = document.getElementById(svgId);
    if (!svg) return;

    const lines = svg.querySelectorAll('line');
    lines.forEach((line, i) => {
      gsap.to(line, {
        strokeDashoffset: 0,
        duration: 1,
        delay: i * 0.2,
        ease: 'power2.inOut'
      });
    });
  }

  function startConnectionAnimation() {
    const canvas = document.getElementById('connection-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gsap.to(canvas, { opacity: 1, duration: 1 });

    const map1El = document.getElementById('final-map1');
    const map2El = document.getElementById('final-map2');

    if (!map1El || !map2El) return;

    const rect1 = map1El.getBoundingClientRect();
    const rect2 = map2El.getBoundingClientRect();

    const cx1 = rect1.left + rect1.width / 2;
    const cy1 = rect1.top + rect1.height / 2;
    const cx2 = rect2.left + rect2.width / 2;
    const cy2 = rect2.top + rect2.height / 2;
    const midX = (cx1 + cx2) / 2;
    const midY = (cy1 + cy2) / 2;

    // Create particles that flow between the two maps
    const particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() < 0.5 ? cx1 : cx2,
        y: Math.random() < 0.5 ? cy1 : cy2,
        targetX: midX + (Math.random() - 0.5) * 30,
        targetY: midY + (Math.random() - 0.5) * 30,
        speed: 0.005 + Math.random() * 0.015,
        progress: 0,
        size: Math.random() * 2 + 1,
        color: Math.random() < 0.5 ? '#4a9eff' : '#8b5cf6',
        startX: 0,
        startY: 0,
        delay: Math.random() * 2
      });
    }

    particles.forEach(p => {
      p.startX = p.x;
      p.startY = p.y;
    });

    let startTime = performance.now();

    function drawConnections() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = (performance.now() - startTime) / 1000;

      particles.forEach(p => {
        if (elapsed < p.delay) return;

        p.progress = Math.min(1, p.progress + p.speed);

        const eased = easeInOutCubic(p.progress);
        p.x = p.startX + (p.targetX - p.startX) * eased;
        p.y = p.startY + (p.targetY - p.startY) * eased;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6 * (1 - p.progress * 0.5);
        ctx.fill();

        // Trail
        ctx.beginPath();
        ctx.moveTo(p.startX, p.startY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.08;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Center glow when particles converge
      const converged = particles.filter(p => p.progress > 0.8).length / particles.length;
      if (converged > 0.3) {
        const gradient = ctx.createRadialGradient(midX, midY, 0, midX, midY, 60);
        gradient.addColorStop(0, `rgba(125, 211, 252, ${converged * 0.15})`);
        gradient.addColorStop(1, 'transparent');
        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.fillRect(midX - 60, midY - 60, 120, 120);
      }

      ctx.globalAlpha = 1;
      connectionAnimFrame = requestAnimationFrame(drawConnections);
    }

    drawConnections();
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function getWarpFactor() {
    return warpFactor;
  }

  function getCurrentSection() {
    return currentSection;
  }

  return { init, getWarpFactor, getCurrentSection };
})();
