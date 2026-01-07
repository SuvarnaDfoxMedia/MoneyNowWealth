

// "use client";

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Tooltip,
//   Legend
// } from "chart.js";
// import { Bar } from "react-chartjs-2";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// export default function SipBarChart({ invested, returns }) {
//   const years = Array.from({ length: 15 }, (_, i) => `${i + 1}Y`);

//   const data = {
//     labels: years,
//     datasets: [
//       {
//         label: "Invested",
//         data: invested,
//         backgroundColor: "#4E7EFF", // BLUE bottom bar
//         borderRadius: {
//           topLeft: 0,
//           topRight: 0,
//           bottomLeft: 6,
//           bottomRight: 6,
//         },
//         barThickness: 16,
//       },
//       {
//         label: "Returns",
//         data: returns,
//         backgroundColor: "#E59E1F", // ORANGE top bar
//         borderRadius: {
//           topLeft: 6,
//           topRight: 6,
//           bottomLeft: 0,
//           bottomRight: 0,
//         },
//         barThickness: 16,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,

//     plugins: {
//       legend: { display: false },
//       tooltip: {
//         callbacks: {
//           label: (ctx) => `${ctx.raw} L`,
//         },
//       },
//     },

//     scales: {
//       x: {
//         stacked: true,
//         grid: { display: false },
//         ticks: {
//           maxRotation: 25,
//           minRotation: 25,
//           font: { size: 11 },
//         },
//       },
//       y: {
//         stacked: true,
//         grid: {
//           color: "#e0e0e0",
//           drawBorder: false,
//         },
//         ticks: {
//           callback: (value) => value + " L",
//           font: { size: 11 },
//         },
//         border: { display: false },
//       },
//     },
//   };

//   return (
//     <div className="h-[340px] w-full">
//       <Bar data={data} options={options} />
//     </div>
//   );
// }


"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SipBarChart({ invested, returns }) {
  const years = Array.from({ length: 15 }, (_, i) => `${i + 1}Y`);

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
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.raw} L`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
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
          callback: (value) => value + " L",
          font: { size: 11 },
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="w-full h-[240px] sm:h-[300px] md:h-[340px]">
      <Bar data={data} options={options} />
    </div>
  );
}
