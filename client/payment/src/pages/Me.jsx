import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import plans from "../data/plans";
import { useState } from "react";

export default function Me() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const openBillingPortal = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/billing-portal`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open billing portal");
      if (data.url) window.location = data.url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Not signed in</h2>
        <p className="text-sm text-gray-600">Please sign in to view your profile.</p>
      </div>
    );
  }

  const subscription = user.subscription || { status: "free" };
  const plan = plans.find((p) => p.priceId === subscription.plan_id) || null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid md:grid-cols-3 gap-6 p-6 items-start">
          {/* Profile */}
          <div className="md:col-span-1 flex items-center gap-4">
            <div className="flex-none">
              <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold">{user.name || "—"}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              {user.created_at && (
                <div className="text-sm text-gray-400 mt-2">Joined {new Date(user.created_at).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          {/* Account details */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">Account</h3>
                <p className="text-sm text-gray-500">Manage your account and billing information.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Sign out
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Subscription</div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-lg font-medium">{plan ? plan.name : subscription.status === 'free' ? 'Free' : subscription.plan_id || subscription.status}</div>
                    {subscription.status && subscription.status !== 'free' && (
                      <div className="text-sm px-2 py-0.5 rounded-full bg-green-100 text-green-800">{subscription.status}</div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {subscription.current_period_end ? (
                    <div className="text-sm text-gray-500">Next billing: <span className="font-medium">{new Date(subscription.current_period_end).toLocaleDateString()}</span></div>
                  ) : (
                    <div className="text-sm text-gray-500">Billing: <span className="font-medium">—</span></div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                {subscription.status && subscription.status !== 'free' ? (
                  <button
                    onClick={openBillingPortal}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-60"
                  >
                    {loading ? 'Opening...' : 'Manage subscription'}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/subscription')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Choose a plan
                  </button>
                )}

                <button
                  onClick={() => navigate('/me')}
                  className="px-4 py-2 border rounded text-sm text-gray-700"
                >
                  Account settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
