/**
 * RankingChart: horizontal ranking bars for all candidates.
 * Each row shows rank, name, party, a proportional bar, and vote stats.
 */

import './RankingChart.css'

export default function RankingChart({ candidates }) {
  const sorted = [...candidates].sort((a, b) => b.votes - a.votes)
  const maxPct = sorted[0]?.percentage || 1

  return (
    <div className="ranking-chart card">
      {sorted.map((c, idx) => {
        const barWidth = maxPct > 0 ? (c.percentage / maxPct) * 100 : 0
        const rank = idx + 1
        const isTop3 = rank <= 3

        return (
          <div key={c.candidate_id} className={`ranking-row ${isTop3 ? 'top3' : ''}`}>
            <div className={`rank-badge rank-${rank <= 3 ? rank : 'rest'}`}>
              {rank}
            </div>

            <div className="rank-avatar">
              {c.candidate_name.split(' ').slice(0, 2).map(w => w[0]).join('')}
            </div>

            <div className="rank-content">
              <div className="rank-names">
                <span className="rank-name">{c.candidate_name}</span>
                <span className="rank-party">{c.party_name}</span>
              </div>
              <div className="rank-bar-track">
                <div
                  className="rank-bar-fill"
                  style={{
                    width: `${barWidth}%`,
                    opacity: isTop3 ? 1 : 0.55,
                  }}
                />
              </div>
            </div>

            <div className="rank-stats">
              <span className="rank-pct">{c.percentage.toFixed(1)}%</span>
              <span className="rank-count">{c.votes.toLocaleString('es-PE')}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
