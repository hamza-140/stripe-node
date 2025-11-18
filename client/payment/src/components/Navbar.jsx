import { Link, NavLink, useNavigate } from "react-router-dom";
import useCartStore from "../store/cartStore";
import { ShoppingCart, Store } from "lucide-react";
import { useAuth } from "../context/AuthProvider";

export default function Navbar() {
  const itemCount = useCartStore((s) => s.itemCount());
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-bold text-gray-800 hover:text-indigo-600 transition"
        >
          <Store size={26} className="text-indigo-600" />
          MyStore
        </Link>

        <nav className="flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition ${
                isActive ? "font-semibold text-indigo-600" : ""
              }`
            }
          >
            Products
          </NavLink>

          <NavLink
            to="/subscription"
            className={({ isActive }) =>
              `flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition ${
                isActive ? "font-semibold text-indigo-600" : ""
              }`
            }
          >
            Subscription
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/me"
              className={({ isActive }) =>
                `flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition ${
                  isActive ? "font-semibold text-indigo-600" : ""
                }`
              }
            >
              Account
            </NavLink>
          )}

          <NavLink
            to="/cart"
            className="relative inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <ShoppingCart size={20} />
            <span className="ml-2">Cart</span>

            {itemCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-white text-indigo-700 rounded-full shadow">
                {itemCount}
              </span>
            )}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
