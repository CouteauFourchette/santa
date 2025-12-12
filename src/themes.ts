export interface Theme {
  name: string;
  label: string;
  colors: {
    bg: string;
    bgLight: string;
    primary: string;
    primaryLight: string;
    accent: string;
    accentLight: string;
    highlight: string;
    highlightDark: string;
    cream: string;
    creamDark: string;
  };
}

export const themes: Record<string, Theme> = {
  classic: {
    name: 'classic',
    label: 'Classic Christmas',
    colors: {
      bg: '#1e3a3a',
      bgLight: '#2d4a4a',
      primary: '#4a7c59',
      primaryLight: '#6b9b7a',
      accent: '#d4a855',
      accentLight: '#e8c778',
      highlight: '#c44536',
      highlightDark: '#a33327',
      cream: '#f5f0e6',
      creamDark: '#e8dfd0',
    },
  },
  winterBlue: {
    name: 'winterBlue',
    label: 'Winter Blue',
    colors: {
      bg: '#1a2a4a',
      bgLight: '#2a3a5a',
      primary: '#4a90c2',
      primaryLight: '#6ab0e2',
      accent: '#e8e8f0',
      accentLight: '#ffffff',
      highlight: '#7ec8e3',
      highlightDark: '#5eb0cb',
      cream: '#f0f4f8',
      creamDark: '#dce4ec',
    },
  },
  elegantGold: {
    name: 'elegantGold',
    label: 'Elegant Gold',
    colors: {
      bg: '#1a1a1a',
      bgLight: '#2a2a2a',
      primary: '#c9a227',
      primaryLight: '#e8c547',
      accent: '#f4e4bc',
      accentLight: '#fff8e7',
      highlight: '#d4af37',
      highlightDark: '#b4942f',
      cream: '#faf6ed',
      creamDark: '#ede5d0',
    },
  },
  berryFrost: {
    name: 'berryFrost',
    label: 'Berry Frost',
    colors: {
      bg: '#2d1b2e',
      bgLight: '#3d2b3e',
      primary: '#8b4a6b',
      primaryLight: '#ab6a8b',
      accent: '#e8d0dc',
      accentLight: '#fff0f5',
      highlight: '#c44b7c',
      highlightDark: '#a43b6c',
      cream: '#fdf5f8',
      creamDark: '#f0e0e8',
    },
  },
};

const THEME_STORAGE_KEY = 'santa-theme';

export function getCurrentTheme(): Theme {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme && themes[savedTheme]) {
    return themes[savedTheme];
  }
  return themes.classic;
}

export function setTheme(themeName: string): void {
  const theme = themes[themeName];
  if (!theme) return;

  localStorage.setItem(THEME_STORAGE_KEY, themeName);
  applyTheme(theme);
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty('--color-santa-bg', theme.colors.bg);
  root.style.setProperty('--color-santa-bg-light', theme.colors.bgLight);
  root.style.setProperty('--color-santa-green', theme.colors.primary);
  root.style.setProperty('--color-santa-green-light', theme.colors.primaryLight);
  root.style.setProperty('--color-santa-gold', theme.colors.accent);
  root.style.setProperty('--color-santa-gold-light', theme.colors.accentLight);
  root.style.setProperty('--color-santa-red', theme.colors.highlight);
  root.style.setProperty('--color-santa-red-dark', theme.colors.highlightDark);
  root.style.setProperty('--color-santa-cream', theme.colors.cream);
  root.style.setProperty('--color-santa-cream-dark', theme.colors.creamDark);

  // Update glow filter color if SVG exists
  const glowFlood = document.getElementById('glowAlpha');
  if (glowFlood) {
    glowFlood.setAttribute('flood-color', theme.colors.highlight);
  }

  // Update SVG gradient if exists
  const gradientStop = document.querySelector('#redGrad stop:last-child');
  if (gradientStop) {
    gradientStop.setAttribute('stop-color', theme.colors.highlight);
  }
}

export function initTheme(): void {
  const theme = getCurrentTheme();
  applyTheme(theme);
}
