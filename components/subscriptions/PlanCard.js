import React from 'react';
import { FaCheck } from 'react-icons/fa';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

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
    <Card 
      className={`h-full flex flex-col ${isPopular ? 'border-primary' : ''}`}
      shadow={true}
      hoverable={true}
    >
      {isPopular && (
        <div className="bg-primary text-white text-center py-1 px-4 rounded-t-lg font-medium text-sm">
          Mais Popular
        </div>
      )}
      <Card.Header>
        <Card.Title>{name}</Card.Title>
        <div className="mt-4 flex items-baseline text-white">
          <span className="text-3xl font-extrabold">R$ {price}</span>
          <span className="ml-1 text-xl text-gray-400">/mês</span>
        </div>
        <Card.Subtitle className="mt-2">{description}</Card.Subtitle>
      </Card.Header>

      <Card.Body className="flex-grow">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <FaCheck className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </Card.Body>

      <Card.Footer className="mt-auto">
        <Button
          variant={isPopular ? 'primary' : 'outline'}
          fullWidth
          onClick={handleClick}
          disabled={disabled}
        >
          {buttonText}
        </Button>
      </Card.Footer>
    </Card>
  );
};

export default PlanCard;