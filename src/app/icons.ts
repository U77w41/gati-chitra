export function logoSvg(className: string): string {
  return (
    `<svg class="${className}" viewBox="0 0 512 512" fill="none" aria-hidden="true">` +
    '<path d="M 408 42 L 408 78 M 408 112 L 408 148 M 408 182 L 408 240" stroke="currentColor" stroke-width="24" stroke-linecap="round"/>' +
    '<path d="M 108 196 C 68 232 56 272 56 320 C 56 388.5 101.2 444 157 444 C 212.8 444 258 388.5 258 320 L 258 240 C 258 198.6 291.6 165 333 165 C 374.4 165 408 198.6 408 240 L 408 362" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M 366 318 L 408 362 L 450 318" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="108" cy="196" r="62" fill="currentColor"/>' +
    '<circle cx="408" cy="412" r="62" fill="currentColor"/>' +
    '</svg>'
  );
}

export const ICONS = {
  moon:
    '<svg class="nav-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3h.393a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992z"/></svg>',
  sun:
    '<svg class="nav-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M3 12h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7"/></svg>',
  briefcase:
    '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 12v.01"/><path d="M3 13a20 20 0 0 0 18 0"/></svg>',
  support:
    '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="heart-icon" d="M16 6.27975C16 6.88118 15.7625 7.45883 15.3383 7.88611C14.3619 8.87007 13.415 9.89605 12.4021 10.8443C12.17 11.0585 11.8017 11.0507 11.5795 10.8268L8.6615 7.88611C7.7795 6.99725 7.7795 5.56225 8.6615 4.67339C9.55218 3.77579 11.0032 3.77579 11.8938 4.67339L11.9999 4.78027L12.1059 4.67345C12.533 4.24286 13.1146 4 13.7221 4C14.3297 4 14.9113 4.24284 15.3383 4.67339C15.7625 5.10073 16 5.67835 16 6.27975Z" stroke-linejoin="round"/><path d="M18 20L21.8243 16.1757C21.9368 16.0632 22 15.9106 22 15.7515V10.5C22 9.67157 21.3284 9 20.5 9V9C19.6716 9 19 9.67157 19 10.5V15" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 16L18.8581 15.1419C18.949 15.051 19 14.9278 19 14.7994V14.7994C19 14.6159 18.8963 14.4482 18.7322 14.3661L18.2893 14.1447C17.5194 13.7597 16.5894 13.9106 15.9807 14.5193L15.0858 15.4142C14.7107 15.7893 14.5 16.298 14.5 16.8284V20" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 20L2.17574 16.1757C2.06321 16.0632 2 15.9106 2 15.7515V10.5C2 9.67157 2.67157 9 3.5 9V9C4.32843 9 5 9.67157 5 10.5V15" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 16L5.14187 15.1419C5.05103 15.051 5 14.9278 5 14.7994V14.7994C5 14.6159 5.10366 14.4482 5.26776 14.3661L5.71067 14.1447C6.48064 13.7597 7.41059 13.9106 8.01931 14.5193L8.91421 15.4142C9.28929 15.7893 9.5 16.298 9.5 16.8284V20" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  grid:
    '<svg class="nav-icon icon-tools-grid" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="17.5" cy="17.5" r="3.5"/><circle cx="17.5" cy="6.5" r="3.5"/><circle cx="6.5" cy="17.5" r="3.5"/><circle cx="6.5" cy="6.5" r="3.5"/></svg>',
  chevron:
    '<svg class="icon icon-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6-6 6"/></svg>',
  external:
    '<svg class="icon icon-external-link" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6H6A2 2 0 004 8v10a2 2 0 002 2h10a2 2 0 002-2v-6"/><path d="M11 13l9-9"/><path d="M15 4h5v5"/></svg>',
  anurup:
    '<svg class="icon icon-anurup" width="32" height="32" viewBox="100 100 800 800" fill="none" stroke="currentColor" stroke-width="64" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M 280 200 H 740 A 60 60 0 0 1 800 260 V 640 A 60 60 0 0 1 740 700 H 650"/><path d="M 200 270 V 740 A 60 60 0 0 0 260 800 H 610 A 40 40 0 0 0 650 760 V 380 A 30 30 0 0 0 620 350 H 380 A 30 30 0 0 0 350 380 V 440 A 75 75 0 0 0 500 440 V 350"/></svg>',
  diff:
    '<svg class="icon icon-diff" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M12 3L12 21M14.7107 19.3887C17.1796 18.8321 19.1072 16.979 19.6863 14.6058C20.1046 12.8918 20.1046 11.1081 19.6863 9.39419C19.1072 7.02094 17.1796 5.16789 14.7107 4.61121M12 4.30969C11.0904 4.30969 10.1808 4.41019 9.28927 4.61121C6.82045 5.16789 4.89278 7.02094 4.31367 9.39419C3.89544 11.1081 3.89544 12.8918 4.31367 14.6058C4.89278 16.979 6.82045 18.8321 9.28928 19.3887C10.1808 19.5898 11.0904 19.6903 12 19.6903"/></svg>',
  install:
    '<svg class="nav-icon icon-install" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  help:
    '<svg class="nav-icon icon-help" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
} as const;
