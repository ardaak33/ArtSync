import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"

export default function Feed({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLikes, setUserLikes] = useState(new Set())
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
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}