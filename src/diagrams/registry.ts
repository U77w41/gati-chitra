import type { DiagramKind } from '../core/types';
import type { DiagramEngine } from './engine';
import { FLOWCHART_ENGINE } from './flowchart-engine';

type Loader = () => Promise<DiagramEngine>;

export const LOADERS: Partial<Record<DiagramKind, Loader>> = {
  state: () => import('./state/index').then((m) => m.engine),
  class: () => import('./class/index').then((m) => m.engine),
  er: () => import('./er/index').then((m) => m.engine),
  requirement: () => import('./requirement/index').then((m) => m.engine),
  usecase: () => import('./usecase/index').then((m) => m.engine),
  architecture: () => import('./architecture/index').then((m) => m.engine),
  sequence: () => import('./sequence/index').then((m) => m.engine),
};

const engines = new Map<DiagramKind, DiagramEngine>();
const promises = new Map<DiagramKind, Promise<DiagramEngine>>();
const failed = new Set<DiagramKind>();
const listeners = new Set<() => void>();

export function getEngine(kind: DiagramKind): DiagramEngine | null {
  if (kind === 'flowchart') return FLOWCHART_ENGINE;
  return engines.get(kind) ?? null;
}

export function hasLoader(kind: DiagramKind): boolean {
  return Boolean(LOADERS[kind]);
}

export function loadEngine(kind: DiagramKind): Promise<DiagramEngine> {
  if (kind === 'flowchart') return Promise.resolve(FLOWCHART_ENGINE);
  const loaded = engines.get(kind);
  if (loaded) return Promise.resolve(loaded);

  const inflight = promises.get(kind);
  if (inflight) return inflight;

  const loader = LOADERS[kind];
  if (!loader) return Promise.reject(new Error(`No loader for ${kind}`));

  const p = loader()
    .then((eng) => {
      engines.set(kind, eng);
      failed.delete(kind);
      for (const cb of listeners) cb();
      return eng;
    })
    .catch((err: unknown) => {
      failed.add(kind);
      for (const cb of listeners) cb();
      throw err;
    });

  promises.set(kind, p);
  return p;
}

export function engineFailed(kind: DiagramKind): boolean {
  return failed.has(kind);
}

export function onEngineChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setLoaderForTest(kind: DiagramKind, loader: Loader | null): void {
  if (loader) {
    LOADERS[kind] = loader;
  } else {
    delete LOADERS[kind];
  }
  engines.delete(kind);
  promises.delete(kind);
  failed.delete(kind);
}
