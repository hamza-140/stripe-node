import products from "../data/products";
import useCartStore from "../store/cartStore";
import { useState } from "react";
import toast from "react-hot-toast";
import { ShoppingCart, CheckCircle, XCircle } from "lucide-react";

export default function Store() {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const items = useCartStore((s) => s.items);

  const handleToggle = (p) => {
    const exists = items.find((it) => it.id === p.id);

    if (exists) {
      removeItem(p.id);

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}
          >
            <XCircle size={20} />
            <span className="font-medium text-sm">Removed from cart</span>
          </div>
        ),
        { duration: 2000 }
      );
    } else {
      addItem(p);

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}
          >
            <CheckCircle size={20} />
            <span className="font-medium text-sm">Added to cart</span>
          </div>
        ),
        { duration: 2000 }
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 tracking-tight text-gray-800 flex items-center gap-2">
        <ShoppingCart className="text-indigo-600" size={32} />
        Our Products
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((p) => {
          const inCart = items.find((it) => it.id === p.id);

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl shadow-sm border hover:shadow-xl transition overflow-hidden group"
            >
              <div className="h-48 bg-gray-100 overflow-hidden flex items-center justify-center">
                <img
                  src={p.image}
                  alt={p.name}
                  className="object-cover h-full w-full group-hover:scale-105 transition"
                />
              </div>

              <div className="p-5">
                <h2 className="text-lg font-semibold text-gray-800">
                  {p.name}
                </h2>

                <p className="text-sm text-gray-500 mt-1 h-10 overflow-hidden">
                  {p.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xl font-semibold text-gray-800">
                    ${(p.price / 100).toFixed(2)}
                  </div>

                  <button
                    onClick={() => handleToggle(p)}
                    className={`flex items-center hover:cursor-pointer gap-2 px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition ${
                      inCart
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {inCart ? (
                      <>
                        <XCircle size={18} />
                        Remove
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
