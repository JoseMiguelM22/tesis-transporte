import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (typeof window !== "undefined") {
  // 1. Mensaje de título gigante en rojo
  console.log(
    "%c¡Detente!",
    "color: red; font-family: sans-serif; font-size: 4.5em; font-weight: bold; text-shadow: 2px 2px 5px rgba(0,0,0,0.3); font-style: normal;"
  );

 
  console.log(
    "%cEsta función del navegador está pensada para desarrolladores. Si alguien te indicó que copiaras y pegaras algo aquí para habilitar una función o para 'hackear' el sistema, se trata de un fraude. Si lo haces, esa persona podría acceder a tus datos o comprometer tu cuenta.",
    "color: white; font-family: sans-serif; font-size: 1.5em; font-weight: normal; line-height: 1.4;"
  );
}
