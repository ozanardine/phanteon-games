import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VipPlan } from '@/types/database.types';
import { FiCheck } from 'react-icons/fi';
import Link from 'next/link';

type VipPlanCardProps = {
  plan: VipPlan;
  isPopular?: boolean;
  isAuthenticated: boolean;
  onSelectPlan?: (plan: VipPlan) => void;
};

export function VipPlanCard({ 
  plan, 
  isPopular = false, 
  isAuthenticated,
  onSelectPlan 
}: VipPlanCardProps) {
  const features = Array.isArray(plan.features) 
    ? plan.features 
    : typeof plan.features === 'string' 
      ? JSON.parse(plan.features)
      : [];
  
  const handleSelect = () => {
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };
  
  return (
    <Card className={`flex flex-col h-full ${isPopular ? 'border-phanteon-orange' : ''}`}>
      {isPopular && (
        <div className="bg-phanteon-orange text-white text-center py-1 text-sm font-medium">
          MAIS POPULAR
        </div>
      )}
      
      <CardHeader className={`rounded-t-lg ${isPopular ? 'bg-gradient-to-br from-phanteon-orange/20 to-phanteon-gray' : 'bg-phanteon-gray'}`}>
        <h2 className="text-xl font-bold text-white">{plan.name}</h2>
        <div className="mt-4">
          <span className="text-3xl font-bold text-white">
            R$ {plan.price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-gray-300 ml-1">por mês</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <ul className="space-y-3 mt-2">
          {features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start">
              <FiCheck className="text-phanteon-orange mt-1 mr-2 flex-shrink-0" />
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        {isAuthenticated ? (
          <Button 
            fullWidth 
            variant={isPopular ? 'primary' : 'outline'}
            onClick={handleSelect}
          >
            Adquirir {plan.name}
          </Button>
        ) : (
          <Link href="/login" className="w-full">
            <Button fullWidth variant={isPopular ? 'primary' : 'outline'}>
              Entrar para Adquirir
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}