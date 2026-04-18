\#  MoneyNowWealth





---



\##  Project Structure



moneynowwealth/

├── api/ # Express.js backend (Node.js)

├── backend/ # Frontend built with Vite + TypeScript

├── README.md

└── .gitignore





---



\##  Technologies Used



| Layer      | Tech Stack                     |

|------------|--------------------------------|

| Frontend   | Vite, TypeScript, React (if used) |

| Backend    | Node.js, Express.js            |

| Package Mgmt | npm 

&nbsp;              |

| Version Control | Git + GitHub              |



---



\##  Getting Started



Follow these steps to run the project locally.



\### 1. Clone the repository



```bash

git clone https://github.com/DFOX-MEDIA-Development-Team/moneynowwealth.gitcd moneynowwealth

2\. Setup the Backend (API)



cd api

npm install



\# Start the server (default port: 3000 or as configured)

npm run dev

Ensure your backend has an index.js as entry point, or update your scripts in package.json.



3\. Setup the Frontend (Vite + TypeScript)



cd ../backend

npm install



\# Start Vite dev server (usually runs at http://localhost:5173)

npm run dev



