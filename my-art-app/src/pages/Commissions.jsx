import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function Commissions({ session }) {
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesByCommission, setMessagesByCommission] = useState({})
  const [drafts, setDrafts] = useState({})
  const [openChats, setOpenChats] = useState(new Set())
  const [tab, setTab] = useState("received")
  const navigate = useNavigate()

  useEffect(() => {
    fetchCommissions()
  }, [])

  async function fetchCommissions() {
    const { data, error } = await supabase
      .from("commissions")
      .select(
        "*, client:profiles!commissions_client_id_fkey(username), artist:profiles!commissions_artist_id_fkey(username)"
      )
      .or(`artist_id.eq.${session.user.id},client_id.eq.${session.user.id}`)
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

  async function fetchMessages(commissionId) {
    if (messagesByCommission[commissionId]) return

    const { data, error } = await supabase
      .from("commission_messages")
      .select("*")
      .eq("commission_id", commissionId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Failed to load commission messages:", error)
      return
    }

    if (data) {
      setMessagesByCommission(prev => ({ ...prev, [commissionId]: data }))
    }
  }

  async function sendMessage(commissionId) {
    const content = drafts[commissionId]?.trim()
    if (!content) return

    const { data, error } = await supabase
      .from("commission_messages")
      .insert({ commission_id: commissionId, sender_id: session.user.id, content })
      .select("*")
      .single()

    if (error) {
      console.error("Failed to send commission message:", error)
      return
    }

    if (data) {
      setMessagesByCommission(prev => ({
        ...prev,
        [commissionId]: [...(prev[commissionId] || []), data],
      }))
      setDrafts(prev => ({ ...prev, [commissionId]: "" }))
    }
  }

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    declined: "bg-red-100 text-red-700",
  }

  const received = commissions.filter(c => c.artist_id === session.user.id)
  const sent = commissions.filter(c => c.client_id === session.user.id)
  const active = tab === "received" ? received : sent

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />
      <div className="max-w-4xl mx-auto mt-8 px-4 pb-12">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setTab("received")}
            className={`flex-1 py-3 rounded-2xl font-medium transition ${
              tab === "received" ? "bg-purple-600 text-white" : "bg-white text-gray-700 shadow-sm"
            }`}
          >
            Commissions Received
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`flex-1 py-3 rounded-2xl font-medium transition ${
              tab === "sent" ? "bg-purple-600 text-white" : "bg-white text-gray-700 shadow-sm"
            }`}
          >
            Commissions Sent
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center">Loading...</p>
        ) : active.length === 0 ? (
          <p className="text-gray-400 text-center">No {tab === "received" ? "received" : "sent"} commissions yet.</p>
        ) : (
          active.map(commission => {
            const isArtist = commission.artist_id === session.user.id
            const partner = isArtist ? commission.client : commission.artist
            const chatOpen = openChats.has(commission.id)
            const showChat = commission.status === "accepted"

            return (
              <div key={commission.id} className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-400">
                      {isArtist ? "From" : "To"}{" "}
                      <span
                        className="font-medium text-purple-700 cursor-pointer hover:underline"
                        onClick={() => navigate(`/artist/${partner?.username}`)}
                      >
                        @{partner?.username}
                      </span>
                    </p>
                    <p className="text-gray-700 mt-3">{commission.description}</p>
                  </div>

                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[commission.status]}`}>
                    {commission.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  {commission.budget && <span>💰 {commission.budget}</span>}
                  {commission.deadline && <span>📅 {commission.deadline}</span>}
                </div>

                {isArtist && commission.status === "pending" && (
                  <div className="flex gap-3 mb-4">
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

                {showChat && (
                  <div className="border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-gray-800">Commission chat</p>
                      <button
                        onClick={() => {
                          const next = new Set(openChats)
                          if (next.has(commission.id)) next.delete(commission.id)
                          else {
                            next.add(commission.id)
                            fetchMessages(commission.id)
                          }
                          setOpenChats(next)
                        }}
                        className="text-sm text-purple-600 hover:underline"
                      >
                        {chatOpen ? "Hide chat" : "Open chat"}
                      </button>
                    </div>

                    {chatOpen && (
                      <>
                        <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                          {(messagesByCommission[commission.id] || []).length === 0 ? (
                            <p className="text-gray-400 text-sm">No messages yet. Start the conversation.</p>
                          ) : (
                            (messagesByCommission[commission.id] || []).map(message => {
                              const senderName = message.sender_id === session.user.id ? "you" : partner?.username || "them"
                              return (
                                <div key={message.id} className="rounded-2xl p-3 bg-gray-50">
                                  <p className="text-xs text-gray-500">
                                    @{senderName} • {new Date(message.created_at).toLocaleString()}
                                  </p>
                                  <p className="text-gray-700 mt-1">{message.content}</p>
                                </div>
                              )
                            })
                          )}
                        </div>

                        <div className="flex gap-3">
                          <input
                            value={drafts[commission.id] || ""}
                            onChange={e => setDrafts(prev => ({ ...prev, [commission.id]: e.target.value }))}
                            className="flex-1 border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                            placeholder="Send a message about this commission..."
                            onKeyDown={e => {
                              if (e.key === "Enter") sendMessage(commission.id)
                            }}
                          />
                          <button
                            onClick={() => sendMessage(commission.id)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition"
                          >
                            Send
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
