import Container from "./Container";
import Button from "./Button";

export default function Hero() {
  return (
    <section className="relative">
      <img
        src="/images/maude_michel.jpg"
        alt="Danseurs SCX"
        className="w-full h-[68vh] object-cover md:h-[75vh]"
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 flex items-end">
        <div className="w-full bg-scx-primary text-white px-4 py-6 md:py-8">
          <Container>
            <h1 className="font-extrabold leading-tight text-[34px] md:text-[52px]">
              COURS
              <br className="hidden md:block" /> DE
              <br className="hidden md:block" /> GROUPE
            </h1>
            <p className="mt-3 max-w-[36ch] font-medium text-[15px]">
              Chez Swing ConneXion, nos cours de groupes sont structurés pour
              permettre à n’importe qui d’apprendre facilement les danses swing.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                href="https://swingconnexion.square.site/shop/classes-session-novembre-2025/ERQ2J5PWONLPD6EWYBAUS7JI"
                variant="primary"
              >
                Réserver un cours
              </Button>
              <Button href="https://swingconnexion.square.site/shop/billets-show-20e-anniversaire/RZKZGYZIMSAODGZPP3WN32ER">
                Acheter des billets
              </Button>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
