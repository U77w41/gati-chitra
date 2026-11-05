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
  parallelOffset: 28,
  parallelEndShare: 0.5,
  edgeLabelRadius: 6,
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
  smallCircleD: 20,
  forkBarW: 72,
  forkBarH: 10,
  documentWave: 8,
  doubleCircleGap: 5,
  trapezoidInset: 14,
  asymmetricNotch: 14,
  titleFontSize: 20,
  titleH: 36,
  sectionFontSize: 14,
  sectionLineH: 18,
  sectionPadX: 12,
  sectionPadY: 6,
  sectionColGap: 12,
  sectionMinH: 12,
  iconSize: 32,
  iconGap: 6,
  noteFold: 10,
  actorFigureH: 56,
  actorMinW: 40,
  ellipseScale: 1.3,
  cloudScale: 1.35,
  bangScale: 1.4,
  blockArrowHead: 40,
  endLabelFontSize: 12,
  endLabelAlong: 18,
  endLabelAcross: 12,
} as const;

export const SEQ = {
  participantGap: 40,
  minParticipantW: 100,
  participantH: 44,
  firstRowGap: 24,
  rowH: 44,
  selfRowH: 56,
  selfLoopW: 48,
  messageLabelPad: 16,
  labelLift: 12,
  noteGap: 10,
  noteRowGap: 12,
  frameHeaderH: 28,
  framePad: 12,
  frameSide: 60,
  frameInset: 8,
  dividerH: 28,
  activationW: 10,
  activationStep: 4,
  bottomPad: 24,
  boxPad: 12,
} as const;

export const GIT = {
  laneGap: 60,
  commitGap: 60,
  labelColW: 110,
  commitD: 20,
  highlightD: 24,
  mergeD: 22,
  tagLift: 22,
  captionDrop: 22,
} as const;

export const ARCH = { gapX: 80, gapY: 60, junctionD: 12 } as const;

export const MINDMAP = { levelGap: 80, siblingGap: 16 } as const;

export const BLOCK = { gap: 16, pad: 12, minUnitW: 80 } as const;

export const JOURNEY = {
  legendW: 140,
  taskMinW: 150,
  taskGap: 20,
  sectionH: 36,
  cardGap: 10,
  faceGap: 40,
  scoreStep: 36,
  faceD: 36,
  actorRowH: 20,
  actorDot: 12,
} as const;

export const TIMELINE = { colMinW: 150, colGap: 24, sectionH: 36, rowGap: 20, eventGap: 16 } as const;

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

export const EDGE_ANIM = { fastFactor: 2, slowFactor: 0.5 } as const;

export const EXPORT = {
  margin: 32,
  ogWidth: 1200,
  ogHeight: 630,
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

export const SHARE = {
  prefix: 'v1=',
  plainPrefix: 'v1p=',
  maxUrlChars: 8000,
  maxDecodedBytes: 80_000,
} as const;

export const UI = {
  narrowBreakpoint: 768,
  splitMin: 0.2,
  splitMax: 0.8,
  splitDefault: 0.33,
  splitStep: 0.05,
} as const;

export const KEYBOARD = { nudge: 10 } as const;

export const TOUCH = {
  hitTolerance: 14,
  handleRadius: 12,
  longPressMs: 500,
  slop: 8,
  doubleTapMs: 300,
} as const;

export const MESSAGES = {
  notFlowchart: "Not a diagram this app can read. Start with a type such as 'flowchart TD' or 'sequenceDiagram'.",
  unsupportedDiagram: (name: string) => `${name} is not supported yet. Supported types: flowchart, sequence, class, state, ER, requirement, use case, architecture, block, gitGraph, journey, timeline and mindmap.`,
  loadingDiagram: (name: string) => `Loading support for ${name} diagrams.`,
  diagramLoadFailed: (name: string) => `Support for ${name} diagrams could not be loaded. Check the connection, then reload the page.`,
  opUnsupported: 'This change is not available for this diagram type. Edit the text instead.',
  syntaxIgnored: (what: string) => `${what} is not supported; it is ignored.`,
  unclosedBlock: (keyword: string) => `"${keyword}" is not closed with end.`,
  strayBlockEnd: '`end` without a matching block.',
  unclosedBrace: (name: string) => `"${name}" is not closed with }.`,
  crossScope: 'These states are in different composite states. Connect them in the text.',
  gitBranchExists: (name: string) => `Branch "${name}" already exists.`,
  gitNoBranch: (name: string) => `Branch "${name}" does not exist.`,
  gitMergeInvalid: (name: string) => `Branch "${name}" cannot be merged here.`,
  gitNoCommit: (id: string) => `Commit "${id}" does not exist.`,
  journeyScore: 'A journey score must be a whole number from 1 to 5.',
  mindmapTwoRoots: 'A mindmap has one root. Indent this line under the root.',
  mindmapCycle: 'A node cannot be moved under its own branch.',
  iconFallback: (name: string) => `Icon "${name}" is not built in; a generic icon is drawn.`,
  nameTaken: (name: string) => `"${name}" is already used.`,
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
  unknownShape: (name: string) => `Unknown shape "${name}", drawn as a rectangle.`,
  shapeApprox: (name: string, drawnAs: string) => `Shape "${name}" is drawn as ${drawnAs}.`,
  iconUnsupported: 'Icons and images are not supported; the node is drawn as a rectangle.',
  linkBlocked: 'Only http, https and mailto links are kept.',
  clickCallbackIgnored: 'Click callbacks are ignored.',
  groupDirectionIgnored: (id: string) => `Subgraph "${id}" has arrows to the outside, so its direction is ignored.`,
  nothingToExport: 'Nothing to export. Add a node first.',
  pngReduced: (scale: number) => `The image was too large, so it was saved at ${scale}x.`,
  gifReduced: 'The GIF was scaled down to fit the size limit.',
  videoUnsupported: 'This browser cannot encode video. Saved as GIF instead.',
  fixTextFirst: 'Fix the errors in the text first.',
  shareTooLong: 'This diagram is too large for a link. Save it as a .mmd file instead.',
  shareInvalid: 'The share link could not be read. Showing the sample diagram.',
  templateFailed: 'The template could not be loaded.',
  shareOpened: 'Opened a shared diagram. Press Ctrl+Z to get your previous diagram back.',
  changedInOtherTab: 'This diagram was changed in another tab.',
  storageUnavailable: 'Browser storage is unavailable, so autosave is off.',
  groupsInText: 'Groups are edited in the text.',
  linkCopied: 'Link copied.',
  copied: 'Copied to the clipboard.',
  copyUnsupported: 'This browser cannot copy images. Use Save instead.',
  nothingToPresent: 'Nothing to present. Add a node first.',
  exportCancelled: 'Export cancelled.',
  videoFailed: (m: string) => `Video export failed: ${m}`,
  updateReady: 'A new version is available.',
  offlineReady: 'Ready to work offline.',
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
