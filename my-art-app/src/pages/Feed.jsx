import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

export default function Feed({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url)")
      .order("created_at", { ascending: false })

    if (data) setPosts(data)
    setLoading(false)
  }

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
      })

    if (postError) alert(postError.message)
    else {
      setTitle("")
      setDescription("")
      setFile(null)
      setShowForm(false)
      fetchPosts()
    }

    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-600">ArtSync</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition"
          >
            + Upload
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </nav>

      {showForm && (
        <div className="max-w-lg mx-auto mt-8 bg-white p-6 rounded-2xl shadow-md">
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
            <button
              onClick={uploadPost}
              disabled={uploading || !file || !title}
              className="bg-purple-600 text-white rounded-lg p-3 font-medium hover:bg-purple-700 transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Post artwork"}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto mt-8 px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-12">
        {loading ? (
          <p className="text-gray-400 col-span-3 text-center">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-400 col-span-3 text-center">No posts yet. Be the first to upload!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{post.title}</h3>
                <p className="text-sm text-gray-400 mt-1">@{post.profiles?.username || "unknown"}</p>
                {post.description && (
                  <p className="text-sm text-gray-600 mt-2">{post.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}