import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useState } from "react"


export default function Navbar({ session }) {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [openToFeedback, setOpenToFeedback] = useState(false)

  async function uploadPost() {
    if (!file || !title) return
    setUploading(true)

    const fileExt = file.name.split(".").pop()
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("artwork")
      .upload(fileName, file)

    if (uploadError) {
      alert(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from("artwork")
      .getPublicUrl(fileName)

    const { error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: session.user.id,
        title,
        description,
        image_url: urlData.publicUrl,
        open_to_feedback: openToFeedback,
      })

    if (postError) alert(postError.message)
    else {
      setTitle("")
      setDescription("")
      setFile(null)
      setOpenToFeedback(false)
      setShowModal(false)
      // Optionally navigate to feed to refresh
      navigate("/feed")
    }

    setUploading(false)
  }

  return (
    <>
    <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1
        className="text-xl font-bold text-purple-600 cursor-pointer"
        onClick={() => navigate("/feed")}
      >
        ArtSync
      </h1>
      <div className="flex gap-4 items-center">
        <button
          onClick={() => navigate("/feed")}
          className="text-sm text-gray-500 hover:text-purple-600 transition"
        >
          Feed
        </button>
        <button
          onClick={() => navigate("/Commissions")}
          className="text-sm text-gray-500 hover:text-purple-600 transition"
        >
          Commissions
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition"
        >
          Upload
        </button>
        <button
          onClick={async () => {
            const { data } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", (await supabase.auth.getUser()).data.user.id)
              .single()
            if (data) navigate(`/artist/${data.username}`)
          }}
          className="text-sm text-gray-500 hover:text-purple-600 transition"
        >
          My Profile
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="text-sm text-gray-500 hover:text-purple-600 transition"
        >
          Set Profile
        </button>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-gray-400 hover:text-gray-600 transition"
        >
          Sign out
        </button>
      </div>
    </nav>

    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl shadow-md max-w-lg w-full mx-4">
          <h2 className="text-lg font-bold mb-4">Upload artwork</h2>
          <div className="flex flex-col gap-4">
            <input
              className="border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              className="border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
            <input
              type="file"
              accept="image/*"
              onChange={e => setFile(e.target.files[0])}
              className="text-sm text-gray-500"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="openToFeedback"
                checked={openToFeedback}
                onChange={e => setOpenToFeedback(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
              />
              <label htmlFor="openToFeedback" className="text-sm text-gray-700 cursor-pointer">
                Open to feedback
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={uploadPost}
                disabled={uploading || !file || !title}
                className="bg-purple-600 text-white rounded-lg p-3 font-medium hover:bg-purple-700 transition disabled:opacity-50 flex-1"
              >
                {uploading ? "Uploading..." : "Post artwork"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-700 rounded-lg p-3 font-medium hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}