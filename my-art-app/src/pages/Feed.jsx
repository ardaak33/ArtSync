import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"



export default function Feed({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLikes, setUserLikes] = useState(new Set())
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editOpenToFeedback, setEditOpenToFeedback] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchPosts()
    fetchUserLikes()
  }, [])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url)")
      .order("created_at", { ascending: false })

    if (data) {
      const postIds = data.map(post => post.id)
      const { data: likeRows } = await supabase
        .from("likes")
        .select("post_id")
        .in("post_id", postIds)

      const likeCounts = {}
      if (likeRows) {
        likeRows.forEach(like => {
          likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1
        })
      }

      setPosts(data.map(post => ({
        ...post,
        likes_count: likeCounts[post.id] || 0
      })))
    }
    setLoading(false)
  }

  async function fetchUserLikes() {
    const { data } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", session.user.id)

    if (data) {
      setUserLikes(new Set(data.map(like => like.post_id)))
    }
  }

  async function toggleLike(postId, e) {
    e.stopPropagation()
    const isLiked = userLikes.has(postId)

    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", session.user.id)
    } else {
      await supabase
        .from("likes")
        .insert({
          post_id: postId,
          user_id: session.user.id,
        })
    }

    await fetchUserLikes()
    await fetchPosts()
  }

  async function editPost() {
    if (!editingPost) return

    const { error } = await supabase
      .from("posts")
      .update({
        title: editTitle,
        description: editDescription,
        open_to_feedback: editOpenToFeedback,
      })
      .eq("id", editingPost.id)

    if (!error) {
      setShowEditModal(false)
      setEditingPost(null)
      fetchPosts()
    } else {
      alert("Failed to update post")
    }
  }

  async function deletePost(postId, e) {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this post?")) return

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)

    if (!error) {
      fetchPosts()
    } else {
      alert("Failed to delete post")
    }
  }

  function openEditModal(post) {
    setEditingPost(post)
    setEditTitle(post.title)
    setEditDescription(post.description || "")
    setEditOpenToFeedback(post.open_to_feedback)
    setShowEditModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />

      <div className="max-w-4xl mx-auto mt-8 px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-12">
        {loading ? (
          <p className="text-gray-400 col-span-3 text-center">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-400 col-span-3 text-center">No posts yet. Be the first to upload!</p>
        ) : (
          posts.map(post => (
            
            <div key={post.id} 
            className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
            onClick={() => navigate(`/post/${post.id}`)}>
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
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={(e) => toggleLike(post.id, e)}
                    className="flex items-center gap-1 text-sm hover:scale-110 transition"
                  >
                    <span className={userLikes.has(post.id) ? "text-red-500 text-lg" : "text-gray-400 text-lg"}>
                      {userLikes.has(post.id) ? "💜" : "🤍"}
                    </span>
                    <span className="text-gray-600 text-sm">{post.likes_count}</span>
                  </button>
                  {post.user_id === session.user.id && (
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(post)
                        }}
                        className="text-sm text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => deletePost(post.id, e)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-md max-w-lg w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Edit post</h2>
            <div className="flex flex-col gap-4">
              <input
                className="border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Title"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
              />
              <textarea
                className="border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                placeholder="Description (optional)"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editOpenToFeedback"
                  checked={editOpenToFeedback}
                  onChange={e => setEditOpenToFeedback(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <label htmlFor="editOpenToFeedback" className="text-sm text-gray-700 cursor-pointer">
                  Open to feedback
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={editPost}
                  disabled={!editTitle}
                  className="bg-purple-600 text-white rounded-lg p-3 font-medium hover:bg-purple-700 transition disabled:opacity-50 flex-1"
                >
                  Update post
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-300 text-gray-700 rounded-lg p-3 font-medium hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}