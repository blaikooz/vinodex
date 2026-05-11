/// <reference types="vite/client" />

declare const __GIT_COMMIT_COUNT__: string;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

// Loose typing: RetroGlobeScreen uses three.js without bundled types.
// Install @types/three to tighten if/when needed.
declare module 'three' {
  const value: any;
  export = value;
}
declare namespace THREE {
  type Mesh = any;
  type Camera = any;
  type WebGLRenderer = any;
  type Vector3 = any;
}
