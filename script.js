const text = "ARMED METHANE";
const el = document.querySelector(".title");
const hero = document.querySelector(".hero");
const title = document.querySelector(".title");
const subtitle = document.querySelector(".subtitle");
const body = document.body;
const chars = "<!>?@#$%^&*>";

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function lockScroll() {
  body.classList.add('no-scroll');
}

function unlockScroll() {
  body.classList.remove('no-scroll');
}

function resetScroll() {
  window.scrollTo(0, 0);
  setTimeout(() => window.scrollTo(0, 0), 20);
}

window.addEventListener('DOMContentLoaded', () => {
  lockScroll();
  resetScroll();
});
window.addEventListener('load', resetScroll);
window.addEventListener('pageshow', resetScroll);

let iteration = 0;
let scrambleComplete = false;
let animationComplete = false;

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
    maybeMoveNavbar();
  }

  iteration += 0.3;
}, 30);

gsap.registerPlugin(ScrollTrigger);

const timeline = gsap.timeline({ onComplete: () => {
  animationComplete = true;
  maybeMoveNavbar();
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
  .fromTo(".propeller", { rotate: 0 }, {
    rotate: 800.1,
    duration: 2,
    ease: "circ.out"
  }, 0);

gsap.from(".hero", {
  opacity: 0,
  scrollTrigger: {
    trigger: ".hero",
    start: "top 80%",
  }
});

function maybeMoveNavbar() {
  if (scrambleComplete && animationComplete) {
    moveHeroToNavbar();
  }
}

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
    height: "8rem",
    ease: "power3.inOut",
    onComplete: () => {
      hero.classList.add("navbar");
      hero.style.position = "fixed";
      hero.style.top = "0";
      hero.style.left = "0";
      hero.style.width = "100%";
      hero.style.height = "8rem";
      unlockScroll();
    }
  });

  gsap.to(title, {
    duration: 0.6,
    fontSize: "1.5rem",
    ease: "power3.inOut"
  });

  gsap.to(subtitle, {
    duration: 0.6,
    fontSize: "1rem",
    opacity: 0.85,
    ease: "power3.inOut"
  });

  gsap.to(".propeller", {
    duration: 0.8,
    width: 140,
    top: "1rem",
    right: "1rem",
    left: "auto",
    opacity: 0.18,
    ease: "power3.inOut"
  });
}

