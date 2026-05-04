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
  const [searchText, setSearchText] = useState("")
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] })
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  async function fetchSearchResults(query) {
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchResults({ users: [], posts: [] })
      setShowSearchDropdown(false)
      return
    }

    const [usersResult, postsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", `%${trimmed}%`)
        .limit(4),
      supabase
        .from("posts")
        .select("id, title, description, image_url, user_id, user:profiles(username)")
        .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
        .limit(4),
    ])

    const users = usersResult.error ? [] : usersResult.data || []
    const posts = postsResult.error ? [] : postsResult.data || []

    setSearchResults({ users, posts })
    setShowSearchDropdown(true)
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    const query = searchText.trim()
    if (!query) return
    setShowSearchDropdown(false)
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  function handleSelectUser(user) {
    setSearchText("")
    setSearchResults([])
    setShowSearchDropdown(false)
    navigate(`/artist/${user.username}`)
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
    <nav className="bg-white shadow-sm px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-1 flex-col md:flex-row md:items-center gap-4">
        <h1
          className="text-xl font-bold text-purple-600 cursor-pointer"
          onClick={() => navigate("/feed")}
        >
          ArtSync
        </h1>
        <div className="relative w-full max-w-sm">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </div>
              <input
                value={searchText}
                onChange={e => {
                  setSearchText(e.target.value)
                  fetchSearchResults(e.target.value)
                }}
                onFocus={() => {
                  if (searchResults.users.length || searchResults.posts.length) setShowSearchDropdown(true)
                }}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 150)}
                className="w-full border rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Search users or artwork..."
              />
            </div>
          </form>
          {showSearchDropdown && (searchResults.users.length > 0 || searchResults.posts.length > 0) && (
            <div className="absolute z-50 mt-2 w-full rounded-2xl border bg-white shadow-lg">
              {searchResults.users.length > 0 && (
                <div className="border-b border-gray-100 px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-gray-500">Users</div>
                  {searchResults.users.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onMouseDown={() => handleSelectUser(user)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50"
                    >
                      @{user.username}
                    </button>
                  ))}
                </div>
              )}
              {searchResults.posts.length > 0 && (
                <div className="px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-gray-500">Art posts</div>
                  {searchResults.posts.map(post => (
                    <button
                      key={post.id}
                      type="button"
                      onMouseDown={() => navigate(`/post/${post.id}`)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50"
                    >
                      <div className="font-medium">{post.title || "Untitled"}</div>
                      <p className="text-xs text-gray-500 truncate">{post.description || "No description"}</p>
                    </button>
                  ))}
                </div>
              )}
              <div className="px-4 py-2 text-xs text-gray-500">Search matches users by username and art posts by title or description.</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4 items-center flex-wrap">
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