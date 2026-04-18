import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Auth from "./pages/Auth"
import Profile from "./pages/Profile"
import Feed from "./pages/Feed"
import ArtistProfile from "./pages/ArtistProfile"
import Commissions from "./pages/Commissions"
import PostDetail from "./pages/PostDetail"

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!session ? <Auth /> : <Navigate to="/profile" />} />
        <Route path="/feed" element={session ? <Feed session={session} /> : <Navigate to="/" />} />
        <Route path="/profile" element={session ? <Profile session={session} /> : <Navigate to="/" />} />
        <Route path="/artist/:username" element={session ? <ArtistProfile session={session} /> : <Navigate to="/" />} />
        <Route path="/Commissions" element={session ? <Commissions session={session} /> : <Navigate to="/" />} />
        <Route path="/post/:id" element={session ? <PostDetail session={session} /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}