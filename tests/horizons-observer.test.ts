import test from 'node:test';
import assert from 'node:assert/strict';

import { parseHorizonsObserverResult } from '../src/server/horizonsService.ts';

const fixture = [
  'Ephemeris / API_USER',
  'Target body name: Jupiter (599)',
  ' Date__(UT)__HR:MN, , , R.A._(ICRF), DEC_(ICRF), APmag, S-brt, delta, deldot, S-O-T,/r, S-T-O, Cnst,',
  '$$SOE',
  ' 2026-Nov-16 00:00, , , 148.01259, 13.72309, -2.090, 5.504, 5.2674165818, -27.1998037, 87.7710,/L, 10.7055, Leo,',
  ' 2026-Nov-17 00:00, , , 148.09297, 13.69911, n.a., n.a., 5.2517041740, -27.2111489, 88.6968,/L, 10.7079, Leo,',
  '$$EOE',
].join('\n');

test('parses JPL Horizons observer ephemeris rows by named columns', () => {
  const rows = parseHorizonsObserverResult(fixture);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].dateUTC, '2026-Nov-16 00:00');
  assert.equal(rows[0].rightAscensionDeg, 148.01259);
  assert.equal(rows[0].declinationDeg, 13.72309);
  assert.equal(rows[0].apparentMagnitude, -2.09);
  assert.equal(rows[0].rangeAU, 5.2674165818);
  assert.equal(rows[0].constellation, 'Leo');
});

test('keeps unavailable Horizons quantities null rather than inventing values', () => {
  const rows = parseHorizonsObserverResult(fixture);
  assert.equal(rows[1].apparentMagnitude, null);
  assert.equal(rows[1].surfaceBrightness, null);
});

test('rejects incomplete Horizons tables', () => {
  assert.throws(() => parseHorizonsObserverResult('no observer table'), /\\$\\$SOE/);
});
