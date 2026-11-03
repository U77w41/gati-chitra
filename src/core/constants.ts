export const LIMITS = {
  maxNodes: 300,
  maxEdges: 600,
  maxTextChars: 20000,
  maxLabelChars: 200,
  maxGroupDepth: 4,
  undoDepth: 200,
} as const;

export const TIMING = { parseDebounceMs: 150, autosaveDebounceMs: 500 } as const;

export const STORAGE = {
  docKey: 'gati-chitra:v1:doc',
  settingsKey: 'gati-chitra:v1:settings',
} as const;

export const FONT_STACK_SANS =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const LAYOUT = {
  fontSize: 16,
  lineHeight: 20,
  labelWrapWidth: 200,
  nodePadX: 18,
  nodePadY: 12,
  minNodeW: 72,
  minNodeH: 40,
  nodeSep: 40,
  rankSep: 64,
  edgeSep: 12,
  margin: 24,
  groupPad: 24,
  groupTitleH: 28,
  edgeLabelPadX: 8,
  edgeLabelH: 20,
  edgeLabelFontSize: 13,
  arrowSize: 10,
  edgeWidth: 2,
  edgeWidthThick: 4,
  dottedDash: [3, 5],
  hitTolerance: 6,
  handleRadius: 7,
  parallelOffset: 14,
  selfLoopSize: 28,
  diamondScale: 1.6,
  hexagonExtraW: 28,
  parallelogramExtraW: 28,
  cylinderExtraH: 18,
  circleExtra: 8,
  roundRadius: 12,
  rectRadius: 4,
  hexagonInset: 14,
  parallelogramSkew: 14,
} as const;

export const VIEW = { zoomMin: 0.1, zoomMax: 4, wheelSensitivity: 0.002, fitMargin: 48 } as const;

export const ANIM = {
  loopSecondsBase: 4,
  speedMin: 0.25,
  speedMax: 3,
  speedStep: 0.25,
  speedDefault: 1,
  densityMin: 1,
  densityMax: 10,
  densityDefault: 4,
  particleRadius: 4,
  spacingBase: 640,
  maxParticlesPerEdge: 12,
  maxParticlesTotal: 1500,
  particleFade: 0.1,
  dashPattern: [8, 8],
  dashCycles: 4,
  glowWindow: 0.12,
  glowBlur: 18,
  dimAlpha: 0.25,
  presentStepSeconds: 1.5,
} as const;

export const EXPORT = {
  margin: 32,
  pngScales: [1, 2, 3],
  pngMaxSide: 8192,
  pngMaxPixels: 40_000_000,
  slideWidth: 1280,
  slideHeight: 720,
  gifFps: [10, 20, 25],
  gifFpsDefault: 20,
  gifMaxFrames: 300,
  gifMaxPixels: 2_073_600,
  videoFps: 30,
  videoMaxSeconds: 30,
  videoLoopsDefault: 2,
  videoLoopsMax: 5,
  videoMaxPixels: 2_073_600,
  svgDecimals: 2,
} as const;

export const SHARE = { prefix: 'v1=', plainPrefix: 'v1p=', maxUrlChars: 8000 } as const;

export const MESSAGES = {
  notFlowchart: "Only flowchart diagrams are supported. Start with 'flowchart TD' or 'graph LR'.",
  tooManyNodes: 'Too many nodes (limit 300).',
  tooManyEdges: 'Too many arrows (limit 600).',
  textTooLong: 'The text is too long (limit 20000 characters).',
  groupTooDeep: 'Subgraph nesting is too deep (limit 4).',
  unknownLine: 'Not understood; kept as written.',
  unclosedGroup: (id: string) => `Subgraph "${id}" is not closed with end.`,
  strayEnd: '`end` without a matching subgraph.',
  duplicateGroupId: (id: string, newId: string) => `Subgraph id "${id}" is already used, so this one is "${newId}".`,
  layoutFailed: 'The diagram could not be laid out. The last picture is kept.',
  unknownNode: (id: string) => `Unknown node "${id}".`,
  unknownEdge: (i: number) => `Unknown arrow ${i}.`,
  nothingToExport: 'Nothing to export. Add a node first.',
  pngReduced: (scale: number) => `The image was too large, so it was saved at ${scale}x.`,
  gifReduced: 'The GIF was scaled down to fit the size limit.',
  videoUnsupported: 'This browser cannot encode video. Saved as GIF instead.',
  fixTextFirst: 'Fix the errors in the text first.',
  shareTooLong: 'This diagram is too large for a link. Save it as a .mmd file instead.',
  shareInvalid: 'The share link could not be read. Showing the sample diagram.',
  storageUnavailable: 'Browser storage is unavailable, so autosave is off.',
  groupsInText: 'Groups are edited in the text.',
  linkCopied: 'Link copied.',
  nothingToPresent: 'Nothing to present. Add a node first.',
  exportCancelled: 'Export cancelled.',
  videoFailed: (m: string) => `Video export failed: ${m}`,
} as const;

export const SCHEME = {
  storageKey: 'StackColorScheme', // the key the author's other sites use, so one choice applies to all of them
  lightThemeColor: '#f5f5fa',
  darkThemeColor: '#303030',
} as const;

export const BRAND = {
  name: 'Gati-chitra',
  owner: 'Ujjwal Chowdhury',
  startYear: 2026,
  hireUrl: 'https://u77w41.github.io/resume/',
  supportUrl: 'https://u77w41.github.io/support-my-work/',
  tools: [
    {
      id: 'diff',
      name: 'Diff Checker',
      description: 'Fast, browser-based diff tool for text files, source code, and Jupyter notebooks.',
      url: 'https://u77w41.github.io/diff-checker/',
    },
    {
      id: 'anurup',
      name: 'ANURUP',
      description: 'Privacy-first photo & PDF tools for online forms',
      url: 'https://u77w41.github.io/anurup/',
    },
  ],
} as const;
