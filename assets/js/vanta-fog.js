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

  const palettes = [
    {
      light: {
        baseColor: 0xffebeb,
        highlightColor: 0xffc300,
        midtoneColor: 0xff1f00,
        lowlightColor: 0x2d00ff,
      },
      dark: {
        baseColor: 0xffebeb,
        highlightColor: 0xffc300,
        midtoneColor: 0xff1f00,
        lowlightColor: 0x2d00ff,
      },
    },
    {
      light: {
        baseColor: 0xf2fbfc,
        highlightColor: 0xa8e6ef,
        midtoneColor: 0x73cddc,
        lowlightColor: 0x5e81ac,
      },
      dark: {
        baseColor: 0x20212b,
        highlightColor: 0x68b8c8,
        midtoneColor: 0x457789,
        lowlightColor: 0x273e53,
      },
    },
    {
      light: {
        baseColor: 0xf9f5ff,
        highlightColor: 0xe5d7ff,
        midtoneColor: 0xc8b5e9,
        lowlightColor: 0x8d9bd1,
      },
      dark: {
        baseColor: 0x20202b,
        highlightColor: 0x9d8fca,
        midtoneColor: 0x6d6598,
        lowlightColor: 0x353a58,
      },
    },
    {
      light: {
        baseColor: 0xf5faf4,
        highlightColor: 0xd9edd2,
        midtoneColor: 0xb8d7bf,
        lowlightColor: 0x8caeb4,
      },
      dark: {
        baseColor: 0x20252a,
        highlightColor: 0x7fa58b,
        midtoneColor: 0x536f66,
        lowlightColor: 0x30434a,
      },
    },
    {
      light: {
        baseColor: 0xfff8f3,
        highlightColor: 0xffddca,
        midtoneColor: 0xf2b5a7,
        lowlightColor: 0xb9a6c9,
      },
      dark: {
        baseColor: 0x252128,
        highlightColor: 0xbd8178,
        midtoneColor: 0x855a68,
        lowlightColor: 0x493c59,
      },
    },
    {
      light: {
        baseColor: 0xf9fbff,
        highlightColor: 0xf7dda2,
        midtoneColor: 0x9dc6e8,
        lowlightColor: 0x6d89b3,
      },
      dark: {
        baseColor: 0x20232b,
        highlightColor: 0xb59458,
        midtoneColor: 0x647f9b,
        lowlightColor: 0x35465d,
      },
    },
  ];

  const choosePaletteIndex = () => {
    const storageKey = "vanta-fog-palette";

    try {
      const previousIndex = Number.parseInt(
        window.sessionStorage.getItem(storageKey),
        10,
      );

      if (
        Number.isInteger(previousIndex) &&
        previousIndex >= 0 &&
        previousIndex < palettes.length
      ) {
        let nextIndex = Math.floor(Math.random() * (palettes.length - 1));

        if (nextIndex >= previousIndex) {
          nextIndex += 1;
        }

        window.sessionStorage.setItem(storageKey, String(nextIndex));
        return nextIndex;
      }

      const nextIndex = Math.floor(Math.random() * palettes.length);
      window.sessionStorage.setItem(storageKey, String(nextIndex));
      return nextIndex;
    } catch (error) {
      return Math.floor(Math.random() * palettes.length);
    }
  };

  const selectedPalette = palettes[choosePaletteIndex()];

  const initializeFog = (darkMode) => {
    if (fog) {
      fog.destroy();
      fog = null;
    }

    const palette = selectedPalette[darkMode ? "dark" : "light"];

    try {
      fog = window.VANTA.FOG({
        el: target,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        blurFactor: 0.55,
        speed: 1,
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
