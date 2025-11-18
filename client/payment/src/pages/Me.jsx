import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function Me() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Not signed in</h2>
        <p className="text-sm text-gray-600">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">My account</h2>

      <div className="space-y-2">
        <div>
          <div className="text-sm text-gray-500">Name</div>
          <div className="font-medium">{user.name || "—"}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Email</div>
          <div className="font-medium">{user.email}</div>
        </div>

        {user.created_at && (
          <div>
            <div className="text-sm text-gray-500">Joined</div>
            <div className="font-medium">{new Date(user.created_at).toLocaleString()}</div>
          </div>
        )}
        <div>
            <div className="text-sm text-gray-500">Subscription</div>
            <div className="font-medium">{user.subscription.status || "Free"}</div>
            
        </div>
      </div>

      

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
