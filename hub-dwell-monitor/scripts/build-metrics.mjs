import { readFile, writeFile } from 'node:fs/promises'

const sourceDirectory = new URL('../../bigdata-bottleneck-analysis/output/', import.meta.url)
const outputFile = new URL('../public/data/metrics.json', import.meta.url)

function parseCsv(text) {
  const [heading, ...rows] = text.trim().split(/\r?\n/)
  const columns = heading.split(',')
  return rows.map((row) => Object.fromEntries(row.split(',').map((value, index) => [columns[index], value])))
}

const [summaryText, pairsText] = await Promise.all([
  readFile(new URL('hub_dwell_summary.csv', sourceDirectory), 'utf8'),
  readFile(new URL('scan_pairs_dwell.csv', sourceDirectory), 'utf8'),
])

const thresholdHours = 6
const summaryRows = parseCsv(summaryText)
const pairRows = parseCsv(pairsText)
const countByHub = new Map()
let totalDwellHours = 0

for (const pair of pairRows) {
  const dwellHours = Number(pair.dwell_hours)
  if (!Number.isFinite(dwellHours) || dwellHours < 0) {
    throw new Error(`Invalid completed visit dwell for ${pair.package_id}`)
  }
  totalDwellHours += dwellHours
  countByHub.set(pair.hub_id, (countByHub.get(pair.hub_id) ?? 0) + 1)
}

const hubs = summaryRows.map((row) => {
  const completedVisits = Number(row.package_count)
  if (countByHub.get(row.hub_id) !== completedVisits) {
    throw new Error(`Completed visit count mismatch for ${row.hub_id}`)
  }

  const meanDwellHours = Number(row.avg_dwell_hours)
  return {
    hub_id: row.hub_id,
    completed_visits: completedVisits,
    mean_dwell_hours: meanDwellHours,
    min_dwell_hours: Number(row.min_dwell_hours),
    max_dwell_hours: Number(row.max_dwell_hours),
    median_dwell_hours: Number(row.median_dwell_hours),
    p95_dwell_hours: Number(row.p95_dwell_hours),
    valid_pair_rate_pct: Number(row.valid_pair_rate_pct),
    priority: meanDwellHours > thresholdHours,
  }
})

const result = {
  priority_threshold_hours: thresholdHours,
  completed_visits: pairRows.length,
  global_mean_dwell_hours: totalDwellHours / pairRows.length,
  hubs: hubs.sort((a, b) => b.mean_dwell_hours - a.mean_dwell_hours),
}

await writeFile(outputFile, `${JSON.stringify(result, null, 2)}\n`)
console.log(`Prepared ${result.hubs.length} hubs and ${result.completed_visits} completed visits.`)
