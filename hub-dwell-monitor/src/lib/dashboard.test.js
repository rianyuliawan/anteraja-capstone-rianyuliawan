import test from 'node:test'
import assert from 'node:assert/strict'
import { filterHubs, prepareDashboard, topHubs } from './dashboard.js'

const metrics = {
  completed_visits: 3,
  global_mean_dwell_hours: 7,
  priority_threshold_hours: 6,
  hubs: [
    { hub_id: 'A', completed_visits: 2, mean_dwell_hours: 8, min_dwell_hours: 4, max_dwell_hours: 10, priority: true },
    { hub_id: 'B', completed_visits: 1, mean_dwell_hours: 5, min_dwell_hours: 3, max_dwell_hours: 7, priority: false },
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

test('empty data is a supported dashboard state', () => {
  const result = prepareDashboard({ hubs: [], completed_visits: 0, global_mean_dwell_hours: null }, { hubs: [] }, {})
  assert.deepEqual(result.hubs, [])
})

test('missing location is reported instead of silently dropping a hub', () => {
  assert.throws(() => prepareDashboard(metrics, { hubs: [] }, {}), /lokasi tidak cocok/i)
})
