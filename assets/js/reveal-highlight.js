(() => {
  const LIST_SELECTOR = ".homepage-content ul";
  const CARD_SELECTOR = ".homepage-content ul > li";
  const MAX_TILT = 2.6;
  const PASTEL_HUES = [12, 38, 105, 164, 198, 232, 278, 330];

  const shuffledHues = [...PASTEL_HUES];
  for (let index = shuffledHues.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledHues[index], shuffledHues[randomIndex]] = [
      shuffledHues[randomIndex],
      shuffledHues[index],
    ];
  }

  document.querySelectorAll(LIST_SELECTOR).forEach((list, index) => {
    const cycle = Math.floor(index / shuffledHues.length);
    const hue = (shuffledHues[index % shuffledHues.length] + cycle * 19) % 360;
    list.style.setProperty("--reveal-hue", hue);
  });

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!finePointer.matches || reducedMotion.matches) return;

  document.querySelectorAll(CARD_SELECTOR).forEach((card) => {
    let animationFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const render = () => {
      animationFrame = 0;

      const bounds = card.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;

      const x = Math.min(Math.max(pointerX - bounds.left, 0), bounds.width);
      const y = Math.min(Math.max(pointerY - bounds.top, 0), bounds.height);
      const horizontal = x / bounds.width;
      const vertical = y / bounds.height;
      const rotateX = (vertical - 0.5) * MAX_TILT * 2;
      const rotateY = (0.5 - horizontal) * MAX_TILT * 2;

      card.style.setProperty("--reveal-x", `${x}px`);
      card.style.setProperty("--reveal-y", `${y}px`);
      card.style.setProperty("--reveal-rotate-x", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--reveal-rotate-y", `${rotateY.toFixed(2)}deg`);
    };

    const updatePointer = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const resetCard = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }

      card.style.setProperty("--reveal-x", "50%");
      card.style.setProperty("--reveal-y", "50%");
      card.style.setProperty("--reveal-rotate-x", "0deg");
      card.style.setProperty("--reveal-rotate-y", "0deg");
    };

    const focusCard = () => {
      card.classList.add("is-reveal-focused");
    };

    const releaseCard = () => {
      if (!card.matches(":hover") && !card.matches(":focus-within")) {
        card.classList.remove("is-reveal-focused");
      }
    };

    card.addEventListener("pointerenter", (event) => {
      focusCard();
      updatePointer(event);
    });
    card.addEventListener("pointermove", updatePointer);
    card.addEventListener("pointerleave", () => {
      resetCard();
      releaseCard();
    });
    card.addEventListener("focusin", focusCard);
    card.addEventListener("focusout", () => {
      window.requestAnimationFrame(releaseCard);
    });
  });
})();
