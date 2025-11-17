import React, { useState } from "react";
import plans from "../data/plans";

function centsToDollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function Subscription() {
  const [selected, setSelected] = useState(plans[0]?.id || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Choose a plan</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg p-4 flex flex-col justify-between ${
              selected === plan.id ? "border-indigo-500 shadow" : ""
            }`}
          >
            <div>
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xl font-bold">
                {centsToDollars(plan.priceMonthly)}/mo
              </div>
              <div>
                <button
                  onClick={() => setSelected(plan.id)}
                  className={`px-3 py-1 rounded ${
                    selected === plan.id
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {selected === plan.id ? "Selected" : "Select"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button
          onClick={onSubscribe}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
        >
          {loading ? "Redirecting..." : "Subscribe"}
        </button>
      </div>
    </div>
  );
}

export default Subscription;
