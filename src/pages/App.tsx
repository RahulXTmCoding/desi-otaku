import { Routes, Route, Link } from "react-router-dom"

function Home() {
  return (
    <div className="text-white min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <header className="text-3xl font-bold mb-6">Custom T-Shirt Shop</header>
      <p className="text-lg">Design your own T-shirts with vibrant styles and colors.</p>
      <button className="mt-6 px-6 py-2 bg-yellow-400 text-black rounded-full font-bold hover:bg-yellow-300 transition">Customize Now</button>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
