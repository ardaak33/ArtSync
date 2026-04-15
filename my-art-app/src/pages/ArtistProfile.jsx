import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../supabaseClient"
import Navbar from "../components/Navbar"

export default function ArtistProfile({ session }) {
  const { username } = useParams()
  const [artist, setArtist] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchArtist()
  }, [username])

  async function fetchArtist() {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single()

    if (profileData) {
      setArtist(profileData)

      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false })

      if (postsData) setPosts(postsData)
    }

    setLoading(false)
  }

  async function submitCommission() {
    if (!description) return
    setSubmitting(true)
    setMessage(null)

    const { error } = await supabase
      .from("commissions")
      .insert({
        client_id: session.user.id,
        artist_id: artist.id,
        description,
        budget,
        deadline,
        status: "pending",
      })

    if (error) setMessage(error.message)
    else {
      setMessage("Commission request sent!")
      setShowForm(false)
      setDescription("")
      setBudget("")
      setDeadline("")
    }

    setSubmitting(false)
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>
  if (!artist) return <p className="text-center mt-10">Artist not found.</p>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-8 px-4">
        {/* Artist header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">@{artist.username}</h2>
            <p className="text-gray-500 mt-2">{artist.bio || "No bio yet."}</p>
            <span className={`inline-block mt-3 text-xs font-medium px-3 py-1 rounded-full ${
              artist.is_open_for_commissions
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {artist.is_open_for_commissions ? "Open for commissions" : "Not taking commissions"}
            </span>
          </div>

          {artist.is_open_for_commissions && session.user.id !== artist.id && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-purple-700 transition"
            >
              Commission me
            </button>
          )}
        </div>

        {/* Commission form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Send a commission request</h3>
            <div className="flex flex-col gap-4">
              <textarea
                className="border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                placeholder="Describe what you'd like commissioned..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
              />
              <input
                className="border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Budget (e.g. $50)"
                value={budget}
                onChange={e => setBudget(e.target.value)}
              />
              <input
                className="border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
              {message && (
                <p className={`text-sm ${message.includes("sent") ? "text-green-500" : "text-red-500"}`}>
                  {message}
                </p>
              )}
              <button
                onClick={submitCommission}
                disabled={submitting || !description}
                className="bg-purple-600 text-white rounded-lg p-3 font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        )}

        {/* Portfolio grid */}
        <h3 className="text-lg font-bold mb-4 text-gray-700">Portfolio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-12">
          {posts.length === 0 ? (
            <p className="text-gray-400 col-span-3">No artwork posted yet.</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800">{post.title}</h4>
                  {post.description && (
                    <p className="text-sm text-gray-500 mt-1">{post.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}