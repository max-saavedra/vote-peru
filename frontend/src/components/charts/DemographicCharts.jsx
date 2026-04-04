/**
 * DemographicCharts: grid of charts for age, sex, NSE, city, and location.
 * Uses Recharts for pie and bar charts.
 */

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import './DemographicCharts.css'

// Color palette for demographics
const PALETTE = [
  '#c8102e', '#2563eb', '#16a34a', '#d97706', '#7c3aed',
  '#0891b2', '#db2777', '#65a30d', '#9333ea', '#0369a1',
]

const SEX_LABELS = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  otro: 'Otro',
  prefiero_no_decir: 'Prefiero no decir',
}

const NSE_LABELS = {
  A: 'NSE A (Alta)',
  B: 'NSE B (Media alta)',
  C: 'NSE C (Media)',
  D: 'NSE D (Media baja)',
  E: 'NSE E (Baja)',
}

const LOC_LABELS = {
  peru: 'Desde Peru',
  extranjero: 'Desde el extranjero',
}

function EmptyState({ msg }) {
  return (
    <div className="chart-empty">
      <p>{msg}</p>
    </div>
  )
}

function SmallPieChart({ data, labelKey, valueKey = 'count', labelMap }) {
  if (!data || data.length === 0) return <EmptyState msg="Sin datos suficientes" />

  const chartData = data.map(d => ({
    name: labelMap ? (labelMap[d[labelKey]] || d[labelKey]) : d[labelKey],
    value: d[valueKey],
    percentage: d.percentage,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name, props) => [
            `${value} (${props.payload.percentage.toFixed(1)}%)`,
            name,
          ]}
        />
        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function SmallBarChart({ data, labelKey, labelMap }) {
  if (!data || data.length === 0) return <EmptyState msg="Sin datos suficientes" />

  const chartData = data.slice(0, 10).map(d => ({
    name: labelMap ? (labelMap[d[labelKey]] || d[labelKey]) : d[labelKey],
    votos: d.count,
    pct: d.percentage,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
        />
        <Tooltip
          formatter={(value, _name, props) => [
            `${value} (${props.payload.pct.toFixed(1)}%)`,
            'Votos',
          ]}
        />
        <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function DemographicCharts({ byAge, bySex, byNse, byCity, byLocation }) {
  return (
    <div className="demographic-grid">
      <div className="demo-card card">
        <h3 className="demo-title">Por rango de edad</h3>
        <SmallBarChart data={byAge} labelKey="age_range" />
      </div>

      <div className="demo-card card">
        <h3 className="demo-title">Por sexo</h3>
        <SmallPieChart data={bySex} labelKey="sex" labelMap={SEX_LABELS} />
      </div>

      <div className="demo-card card">
        <h3 className="demo-title">Por nivel socioeconómico (NSE)</h3>
        <SmallBarChart data={byNse} labelKey="nse" labelMap={NSE_LABELS} />
      </div>

      <div className="demo-card card">
        <h3 className="demo-title">Por ciudad (top 10)</h3>
        <SmallBarChart data={byCity} labelKey="city" />
      </div>

      <div className="demo-card card">
        <h3 className="demo-title">Peru vs. Extranjero</h3>
        <SmallPieChart data={byLocation} labelKey="location_type" labelMap={LOC_LABELS} />
      </div>
    </div>
  )
}
