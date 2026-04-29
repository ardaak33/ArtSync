import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import Navbar from "../components/Navbar"

export default function PostDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [feedback, setFeedback] = useState([])
  const [content, setContent] = useState("")
  const [feedbackContent, setFeedbackContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)

  useEffect(() => {
    fetchPost()
    fetchComments()
    fetchFeedback()
    fetchLikeStatus()
    fetchLikesCount()
  }, [id])

  async function fetchPost() {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles(username)")
      .eq("id", id)
      .single()

    if (data) {
      setPost(data)
    }
    setLoading(false)
  }

  async function fetchComments() {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(username)")
      .eq("post_id", id)
      .eq("type", "comment")
      .order("created_at", { ascending: true })

    if (data) setComments(data)
  }

  async function fetchFeedback() {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(username)")
      .eq("post_id", id)
      .eq("type", "feedback")
      .order("created_at", { ascending: true })

    if (data) setFeedback(data)
  }

  async function fetchLikeStatus() {
    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", session.user.id)

    setIsLiked(data && data.length > 0)
  }

  async function fetchLikesCount() {
    const { count } = await supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", id)

    setLikesCount(count || 0)
  }

  async function toggleLike() {
    if (isLiked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", id)
        .eq("user_id", session.user.id)
      setIsLiked(false)
    } else {
      await supabase
        .from("likes")
        .insert({
          post_id: id,
          user_id: session.user.id,
        })
      setIsLiked(true)
    }

    await fetchLikesCount()
  }

  async function submitComment() {
    if (!content) return
    setSubmitting(true)

    const { error } = await supabase
      .from("comments")
      .insert({
        post_id: id,
        user_id: session.user.id,
        content,
        type: "comment",
      })

    if (!error) {
      setContent("")
      fetchComments()
    }

    setSubmitting(false)
  }

  async function submitFeedback() {
    if (!feedbackContent) return
    setFeedbackSubmitting(true)

    const { error } = await supabase
      .from("comments")
      .insert({
        post_id: id,
        user_id: session.user.id,
        content: feedbackContent,
        type: "feedback",
      })

    if (!error) {
      setFeedbackContent("")
      fetchFeedback()
    }

    setFeedbackSubmitting(false)
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>
  if (!post) return <p className="text-center mt-10">Post not found.</p>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />

      <div className="max-w-3xl mx-auto mt-8 px-4 pb-12">
        {/* Post */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full object-cover max-h-96"
          />
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800">{post.title}</h2>
            <p
              className="text-sm text-purple-500 mt-1 cursor-pointer hover:underline"
              onClick={() => navigate(`/artist/${post.profiles?.username}`)}
            >
              @{post.profiles?.username}
            </p>
            {post.description && (
              <p className="text-gray-600 mt-3">{post.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={toggleLike}
                className="flex items-center gap-2 hover:scale-110 transition"
              >
                <span className={isLiked ? "text-red-500 text-2xl" : "text-gray-400 text-2xl"}>
                  {isLiked ? "❤️" : "🤍"}
                </span>
                <span className="text-gray-600 font-medium">{likesCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Comments</h3>

          <div className="flex flex-col gap-4 mb-6">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-sm">No comments yet. Be the first!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-600 cursor-pointer hover:underline" 
                    onClick={() => navigate(`/artist/${comment.profiles?.username}`)}>
                      @{comment.profiles?.username}
                    </p>
                    <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment input */}
          <div className="flex gap-3">
            <input
              className="flex-1 border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Leave a comment..."
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitComment()}
            />
            <button
              onClick={submitComment}
              disabled={submitting || !content}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50"
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        </div>

        {/* Feedback Section */}
        {post.open_to_feedback && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Feedback</h3>

            <div className="flex flex-col gap-4 mb-6">
              {feedback.length === 0 ? (
                <p className="text-gray-400 text-sm">No feedback yet. Be the first to share your thoughts!</p>
              ) : (
                feedback.map(fb => (
                  <div key={fb.id} className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-600 cursor-pointer hover:underline" 
                      onClick={() => navigate(`/artist/${fb.profiles?.username}`)}>
                        @{fb.profiles?.username}
                      </p>
                      <p className="text-gray-700 text-sm mt-1">{fb.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Feedback input */}
            <div className="flex gap-3">
              <input
                className="flex-1 border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Share your feedback..."
                value={feedbackContent}
                onChange={e => setFeedbackContent(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitFeedback()}
              />
              <button
                onClick={submitFeedback}
                disabled={feedbackSubmitting || !feedbackContent}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50"
              >
                {feedbackSubmitting ? "..." : "Post"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}