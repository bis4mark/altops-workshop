import './App.css';
import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>AltOps Workshop</h1>
        <p>Welcome to the React Application</p>
      </header>
      <SpeedInsights />
    </div>
  );
}

export default App;
