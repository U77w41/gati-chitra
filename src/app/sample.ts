export const SAMPLE_TEXT = `flowchart TD
  A[Start] --> B{Valid?}
  B -->|yes| C[Save]
  B -->|no| D[Fix input]
  D --> B
  C --> E([Done])`;
