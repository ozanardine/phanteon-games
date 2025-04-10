import Image from 'next/image';
import Link from 'next/link';
import ServerStatus from '@/components/server-status';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-[500px] rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-dark-green-black to-transparent z-10" />
        <Image
          src="/images/hero-bg.jpg"
          alt="Phanter Ops Hero"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-intense-orange">Phanter</span> Ops
          </h1>
          <p className="text-xl md:text-2xl max-w-xl mb-8">
            Eleve sua experiência em servidores de jogos com nossos planos VIP exclusivos
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/registro" className="btn-primary">
              Criar Perfil
            </Link>
            <Link href="/servidores" className="btn-secondary">
              Nossos Servidores
            </Link>
          </div>
        </div>
      </section>

      {/* Server Status Section */}
      <section className="py-8">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Status dos <span className="text-intense-orange">Servidores</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <ServerStatus gameType="rust" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 bg-military-green/30 -mx-4 px-4 rounded-lg">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Por que escolher a <span className="text-intense-orange">Phanter Ops</span>?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-military-green p-6 rounded-lg">
            <div className="h-14 w-14 bg-olive-green rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Segurança</h3>
            <p>Servidores com proteção contra cheaters e sistema anti-DDos avançado.</p>
          </div>
          <div className="bg-military-green p-6 rounded-lg">
            <div className="h-14 w-14 bg-olive-green rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Alto Desempenho</h3>
            <p>Hardware de ponta garantindo baixo ping e jogabilidade sem travamentos.</p>
          </div>
          <div className="bg-military-green p-6 rounded-lg">
            <div className="h-14 w-14 bg-olive-green rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Benefícios VIP</h3>
            <p>Acesso a itens exclusivos, comandos especiais e suporte prioritário.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Pronto para dominar os servidores?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Assine agora um de nossos planos VIP e aproveite todos os benefícios exclusivos.
        </p>
        <Link href="/planos" className="btn-primary text-lg py-3 px-8">
          Ver Planos VIP
        </Link>
      </section>
    </div>
  );
} 