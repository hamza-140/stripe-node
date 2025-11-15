import { useState } from "react";
import useCartStore from "../store/cartStore";
import { ShoppingCart, User, CreditCard, AlertTriangle } from "lucide-react";

export default function Checkout() {
  const items = useCartStore((s) => s.items);
  const customer = useCartStore((s) => s.customer);
  const getTotal = useCartStore((s) => s.getTotal);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handlePay() {
    setError(null);

    if (!customer.name || !customer.email) {
      setError("Please enter your name and email before paying.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create checkout session.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow text-center">
        <ShoppingCart size={32} className="mx-auto mb-3 text-gray-400" />
        <h2 className="text-xl font-semibold mb-3">Your cart is empty</h2>
        <a href="/" className="text-indigo-600 hover:underline">
          Return to store →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg mt-4 mb-12">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard size={28} className="text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ShoppingCart size={20} className="text-gray-500" />
          Order Summary
        </h2>

        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
            >
              <div className="text-sm font-medium text-gray-800">
                {it.name}
                <span className="text-gray-500"> × {it.quantity}</span>
              </div>
              <div className="text-sm font-semibold text-gray-700">
                ${(it.quantity * it.price / 100).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <User size={20} className="text-gray-500" />
          Customer Information
        </h2>

        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
          <div className="font-medium text-gray-900 mb-1">{customer.name}</div>
          <div>{customer.email}</div>

          {customer.phone && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="text-lg font-semibold text-gray-800">Total</div>
        <div className="text-2xl font-bold text-gray-900">
          ${(getTotal() / 100).toFixed(2)}
        </div>
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg text-lg font-medium shadow hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Pay with Card"}
      </button>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}
    </div>
  );
}
