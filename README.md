# CareCompass 🧭

CareCompass is a healthcare application backend and frontend designed to assist doctors and caregivers in tracking patient data, logs, and clinician notes.

## 📂 Project Structure

- `public/`: Contains all client-side code (HTML, CSS, JS).
- `docs/`: Contains project documentation.
- `server.js`: The Node.js Express server backend.
- `db.json`: JSON database file using `lowdb`.

## 🚀 Getting Started

### Prerequisites

- Node.js installed on your machine.

### Installation

1.  Clone the repository or download the source code.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Application

1.  Start the server:
    ```bash
    npm start
    ```
    Or manually:
    ```bash
    node server.js
    ```
2.  Open your browser and navigate to:
    `http://localhost:3000`

## 🔐 Credentials

- **Doctor Role**: Select "Doctor" on the login screen.
- **Caregiver Role**: Select "Caregiver" on the login screen.
- You can register a new account or use existing ones if available in `db.json`.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: LowDB (JSON file based)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

