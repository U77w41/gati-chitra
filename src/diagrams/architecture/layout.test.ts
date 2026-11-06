import { describe, expect, it } from 'vitest';
import { testMeasure } from '../../../tests/support/measure';
import { parseArchitecture } from './parse';
import { layoutArchitecture } from './layout';

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

describe('layoutArchitecture', () => {
  it('places nodes on a grid from the edge sides', () => {
    const doc = parseArchitecture(T);
    const L = layoutArchitecture(doc, testMeasure);
    const c = (id: string) => L.nodes[id].center;
    expect(c('server').x).toBeLessThan(c('db').x);
    expect(c('db').x).toBeLessThan(c('j1').x);
    expect(c('j1').x).toBeLessThan(c('lambda').x);
    expect(c('db').y).toBe(c('server').y);
    expect(c('disk1').x).toBe(c('server').x);
    expect(c('disk1').y).toBeGreaterThan(c('server').y);
    expect(L.edges.e0.kind).toBe('straight');
    const g = L.groups.api.rect;
    for (const id of ['db', 'server', 'disk1']) expect(c(id).x).toBeGreaterThan(g.x);
  });

  it('lets a pin move a service', () => {
    const doc = parseArchitecture(T + '\n%% studio:pos db 500 400');
    expect(layoutArchitecture(doc, testMeasure).nodes.db.center).toEqual({ x: 500, y: 400 });
  });
});
