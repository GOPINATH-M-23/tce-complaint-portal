import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  })
}

export default function TrendLineChart({ complaints }) {
  const labels = getLast7Days()

  const counts = labels.map((label) =>
    complaints.filter((c) => {
      if (!c.createdAt) return false
      const d = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt)
      const dayLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      return dayLabel === label
    }).length,
  )

  const data = {
    labels,
    datasets: [{
      label: 'Complaints',
      data: counts,
      borderColor: '#2e6b52',
      backgroundColor: 'rgba(46,107,82,0.12)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#1f4d3a',
      pointRadius: 5,
    }],
  }

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { precision: 0 } },
      x: { grid: { display: false }, ticks: { font: { size: 12 } } },
    },
  }

  return <Line data={data} options={options} />
}
