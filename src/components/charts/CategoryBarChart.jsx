import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { CATEGORIES } from '@/utils/constants'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function CategoryBarChart({ complaints }) {
  const counts = CATEGORIES.map((c) => complaints.filter((x) => x.category === c).length)

  const data = {
    labels: CATEGORIES.map((c) => (c.length > 14 ? c.slice(0, 14) + '…' : c)),
    datasets: [
      {
        label: 'Complaints',
        data: counts,
        backgroundColor: 'rgba(46,107,82,0.75)',
        hoverBackgroundColor: '#1f4d3a',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => CATEGORIES[items[0].dataIndex],
        },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { precision: 0 } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  }

  return <Bar data={data} options={options} />
}
