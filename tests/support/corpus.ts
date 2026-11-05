export const CORPUS: {
  name: string;
  text: string;
  ok: boolean;
  nodes: number;
  edges: number;
  groups: number;
}[] = [
  {
    name: 'approval',
    ok: true,
    nodes: 5,
    edges: 5,
    groups: 0,
    text: `flowchart TD
  A[Start] --> B{Valid?}
  B -->|yes| C[Save]
  B -->|no| D[Fix input]
  D --> B
  C --> E([Done])`,
  },
  {
    name: 'pipeline',
    ok: true,
    nodes: 5,
    edges: 4,
    groups: 2,
    text: `graph LR
  subgraph ingest [Ingest]
    S3[(Raw files)] --> Parse[Parse]
  end
  subgraph serve [Serve]
    API[API] --> UI[[Web app]]
  end
  Parse --> Store[(Warehouse)]
  Store --> API`,
  },
  {
    name: 'alert',
    ok: true,
    nodes: 3,
    edges: 2,
    groups: 0,
    text: `flowchart TB
  classDef hot fill:#ffe4e1,stroke:#c0392b,stroke-width:2px;
  A[Alert]:::hot --> B[Page on-call]
  B -.-> C[Ack]
  style C fill:#e8f8f5
  linkStyle 0 stroke:#c0392b,stroke-width:3px`,
  },
  {
    name: 'arrow-styles',
    ok: true,
    nodes: 7,
    edges: 8,
    groups: 0,
    text: `flowchart LR
  A --> B --> C
  A & B ==> D
  C -- label text --> D
  D --o E
  E --x F
  F <--> G`,
  },
  {
    name: 'comments',
    ok: true,
    nodes: 2,
    edges: 1,
    groups: 0,
    text: `%%{init: {"theme": "forest"}}%%
flowchart TD
  %% a comment
  A[Start] --> B[End]
  click A "https://example.com"
  %% studio:layout v1
  %% studio:pos A 100 40
  %% studio:pos B 100 200`,
  },
  {
    name: 'invalid',
    ok: false,
    nodes: 0,
    edges: 0,
    groups: 0,
    text: `pie title Pets
  "Dogs" : 3`,
  },
];
