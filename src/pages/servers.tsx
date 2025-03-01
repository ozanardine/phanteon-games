import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/ui/Loading';
import { supabase } from '@/lib/supabase';
import { Server } from '@/types/database.types';
import { FiUsers, FiServer, FiClock } from 'react-icons/fi';

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const { data, error } = await supabase
          .from('servers')
          .select('*')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        setServers(data || []);
      } catch (err) {
        console.error('Error fetching servers:', err);
        setError('Não foi possível carregar os servidores. Por favor, tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServers();
  }, []);
  
  const getStatusColor = (status: 'online' | 'offline') => {
    return status === 'online' ? 'bg-green-500' : 'bg-red-500';
  };
  
  const formatLastOnline = (lastOnline: string) => {
    const date = new Date(lastOnline);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <Layout title="Servidores | Phanteon Games" description="Lista de servidores da Phanteon Games">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Nossos Servidores</h1>
          <p className="mt-2 text-lg text-gray-300">
            Confira nossos servidores de jogos e junte-se à diversão!
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loading size="lg" />
          </div>
        ) : error ? (
          <Alert type="error">{error}</Alert>
        ) : servers.length === 0 ? (
          <Alert type="info">
            Nenhum servidor disponível no momento. Volte mais tarde.
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <Card key={server.id} className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-white">{server.name}</h2>
                    <div className="flex items-center">
                      <span className={`w-3 h-3 rounded-full ${getStatusColor(server.status)} mr-2`}></span>
                      <span className="text-sm text-gray-300">{server.status === 'online' ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{server.game}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-phanteon-dark rounded-md p-3">
                        <div className="flex items-center text-gray-300 mb-1">
                          <FiUsers className="mr-2" />
                          <span className="text-sm font-medium">Jogadores</span>
                        </div>
                        <p className="text-white font-medium">
                          {server.players_current} / {server.players_max}
                        </p>
                      </div>
                      
                      <div className="bg-phanteon-dark rounded-md p-3">
                        <div className="flex items-center text-gray-300 mb-1">
                          <FiServer className="mr-2" />
                          <span className="text-sm font-medium">Endereço</span>
                        </div>
                        <p className="text-white font-medium overflow-hidden overflow-ellipsis">
                          {server.ip}:{server.port}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-phanteon-dark rounded-md p-3">
                      <div className="flex items-center text-gray-300 mb-1">
                        <FiClock className="mr-2" />
                        <span className="text-sm font-medium">Última atualização</span>
                      </div>
                      <p className="text-white text-sm">
                        {formatLastOnline(server.last_online)}
                      </p>
                    </div>
                    
                    <button 
                      className="w-full bg-phanteon-light hover:bg-phanteon-light/80 text-white py-2 rounded-md transition"
                      onClick={() => {
                        navigator.clipboard.writeText(`${server.ip}:${server.port}`);
                        alert('Endereço do servidor copiado para a área de transferência!');
                      }}
                    >
                      Copiar Endereço
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}