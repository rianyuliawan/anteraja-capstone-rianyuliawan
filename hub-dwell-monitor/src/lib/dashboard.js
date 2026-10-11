export function prepareDashboard(metrics, locations, aiSummary) {
  if (!Array.isArray(metrics?.hubs) || !Array.isArray(locations?.hubs)) {
    throw new Error('Data metrics atau lokasi tidak memiliki daftar hub yang valid.')
  }

  const locationById = new Map()
  for (const location of locations.hubs) {
    if (!location?.hub_id || locationById.has(location.hub_id)) {
      throw new Error('ID hub pada data lokasi tidak valid atau duplikat.')
    }
    locationById.set(location.hub_id, location)
  }

  const seen = new Set()
  const hubs = metrics.hubs.map((metric) => {
    const location = locationById.get(metric.hub_id)
    if (!metric?.hub_id || seen.has(metric.hub_id) || !location) {
      throw new Error(`Data lokasi tidak cocok untuk hub ${metric?.hub_id ?? 'tanpa ID'}.`)
    }
    seen.add(metric.hub_id)

    for (const field of ['completed_visits', 'mean_dwell_hours', 'min_dwell_hours', 'max_dwell_hours']) {
      if (!Number.isFinite(metric[field]) || metric[field] < 0) {
        throw new Error(`Nilai ${field} tidak valid untuk ${metric.hub_id}.`)
      }
    }
    if (metric.min_dwell_hours > metric.mean_dwell_hours || metric.mean_dwell_hours > metric.max_dwell_hours) {
      throw new Error(`Rentang dwell tidak valid untuk ${metric.hub_id}.`)
    }
    if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
      throw new Error(`Koordinat tidak valid untuk ${metric.hub_id}.`)
    }

    return { ...metric, ...location }
  })

  if (locations.hubs.length !== hubs.length) {
    throw new Error('Ada lokasi hub yang tidak memiliki metrics.')
  }

  const completedVisits = hubs.reduce((sum, hub) => sum + hub.completed_visits, 0)
  if (completedVisits !== metrics.completed_visits) {
    throw new Error('Total completed visits tidak sesuai dengan data per hub.')
  }

  return {
    hubs,
    completedVisits,
    globalMeanDwellHours: metrics.global_mean_dwell_hours,
    priorityThresholdHours: metrics.priority_threshold_hours,
    aiSummary: {
      summary: typeof aiSummary?.summary === 'string' ? aiSummary.summary : '',
      priority_hubs: Array.isArray(aiSummary?.priority_hubs) ? aiSummary.priority_hubs.filter((id) => typeof id === 'string') : [],
      next_checks: Array.isArray(aiSummary?.next_checks) ? aiSummary.next_checks.filter((item) => typeof item === 'string') : [],
    },
  }
}

export function topHubs(hubs, limit = 3) {
  return [...hubs].sort((a, b) => b.mean_dwell_hours - a.mean_dwell_hours).slice(0, limit)
}

export function filterHubs(hubs, priorityOnly, searchTerm = '') {
  const query = searchTerm.trim().toLocaleLowerCase('id')
  return hubs.filter((hub) => {
    if (priorityOnly && !hub.priority) return false
    return !query || `${hub.hub_name} ${hub.city} ${hub.hub_id}`.toLocaleLowerCase('id').includes(query)
  })
}

export function formatHours(value) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value)
}
