import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"



export default function Feed({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}