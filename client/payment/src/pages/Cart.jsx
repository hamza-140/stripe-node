import { useState } from "react";
import useCartStore from "../store/cartStore";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, User, Mail, Phone, Home } from "lucide-react";

function formatMoney(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const customer = useCartStore((s) => s.customer);
  const getTotal = useCartStore((s) => s.getTotal);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const total = getTotal();

  function onQtyChange(id, qty) {
    const q = Math.max(1, Number(qty) || 1);
    updateQty(id, q);
  }

  function proceed() {
    if (!customer.name || !customer.email) {
      setError("Please provide your name and email before proceeding.");
      return;
    }
    navigate("/checkout");
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-4xl font-bold mb-8 tracking-tight flex items-center gap-3 text-gray-800">
        <ShoppingCart size={32} className="text-indigo-600" />
        Your Cart
      </h1>

      {items.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <p className="text-gray-600 text-lg mb-4">
            Your cart is currently empty.
          </p>
          <Link to="/" className="text-indigo-600 font-medium hover:underline">
            Go back to store →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-5">
            {items.map((it) => (
              <div
                key={it.id}
                className="bg-white p-5 rounded-xl shadow flex items-center gap-5"
              >
                <img
                  src={it.image}
                  alt={it.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />

                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-lg">
                    {it.name}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    {formatMoney(it.price)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) => onQtyChange(it.id, e.target.value)}
                    className="w-20 py-2 px-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400"
                  />

                  <button
                    onClick={() => removeItem(it.id)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-8 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Customer Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 border rounded-lg p-3">
                <User size={20} className="text-gray-400" />
                <input
                  placeholder="Full name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ name: e.target.value })}
                  className="flex-1 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 border rounded-lg p-3">
                <Mail size={20} className="text-gray-400" />
                <input
                  placeholder="Email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ email: e.target.value })}
                  className="flex-1 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 border rounded-lg p-3">
                <Phone size={20} className="text-gray-400" />
                <input
                  placeholder="Phone"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ phone: e.target.value })}
                  className="flex-1 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 border rounded-lg p-3 sm:col-span-2">
                <Home size={20} className="text-gray-400" />
                <input
                  placeholder="Address"
                  value={customer.address}
                  onChange={(e) => setCustomer({ address: e.target.value })}
                  className="flex-1 outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-xl font-semibold">
                Total: {formatMoney(total)}
              </div>

              <button
                onClick={proceed}
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Proceed to Payment →
              </button>
            </div>

            {error && (
              <div className="mt-4 text-red-600 font-medium">{error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
