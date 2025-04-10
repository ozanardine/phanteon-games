"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";

interface MercadoPagoButtonProps {
  planId: string;
  planName: string;
  amount: number;
}

export function MercadoPagoButton({ planId, planName, amount }: MercadoPagoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializa o SDK do Mercado Pago
    const mpPublicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
    if (mpPublicKey) {
      initMercadoPago(mpPublicKey);
    } else {
      console.error("Chave pública do Mercado Pago não encontrada");
      setError("Configuração de pagamento indisponível");
    }
  }, []);

  const createPreference = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Em produção, esta chamada seria feita para uma rota API do Next.js
      // que por sua vez chamaria a API do Mercado Pago com as chaves secretas
      const response = await fetch("/api/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          planName,
          amount,
          payer: {
            // Idealmente estas informações viriam do perfil do usuário
            name: "Usuário",
            email: "usuario@exemplo.com",
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPreferenceId(data.id);
      } else {
        throw new Error(data.message || "Erro ao criar preferência de pagamento");
      }
    } catch (err: any) {
      console.error("Erro ao criar preferência:", err);
      setError(err.message || "Não foi possível iniciar o pagamento");
      
      // Em desenvolvimento, simulamos um preferenceId para visualização
      if (process.env.NODE_ENV === "development") {
        setPreferenceId("TEST-12345-PREFERENCE-ID");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!preferenceId) {
      await createPreference();
    }
  };

  const onError = () => {
    setError("Houve um erro no processamento do pagamento");
  };

  const onReady = () => {
    // O botão está pronto para ser renderizado
  };

  // Renderização do botão de pagamento do Mercado Pago
  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded mb-4 text-center">
          {error}
        </div>
      )}

      {!preferenceId ? (
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className={`w-full py-3 rounded-md bg-intense-orange text-white font-medium transition-colors ${
            isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-intense-orange/90"
          }`}
        >
          {isLoading ? "Processando..." : "Continuar para Pagamento"}
        </button>
      ) : (
        <div className="flex justify-center">
          <Payment
            initialization={{ preferenceId, amount }}
            onError={onError}
            onReady={onReady}
          />
        </div>
      )}
    </div>
  );
} 