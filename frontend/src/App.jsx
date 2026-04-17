import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [healthData, setHealthData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch data from the Flask backend using the environment variable
    const fetchHealthCheck = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL
        const response = await fetch(`${apiUrl}/health`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setHealthData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHealthCheck()
  }, [])

  return (
    <div className="App">
      <header>
        <h1>Roommate Matching App</h1>
        <h2>System Status</h2>
      </header>
      
      <main>
        {loading && <p>Connecting to backend...</p>}
        
        {error && (
          <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>
            <p><strong>Connection Error:</strong> {error}</p>
            <p>Make sure your Flask server is running on port 5000!</p>
          </div>
        )}
        
        {healthData && (
          <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', color: '#333' }}>
            <p><strong>Status:</strong> {healthData.status}</p>
            <p><strong>Message:</strong> {healthData.message}</p>
            <p><strong>Environment:</strong> {healthData.environment}</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App