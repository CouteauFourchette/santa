const SNOW_STORAGE_KEY = 'santa-snow-enabled';

let snowContainer: HTMLDivElement | null = null;
let animationFrame: number | null = null;
let snowflakes: Snowflake[] = [];

interface Snowflake {
  element: HTMLDivElement;
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
}

export function isSnowEnabled(): boolean {
  const saved = localStorage.getItem(SNOW_STORAGE_KEY);
  return saved === null ? true : saved === 'true'; // Enabled by default
}

export function setSnowEnabled(enabled: boolean): void {
  localStorage.setItem(SNOW_STORAGE_KEY, String(enabled));
  if (enabled) {
    startSnowfall();
  } else {
    stopSnowfall();
  }
}

export function initSnowfall(): void {
  if (isSnowEnabled()) {
    startSnowfall();
  }
}

function createSnowflake(): Snowflake {
  const element = document.createElement('div');
  element.className = 'snowflake';

  const size = Math.random() * 4 + 2; // 2-6px
  const x = Math.random() * window.innerWidth;
  const y = -10;
  const speed = Math.random() * 1 + 0.5; // 0.5-1.5
  const wobble = 0;
  const wobbleSpeed = Math.random() * 0.02 + 0.01;
  const opacity = Math.random() * 0.6 + 0.4; // 0.4-1.0

  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.style.opacity = String(opacity);

  return { element, x, y, size, speed, wobble, wobbleSpeed, opacity };
}

function updateSnowflake(flake: Snowflake): boolean {
  flake.y += flake.speed;
  flake.wobble += flake.wobbleSpeed;
  flake.x += Math.sin(flake.wobble) * 0.5;

  flake.element.style.top = `${flake.y}px`;
  flake.element.style.left = `${flake.x}px`;

  // Return true if snowflake is still visible
  return flake.y < window.innerHeight + 10;
}

function animate(): void {
  if (!snowContainer) return;

  // Add new snowflakes occasionally
  if (Math.random() < 0.1 && snowflakes.length < 100) {
    const flake = createSnowflake();
    snowflakes.push(flake);
    snowContainer.appendChild(flake.element);
  }

  // Update existing snowflakes
  snowflakes = snowflakes.filter(flake => {
    const visible = updateSnowflake(flake);
    if (!visible) {
      flake.element.remove();
    }
    return visible;
  });

  animationFrame = requestAnimationFrame(animate);
}

export function startSnowfall(): void {
  if (snowContainer) return; // Already running

  snowContainer = document.createElement('div');
  snowContainer.id = 'snow-container';
  snowContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1000;
    overflow: hidden;
  `;
  document.body.appendChild(snowContainer);

  // Add snowflake styles if not already present
  if (!document.getElementById('snowflake-styles')) {
    const style = document.createElement('style');
    style.id = 'snowflake-styles';
    style.textContent = `
      .snowflake {
        position: absolute;
        background: white;
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
      }
    `;
    document.head.appendChild(style);
  }

  animate();
}

export function stopSnowfall(): void {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  if (snowContainer) {
    snowContainer.remove();
    snowContainer = null;
  }

  snowflakes = [];
}
