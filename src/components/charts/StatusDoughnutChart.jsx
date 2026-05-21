import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { STATUSES } from '@/utils/constants'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']

export default function StatusDoughnutChart({ complaints }) {
  const counts = STATUSES.map((s) => complaints.filter((c) => c.status === s).length)

  const data = {
    labels: STATUSES,
    datasets: [
      {
        data: counts,
        backgroundColor: COLORS,
        hoverOffset: 6,
        borderWidth: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 16, font: { size: 12, family: 'DM Sans' }, usePointStyle: true },
      },
    },
  }

  return <Doughnut data={data} options={options} />
}
