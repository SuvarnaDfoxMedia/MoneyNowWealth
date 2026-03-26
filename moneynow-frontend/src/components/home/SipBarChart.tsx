
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Tooltip,
//   Legend
// } from "chart.js";
// import { Bar } from "react-chartjs-2";

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { Bar } from "react-chartjs-2";

"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SipBarChartProps {
  invested: number[];
  returns: number[];
}

export default function SipBarChart({ invested, returns }: SipBarChartProps) {
  const years = invested.map((_, i) => `${i + 1}Y`);

  const data = {
    labels: years,
    datasets: [
      {
        label: "Invested",
        data: invested,
        backgroundColor: "#4E7EFF",
        borderRadius: {
          topLeft: 0,
          topRight: 0,
          bottomLeft: 6,
          bottomRight: 6,
        },
        barThickness: 16,
      },
      {
        label: "Returns",
        data: returns,
        backgroundColor: "#E59E1F",
        borderRadius: {
          topLeft: 6,
          topRight: 6,
          bottomLeft: 0,
          bottomRight: 0,
        },
        barThickness: 16,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const rawValue = context.raw;
            const value = Number(rawValue) || 0;
            return `${context.dataset.label}: ₹${(
              value * 100000
            ).toLocaleString("en-IN")}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          maxRotation: 25,
          minRotation: 25,
          font: { size: 11 },
        },
      },
      y: {
        stacked: true,
        grid: {
          color: "#e0e0e0",
          drawBorder: false,
        },
        ticks: {
          callback: (value: string | number) => {
            const v = Number(value) || 0;
            if (v === 0) return "0";
            return `₹${(v * 100000).toLocaleString("en-IN")}`;
          },
          font: { size: 11 },
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="h-[340px] w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
