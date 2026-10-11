import { useEffect, useMemo, useState } from 'react'
import DashboardMap from './components/DashboardMap.jsx'
import { filterHubs, formatHours, prepareDashboard, topHubs } from './lib/dashboard.js'

const numberFormat = new Intl.NumberFormat('id-ID')
const percentFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })

function useDashboardData(retryCount) {
  const [state, setState] = useState({ status: 'loading', data: null, message: '' })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', data: null, message: '' })

    Promise.all(['metrics', 'locations', 'ai-summary'].map(async (name) => {
      const response = await fetch(`/data/${name}.json`, { signal: controller.signal })
      if (!response.ok) throw new Error(`Gagal memuat ${name}.json (HTTP ${response.status}).`)
      return response.json()
    }))
      .then(([metrics, locations, summary]) => {
        if (!controller.signal.aborted) {
          setState({ status: 'ready', data: prepareDashboard(metrics, locations, summary), message: '' })
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', data: null, message: error.message || 'Data hub gagal dimuat.' })
        }
      })

    return () => controller.abort()
  }, [retryCount])

  return state
}

function Eyebrow({ children }) {
  return <span className="eyebrow">{children}</span>
}

function StatCard({ label, value, suffix, note, tone = 'neutral' }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card-label">{label}</span>
      <div className="stat-card-value">{value}<span>{suffix}</span></div>
      <span className="stat-card-note">{note}</span>
    </div>
  )
}

function Placeholder({ title, description }) {
  return (
    <div className="placeholder" role="status">
      <div className="placeholder-mark" aria-hidden="true">○</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

function HubDetail({ hub, thresholdHours, onClose, isDefault }) {
  if (!hub) {
    return <Placeholder title="Pilih salah satu hub" description="Klik penanda pada peta atau nama hub dalam daftar untuk melihat detailnya." />
  }

  return (
    <div className="hub-detail" aria-live="polite">
      <div className="hub-detail-heading">
        <div>
          <Eyebrow>{isDefault ? 'Fokus awal · mean tertinggi' : 'Detail hub terpilih'}</Eyebrow>
          <h3>{hub.hub_name}</h3>
          <p>{hub.hub_id} · {hub.city}, {hub.province}</p>
        </div>
        <div className="hub-detail-actions">
          <span className={`status-pill${hub.priority ? ' status-pill--priority' : ''}`}>{hub.priority ? 'Prioritas investigasi' : 'Reguler'}</span>
          {!isDefault && <button className="icon-button" type="button" aria-label="Kembali ke fokus awal" onClick={onClose}>×</button>}
        </div>
      </div>
      <div className="hub-detail-grid">
        <div className="hub-detail-metric hub-detail-metric--primary"><span>Rata-rata dwell</span><strong>{formatHours(hub.mean_dwell_hours)} <small>jam</small></strong></div>
        <div className="hub-detail-metric hub-detail-metric--primary"><span>Kunjungan selesai</span><strong>{numberFormat.format(hub.completed_visits)}</strong></div>
        <div className="hub-detail-metric"><span>Minimum</span><strong>{formatHours(hub.min_dwell_hours)} jam</strong></div>
        <div className="hub-detail-metric"><span>Maksimum</span><strong>{formatHours(hub.max_dwell_hours)} jam</strong></div>
        <div className="hub-detail-metric"><span>Median</span><strong>{formatHours(hub.median_dwell_hours)} jam</strong></div>
        <div className="hub-detail-metric"><span>P95</span><strong>{formatHours(hub.p95_dwell_hours)} jam</strong></div>
      </div>
      <div className="hub-detail-quality">
        <span>Pasangan scan valid</span>
        <strong>{percentFormat.format(hub.valid_pair_rate_pct)}%</strong>
        <div className="quality-track" role="meter" aria-label="Persentase pasangan scan valid" aria-valuemin="0" aria-valuemax="100" aria-valuenow={hub.valid_pair_rate_pct}>
          <span style={{ width: `${hub.valid_pair_rate_pct}%` }} />
        </div>
      </div>
      <div className="hub-detail-foot">
        <span>Selisih dari ambang {formatHours(thresholdHours)} jam</span>
        <strong className={hub.priority ? 'delta-positive' : ''}>{hub.mean_dwell_hours > thresholdHours ? '+' : ''}{formatHours(hub.mean_dwell_hours - thresholdHours)} jam</strong>
      </div>
      <p className="hub-detail-note">P95 berarti 95% kunjungan selesai berdurasi sampai nilai tersebut. Rasio scan valid dihitung dari catatan paket-hub dengan pasangan ARRIVAL–DEPARTURE. Ambang prioritas bukan SLA resmi.</p>
    </div>
  )
}

function Dashboard({ data }) {
  const [priorityOnly, setPriorityOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedHubId, setSelectedHubId] = useState(null)
  const priorityCount = data.hubs.filter((hub) => hub.priority).length
  const ranked = useMemo(() => topHubs(data.hubs), [data.hubs])
  const topVisits = ranked.reduce((total, hub) => total + hub.completed_visits, 0)
  const mapHubs = useMemo(() => filterHubs(data.hubs, priorityOnly), [data.hubs, priorityOnly])
  const listHubs = useMemo(() => filterHubs(data.hubs, priorityOnly, searchTerm), [data.hubs, priorityOnly, searchTerm])
  const selectedHub = data.hubs.find((hub) => hub.hub_id === selectedHubId) ?? ranked[0]

  useEffect(() => {
    if (selectedHubId && !mapHubs.some((hub) => hub.hub_id === selectedHubId)) {
      setSelectedHubId(null)
    }
  }, [mapHubs, selectedHubId])

  if (data.hubs.length === 0) {
    return <Placeholder title="Belum ada data hub" description="Tambahkan metrics dan lokasi hub, lalu muat ulang dashboard." />
  }

  return (
    <>
      <section className="kpi-grid" aria-label="Kinerja seluruh hub">
        <StatCard label="Total hub" value={data.hubs.length} note="Lokasi terpantau" />
        <StatCard label="Completed visits" value={numberFormat.format(data.completedVisits)} note="Pasangan scan valid" />
        <StatCard label="Mean dwell global" value={formatHours(data.globalMeanDwellHours)} suffix="jam" note="Dari seluruh kunjungan selesai" />
        <StatCard label="Hub prioritas" value={priorityCount} note={`Mean di atas ${data.priorityThresholdHours} jam`} tone="brand" />
      </section>

      <section className="rank-section" aria-labelledby="rank-title">
        <div className="section-heading">
          <div><Eyebrow>Fokus investigasi</Eyebrow><h2 id="rank-title">Top 3 dwell time tertinggi</h2></div>
          <p>{numberFormat.format(topVisits)} kunjungan · {percentFormat.format(topVisits / data.completedVisits * 100)}% dari total</p>
        </div>
        <div className="rank-grid">
          {ranked.map((hub, index) => (
            <button className="rank-card" key={hub.hub_id} type="button" onClick={() => setSelectedHubId(hub.hub_id)}>
              <span className="rank-number">0{index + 1}</span>
              <span className="rank-main"><strong>{hub.hub_name}</strong><small>{hub.hub_id} · {numberFormat.format(hub.completed_visits)} kunjungan</small><small>Rentang {formatHours(hub.min_dwell_hours)}–{formatHours(hub.max_dwell_hours)} jam</small></span>
              <span className="rank-value">{formatHours(hub.mean_dwell_hours)} <small>jam</small></span>
            </button>
          ))}
        </div>
      </section>

      <section className="monitor-section" aria-labelledby="monitor-title">
        <div className="section-heading monitor-heading">
          <div><Eyebrow>Eksplorasi lokasi</Eyebrow><h2 id="monitor-title">Peta dan daftar hub</h2></div>
          <div className="segmented" role="group" aria-label="Filter prioritas hub">
            <button type="button" className={!priorityOnly ? 'is-active' : ''} aria-pressed={!priorityOnly} onClick={() => setPriorityOnly(false)}>Semua hub</button>
            <button type="button" className={priorityOnly ? 'is-active' : ''} aria-pressed={priorityOnly} onClick={() => setPriorityOnly(true)}>Prioritas saja</button>
          </div>
        </div>
        <p className="monitor-note">Prioritas berarti rata-rata dwell di atas {formatHours(data.priorityThresholdHours)} jam (ambang simulasi analisis, bukan SLA resmi). {priorityCount === data.hubs.length ? 'Saat ini seluruh hub termasuk prioritas.' : ''}</p>
        <div className="monitor-grid">
          <div className="map-panel">
            <div className="panel-topline"><strong>Peta hub</strong><span>{mapHubs.length} lokasi</span></div>
            <DashboardMap hubs={mapHubs} selectedHubId={selectedHubId} onSelectHub={setSelectedHubId} />
          </div>
          <div className="side-panel">
            <div className="hub-list-panel">
              <div className="panel-topline"><strong>Daftar hub</strong><span>{listHubs.length} dari {mapHubs.length}</span></div>
              <label className="search-field">
                <span className="sr-only">Cari hub</span>
                <span aria-hidden="true" className="search-icon">⌕</span>
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari nama, kota, atau ID hub" type="search" />
              </label>
              {listHubs.length > 0 ? (
                <ul className="hub-list">
                  {listHubs.map((hub) => (
                    <li key={hub.hub_id}>
                      <button type="button" className={`hub-list-item${selectedHubId === hub.hub_id ? ' is-selected' : ''}`} onClick={() => setSelectedHubId(hub.hub_id)}>
                        <span className="hub-list-top">
                          <span className="hub-list-marker" aria-hidden="true" />
                          <span className="hub-list-main"><strong>{hub.hub_name}</strong><small>{hub.city} · {hub.hub_id}</small></span>
                          <span className="hub-list-value">{formatHours(hub.mean_dwell_hours)}<small> jam</small></span>
                        </span>
                        <span className="hub-list-stats">
                          <span><strong>{numberFormat.format(hub.completed_visits)}</strong> kunjungan selesai</span>
                          <span>Rentang <strong>{formatHours(hub.min_dwell_hours)}–{formatHours(hub.max_dwell_hours)}</strong> jam</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <Placeholder title="Hub tidak ditemukan" description="Coba kata kunci lain atau ubah filter prioritas." />}
            </div>
          </div>
          <HubDetail hub={selectedHub} thresholdHours={data.priorityThresholdHours} isDefault={!selectedHubId} onClose={() => setSelectedHubId(null)} />
        </div>
      </section>

      <section className="insight-panel" aria-labelledby="insight-title">
        <div><Eyebrow>Ringkasan operasional</Eyebrow><h2 id="insight-title">Langkah pemeriksaan berikutnya</h2><p>{data.aiSummary.summary}</p></div>
        <ol>{data.aiSummary.next_checks.map((check) => <li key={check}>{check}</li>)}</ol>
      </section>
    </>
  )
}

export default function App() {
  const [retryCount, setRetryCount] = useState(0)
  const state = useDashboardData(retryCount)

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <img src="/logo-anteraja.png" alt="Anteraja" className="brand-logo" />
          <div className="header-divider" aria-hidden="true" />
          <span className="product-name">Hub Dwell Monitor</span>
          <span className="header-context">Dashboard operasional</span>
        </div>
      </header>
      <main className="app-shell">
        <div className="page-intro">
          <div><Eyebrow>ANALISIS OPERASIONAL HUB</Eyebrow><h1>Monitor dwell time hub</h1><p>Pantau durasi kunjungan selesai, bandingkan performa antarlokasi, dan tentukan fokus investigasi.</p></div>
          <div className="data-chip"><span className="data-chip-dot" /> Data analisis tersedia</div>
        </div>

        {state.status === 'loading' && (
          <div className="loading-state" role="status" aria-live="polite">
            <div className="loading-spinner" />
            <strong>Memuat data hub…</strong>
            <p>Menyusun metrik, lokasi, dan ringkasan operasional.</p>
          </div>
        )}
        {state.status === 'error' && (
          <div className="error-state" role="alert">
            <strong>Data hub belum dapat ditampilkan</strong>
            <p>{state.message}</p>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Coba lagi</button>
          </div>
        )}
        {state.status === 'ready' && <Dashboard data={state.data} />}
      </main>
      <footer className="site-footer">Anteraja Hub Dwell Monitor <span>·</span> Sumber metrics: analisis scan ARRIVAL–DEPARTURE</footer>
    </div>
  )
}
