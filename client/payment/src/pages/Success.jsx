import { useEffect, useState } from "react";
import { CheckCircle, ShoppingBag, FileDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useCartStore from "../store/cartStore";
import jsPDF from "jspdf";
import confetti from "canvas-confetti";

export default function Success() {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const navigate = useNavigate();

  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    async function verify() {
      const id = new URLSearchParams(window.location.search).get("session_id");
      if (!id) return navigate("/");

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/verify-session?session_id=${id}`
        );
        const data = await res.json();

        if (!data.valid) return navigate("/");

        setSessionData(data.session);
        clearCart();

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.4 },
        });
      } catch (err) {
        navigate("/");
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, []);

  function downloadInvoice() {
    const doc = new jsPDF();
    let y = 20;

    // ----------------- CONFIG -----------------
    const LOGO_URL = "https://images.unsplash.com/photo-1630040995437-80b01c5dd52d?fm=jpg";
    const COMPANY_NAME = "MyStore";
    const COMPANY_TAGLINE = "Premium Products. Exceptional Service.";
    const COMPANY_WEBSITE = "";

    const formatCurrency = (amount, currency) =>
      (amount / 100).toLocaleString("en-US", {
        style: "currency",
        currency: currency || "USD",
      });

    // ----------------- HEADER BAR -----------------
    doc.setFillColor(30, 41, 59); // dark blue/grey
    doc.rect(0, 0, 220, 40, "F");

    doc.addImage(LOGO_URL, "JPEG", 14, 8, 16, 16);

    // Company name & tagline
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255);
    doc.text(COMPANY_NAME, 33, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(COMPANY_TAGLINE, 33, 24);

    y = 50;

    // ----------------- TITLE -----------------
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Order Receipt", 14, y);
    y += 10;

    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 12;

    // ----------------- ORDER & CUSTOMER DETAILS -----------------
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    doc.text(`Email: ${sessionData.customer_email || "N/A"}`, 14, y);
    y += 6;

    if (sessionData.metadata?.customer_name) {
      doc.text(`Customer: ${sessionData.metadata.customer_name}`, 14, y);
      y += 6;
    }

    if (sessionData.metadata?.customer_phone) {
      doc.text(`Phone: ${sessionData.metadata.customer_phone}`, 14, y);
      y += 6;
    }

    if (sessionData.id) {
      y += 2;
      doc.text(`Receipt ID: ${sessionData.id}`, 14, y);
    }

    y += 8;
    doc.line(14, y, 196, y);
    y += 12;

    // ----------------- ITEMS SECTION -----------------
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Purchased Items", 14, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    doc.text("Description", 14, y);
    doc.text("Qty", 150, y);
    doc.text("Price", 180, y, { align: "right" });
    y += 6;

    doc.setDrawColor(220);
    doc.line(14, y, 196, y);
    y += 8;

    sessionData.line_items.forEach((li) => {
      doc.text(li.description, 14, y);
      doc.text(`${li.quantity}`, 150, y);
      doc.text(formatCurrency(li.amount_total, sessionData.currency), 180, y, {
        align: "right",
      });
      y += 8;
    });

    y += 6;
    doc.line(14, y, 196, y);
    y += 12;

    // ----------------- TOTAL -----------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    doc.text("Total", 14, y);
    doc.text(
      formatCurrency(sessionData.amount_total, sessionData.currency),
      180,
      y,
      { align: "right" }
    );

    y += 20;

    // ----------------- FOOTER -----------------
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);

    doc.text("Thank you for your order!", 14, y);
    y += 5;
    doc.text("For support, please contact us anytime.", 14, y);
    y += 5;
    doc.text(COMPANY_WEBSITE, 14, y);

    // Save
    doc.save("receipt.pdf");
  }

  // LOADING
  if (loading) {
    return (
      <div className="text-center mt-20 text-gray-600 text-lg">
        Verifying payment...
      </div>
    );
  }

  if (!sessionData) return null;

  const { customer_email, metadata, amount_total, currency, line_items } =
    sessionData;

  return (
    <div className="max-w-lg mx-auto bg-white p-10 rounded-2xl shadow-lg mt-12 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle size={60} className="text-green-600" />
      </div>

      <h1 className="text-3xl font-bold mb-3 text-gray-900">
        Payment Successful!
      </h1>

      <p className="text-gray-600 text-md mb-8">
        Thank you for your purchase. Below is your order summary:
      </p>

      <div className="bg-gray-50 p-5 rounded-lg mb-8 border text-left">
        <h2 className="font-semibold text-gray-700 mb-4 text-lg">
          Order Summary
        </h2>

        <div className="space-y-3">
          {line_items.map((li) => (
            <div key={li.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {li.description} × {li.quantity}
              </span>
              <span className="font-medium">
                ${(li.amount_total / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>
            {(amount_total / 100).toLocaleString("en-US", {
              style: "currency",
              currency,
            })}
          </span>
        </div>

        <div className="text-sm text-gray-500 mt-3">
          Sent to: {customer_email}
        </div>
      </div>

      <button
        onClick={downloadInvoice}
        className="inline-flex items-center gap-2 text-indigo-600 font-medium mb-6 hover:underline"
      >
        <FileDown size={18} />
        Download Invoice (PDF)
      </button>

      <br />

      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-indigo-700 transition"
      >
        <ShoppingBag size={20} />
        Continue Shopping
      </Link>
    </div>
  );
}
