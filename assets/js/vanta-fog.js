(() => {
  const target = document.getElementById("vanta-fog");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

  if (
    !target ||
    reducedMotion.matches ||
    !window.THREE ||
    !window.VANTA ||
    typeof window.VANTA.FOG !== "function"
  ) {
    return;
  }

  let fog;

  const initializeFog = (darkMode) => {
    if (fog) {
      fog.destroy();
      fog = null;
    }

    const palette = darkMode
      ? {
          baseColor: 0x20212b,
          highlightColor: 0x719ab1,
          midtoneColor: 0x536f80,
          lowlightColor: 0x2b3742,
        }
      : {
          baseColor: 0xf7fafc,
          highlightColor: 0xd7edf4,
          midtoneColor: 0xc6dfe8,
          lowlightColor: 0xaebfcb,
        };

    try {
      fog = window.VANTA.FOG({
        el: target,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        blurFactor: 0.55,
        speed: 0.45,
        zoom: 1.1,
        scale: 1,
        scaleMobile: 1.5,
        ...palette,
      });
    } catch (error) {
      // Keep the static background fallback if WebGL is unavailable.
      console.warn("Vanta Fog could not be initialized.", error);
    }
  };

  initializeFog(colorScheme.matches);

  const handleColorSchemeChange = (event) => {
    initializeFog(event.matches);
  };

  if (typeof colorScheme.addEventListener === "function") {
    colorScheme.addEventListener("change", handleColorSchemeChange);
  } else if (typeof colorScheme.addListener === "function") {
    colorScheme.addListener(handleColorSchemeChange);
  }
})();
