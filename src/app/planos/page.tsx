"use client";

import { useState } from "react";
import { FaCrown, FaCheckCircle, FaTimesCircle, FaCreditCard } from "react-icons/fa";
import Link from "next/link";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: PlanFeature[];
  popular?: boolean;
}

export default function PlanosPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
    email: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plans: Plan[] = [
    {
      id: "bronze",
      name: "Bronze",
      price: 19.90,
      duration: "mensal",
      features: [
        { name: "Kit inicial básico", included: true },
        { name: "Limite de homes: 1", included: true },
        { name: "Comandos básicos", included: true },
        { name: "TP a cada 5 minutos", included: true },
        { name: "Acesso à loja VIP", included: false },
        { name: "Kit PVP avançado", included: false },
        { name: "Prioridade na fila", included: false },
      ],
    },
    {
      id: "prata",
      name: "Prata",
      price: 39.90,
      duration: "mensal",
      popular: true,
      features: [
        { name: "Kit inicial avançado", included: true },
        { name: "Limite de homes: 3", included: true },
        { name: "Comandos avançados", included: true },
        { name: "TP a cada 2 minutos", included: true },
        { name: "Acesso à loja VIP", included: true },
        { name: "Kit PVP avançado", included: true },
        { name: "Prioridade na fila", included: false },
      ],
    },
    {
      id: "ouro",
      name: "Ouro",
      price: 69.90,
      duration: "mensal",
      features: [
        { name: "Kit inicial completo", included: true },
        { name: "Limite de homes: 5", included: true },
        { name: "Todos os comandos VIP", included: true },
        { name: "TP instantâneo", included: true },
        { name: "Acesso à loja VIP+", included: true },
        { name: "Kit PVP Elite", included: true },
        { name: "Prioridade máxima na fila", included: true },
      ],
    },
  ];

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    
    // Rolagem suave até a seção de pagamento
    const paymentSection = document.getElementById("payment-section");
    if (paymentSection) {
      paymentSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    
    // Simulação de processamento de pagamento
    setTimeout(() => {
      // Em produção, você faria uma chamada API para o Mercado Pago aqui
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 2000);
  };

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Planos <span className="text-intense-orange">VIP</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Eleve sua experiência nos servidores Phanter Ops com benefícios exclusivos, kits especiais e muito mais!
        </p>
      </div>

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-lg p-6 shadow-lg transition-transform hover:scale-105 ${
              plan.popular
                ? "bg-olive-green border-2 border-intense-orange"
                : "bg-military-green"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-intense-orange text-white px-4 py-1 rounded-full text-sm font-bold">
                Mais Popular
              </div>
            )}
            
            <div className="text-center mb-6">
              <FaCrown className={`mx-auto text-4xl mb-2 ${plan.popular ? "text-intense-orange" : "text-gray-400"}`} />
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                <span className="text-gray-300 ml-1">/{plan.duration}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  {feature.included ? (
                    <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <FaTimesCircle className="text-gray-500 mr-2 flex-shrink-0" />
                  )}
                  <span className={feature.included ? "text-white" : "text-gray-400"}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan)}
              className={`w-full py-3 rounded-md font-medium transition-colors ${
                plan.popular
                  ? "bg-intense-orange hover:bg-intense-orange/90 text-white"
                  : "bg-olive-green hover:bg-olive-green/90 text-white"
              }`}
            >
              Escolher Plano
            </button>
          </div>
        ))}
      </div>

      {/* Seção de Pagamento */}
      {selectedPlan && !paymentSuccess && (
        <div id="payment-section" className="mt-16 bg-military-green p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Finalizar assinatura - Plano {selectedPlan.name}
          </h2>
          
          <div className="max-w-lg mx-auto">
            <div className="bg-dark-green-black p-4 rounded-lg mb-8">
              <div className="flex justify-between mb-4">
                <span>Plano {selectedPlan.name}</span>
                <span>R$ {selectedPlan.price.toFixed(2)}</span>
              </div>
              <div className="border-t border-olive-green pt-4 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-intense-orange">R$ {selectedPlan.price.toFixed(2)}</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmitPayment} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded bg-dark-green-black border border-olive-green text-white"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Nome no Cartão</label>
                  <input
                    type="text"
                    name="cardName"
                    required
                    value={formData.cardName}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded bg-dark-green-black border border-olive-green text-white"
                    placeholder="Nome completo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Número do Cartão</label>
                  <input
                    type="text"
                    name="cardNumber"
                    required
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded bg-dark-green-black border border-olive-green text-white"
                    placeholder="0000 0000 0000 0000"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Validade</label>
                    <input
                      type="text"
                      name="expiry"
                      required
                      value={formData.expiry}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-dark-green-black border border-olive-green text-white"
                      placeholder="MM/AA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      required
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-dark-green-black border border-olive-green text-white"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-3 rounded-md bg-intense-orange text-white font-medium flex items-center justify-center ${
                  isProcessing ? "opacity-70 cursor-not-allowed" : "hover:bg-intense-orange/90"
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    <FaCreditCard className="mr-2" /> Finalizar Pagamento
                  </>
                )}
              </button>
              
              <div className="text-sm text-gray-400 text-center">
                <p>Ao assinar, você concorda com nossos Termos de Serviço e Política de Privacidade.</p>
                <p className="mt-2">Seus dados de pagamento são processados de forma segura.</p>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Confirmação de Pagamento */}
      {paymentSuccess && (
        <div className="mt-16 bg-military-green p-8 rounded-lg text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Pagamento Concluído!</h2>
          <p className="text-gray-300 mb-6">
            Obrigado por assinar o plano {selectedPlan?.name}. Seus benefícios VIP já estão ativos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/perfil" className="py-2 px-4 bg-olive-green hover:bg-olive-green/90 text-white rounded-md">
              Ver meu perfil
            </Link>
            <Link href="/servidores" className="py-2 px-4 bg-intense-orange hover:bg-intense-orange/90 text-white rounded-md">
              Ir para os servidores
            </Link>
          </div>
        </div>
      )}
      
      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Perguntas Frequentes
        </h2>
        
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="bg-military-green p-5 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Como funciona a renovação?</h3>
            <p className="text-gray-300">
              As assinaturas são renovadas automaticamente ao final do período. Você pode cancelar a qualquer momento pela área do cliente.
            </p>
          </div>
          
          <div className="bg-military-green p-5 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Posso mudar de plano?</h3>
            <p className="text-gray-300">
              Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. A diferença será calculada proporcionalmente ao tempo restante.
            </p>
          </div>
          
          <div className="bg-military-green p-5 rounded-lg">
            <h3 className="font-bold text-lg mb-2">O que acontece se eu cancelar?</h3>
            <p className="text-gray-300">
              Ao cancelar, você continuará com os benefícios até o final do período já pago. Após esse período, sua conta voltará para o status normal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 