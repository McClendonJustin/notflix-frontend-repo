import { Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import Selection from './pages/Selection'
import Cinema from './pages/Cinema'
import Donate from './pages/Donate'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route element={<RequireAuth />}>
        <Route path="/selection" element={<Selection />} />
        <Route path="/cinema/:id" element={<Cinema />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
