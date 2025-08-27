import { createRoot } from 'react-dom/client'
import App from './App'

const content = document.querySelector('#content')
if (content) {
  createRoot(content).render(<App />)
}
