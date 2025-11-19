import React, { useState } from "react";
import plans from "../data/plans";
import { useAuth } from "../context/AuthProvider";
function centsToDollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Subscription() {
  const [selected, setSelected] = useState(plans[0]?.id || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

  const onSubscribe = async () => {
    setError(null);
    const plan = plans.find((p) => p.id === selected);
    if (!plan) return setError("Select a plan");

    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/create-checkout-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "subscription",
            priceId: plan.priceId,
            quantity: 1,
            customer: user,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create session");

      if (data.url) {
        window.location = data.url;
      } else {
        throw new Error("No redirect URL returned");
      }
    } catch (err) {
      setError(err.message || "Subscription failed");
      setLoading(false);
    }
  };

  const onManage = async () => {
    setError(null);
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/billing-portal`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to open billing portal");

      if (data.url) {
        window.location = data.url;
      } else {
        throw new Error("No redirect URL returned");
      }
    } catch (err) {
      setError(err.message || "Could not open billing portal");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Choose Your Plan</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={`cursor-pointer rounded-2xl p-6 shadow-sm border
              transition-all duration-300 hover:shadow-lg hover:-translate-y-1
              ${
                selected === plan.id
                  ? "border-indigo-500 shadow-lg bg-indigo-50"
                  : "border-gray-200 bg-white"
              }`}
          >
            <div>
              <h2 className="text-xl font-semibold mb-1">{plan.name}</h2>
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div className="text-3xl font-bold tracking-tight">
                {centsToDollars(plan.priceMonthly)}
                <span className="text-base text-gray-600">/mo</span>
              </div>

              <div
                className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                  selected === plan.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {selected === plan.id ? "Selected" : "Select"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}

        {user?.subscription && user.subscription.status && user.subscription.status !== "free" ? (
          <>
            <button
              onClick={onManage}
              disabled={loading}
              className="px-6 py-3 bg-gray-800 text-white rounded-xl text-lg font-medium shadow hover:bg-gray-900 disabled:opacity-60 transition-all"
            >
              {loading ? "Opening..." : "Manage Subscription"}
            </button>
            <div className="mt-2 text-sm text-gray-600">You have an active subscription.</div>
          </>
        ) : (
          <button
            onClick={onSubscribe}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-lg font-medium shadow \
                       hover:bg-indigo-700 disabled:opacity-60 transition-all"
          >
            {loading ? "Redirecting..." : "Continue to Checkout"}
          </button>
        )}
      </div>
    </div>
  );
}
