// components/profile/tabs/VipManagementTab.js
import React, { useMemo } from 'react';
import { FaCrown, FaClock, FaChevronRight, FaArrowUp, FaHistory, FaInfoCircle, FaShieldAlt } from 'react-icons/fa';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { formatDate, calculateTimeUntilExpiration, generateBenefitsList, FaCheck } from '../utils';

const VipManagementTab = ({ subscriptionData, subscriptionHistory = [], onRenew, onUpgrade }) => {
  const hasActiveSubscription = subscriptionData && subscriptionData.status === 'active';
  const expirationInfo = useMemo(() => {
    return hasActiveSubscription ? calculateTimeUntilExpiration(subscriptionData.expires_at) : null;
  }, [hasActiveSubscription, subscriptionData]);
  
  return (
    <div className="space-y-8">
      {/* Status da Assinatura */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaCrown className="text-primary mr-2" />
            Status da Assinatura VIP
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {hasActiveSubscription ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-dark-400 to-dark-300 p-4 rounded-lg">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{subscriptionData.plan_name}</h3>
                  <p className="text-gray-300">
                    Ativo até {formatDate(subscriptionData.expires_at)}
                  </p>
                  {expirationInfo && !expirationInfo.expired && (
                    <p className="text-primary text-sm mt-1">
                      <FaClock className="inline mr-1" /> 
                      {expirationInfo.text} restantes
                    </p>
                  )}
                </div>
                <div className="mt-4 md:mt-0">
                  <Card.Badge variant={expirationInfo?.expired ? 'danger' : 'success'} className="text-sm">
                    {expirationInfo?.expired ? 'Expirado' : 'Ativo'}
                  </Card.Badge>
                </div>
              </div>

              {/* Barra de progresso da assinatura */}
              {expirationInfo && !expirationInfo.expired && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Hoje</span>
                    <span>Expiração</span>
                  </div>
                  <div className="w-full bg-dark-400 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${Math.max(5, Math.min(100, 100 - (expirationInfo.days / 30) * 100))}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Benefícios do plano */}
              <div>
                <h4 className="text-white font-medium mb-2">Seus Benefícios:</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {generateBenefitsList(subscriptionData.plan_id).map((benefit, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <div className="bg-primary/20 text-primary rounded-full p-1 flex-shrink-0 mt-0.5 mr-2">
                        <FaCheck className="w-3 h-3" />
                      </div>
                      <span className="text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ações de VIP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={onRenew}
                  className="group"
                >
                  <FaClock className="mr-2" />
                  Renovar Assinatura
                  <FaChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
                
                <Button
                  variant="primary"
                  onClick={onUpgrade}
                  className="group"
                >
                  <FaArrowUp className="mr-2" />
                  Fazer Upgrade
                  <FaChevronRight className="ml-1 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-dark-300 text-gray-400 flex items-center justify-center mx-auto mb-4">
                <FaCrown className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Sem assinatura ativa</h3>
              <p className="text-gray-400 mb-4">
                Você ainda não possui nenhum plano VIP ativo.
                Adquira um plano para obter vantagens exclusivas!
              </p>
              <Button 
                variant="primary"
                onClick={onRenew}
              >
                Ver Planos VIP
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Instruções para VIP */}
      {hasActiveSubscription && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center">
              <FaInfoCircle className="text-primary mr-2" />
              Como usar seu VIP
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <div>
                <p className="text-gray-300 mb-2">
                  Para resgatar seus itens VIP, utilize o comando:
                </p>
                <div className="bg-dark-400 p-3 rounded font-mono text-sm text-gray-300">
                  /resgatar
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Caso seu inventário esteja cheio, você receberá instruções no jogo.
                </p>
              </div>
              {/* Adicionar mais instruções úteis */}
              <div className="bg-dark-400/50 p-4 rounded-lg border border-dark-300 mt-4">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <FaShieldAlt className="text-primary mr-2" />
                  Dica VIP
                </h4>
                <p className="text-gray-300 text-sm">
                  Você pode usar o comando <span className="text-primary font-mono">/vip</span> dentro 
                  do jogo para ver todas as opções disponíveis para o seu plano.
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Histórico de Assinaturas */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center">
            <FaHistory className="text-primary mr-2" />
            Histórico de Assinaturas
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {subscriptionHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-400">
                    <th className="py-2 px-4 text-left text-gray-300">Plano</th>
                    <th className="py-2 px-4 text-left text-gray-300">Data</th>
                    <th className="py-2 px-4 text-left text-gray-300">Expiração</th>
                    <th className="py-2 px-4 text-right text-gray-300">Valor</th>
                    <th className="py-2 px-4 text-center text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionHistory.map((sub) => (
                    <tr key={sub.id} className="border-b border-dark-300">
                      <td className="py-3 px-4 text-white">{sub.plan_name}</td>
                      <td className="py-3 px-4 text-gray-400">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {formatDate(sub.expires_at)}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-right">
                        R$ {parseFloat(sub.amount || sub.price || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            sub.status === 'active'
                              ? 'bg-green-900/20 text-green-500'
                              : sub.status === 'pending'
                              ? 'bg-yellow-900/20 text-yellow-500'
                              : 'bg-red-900/20 text-red-500'
                          }`}
                        >
                          {sub.status === 'active'
                            ? 'Ativo'
                            : sub.status === 'pending'
                            ? 'Pendente'
                            : 'Expirado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400">
                Você ainda não possui histórico de assinaturas.
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default VipManagementTab;