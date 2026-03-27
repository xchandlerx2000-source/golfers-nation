import React, { useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { normalizeCurrentUser } from "./lib/account-state";
import { useAppStore } from "./store/useAppStore";

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

const THEME_PRESETS = {
  forest: {
    light: {
      background: "#f3f8f3",
      backgroundAccent: "#e4efe5",
      surface: "#ffffff",
      surfaceRaised: "#ffffff",
      surfaceMuted: "#e9f1ea",
      surfaceSoft: "#eef5ef",
      border: "#bfd1c2",
      borderStrong: "#8ead92",
      text: "#173122",
      textMuted: "#587164",
      textSoft: "#32503e",
      primary: "#2f8f53",
      primaryPressed: "#227442",
      primarySoft: "#d8ecde",
      accent: "#58b87a",
      success: "#1f9d55",
      warning: "#c57f10",
      danger: "#d34d4d",
      shadow: "#0d1610",
      tabBar: "#f8fbf8",
      overlayPrimary: "rgba(47, 143, 83, 0.18)",
      overlayAccent: "rgba(88, 184, 122, 0.12)",
    },
    dark: {
      background: "#09140d",
      backgroundAccent: "#102117",
      surface: "#122319",
      surfaceRaised: "#16291d",
      surfaceMuted: "#1d3325",
      surfaceSoft: "#183022",
      border: "#2d4a36",
      borderStrong: "#4f7b5b",
      text: "#f2faf4",
      textMuted: "#9db7a4",
      textSoft: "#c6d8ca",
      primary: "#4cc06e",
      primaryPressed: "#35a657",
      primarySoft: "#183924",
      accent: "#86e7a4",
      success: "#34d07b",
      warning: "#f0b44a",
      danger: "#f46b6b",
      shadow: "#030805",
      tabBar: "#0d1911",
      overlayPrimary: "rgba(76, 192, 110, 0.22)",
      overlayAccent: "rgba(134, 231, 164, 0.12)",
    },
  },
  sand: {
    light: {
      background: "#f8f2e8",
      backgroundAccent: "#f1e7d8",
      surface: "#fffaf2",
      surfaceRaised: "#ffffff",
      surfaceMuted: "#f3e7d6",
      surfaceSoft: "#f8efe3",
      border: "#d8c4aa",
      borderStrong: "#b7966c",
      text: "#3d2b1c",
      textMuted: "#77604b",
      textSoft: "#5a4330",
      primary: "#c78436",
      primaryPressed: "#ab6d25",
      primarySoft: "#f0dfc8",
      accent: "#e7a455",
      success: "#3f9a58",
      warning: "#c57f10",
      danger: "#c94a3d",
      shadow: "#1b120a",
      tabBar: "#fff8ef",
      overlayPrimary: "rgba(199, 132, 54, 0.18)",
      overlayAccent: "rgba(231, 164, 85, 0.14)",
    },
    dark: {
      background: "#15100b",
      backgroundAccent: "#21170f",
      surface: "#261b12",
      surfaceRaised: "#2d2016",
      surfaceMuted: "#3a2a1d",
      surfaceSoft: "#322317",
      border: "#58412a",
      borderStrong: "#8c6844",
      text: "#fbf5ec",
      textMuted: "#c8b39a",
      textSoft: "#ead9c6",
      primary: "#e29a49",
      primaryPressed: "#c57f31",
      primarySoft: "#49321e",
      accent: "#f5be76",
      success: "#55c576",
      warning: "#f0b44a",
      danger: "#ef7668",
      shadow: "#070503",
      tabBar: "#1a130d",
      overlayPrimary: "rgba(226, 154, 73, 0.2)",
      overlayAccent: "rgba(245, 190, 118, 0.12)",
    },
  },
  ocean: {
    light: {
      background: "#eef7fb",
      backgroundAccent: "#dcedf5",
      surface: "#ffffff",
      surfaceRaised: "#ffffff",
      surfaceMuted: "#e5f1f8",
      surfaceSoft: "#edf5fa",
      border: "#b8d0de",
      borderStrong: "#79a7c2",
      text: "#133145",
      textMuted: "#567489",
      textSoft: "#2d5066",
      primary: "#2f8dc8",
      primaryPressed: "#1f73a8",
      primarySoft: "#d7eaf6",
      accent: "#50b4eb",
      success: "#239b7d",
      warning: "#c98512",
      danger: "#d44c61",
      shadow: "#08121a",
      tabBar: "#f5fbff",
      overlayPrimary: "rgba(47, 141, 200, 0.18)",
      overlayAccent: "rgba(80, 180, 235, 0.14)",
    },
    dark: {
      background: "#07131b",
      backgroundAccent: "#0b1f2b",
      surface: "#0f2130",
      surfaceRaised: "#14283a",
      surfaceMuted: "#19344b",
      surfaceSoft: "#11283a",
      border: "#274964",
      borderStrong: "#4a7ba3",
      text: "#f4f9fc",
      textMuted: "#9eb6c9",
      textSoft: "#c6d7e3",
      primary: "#45a7ea",
      primaryPressed: "#2e89c6",
      primarySoft: "#17354d",
      accent: "#7bd8ff",
      success: "#34c9a1",
      warning: "#f0b44a",
      danger: "#ef6f83",
      shadow: "#02070c",
      tabBar: "#0b1823",
      overlayPrimary: "rgba(69, 167, 234, 0.2)",
      overlayAccent: "rgba(123, 216, 255, 0.12)",
    },
  },
  slate: {
    light: {
      background: "#f3f5f8",
      backgroundAccent: "#e6eaf0",
      surface: "#ffffff",
      surfaceRaised: "#ffffff",
      surfaceMuted: "#eceff4",
      surfaceSoft: "#f0f3f7",
      border: "#c4ccd7",
      borderStrong: "#8f9caf",
      text: "#1c2430",
      textMuted: "#5e6c81",
      textSoft: "#384557",
      primary: "#4d6fd3",
      primaryPressed: "#3958b4",
      primarySoft: "#dbe2f7",
      accent: "#6f96ff",
      success: "#2ca36d",
      warning: "#c98512",
      danger: "#d94e5a",
      shadow: "#101720",
      tabBar: "#f8f9fc",
      overlayPrimary: "rgba(77, 111, 211, 0.18)",
      overlayAccent: "rgba(111, 150, 255, 0.12)",
    },
    dark: {
      background: "#0b1017",
      backgroundAccent: "#111926",
      surface: "#151f2d",
      surfaceRaised: "#1b2636",
      surfaceMuted: "#223144",
      surfaceSoft: "#172535",
      border: "#31475f",
      borderStrong: "#557394",
      text: "#f5f7fb",
      textMuted: "#a8b7cc",
      textSoft: "#ced8e6",
      primary: "#6b8cff",
      primaryPressed: "#5373df",
      primarySoft: "#1f2f5c",
      accent: "#9cb5ff",
      success: "#48c182",
      warning: "#f0b44a",
      danger: "#f06b76",
      shadow: "#04070c",
      tabBar: "#101722",
      overlayPrimary: "rgba(107, 140, 255, 0.2)",
      overlayAccent: "rgba(156, 181, 255, 0.12)",
    },
  },
  midnight: {
    light: {
      background: "#f3f3f7",
      backgroundAccent: "#e8e7ef",
      surface: "#ffffff",
      surfaceRaised: "#ffffff",
      surfaceMuted: "#eceaf4",
      surfaceSoft: "#f1eff8",
      border: "#c7c1d8",
      borderStrong: "#988bb8",
      text: "#241f35",
      textMuted: "#675f81",
      textSoft: "#433b5d",
      primary: "#7458dd",
      primaryPressed: "#5f44c1",
      primarySoft: "#e0daf8",
      accent: "#9f87ff",
      success: "#2aaf73",
      warning: "#c98512",
      danger: "#d94e7f",
      shadow: "#110e1c",
      tabBar: "#f8f7fd",
      overlayPrimary: "rgba(116, 88, 221, 0.18)",
      overlayAccent: "rgba(159, 135, 255, 0.12)",
    },
    dark: {
      background: "#080710",
      backgroundAccent: "#100d1c",
      surface: "#151126",
      surfaceRaised: "#1a1630",
      surfaceMuted: "#261f45",
      surfaceSoft: "#19152d",
      border: "#3b2e62",
      borderStrong: "#67509c",
      text: "#f7f4ff",
      textMuted: "#b4aacd",
      textSoft: "#d9d1ef",
      primary: "#8b72ff",
      primaryPressed: "#6f57df",
      primarySoft: "#281f4d",
      accent: "#b8a6ff",
      success: "#42c98a",
      warning: "#f0b44a",
      danger: "#f26b96",
      shadow: "#02010a",
      tabBar: "#0e0b1a",
      overlayPrimary: "rgba(139, 114, 255, 0.2)",
      overlayAccent: "rgba(184, 166, 255, 0.12)",
    },
  },
};

function resolveMode(colorMode, systemColorScheme) {
  if (colorMode === "light" || colorMode === "dark") {
    return colorMode;
  }

  return systemColorScheme === "light" ? "light" : "dark";
}

function getTextScaleMultiplier(textScale) {
  return textScale === "large" ? 1.08 : 1;
}

function withContrast(colors, contrastMode) {
  if (contrastMode !== "high") {
    return colors;
  }

  return {
    ...colors,
    border: colors.borderStrong,
    textMuted: colors.textSoft,
  };
}

export function buildAppTheme(appearance = {}, systemColorScheme = "dark") {
  const themeId = THEME_PRESETS[appearance.themeId] ? appearance.themeId : "forest";
  const resolvedMode = resolveMode(appearance.colorMode, systemColorScheme);
  const baseColors = THEME_PRESETS[themeId][resolvedMode];
  const colors = withContrast(baseColors, appearance.contrastMode);

  return {
    id: themeId,
    mode: resolvedMode,
    isDark: resolvedMode === "dark",
    colors,
    spacing,
    radii,
    appearance: {
      colorMode: appearance.colorMode || "system",
      themeId,
      textScale: appearance.textScale || "standard",
      compactMode: appearance.compactMode === true,
      contrastMode: appearance.contrastMode || "standard",
    },
    typeScale: {
      multiplier: getTextScaleMultiplier(appearance.textScale),
    },
  };
}

export const defaultTheme = buildAppTheme();
export const colors = defaultTheme.colors;
export const AppThemeContext = React.createContext(defaultTheme);

export function AppThemeProvider({ children }) {
  const rawCurrentUser = useAppStore((state) => state.currentUser);
  const currentUser = normalizeCurrentUser(rawCurrentUser || {});
  const systemColorScheme = useColorScheme() || "dark";
  const theme = useMemo(
    () => buildAppTheme(currentUser.appearance || {}, systemColorScheme),
    [currentUser.appearance, systemColorScheme]
  );

  return (
    <AppThemeContext.Provider value={theme}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(AppThemeContext);
}
