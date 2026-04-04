/**
 * TrendChart: line chart showing cumulative vote accumulation over last 24h.
 * Displays top 5 candidates as separate lines.
 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// Colors assigned to lines in order of rank
const LINE_COLORS = ['#c8102e', '#2563eb', '#16a34a', '#d97706', '#7c3aed']

export default function TrendChart({ data }) {
  // Transform flat array into recharts format: [{hour, name1: votes, name2: votes, ...}]
  const candidateIds = [...new Set(data.map(d => d.candidate_id))]
  const hoursMap = {}

  data.forEach(point => {
    if (!hoursMap[point.hour]) hoursMap[point.hour] = { hour: point.hour }
    hoursMap[point.hour][point.candidate_id] = point.cumulative_votes
    hoursMap[point.hour][`${point.candidate_id}_name`] = point.candidate_name
  })

  const chartData = Object.values(hoursMap).sort((a, b) => a.hour.localeCompare(b.hour))

  // Get display names from data
  const nameMap = {}
  data.forEach(d => { nameMap[d.candidate_id] = d.candidate_name })

  const formatHour = (h) => {
    if (!h) return ''
    const date = new Date(h)
    return `${date.getHours().toString().padStart(2,'0')}:00`
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="hour"
          tickFormatter={formatHour}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
        <Tooltip
          labelFormatter={formatHour}
          formatter={(value, key) => [value, nameMap[key] || key]}
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '0.8rem',
          }}
        />
        <Legend
          formatter={(value) => nameMap[value] || value}
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ fontSize: '0.78rem' }}
        />
        {candidateIds.map((id, i) => (
          <Line
            key={id}
            type="monotone"
            dataKey={id}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
