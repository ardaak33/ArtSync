import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"


export default function Navbar() {
  const navigate = useNavigate()

  return (
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
  )
}