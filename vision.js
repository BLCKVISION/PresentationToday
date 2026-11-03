/**
 * Big O: El Costo Real del Crecimiento
 * Interactive Presentation Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // ─── 1. CUSTOM CURSOR ───
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    let mx = -200, my = -200, rx = -200, ry = -200, clicking = false;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
    });
    document.addEventListener('mousedown', () => { clicking = true; });
    document.addEventListener('mouseup', () => { clicking = false; });

    (function renderCursor() {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        if (dot && ring) {
            dot.style.left = mx + 'px';
            dot.style.top = my + 'px';
            dot.style.transform = `translate(-50%,-50%) scale(${clicking ? 0.75 : 1})`;
            ring.style.left = rx + 'px';
            ring.style.top = ry + 'px';
            ring.style.transform = `translate(-50%,-50%) scale(${clicking ? 1.4 : 1})`;
        }
        requestAnimationFrame(renderCursor);
    })();

    // ─── 2. DECK PRESENTATION SYSTEM ───
    const TOTAL = 12;
    window.cur = 0;
    window.busy = false;

    window.slides = Array.from(document.querySelectorAll('.slide'));
    const deckEl = document.getElementById('deck');
    const dotsEl = document.getElementById('dots');
    const hintEl = document.getElementById('hint');
    const counterEl = document.getElementById('counter');

    // Initial positioning of slides
    window.slides.forEach((s, i) => {
        gsap.set(s, {
            y: i === 0 ? '0%' : '100%',
            zIndex: TOTAL - i
        });
    });

    // Populate dots in HUD
    if (dotsEl) {
        dotsEl.innerHTML = '';
        window.slides.forEach((_, i) => {
            const d = document.createElement('div');
            d.className = 'dot' + (i === 0 ? ' active' : '');
            d.addEventListener('click', () => goTo(i));
            dotsEl.appendChild(d);
        });
    }

    const speakerMap = {
        0: "Equipo // Portada",
        1: "Expositor 1",
        2: "Expositor 1",
        3: "Expositor 2",
        4: "Expositor 2",
        5: "Expositor 3",
        6: "Expositor 3",
        7: "Expositor 3",
        8: "Expositor 4",
        9: "Expositor 4",
        10: "Expositor 4",
        11: "Fin // Preguntas"
    };

    // Update HUD display
    window.updateHUD = function(i) {
        document.querySelectorAll('.dot').forEach((d, j) => {
            d.classList.toggle('active', j === i);
        });
        if (counterEl) {
            counterEl.innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b> / ${String(TOTAL).padStart(2, '0')}`;
        }
        const speakerNameEl = document.getElementById('speaker-name');
        if (speakerNameEl) {
            speakerNameEl.textContent = speakerMap[i] || "Expositor 1";
        }
    };

    // Stagger slide elements into view
    window.staggerIn = function(slide, dir) {
        const fromY = (dir >= 0) ? 24 : -24;
        const items = Array.from(slide.querySelectorAll('.e'));
        gsap.killTweensOf(items);
        gsap.set(items, { opacity: 0, y: fromY, filter: 'blur(5px)' });
        gsap.to(items, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.68,
            stagger: 0.08,
            ease: 'power3.out'
        });

        // Trigger KaTeX rendering if elements were updated
        renderMath();

        // Animate cover curve paths if on Portada
        if (slide.classList.contains('slide-cover')) {
            const paths = Array.from(slide.querySelectorAll('.hero-path'));
            if (paths.length > 0) {
                gsap.fromTo(paths,
                    { strokeDashoffset: 800 },
                    { strokeDashoffset: 0, duration: 2.2, stagger: 0.12, ease: 'power2.out' }
                );
            }
        }
    };

    function staggerOut(slide, dir) {
        const items = Array.from(slide.querySelectorAll('.e'));
        gsap.killTweensOf(items);
        gsap.to(items, {
            opacity: 0,
            y: dir > 0 ? -18 : 18,
            filter: 'blur(4px)',
            duration: 0.28,
            stagger: 0.02,
            ease: 'power2.in'
        });
    }

    // Slide transition controller
    function goTo(next) {
        if (window.busy || next === window.cur || next < 0 || next >= TOTAL) return;
        window.busy = true;

        const dir = next > window.cur ? 1 : -1;
        const entering = window.slides[next];
        const leaving = window.slides[window.cur];

        const enterItems = Array.from(entering.querySelectorAll('.e'));
        gsap.set(enterItems, { opacity: 0, y: dir > 0 ? 24 : -24, filter: 'blur(4px)' });
        gsap.set(entering, { y: dir > 0 ? '100%' : '-100%', zIndex: TOTAL - next });
        gsap.set(leaving, { zIndex: TOTAL - window.cur });

        staggerOut(leaving, dir);

        gsap.to(entering, {
            y: '0%',
            duration: 0.8,
            ease: 'expo.inOut',
            onComplete: () => {
                window.staggerIn(entering, dir);
                gsap.set(leaving, { y: dir > 0 ? '-100%' : '100%' });
                window.cur = next;
                window.busy = false;
                window.updateHUD(window.cur);
            }
        });
    }

    // ─── 3. NAVIGATION INPUTS ───
    let wheelTimeout = null;
    let lastWheelDelta = 0;
    window.addEventListener('wheel', e => {
        if (window.isBlackout) return;
        if (wheelTimeout) return;
        lastWheelDelta = e.deltaY;
        wheelTimeout = setTimeout(() => {
            if (lastWheelDelta > 0) goTo(window.cur + 1);
            else if (lastWheelDelta < 0) goTo(window.cur - 1);
            wheelTimeout = null;
        }, 80);
    }, { passive: true });

    let touchStartY = 0;
    window.addEventListener('touchstart', e => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', e => {
        if (window.isBlackout) return;
        const delta = touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(delta) > 45) {
            if (delta > 0) goTo(window.cur + 1);
            else goTo(window.cur - 1);
        }
    }, { passive: true });

    window.addEventListener('keydown', e => {
        // If presentation is in blackout curtain, double click or pressing Enter/Space/B unlocks it
        if (window.isBlackout) {
            if (['Enter', 'Space', 'KeyB', 'PageDown', 'ArrowRight', 'ArrowDown'].includes(e.code) || ['b', 'B', 'Enter'].includes(e.key)) {
                e.preventDefault();
                window.unlockBlackout();
            }
            return;
        }

        // Toggle blackout mode with 'B' during presentation
        if (e.key === 'b' || e.key === 'B') {
            e.preventDefault();
            window.toggleBlackout();
            return;
        }

        if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) {
            e.preventDefault();
            goTo(window.cur + 1);
        } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
            e.preventDefault();
            goTo(window.cur - 1);
        } else if (e.key === 'g' || e.key === 'G') {
            window.open('guion.html', '_blank');
        } else if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        } else if (e.code === 'Space') {
            e.preventDefault();
            // On Slide 2 (index 2: Rendimiento & Escala), space toggles the scale demo
            if (window.cur === 2) {
                const currentScale = window.currentScaleValue || 10;
                window.setScale(currentScale === 10 ? 100000 : 10);
            } else {
                goTo(window.cur + 1);
            }
        }
    });

    // Hide navigation hint on first interaction
    const hideHint = () => {
        if (hintEl) gsap.to(hintEl, { opacity: 0, duration: 0.4 });
    };
    window.addEventListener('wheel', hideHint, { once: true });
    window.addEventListener('keydown', hideHint, { once: true });
    window.addEventListener('touchend', hideHint, { once: true });

    // ─── 4. BLACKOUT CURTAIN CONTROLLER (INICIO EN NEGRO & DOBLE CLIC) ───
    window.isBlackout = true;
    const curtain = document.getElementById('blackout-curtain');
    const hudElements = [
        dotsEl,
        hintEl,
        counterEl,
        document.querySelector('.deck-brand-pill'),
        document.querySelector('.deck-bottom-left')
    ].filter(Boolean);

    // Initial silent preparation of Slide 0
    gsap.set(window.slides[0].querySelectorAll('.e'), { opacity: 0 });
    const heroCurves = Array.from(window.slides[0].querySelectorAll('.hero-path'));
    if (heroCurves.length > 0) {
        gsap.set(heroCurves, { strokeDashoffset: 800 });
    }
    gsap.set(hudElements, { opacity: 0 });
    window.updateHUD(0);

    window.unlockBlackout = function() {
        if (!window.isBlackout) return;
        window.isBlackout = false;

        if (curtain) {
            gsap.to(curtain, {
                opacity: 0,
                duration: 0.9,
                ease: 'power2.inOut',
                onComplete: () => {
                    curtain.style.display = 'none';
                }
            });
        }

        // Fade in HUD gracefully
        gsap.to(hudElements, { opacity: 1, duration: 0.8, stagger: 0.06, ease: 'power2.out' });

        // Trigger entrance animation on Slide 0 and start drawing laser curves
        window.staggerIn(window.slides[0], 1);
    };

    window.toggleBlackout = function() {
        if (!curtain) return;
        if (window.isBlackout) {
            window.unlockBlackout();
        } else {
            window.isBlackout = true;
            curtain.style.display = 'flex';
            gsap.to(curtain, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });
            gsap.to(hudElements, { opacity: 0, duration: 0.4 });
        }
    };

    if (curtain) {
        // Double-click on curtain unlocks
        curtain.addEventListener('dblclick', e => {
            e.preventDefault();
            e.stopPropagation();
            window.unlockBlackout();
        });

        // Touch double-tap support for mobile / tablets
        let lastTapTime = 0;
        curtain.addEventListener('touchend', e => {
            const now = Date.now();
            if (now - lastTapTime < 380 && now - lastTapTime > 0) {
                e.preventDefault();
                window.unlockBlackout();
            }
            lastTapTime = now;
        });

        // Subtle hint when moving mouse over the black screen
        let hintTimer = null;
        window.addEventListener('mousemove', () => {
            if (!window.isBlackout) return;
            curtain.classList.add('show-hint');
            clearTimeout(hintTimer);
            hintTimer = setTimeout(() => {
                if (window.isBlackout) curtain.classList.remove('show-hint');
            }, 2400);
        });
    }

    // Window double-click fallback
    window.addEventListener('dblclick', () => {
        if (window.isBlackout) {
            window.unlockBlackout();
        }
    });

    // Initial KaTeX math formatting
    renderMath();
    initCartesianGraph();

    // ─── 5. DESKTOP PRESENTATION AUTOSCALER ───
    // Automatically fits the widescreen desktop slide layout onto any screen (projectors, TVs, tablets, scaled displays)
    function autoScaleDeck() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const targetW = 1260;
        const targetH = 750;

        let scale = 1;
        if (w < targetW || h < targetH) {
            const scaleW = w / targetW;
            const scaleH = h / targetH;
            scale = Math.min(scaleW, scaleH);
            scale = Math.max(0.65, Math.min(scale, 1.15));
        }

        document.documentElement.style.setProperty('--deck-scale', scale.toFixed(3));
    }

    window.addEventListener('resize', autoScaleDeck);
    autoScaleDeck();
});

// Helper for rendering KaTeX equations safely
function renderMath() {
    if (window.renderMathInElement) {
        try {
            renderMathInElement(document.body, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ],
                throwOnError: false
            });
        } catch (e) {
            console.warn("KaTeX render note:", e);
        }
    }
}

// ==========================================================================
// SLIDE 1: INTERACTIVE SCALE CONTROLLER
// ==========================================================================
window.currentScaleValue = 10;

window.setScale = function(n) {
    window.currentScaleValue = n;

    const btn10 = document.getElementById('btn-scale-10');
    const btn100k = document.getElementById('btn-scale-100k');
    const cardB = document.getElementById('card-algo-b');
    const badgeB = document.getElementById('badge-b');
    const crashBanner = document.getElementById('crash-banner');

    const opsA = document.getElementById('ops-a');
    const timeA = document.getElementById('time-a');
    const meterA = document.getElementById('meter-a');

    const opsB = document.getElementById('ops-b');
    const timeB = document.getElementById('time-b');
    const meterB = document.getElementById('meter-b');
    const statusTextB = document.getElementById('status-text-b');
    const statusB = document.getElementById('status-b');

    const pathCurveB = document.getElementById('curve-path-b');
    const areaCurveB = document.getElementById('curve-area-b');
    const dotCurveB = document.getElementById('curve-dot-b');
    const tagB = document.getElementById('curve-tag-b');
    const titleB = document.getElementById('curve-title-b');

    if (n === 10) {
        if (btn10) btn10.classList.add('active');
        if (btn100k) btn100k.classList.remove('active');

        // Algo A: 5(10) + 10 = 60 ops
        if (opsA) opsA.textContent = "60 ops";
        if (timeA) timeA.textContent = "~ 0.00006 ms";
        if (meterA) meterA.style.width = "2%";

        // Algo B: 2(1000) + 100 + 100 = 2200 ops
        if (opsB) opsB.textContent = "2.200 ops";
        if (timeB) timeB.textContent = "~ 0.0022 ms";
        if (meterB) {
            meterB.style.width = "4%";
            meterB.classList.remove('meter-red');
            meterB.classList.add('meter-green');
        }

        if (statusTextB) statusTextB.textContent = "Estable";
        if (statusB) {
            statusB.classList.remove('status-red');
            statusB.classList.add('status-green');
        }

        if (badgeB) {
            badgeB.className = 'pill-badge-green pill-green';
        }

        if (cardB) cardB.classList.remove('crash-mode');
        if (crashBanner) crashBanner.style.display = 'none';

        // Reset SVG curve to gentle green curve
        if (pathCurveB) {
            pathCurveB.setAttribute('d', 'M 8,39 C 140,39 260,37 372,35');
            pathCurveB.setAttribute('stroke', '#10b981');
        }
        if (areaCurveB) {
            areaCurveB.setAttribute('d', 'M 8,39 C 140,39 260,37 372,35 L 372,40 L 8,40 Z');
            areaCurveB.setAttribute('fill', 'url(#gradCurveBGreen)');
        }
        if (dotCurveB) {
            dotCurveB.setAttribute('cx', '372');
            dotCurveB.setAttribute('cy', '35');
            dotCurveB.setAttribute('fill', '#10b981');
        }
        if (tagB) {
            tagB.className = 'curve-val-tag tag-green';
            tagB.textContent = 'Zona Segura';
        }
        if (titleB) titleB.textContent = "Curva de Crecimiento: Estable en n = 10";

    } else {
        // n = 100,000
        if (btn10) btn10.classList.remove('active');
        if (btn100k) btn100k.classList.add('active');

        // Algo A: 5(100000) + 10 = 500,010 ops
        if (opsA) opsA.textContent = "500.010 ops";
        if (timeA) timeA.textContent = "~ 0.50 ms";
        if (meterA) meterA.style.width = "18%";

        // Algo B: 2*(10^5)^3 + (10^5)^2 + 100 = 2,000,010,000,000,100 ops (~2 * 10^15 ops)
        if (opsB) opsB.textContent = "2.000.010.000.000.100 ops (2 × 10¹⁵)";
        if (timeB) timeB.textContent = "> 23.1 DÍAS (CPU a 1 GHz)";
        if (meterB) {
            meterB.style.width = "100%";
            meterB.classList.remove('meter-green');
            meterB.classList.add('meter-red');
        }

        if (statusTextB) statusTextB.textContent = "CRASH / OOM";
        if (statusB) {
            statusB.classList.remove('status-green');
            statusB.classList.add('status-red');
        }

        if (badgeB) {
            badgeB.className = 'pill-badge-red pill-red';
        }

        if (cardB) cardB.classList.add('crash-mode');
        if (crashBanner) {
            crashBanner.style.display = 'flex';
            gsap.fromTo(crashBanner,
                { opacity: 0, y: -10, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
            );
        }

        // Morph SVG curve to steep exponential red spike
        if (pathCurveB) {
            pathCurveB.setAttribute('d', 'M 8,40 C 180,40 270,36 345,6');
            pathCurveB.setAttribute('stroke', '#ef4444');
        }
        if (areaCurveB) {
            areaCurveB.setAttribute('d', 'M 8,40 C 180,40 270,36 345,6 L 345,40 L 8,40 Z');
            areaCurveB.setAttribute('fill', 'url(#gradCurveBRed)');
        }
        if (dotCurveB) {
            dotCurveB.setAttribute('cx', '345');
            dotCurveB.setAttribute('cy', '6');
            dotCurveB.setAttribute('fill', '#ef4444');
        }
        if (tagB) {
            tagB.className = 'curve-val-tag tag-red';
            tagB.textContent = '¡Disparo Cúbico!';
        }
        if (titleB) titleB.textContent = "Curva de Crecimiento: Colapso Exponencial (> 2×10¹⁵ ops)";
    }
};

// ==========================================================================
// SLIDE 2: CPU HARDWARE SIMULATION
// ==========================================================================
window.setCpuHw = function(type) {
    const btnFast = document.getElementById('hw-fast');
    const btnSlow = document.getElementById('hw-slow');
    const clockLabel = document.getElementById('cpu-clock-label');
    const timeSub = document.getElementById('hw-time-sub');

    if (type === 'fast') {
        if (btnFast) btnFast.classList.add('active');
        if (btnSlow) btnSlow.classList.remove('active');
        if (clockLabel) clockLabel.textContent = "5.0 GHz";
        if (timeSub) timeSub.textContent = "Tiempo: ~0.0008 ms (Rápido) · Ops: Invariantes";
    } else {
        if (btnFast) btnFast.classList.remove('active');
        if (btnSlow) btnSlow.classList.add('active');
        if (clockLabel) clockLabel.textContent = "100 MHz";
        if (timeSub) timeSub.textContent = "Tiempo: ~0.0400 ms (Lento) · Ops: Invariantes";
    }

    // Visual pulse effect through diagram
    gsap.fromTo(".pipeline-node",
        { borderColor: "rgba(113, 112, 255, 0.6)" },
        { borderColor: "rgba(255, 255, 255, 0.08)", duration: 0.6, stagger: 0.1 }
    );
};

// ==========================================================================
// SLIDE 3: INTERACTIVE BIG O SIMPLIFICATION (FADE-OUT ANIMATION)
// ==========================================================================
window.highlightRule = function(type) {
    console.log("Rule highlighted:", type);
};

window.runFadeOutAnimation = function() {
    window.resetFadeOutAnimation();

    const partConst = document.getElementById('part-const');
    const partPlus2 = document.getElementById('part-plus2');
    const partLinear = document.getElementById('part-linear');
    const partPlus1 = document.getElementById('part-plus1');
    const partCoeff = document.getElementById('part-coeff');
    const partCubic = document.getElementById('part-cubic');
    const bigOTarget = document.getElementById('big-o-target');
    const mathWrap = document.getElementById('math-expr-wrap');

    const p1 = document.getElementById('step-pill-1');
    const p2 = document.getElementById('step-pill-2');
    const p3 = document.getElementById('step-pill-3');
    const p4 = document.getElementById('step-pill-4');
    const p5 = document.getElementById('step-pill-5');

    const updatePills = (activePill) => {
        [p1, p2, p3, p4, p5].forEach(p => {
            if (p) p.classList.toggle('active', p === activePill);
        });
    };

    const tl = gsap.timeline();

    // Step 1: Base
    tl.call(() => updatePills(p1))
      .to({}, { duration: 0.3 })

    // Step 2: Fade constant (+ 1000)
      .call(() => updatePills(p2))
      .to([partConst, partPlus2], {
          opacity: 0,
          scale: 0.4,
          y: -20,
          filter: "blur(6px)",
          duration: 0.65,
          ease: "power2.in"
      })

    // Step 3: Fade linear term (+ 20n)
      .call(() => updatePills(p3))
      .to([partLinear, partPlus1], {
          opacity: 0,
          scale: 0.4,
          y: -20,
          filter: "blur(6px)",
          duration: 0.65,
          ease: "power2.in"
      }, "+=0.2")

    // Step 4: Drop coefficient (5)
      .call(() => updatePills(p4))
      .to(partCoeff, {
          opacity: 0,
          scale: 0.4,
          y: -15,
          filter: "blur(5px)",
          duration: 0.55,
          ease: "power2.in"
      }, "+=0.2")

    // Step 5: Highlight cubic term and reveal O(n³)
      .call(() => updatePills(p5))
      .to(partCubic, {
          scale: 1.4,
          color: "#a5a8ff",
          duration: 0.5,
          ease: "back.out(2)"
      })
      .to(mathWrap, {
          opacity: 0,
          scale: 0.7,
          duration: 0.4,
          ease: "power2.in"
      }, "+=0.2")
      .to(bigOTarget, {
          opacity: 1,
          scale: 1,
          duration: 0.7,
          ease: "elastic.out(1, 0.75)"
      });
};

window.resetFadeOutAnimation = function() {
    const partConst = document.getElementById('part-const');
    const partPlus2 = document.getElementById('part-plus2');
    const partLinear = document.getElementById('part-linear');
    const partPlus1 = document.getElementById('part-plus1');
    const partCoeff = document.getElementById('part-coeff');
    const partCubic = document.getElementById('part-cubic');
    const bigOTarget = document.getElementById('big-o-target');
    const mathWrap = document.getElementById('math-expr-wrap');

    const p1 = document.getElementById('step-pill-1');
    const p2 = document.getElementById('step-pill-2');
    const p3 = document.getElementById('step-pill-3');
    const p4 = document.getElementById('step-pill-4');
    const p5 = document.getElementById('step-pill-5');

    gsap.killTweensOf([partConst, partPlus2, partLinear, partPlus1, partCoeff, partCubic, bigOTarget, mathWrap]);

    gsap.set([partConst, partPlus2, partLinear, partPlus1, partCoeff], {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)"
    });
    gsap.set(partCubic, { scale: 1, color: "#ffffff" });
    gsap.set(mathWrap, { opacity: 1, scale: 1 });
    gsap.set(bigOTarget, { opacity: 0, scale: 0.6 });

    [p1, p2, p3, p4, p5].forEach(p => {
        if (p) p.classList.toggle('active', p === p1);
    });
};

// ==========================================================================
// SLIDE 4: CARTESIAN GRAPH INTERACTIVITY
// ==========================================================================
function initCartesianGraph() {
    const svg = document.getElementById('cartesian-svg');
    const scrub = document.getElementById('interactive-scrub');
    const scrubLine = document.getElementById('scrub-line');
    const scrubDotCgn = document.getElementById('scrub-dot-cgn');
    const scrubDotTn = document.getElementById('scrub-dot-tn');
    const statusText = document.getElementById('graph-status-text');
    const shadedArea = document.getElementById('graph-shaded-area');

    if (!svg) return;

    svg.addEventListener('mousemove', e => {
        const rect = svg.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * 960;

        if (svgX < 90 || svgX > 880) return;

        if (scrub) scrub.style.display = 'block';

        if (scrubLine) {
            scrubLine.setAttribute('x1', svgX);
            scrubLine.setAttribute('x2', svgX);
        }

        // Approximate heights for curves at X
        // n0 threshold is at 390
        const t = (svgX - 90) / (880 - 90);
        const yTn = 230 - t * 125 + Math.sin(t * Math.PI * 1.5) * 15;
        const yCgn = 265 - t * 217;

        if (scrubDotTn) {
            scrubDotTn.setAttribute('cx', svgX);
            scrubDotTn.setAttribute('cy', yTn);
        }
        if (scrubDotCgn) {
            scrubDotCgn.setAttribute('cx', svgX);
            scrubDotCgn.setAttribute('cy', yCgn);
        }

        if (statusText) {
            if (svgX < 390) {
                statusText.innerHTML = `Para <strong>n < n₀</strong>: El algoritmo real $T(n)$ puede sobrepasar $c \\cdot g(n)$ debido a costos fijos y constantes iniciales.`;
                if (shadedArea) shadedArea.style.opacity = '0.35';
            } else {
                statusText.innerHTML = `Para <strong>n ≥ n₀</strong>: La cota superior $c \\cdot g(n)$ supera a $T(n)$. <strong>¡La condición $0 \\le T(n) \\le c \\cdot g(n)$ se cumple inviolablemente!</strong>`;
                if (shadedArea) shadedArea.style.opacity = '1';
            }
            renderMath();
        }
    });

    svg.addEventListener('mouseleave', () => {
        if (scrub) scrub.style.display = 'none';
        if (shadedArea) shadedArea.style.opacity = '1';
        if (statusText) {
            statusText.innerHTML = `En el punto <strong>n₀</strong>, la cota $c \\cdot g(n)$ cruza por encima de $T(n)$. Para todo <strong>n ≥ n₀</strong>, la cota superior jamás vuelve a romperse.`;
            renderMath();
        }
    });
}

// ==========================================================================
// SLIDE 5: PRACTICAL CUBIC PROOF SUBSTITUTION
// ==========================================================================
window.setProofN = function(n) {
    // Update active pill button
    [10, 15, 20, 50, 100].forEach(val => {
        const btn = document.getElementById(`n-btn-${val}`);
        if (btn) btn.classList.toggle('active', val === n);
    });

    const c = 3;
    // T(n) = 2n^3 + n^2 + 100
    const tn = 2 * Math.pow(n, 3) + Math.pow(n, 2) + 100;
    // c * g(n) = 3 * n^3
    const cgn = c * Math.pow(n, 3);

    const formatNum = num => num.toLocaleString('de-DE');

    const formTn = document.getElementById('formula-tn-live');
    const valTn = document.getElementById('val-tn-live');
    const formCgn = document.getElementById('formula-cgn-live');
    const valCgn = document.getElementById('val-cgn-live');
    const note = document.getElementById('sub-footer-note');
    const checkBadge = document.getElementById('verified-badge-wrap');

    if (formTn) formTn.textContent = `2(${n})³ + (${n})² + 100`;
    if (valTn) {
        gsap.fromTo(valTn, { scale: 0.9, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.3 });
        valTn.textContent = formatNum(tn);
    }

    if (formCgn) formCgn.textContent = `3 · (${n})³`;
    if (valCgn) {
        gsap.fromTo(valCgn, { scale: 0.9, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.3 });
        valCgn.textContent = formatNum(cgn);
    }

    const margin = cgn - tn;
    if (note) {
        note.innerHTML = `Demostración en $n = ${n}$: <strong>${formatNum(tn)} $\\le$ ${formatNum(cgn)}</strong>. La desigualdad se cumple con una holgura positiva de <strong>${formatNum(margin)} operaciones</strong> a favor de la cota superior.`;
    }

    if (checkBadge) {
        gsap.fromTo(checkBadge,
            { scale: 0.85, opacity: 0.6 },
            { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }
        );
    }

    renderMath();
};

// Interactive Parallax Reaction for Slide 0 Portada & Slide 11 Big O Reactor
document.addEventListener('mousemove', e => {
    if (window.cur === 0) {
        const emblem = document.querySelector('.cover-big-o-emblem');
        if (emblem) {
            const rect = emblem.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            emblem.style.transform = `perspective(800px) rotateY(${dx * 10}deg) rotateX(${-dy * 10}deg) translateY(-2px)`;
        }
    } else if (window.cur === 11) {
        const reactor = document.getElementById('big-o-epic-reactor');
        if (reactor) {
            const rect = reactor.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            reactor.style.transform = `perspective(900px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg)`;
        }
    }
});
