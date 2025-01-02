import { useState } from 'react'
import GraphComponent from './Component/GraphComponent';
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div>
      <GraphComponent/>
    </div>
      
    </>
  )
}

export default App
