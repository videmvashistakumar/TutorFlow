import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { migrateToInr } from './lib/inrMigration.js'
import { initTheme } from './lib/settingsStore';
import { NexenInspector } from './components/_internal/NexenInspector';

migrateToInr()
initTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {import.meta.env.DEV && <NexenInspector />}
		</React.StrictMode>,
)

