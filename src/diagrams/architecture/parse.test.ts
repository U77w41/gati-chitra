import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseArchitecture } from './parse';

const T = `architecture-beta
  group api(cloud)[API]
  service db(database)[Database] in api
  service server(server)[Server] in api
  service disk1(disk)[Storage] in api
  service lambda(logos:aws-lambda)[Lambda]
  junction j1
  db:L -- R:server
  disk1:T -- B:server
  server:R --> L:j1
  j1:R -- L:lambda`;

describe('parseArchitecture', () => {
  it('reads groups, services, junctions, icons and sides', () => {
    const d = parseArchitecture(T);
    expect(d).toMatchObject({ kind: 'architecture', ok: true });
    expect(d.nodes.map((n) => n.id)).toEqual(['db', 'server', 'disk1', 'lambda', 'j1']);
    expect(d.nodes[0]).toMatchObject({ shape: 'round', icon: 'database', label: 'Database', group: 'api' });
    expect(d.nodes[3].icon).toBe('server');
    expect(d.diagnostics).toContainEqual({ line: 6, severity: 'info', message: MESSAGES.iconFallback('logos:aws-lambda') });
    expect(d.nodes[4]).toMatchObject({ shape: 'filledCircle', label: '', size: { width: 12, height: 12 } });
    expect(d.edges[2]).toMatchObject({ from: 'server', to: 'j1', variant: '-->', markers: { start: 'none', end: 'arrow' } });
    expect(d.data!.architecture!.sides.e0).toEqual({ from: 'L', to: 'R' });
  });

  it('reports an unknown node in an edge', () => {
    const d = parseArchitecture('architecture-beta\n  unknown:L -- R:other');
    expect(d.diagnostics).toContainEqual({ line: 2, severity: 'error', message: MESSAGES.unknownNode('unknown') });
  });
});
