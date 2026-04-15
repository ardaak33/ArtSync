import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import Navbar from "../components/Navbar"

export default function Dashboard({ session }) {
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommissions()
  }, [])

  async function fetchCommissions() {
    const { data, error } = await supabase
      .from("commissions")
      .select("*, profiles!commissions_client_id_fkey(username)")
      .eq("artist_id", session.user.id)
      .order("created_at", { ascending: false })

    if (data) setCommissions(data)
    setLoading(false)
  }

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from("commissions")
      .update({ status })
      .eq("id", id)

    if (!error) fetchCommissions()
  }

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto mt-8 px-4 pb-12">
        {loading ? (
          <p className="text-gray-400 text-center">Loading...</p>
        ) : commissions.length === 0 ? (
          <p className="text-gray-400 text-center">No commission requests yet.</p>
        ) : (
          commissions.map(commission => (
            <div key={commission.id} className="bg-white rounded-2xl shadow-sm p-6 mb-4">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-gray-400">
                  From <span className="font-medium text-gray-700">@{commission.profiles?.username}</span>
                </p>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[commission.status]}`}>
                  {commission.status}
                </span>
              </div>

              <p className="text-gray-700 mb-3">{commission.description}</p>

              <div className="flex gap-4 text-sm text-gray-500 mb-4">
                {commission.budget && <span>💰 {commission.budget}</span>}
                {commission.deadline && <span>📅 {commission.deadline}</span>}
              </div>

              {commission.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateStatus(commission.id, "accepted")}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(commission.id, "declined")}
                    className="bg-red-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-500 transition"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}