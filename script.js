const revealTargets = [...document.querySelectorAll('.section, .card')];

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.18 }
);

revealTargets.forEach((target) => {
  target.classList.add('reveal');
  observer.observe(target);
});
