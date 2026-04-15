import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import Navbar from "../components/Navbar"

export default function Profile({ session }) {
  const [profile, setProfile] = useState(null)
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    async function getProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (data) {
        setProfile(data)
        setUsername(data.username)
        setBio(data.bio || "")
        setIsOpen(data.is_open_for_commissions)
      }
      setLoading(false)
    }

    getProfile()
  }, [session])

  async function saveProfile() {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: session.user.id,
        username,
        bio,
        is_open_for_commissions: isOpen,
      })

    if (error) setMessage(error.message)
    else setMessage("Profile saved!")

    setSaving(false)
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-lg">
          <h1 className="text-2xl font-bold mb-6">Your profile</h1>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Username</label>
              <input
                className="border rounded-lg p-3 w-full text-sm outline-none focus:ring-2 focus:ring-purple-400"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. artby_jane"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Bio</label>
              <textarea
                className="border rounded-lg p-3 w-full text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell people about your art..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="commissions"
                checked={isOpen}
                onChange={e => setIsOpen(e.target.checked)}
                className="w-4 h-4 accent-purple-600"
              />
              <label htmlFor="commissions" className="text-sm text-gray-700">
                Open for commissions
              </label>
            </div>

            {message && (
              <p className={`text-sm ${message === "Profile saved!" ? "text-green-500" : "text-red-500"}`}>
                {message}
              </p>
            )}

            <button
              onClick={saveProfile}
              disabled={saving}
              className="bg-purple-600 text-white rounded-lg p-3 font-medium hover:bg-purple-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>

            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}