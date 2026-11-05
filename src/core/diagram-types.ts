export interface EditCaps {
  add: boolean; connect: boolean; rename: boolean; delete: boolean; move: boolean;
  shape: boolean; style: boolean; edgeVariant: boolean; reverse: boolean;
}
export interface Choice<T extends string = string> { value: T; name: string }

export type SeqEvent =
  | { type: 'message'; edgeId: string }
  | { type: 'note'; nodeId: string; placement: 'left' | 'right' | 'over'; targets: string[] }
  | { type: 'activate'; id: string }
  | { type: 'deactivate'; id: string }
  | { type: 'frameStart'; frameId: number; keyword: string; label: string }
  | { type: 'frameDivider'; frameId: number; label: string }
  | { type: 'frameEnd'; frameId: number };

export interface SequenceData {
  participants: string[];                         // node ids in column order
  boxes: { label: string; members: string[] }[];
  events: SeqEvent[];                             // source order
  autonumber: { start: number; step: number } | null;
}

export interface GitGraphData {
  direction: 'LR' | 'TB' | 'BT';
  branches: { name: string; colorIndex: number; order: number }[];
  commits: { id: string; branch: string; ordinal: number; tag: string | null; label: string }[];
}

export type BlockItem =
  | { type: 'node'; id: string; span: number }
  | { type: 'space'; span: number }
  | { type: 'block'; id: string; span: number; columns: number | null; children: BlockItem[] };

export interface BlockData { columns: number | null; items: BlockItem[] }

export interface MindmapData {
  root: string;
  parent: Record<string, string | null>;
  children: Record<string, string[]>;
  indent: Record<string, number>;
}

export interface JourneyData {
  sections: { name: string; colorIndex: number }[];
  actors: string[];
  tasks: { cardId: string; faceId: string; score: number; actors: string[]; section: number }[];
}

export interface TimelineData {
  direction: 'LR' | 'TD';
  sections: { name: string; colorIndex: number; periods: string[] }[];
  periods: { id: string; events: string[]; section: number }[];
}

export interface ArchitectureData {
  sides: Record<string, { from: 'L' | 'R' | 'T' | 'B'; to: 'L' | 'R' | 'T' | 'B' }>; // by edge id
}

export interface DiagramData {
  sequence?: SequenceData;
  gitgraph?: GitGraphData;
  block?: BlockData;
  mindmap?: MindmapData;
  journey?: JourneyData;
  timeline?: TimelineData;
  architecture?: ArchitectureData;
}
