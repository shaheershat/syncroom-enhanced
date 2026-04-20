declare global {
  interface ScreenOrientation {
    lock?: (orientation: string) => Promise<void>;
    unlock?: () => void;
  }
}

export {};
