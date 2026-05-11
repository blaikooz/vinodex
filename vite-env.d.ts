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
