import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "../supabaseClient"
import Navbar from "../components/Navbar"

export default function Search({ session }) {
  const [searchParams] = useSearchParams()
  const [results, setResults] = useState({ users: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const searchQuery = searchParams.get("q") || ""
    setQuery(searchQuery)

    async function fetchResults() {
      const trimmed = searchQuery.trim()
      if (!trimmed) {
        setResults({ users: [], posts: [] })
        return
      }

      setLoading(true)
      const [usersResult, postsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username")
          .ilike("username", `%${trimmed}%`)
          .limit(50),
        supabase
          .from("posts")
          .select("id, title, description, image_url, user_id, user:profiles(username)")
          .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
          .limit(50),
      ])

      setResults({
        users: usersResult.error ? [] : usersResult.data || [],
        posts: postsResult.error ? [] : postsResult.data || [],
      })
      setLoading(false)
    }

    fetchResults()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />
      <div className="max-w-4xl mx-auto mt-8 px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900">Search users</h2>
          <p className="mt-2 text-sm text-gray-500">
            Search by username now. Later this page can also return artwork posts.
          </p>

          <div className="mt-6">
            <div className="mb-4 text-sm text-gray-600">Searching for: <span className="font-medium">{query || "..."}</span></div>
            {loading ? (
              <p className="text-gray-500">Loading results...</p>
            ) : !query ? (
              <p className="text-gray-500">Type a query in the search bar to find creators and artwork.</p>
            ) : results.users.length === 0 && results.posts.length === 0 ? (
              <p className="text-gray-500">No users or art posts found for "{query}".</p>
            ) : (
              <div className="space-y-6">
                {results.users.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="mb-4 text-sm font-semibold text-gray-700">Users</div>
                    <div className="grid gap-3">
                      {results.users.map(user => (
                        <button
                          key={user.id}
                          onClick={() => navigate(`/artist/${user.username}`)}
                          className="rounded-2xl border border-gray-200 p-4 text-left hover:border-purple-300 hover:bg-purple-50 transition"
                        >
                          <p className="font-medium text-gray-900">@{user.username}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {results.posts.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 p-4">
                    <div className="mb-4 text-sm font-semibold text-gray-700">Art posts</div>
                    <div className="grid gap-3">
                      {results.posts.map(post => (
                        <button
                          key={post.id}
                          onClick={() => navigate(`/post/${post.id}`)}
                          className="rounded-2xl border border-gray-200 p-4 text-left hover:border-purple-300 hover:bg-purple-50 transition"
                        >
                          <div className="font-medium text-gray-900">{post.title || "Untitled"}</div>
                          <p className="text-sm text-gray-500 truncate">{post.description || "No description"}</p>
                          {post.user?.username && <p className="mt-2 text-xs text-gray-500">By @{post.user.username}</p>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
