import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const distDir = join(import.meta.dirname, '../dist');

describe('generated output structure', () => {
  it('has types.js', () => {
    expect(existsSync(join(distDir, 'types.js'))).toBe(true);
  });

  it('has types.d.ts', () => {
    expect(existsSync(join(distDir, 'types.d.ts'))).toBe(true);
  });

  it('has schemas.js', () => {
    expect(existsSync(join(distDir, 'schemas.js'))).toBe(true);
  });

  it('has schemas.d.ts', () => {
    expect(existsSync(join(distDir, 'schemas.d.ts'))).toBe(true);
  });

  it('has client/fetch.js', () => {
    expect(existsSync(join(distDir, 'client', 'fetch.js'))).toBe(true);
  });

  it('has client/fetch.d.ts', () => {
    expect(existsSync(join(distDir, 'client', 'fetch.d.ts'))).toBe(true);
  });

  it('has client/axios.js', () => {
    expect(existsSync(join(distDir, 'client', 'axios.js'))).toBe(true);
  });

  it('has client/axios.d.ts', () => {
    expect(existsSync(join(distDir, 'client', 'axios.d.ts'))).toBe(true);
  });

  it('has openapi.json', () => {
    expect(existsSync(join(distDir, 'openapi.json'))).toBe(true);
  });
});

describe('openapi.json (OAS 3.0 conversion)', () => {
  const openapi = JSON.parse(readFileSync(join(distDir, 'openapi.json'), 'utf8'));
  const swagger = JSON.parse(
    readFileSync(join(import.meta.dirname, 'fixtures', 'swagger.json'), 'utf8'),
  );

  it('is OpenAPI 3.0', () => {
    expect(openapi.openapi).toMatch(/^3\.0\./);
  });

  it('preserves all paths from the input spec', () => {
    expect(Object.keys(openapi.paths).length).toBe(Object.keys(swagger.paths).length);
  });

  it('preserves all component schemas from definitions', () => {
    expect(Object.keys(openapi.components.schemas).length).toBe(
      Object.keys(swagger.definitions).length,
    );
  });
});
