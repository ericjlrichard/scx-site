import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import Footer from "../components/Footer";
import Container from "../components/Container";
import Spinner from "../components/Spinner";

const API = "https://api.swingconnexion.ca/public";

export default function PaymentThanks() {
  const { lang } = useParams();
  const [searchParams] = useSearchParams();
  const locale = (lang || "fr").startsWith("en") ? "en" : "fr";

  const [status, setStatus] = useState("loading"); // loading | success | error | already_paid
  const [error, setError] = useState(null);

  useEffect(() => {
    const transactionId = searchParams.get("transactionId");
    const ref = searchParams.get("ref") || searchParams.get("referenceId");
    const sig = searchParams.get("sig");

    if (!ref || !sig) {
      setError(locale === "fr" ? "Informations de paiement manquantes." : "Missing payment information.");
      setStatus("error");
      return;
    }

    const invoiceNumbers = ref.split(",").map((s) => s.trim()).filter(Boolean);

    fetch(`${API}/payment-received`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, invoiceNumbers, sig }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
        } else if (data.error?.includes("not yet completed")) {
          setStatus("error");
          setError(locale === "fr"
            ? "Le paiement n'a pas encore été confirmé par Square. Veuillez patienter quelques instants."
            : "Payment has not yet been confirmed by Square. Please wait a moment.");
        } else {
          setStatus("error");
          setError(data.error || (locale === "fr" ? "Une erreur est survenue." : "An error occurred."));
        }
      })
      .catch(() => {
        setStatus("error");
        setError(locale === "fr" ? "Erreur de connexion au serveur." : "Server connection error.");
      });
  }, []);

  return (
    <>
      <title>Payment Confirmed — Swing ConneXion</title>
      <meta name="robots" content="noindex,nofollow" />
      <PageHero
        className="-mt-25"
        imageSrc="/images/katya_zack.jpg"
        imageAlt="SCX dancers"
        bandColorVar="var(--color-scx-secondary)"
        titleLines={locale === "fr" ? ["PAIEMENT"] : ["PAYMENT"]}
      />
      <section className="bg-scx-secondary text-white">
        <Container>
          <div className="py-20 max-w-lg mx-auto text-center">
            {status === "loading" && (
              <>
                <Spinner size={40} className="mx-auto mb-6" />
                <p className="text-white/70">
                  {locale === "fr" ? "Confirmation du paiement en cours…" : "Confirming your payment…"}
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="text-6xl mb-5">✅</div>
                <h2 className="text-2xl font-bold mb-3">
                  {locale === "fr" ? "Paiement reçu !" : "Payment received!"}
                </h2>
                <p className="text-white/70 mb-6">
                  {locale === "fr"
                    ? "Votre paiement a bien été enregistré. Un reçu vous a été envoyé par courriel."
                    : "Your payment has been recorded. A receipt has been sent to your email."}
                </p>
                <a
                  href="https://dome.swingconnexion.com/my-invoices"
                  className="text-sm text-[var(--color-scx-primary)] hover:underline"
                >
                  {locale === "fr" ? "Voir mes factures sur Dome →" : "View my invoices on Dome →"}
                </a>
              </>
            )}

            {status === "error" && (
              <>
                <div className="text-6xl mb-5">⚠️</div>
                <h2 className="text-2xl font-bold mb-3">
                  {locale === "fr" ? "Un problème est survenu" : "Something went wrong"}
                </h2>
                <p className="text-white/60 mb-6 text-sm">{error}</p>
                <p className="text-white/50 text-sm">
                  {locale === "fr"
                    ? "Si vous avez été chargé·e, contactez-nous à "
                    : "If you were charged, please contact us at "}
                  <a href="mailto:info@swingconnexion.com" className="text-white hover:underline">
                    info@swingconnexion.com
                  </a>
                </p>
              </>
            )}
          </div>
        </Container>
      </section>
      <Footer />
    </>
  );
}
