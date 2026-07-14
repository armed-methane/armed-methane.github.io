const text = "ARMED METHANE";
const el = document.querySelector(".title");
const hero = document.querySelector(".hero");
const title = document.querySelector(".title");
const subtitle = document.querySelector(".subtitle");
const statusBox = document.querySelector(".status-box");
const body = document.body;
const chars = "asdfghjklqwertyuiopzxcvbnm1234567890";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

let lastScrollY = 0;
let isNavbarHidden = false;

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function lockScroll() {
  body.classList.add('no-scroll');
}

let lenis;

function unlockScroll() {
  body.classList.remove('no-scroll');
}

function initLenis() {
  if (lenis || typeof Lenis === 'undefined') return;

  lenis = new Lenis({
    duration: 1,
    easing: (t) => 1 - Math.pow(1 - t, 5),
    wheelMultiplier: 1,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

function resetScroll() {
  window.scrollTo(0, 0);
  setTimeout(() => window.scrollTo(0, 0), 20);
}

function hideNavbar() {
  if (!hero.classList.contains('navbar') || isNavbarHidden) return;
  isNavbarHidden = true;
  hero.classList.add('hide');
}

function showNavbar() {
  if (!hero.classList.contains('navbar') || !isNavbarHidden) return;
  isNavbarHidden = false;
  hero.classList.remove('hide');
}

function handleScroll() {
  if (!hero.classList.contains('navbar')) return;
  const currentY = window.pageYOffset;
  const delta = currentY - lastScrollY;
  if (Math.abs(delta) < 15) return;

  if (delta > 0) {
    hideNavbar();
  } else {
    showNavbar();
  }

  lastScrollY = currentY;
}

window.addEventListener('scroll', handleScroll, { passive: true });

window.addEventListener('DOMContentLoaded', () => {
  lockScroll();
  resetScroll();
});
window.addEventListener('load', resetScroll);
window.addEventListener('pageshow', resetScroll);

let scrambleComplete = false;
let animationComplete = false;

function introFinished() {
  if (scrambleComplete && animationComplete) {
    showIntroGate();
  }
}

function runScramble() {
  let iteration = 0;
  const interval = setInterval(() => {
    el.innerText = text
      .split("")
      .map((letter, index) => {
        if (index < iteration) return text[index];
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join("");

    if (iteration >= text.length) {
      clearInterval(interval);
      scrambleComplete = true;
      introFinished();
    }

    iteration += 0.3;
  }, 30);
}

function runIntroTimeline() {
  const timeline = gsap.timeline({ onComplete: () => {
    animationComplete = true;
    introFinished();
  }});

  timeline
    .from(title, {
      opacity: 0,
      y: 80,
      duration: 1.5,
      ease: "power3.out"
    })
    .from(subtitle, {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: "power3.out"
    }, "-=1")
    .from("#heroMolecule", {
      opacity: 0,
      scale: 0.8,
      duration: 1.5,
      ease: "power3.out"
    }, 0);
}

function startIntro() {
  if (prefersReducedMotion) {
    el.innerText = text;
    gsap.set([title, subtitle], { opacity: 1, y: 0 });
    scrambleComplete = true;
    animationComplete = true;
    introFinished();
    return;
  }
  runScramble();
  runIntroTimeline();
}

startIntro();

function moveHeroToNavbar() {
  if (hero.classList.contains("navbar")) return;

  const rect = hero.getBoundingClientRect();
  hero.style.position = "fixed";
  hero.style.top = `${rect.top}px`;
  hero.style.left = `${rect.left}px`;
  hero.style.width = `${rect.width}px`;
  hero.style.height = `${rect.height}px`;
  hero.style.margin = "0";
  hero.style.zIndex = "1000";

  gsap.to(hero, {
    duration: 0.8,
    top: 0,
    left: 0,
    width: "100%",
    height: "5rem",
    ease: "power3.inOut",
    onComplete: () => {
      hero.classList.add("navbar");
      hero.style.position = "fixed";
      hero.style.top = "0";
      hero.style.left = "0";
      hero.style.width = "100%";
      hero.style.height = "5rem";
      hero.style.transform = "";
      lastScrollY = window.pageYOffset;
      unlockScroll();
      initLenis();
      showStatusBox();
    }
  });

  gsap.to(title, {
    duration: 0.6,
    fontSize: "3rem",
    ease: "power3.inOut"
  });

  gsap.to(subtitle, {
    duration: 0.6,
    fontSize: "0.7rem",
    opacity: 0.85,
    ease: "power3.inOut"
  });

  flyHeroMoleculeToBanner();
}

function flyHeroMoleculeToBanner() {
  const heroMoleculeEl = document.getElementById("heroMolecule");
  const bannerEl = document.querySelector(".molecule-banner");
  if (!heroMoleculeEl || !bannerEl) return;


  const startRect = heroMoleculeEl.getBoundingClientRect();
  const endRect = bannerEl.getBoundingClientRect();

  heroMoleculeEl.style.position = "fixed";
  heroMoleculeEl.style.top = `${startRect.top}px`;
  heroMoleculeEl.style.left = `${startRect.left}px`;
  heroMoleculeEl.style.width = `${startRect.width}px`;
  heroMoleculeEl.style.height = `${startRect.height}px`;
  heroMoleculeEl.style.margin = "0";
  heroMoleculeEl.style.transform = "none";

  const targetSize = Math.max(Math.min(endRect.width, endRect.height) * 0.6, 60);
  const targetTop = endRect.top + endRect.height / 2 - targetSize / 2;
  const targetLeft = endRect.left + endRect.width / 2 - targetSize / 2;

  gsap.to(heroMoleculeEl, {
    duration: 1.7,
    top: targetTop,
    left: targetLeft,
    width: targetSize,
    height: targetSize,
    opacity: 0,
    ease: "power2.inOut",
    onComplete: () => {
      bannerEl.classList.add("reveal");
      if (window.__bannerMoleculeControls) {
        window.__bannerMoleculeControls.enableDrift();
      }
      if (window.__heroMoleculeControls) {
        window.__heroMoleculeControls.stop();
      }
      heroMoleculeEl.style.display = "none";
    }
  });
}

function showStatusBox() {
  if (!statusBox) return;
  statusBox.classList.remove("closed");
  statusBox.classList.add("visible");
  statusBox.removeAttribute("aria-hidden");
}

const statusClose = document.querySelector(".status-close");
if (statusClose) {
  statusClose.addEventListener("click", () => {
    if (!statusBox) return;
    statusBox.classList.remove("visible");
    statusBox.classList.add("closed");
    statusBox.setAttribute("aria-hidden", "true");
  });
}

// warn
const introGate = document.getElementById("introGate");
const introGateAccept = document.querySelector(".intro-gate-accept");

function showIntroGate() {
  if (!introGate) {
    moveHeroToNavbar();
    return;
  }
  introGate.classList.add("show");
  introGate.removeAttribute("aria-hidden");
}

if (introGateAccept) {
  introGateAccept.addEventListener("click", () => {
    if (introGate) {
      introGate.classList.remove("show");
      introGate.setAttribute("aria-hidden", "true");
      setTimeout(() => {
        introGate.remove();
        moveHeroToNavbar();
      }, 400);
    } else {
      moveHeroToNavbar();
    }
  }, { once: true });
}

// cursor
const cursorTarget = document.getElementById("cursorTarget");
const cursorCoords = cursorTarget ? cursorTarget.querySelector(".cursor-coords") : null;

if (cursorTarget && window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("mousemove", (e) => {
    cursorTarget.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    if (cursorCoords) {
      const x = String(Math.round(e.clientX)).padStart(4, "0");
      const y = String(Math.round(e.clientY)).padStart(4, "0");
      cursorCoords.textContent = `X:${x} Y:${y}`;
    }
  });

  const hoverTargets = document.querySelectorAll(
    "a, button, input, textarea, [role='button'], .status-close, .hud-frame"
  );
  hoverTargets.forEach((elx) => {
    elx.addEventListener("mouseenter", () => cursorTarget.classList.add("is-hovering"));
    elx.addEventListener("mouseleave", () => cursorTarget.classList.remove("is-hovering"));
  });
}

document.querySelectorAll(".hud-frame").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-4px) rotateX(${py * -8}deg) rotateY(${px * 8}deg)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});
