import { XCircle, ArrowLeft } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Cancel() {
  const [allowShow, setAllowShow] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function verify() {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      if (!sessionId) {
        navigate("/", { replace: true });
        return;
      }

      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/verify-session?session_id=${sessionId}`
        );
        const data = await res.json();

        if (!data.session) {
          navigate("/", { replace: true });
          return;
        }

        if (data.valid) {
          navigate(`/success?session_id=${sessionId}`, { replace: true });
          return;
        }

        setAllowShow(true);
      } catch (err) {
        navigate("/", { replace: true });
      }

      setLoading(false);
    }

    verify();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-20 text-gray-600 text-lg">
        Checking payment status...
      </div>
    );
  }

  if (!allowShow) return null;

  return (
    <div className="max-w-lg mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 text-center">
      <div className="flex justify-center mb-6">
        <XCircle size={60} className="text-red-600" />
      </div>

      <h1 className="text-3xl font-bold mb-3 text-gray-900">
        Payment Canceled
      </h1>

      <p className="text-gray-600 text-md mb-6 leading-relaxed">
        Your payment was canceled or failed. You can return to the store and try
        again at any time.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-gray-800 transition"
      >
        <ArrowLeft size={20} />
        Back to Store
      </Link>
    </div>
  );
}
