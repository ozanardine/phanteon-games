import React, { useState } from 'react';
import { FaCheck, FaCrown } from 'react-icons/fa';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import VipBadge from '../ui/VipBadge';

const planColorMapping = {
  'vip-basic': {
    gradient: 'from-amber-700 to-amber-900',
    border: 'border-amber-700',
    shadow: 'shadow-amber-700/30',
    badge: 'vip-basic'
  },
  'vip-plus': {
    gradient: 'from-gray-400 to-gray-600',
    border: 'border-gray-400',
    shadow: 'shadow-gray-400/30',
    badge: 'vip-plus'
  }
};

const PlanCard = ({
  id,
  name,
  price,
  description,
  features = [],
  isPopular = false,
  onClick,
  buttonText = 'Assinar Agora',
  disabled = false,
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  
  const planStyle = planColorMapping[id] || planColorMapping['vip-basic'];

  const handleClick = () => {
    if (!session) {
      // Se não estiver logado, redireciona para página inicial com mensagem
      router.push('/?login=true');
      return;
    }

    // Se estiver logado e tiver onClick definido, executa a função
    if (onClick) {
      onClick();
    } else {
      // Caso contrário, redireciona para a página de checkout
      router.push(`/checkout/${id}`);
    }
  };

  return (
    <div 
      className={`relative transform transition-all duration-500 ${isHovered ? 'scale-[1.03]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${planStyle.gradient} opacity-0 ${isHovered ? 'opacity-20' : ''} blur-xl transition-opacity duration-500`}></div>
      
      <Card 
        className={`h-full flex flex-col relative z-10 border-2 overflow-hidden ${isPopular ? planStyle.border : 'border-dark-200'} ${isHovered ? `${planStyle.shadow} shadow-xl` : 'shadow-lg'}`}
        shadow={true}
        hoverable={false}
        padding="none"
        variant={isHovered ? 'lighter' : 'default'}
      >
        {isPopular && (
          <div className={`bg-gradient-to-r ${planStyle.gradient} text-white text-center py-1.5 px-4 font-medium text-sm absolute top-0 right-0 transform translate-x-8 translate-y-4 rotate-45 shadow-md w-40`}>
            Mais Popular
          </div>
        )}
        
        <div className="absolute top-4 left-4">
          <VipBadge plan={id} size={36} />
        </div>
        
        <Card.Header className="pt-14 pb-4 px-6">
          <Card.Title className="text-2xl flex items-center gap-2">
            {name}
            {id === 'vip-premium' && <FaCrown className="text-yellow-500" />}
          </Card.Title>
          <div className="mt-4 flex items-baseline text-white">
            <span className="text-4xl font-extrabold">R$ {price}</span>
            <span className="ml-1 text-xl text-gray-400">/mês</span>
          </div>
          <Card.Subtitle className="mt-2">{description}</Card.Subtitle>
        </Card.Header>

        <Card.Divider className={isPopular ? planStyle.border : ''} />

        <Card.Body className="flex-grow p-6">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <div className={`flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-r ${planStyle.gradient} text-white flex-shrink-0 mr-2`}>
                  <FaCheck className="h-3 w-3" />
                </div>
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </Card.Body>

        <Card.Footer className="mt-auto px-6 pb-6">
          <Button
            variant={isPopular ? 'gradient' : 'outline'}
            fullWidth
            onClick={handleClick}
            disabled={disabled}
            size="lg"
            className={`transform transition-all duration-300 ${isHovered ? 'translate-y-0 shadow-lg' : 'translate-y-0'}`}
          >
            {buttonText}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default PlanCard;