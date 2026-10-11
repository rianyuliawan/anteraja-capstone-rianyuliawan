import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { filterHubs, prepareDashboard, topHubs } from './dashboard.js'

const metrics = {
  completed_visits: 3,
  global_mean_dwell_hours: 7,
  priority_threshold_hours: 6,
  hubs: [
    { hub_id: 'A', completed_visits: 2, mean_dwell_hours: 8, min_dwell_hours: 4, max_dwell_hours: 10, median_dwell_hours: 8, p95_dwell_hours: 9.5, valid_pair_rate_pct: 80, priority: true },
    { hub_id: 'B', completed_visits: 1, mean_dwell_hours: 5, min_dwell_hours: 3, max_dwell_hours: 7, median_dwell_hours: 5, p95_dwell_hours: 6.5, valid_pair_rate_pct: 75, priority: false },
  ],
}
const locations = { hubs: [
  { hub_id: 'A', hub_name: 'Hub Alpha', city: 'Jakarta', latitude: -6.2, longitude: 106.8 },
  { hub_id: 'B', hub_name: 'Hub Beta', city: 'Bekasi', latitude: -6.3, longitude: 107 },
] }

test('joins metrics and locations by hub_id and preserves completed visits', () => {
  const result = prepareDashboard(metrics, locations, {})
  assert.equal(result.completedVisits, 3)
  assert.equal(result.hubs[0].hub_name, 'Hub Alpha')
})

test('ranks raw numeric mean values, not formatted strings', () => {
  const ranked = topHubs([{ mean_dwell_hours: 9.5 }, { mean_dwell_hours: 10.2 }], 2)
  assert.equal(ranked[0].mean_dwell_hours, 10.2)
})

test('priority filter and search can be combined', () => {
  const hubs = prepareDashboard(metrics, locations, {}).hubs
  assert.deepEqual(filterHubs(hubs, true, 'beta'), [])
  assert.deepEqual(filterHubs(hubs, true, 'alpha').map((hub) => hub.hub_id), ['A'])
})

test('priority is calculated from the exercise threshold, not a stale flag', () => {
  const staleMetrics = structuredClone(metrics)
  staleMetrics.hubs[0].priority = false
  assert.equal(prepareDashboard(staleMetrics, locations, {}).hubs[0].priority, true)
})

test('rejects invalid detailed metrics instead of rendering misleading values', () => {
  const invalidMetrics = structuredClone(metrics)
  invalidMetrics.hubs[0].valid_pair_rate_pct = 120
  assert.throws(() => prepareDashboard(invalidMetrics, locations, {}), /rentang dwell tidak valid/i)
})

test('no-priority scenario keeps priority list empty', () => {
  const hubs = [{ hub_id: 'LOW', mean_dwell_hours: 4.5, priority: false }]
  assert.deepEqual(filterHubs(hubs, true), [])
})

test('empty data is a supported dashboard state', () => {
  const result = prepareDashboard({ hubs: [], completed_visits: 0, global_mean_dwell_hours: null }, { hubs: [] }, {})
  assert.deepEqual(result.hubs, [])
})

test('missing location is reported instead of silently dropping a hub', () => {
  assert.throws(() => prepareDashboard(metrics, { hubs: [] }, {}), /lokasi tidak cocok/i)
})

test('global mean uses all completed pairs, excluding open visits', async () => {
  const [metricsJson, pairsCsv] = await Promise.all([
    readFile(new URL('../../public/data/metrics.json', import.meta.url), 'utf8'),
    readFile(new URL('../../../bigdata-bottleneck-analysis/output/scan_pairs_dwell.csv', import.meta.url), 'utf8'),
  ])
  const prepared = JSON.parse(metricsJson)
  const rows = pairsCsv.trim().split(/\r?\n/).slice(1)
  const total = rows.reduce((sum, row) => sum + Number(row.split(',').at(-1)), 0)
  assert.equal(prepared.completed_visits, rows.length)
  assert.ok(Math.abs(prepared.global_mean_dwell_hours - total / rows.length) < 1e-10)
})
