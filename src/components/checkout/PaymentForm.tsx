import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { FaPix, FaCreditCard, FaPaypal } from 'react-icons/fa';

type PaymentMethod = 'pix' | 'card' | 'paypal';

type PaymentFormProps = {
  amount: number;
  planName: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function PaymentForm({ amount, planName, onSuccess, onCancel }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Campos para cartão de crédito
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    
    // Simulação de processamento de pagamento
    setTimeout(() => {
      setIsProcessing(false);
      // Simula sucesso (em um cenário real, chamaria uma API de pagamento)
      onSuccess();
    }, 2000);
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-xl font-bold text-white">Pagamento - {planName}</h2>
        <p className="text-gray-400 mt-1">
          Total: R$ {amount.toFixed(2).replace('.', ',')}
        </p>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
        )}
        
        <div className="mb-6">
          <h3 className="text-white font-medium mb-3">Método de Pagamento</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              className={`p-3 flex flex-col items-center justify-center rounded-md transition ${
                paymentMethod === 'pix' 
                  ? 'bg-phanteon-orange/20 border border-phanteon-orange' 
                  : 'bg-phanteon-dark hover:bg-phanteon-light/80'
              }`}
              onClick={() => setPaymentMethod('pix')}
            >
              <FaPix className="w-6 h-6 text-white mb-2" />
              <span className="text-sm text-white">PIX</span>
            </button>
            
            <button
              type="button"
              className={`p-3 flex flex-col items-center justify-center rounded-md transition ${
                paymentMethod === 'card' 
                  ? 'bg-phanteon-orange/20 border border-phanteon-orange' 
                  : 'bg-phanteon-dark hover:bg-phanteon-light/80'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <FaCreditCard className="w-6 h-6 text-white mb-2" />
              <span className="text-sm text-white">Cartão</span>
            </button>
            
            <button
              type="button"
              className={`p-3 flex flex-col items-center justify-center rounded-md transition ${
                paymentMethod === 'paypal' 
                  ? 'bg-phanteon-orange/20 border border-phanteon-orange' 
                  : 'bg-phanteon-dark hover:bg-phanteon-light/80'
              }`}
              onClick={() => setPaymentMethod('paypal')}
            >
              <FaPaypal className="w-6 h-6 text-white mb-2" />
              <span className="text-sm text-white">PayPal</span>
            </button>
          </div>
        </div>
        
        {paymentMethod === 'pix' && (
          <div className="bg-phanteon-dark p-4 rounded-md text-center">
            <p className="text-white mb-4">
              Escaneie o QR Code abaixo ou copie a chave PIX:
            </p>
            <div className="bg-white p-4 rounded-md w-48 h-48 mx-auto mb-4">
              {/* Aqui seria um QR Code real */}
              <div className="bg-gray-300 w-full h-full flex items-center justify-center">
                QR Code
              </div>
            </div>
            <p className="text-gray-400 mb-2">Chave PIX:</p>
            <div className="bg-phanteon-light rounded-md p-2 flex justify-between mb-4">
              <span className="text-white">phanteongames@gmail.com</span>
              <button
                className="text-phanteon-orange text-sm"
                onClick={() => {
                  navigator.clipboard.writeText('phanteongames@gmail.com');
                  alert('Chave PIX copiada!');
                }}
              >
                Copiar
              </button>
            </div>
          </div>
        )}
        
        {paymentMethod === 'card' && (
          <form onSubmit={handlePayment}>
            <Input
              label="Número do Cartão"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              fullWidth
              className="mb-3"
            />
            
            <Input
              label="Nome no Cartão"
              placeholder="NOME SOBRENOME"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              fullWidth
              className="mb-3"
            />
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <Input
                label="Validade"
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                fullWidth
              />
              
              <Input
                label="CVC"
                placeholder="123"
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                fullWidth
              />
            </div>
          </form>
        )}
        
        {paymentMethod === 'paypal' && (
          <div className="bg-phanteon-dark p-4 rounded-md text-center">
            <p className="text-white mb-4">
              Você será redirecionado para o PayPal para finalizar o pagamento.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancelar
        </Button>
        
        <Button
          variant="primary"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loading size="sm" className="mr-2" />
              Processando...
            </>
          ) : (
            `Pagar R$ ${amount.toFixed(2).replace('.', ',')}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}