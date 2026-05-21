import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js'
import { PRIORITIES } from '@/utils/constants'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#7f1d1d']

export default function PriorityBarChart({ complaints }) {
  const counts = PRIORITIES.map((p) => complaints.filter((c) => c.priority === p).length)

  const data = {
    labels: PRIORITIES,
    datasets: [{
      label: 'Count',
      data: counts,
      backgroundColor: COLORS,
      borderRadius: 8,
      borderSkipped: false,
    }],
  }

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { precision: 0 } },
      x: { grid: { display: false } },
    },
  }

  return <Bar data={data} options={options} />
}
