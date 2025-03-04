import React, { useState, useEffect } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { FiLink, FiUnlink } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface DiscordConnectionProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const DiscordConnection: React.FC<DiscordConnectionProps> = ({ 
  onConnect, 
  onDisconnect 
}) => {
  const { user, connectDiscord } = useAuth();
  const [discordConnected, setDiscordConnected] = useState(false);
  const [discordUsername, setDiscordUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Verificar status da conexão com Discord
  useEffect(() => {
    fetchDiscordStatus();
  }, [user]);
  
  const fetchDiscordStatus = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('discord_connections')
        .select('discord_username, discord_avatar')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        setDiscordConnected(false);
        setDiscordUsername('');
        return;
      }
      
      setDiscordConnected(true);
      setDiscordUsername(data.discord_username || 'Usuário Discord');
    } catch (error) {
      console.error('Error checking Discord connection:', error);
    }
  };
  
  // Função para desconectar conta do Discord
  const disconnectDiscord = async () => {
    if (!user?.id || !discordConnected) return;
    
    if (!window.confirm("Tem certeza que deseja desvincular sua conta do Discord? Isso pode remover seu cargo VIP no servidor Discord.")) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('discord_connections')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      setDiscordConnected(false);
      setDiscordUsername('');
      
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Error disconnecting Discord:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Função para iniciar conexão com Discord
  const handleConnectDiscord = async () => {
    setLoading(true);
    
    try {
      // Inicia o fluxo de autenticação Discord com o retorno para a página atual
      await connectDiscord(window.location.href);
      
      // Esta parte só será executada se o redirecionamento falhar
      if (onConnect) {
        onConnect();
      }
    } catch (error) {
      console.error('Error connecting Discord:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <FaDiscord className="text-[#5865F2] text-2xl mr-3" />
            <h2 className="text-xl font-bold">Discord</h2>
          </div>
          
          {discordConnected ? (
            <Badge variant="success">Conectado</Badge>
          ) : (
            <Badge variant="secondary">Desconectado</Badge>
          )}
        </div>
        
        {discordConnected ? (
          <div>
            <div className="bg-phanteon-light/20 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="font-medium">{discordUsername}</p>
                  <p className="text-sm text-gray-400">
                    Conta conectada com sucesso
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={disconnectDiscord}
                isLoading={loading}
                className="text-red-400 hover:text-red-300"
              >
                <FiUnlink className="mr-2" /> Desvincular
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-300 mb-6">
              Conecte sua conta do Discord para receber automaticamente seu cargo VIP e acessar canais exclusivos.
            </p>
            
            <Button
              variant="outline"
              onClick={handleConnectDiscord}
              isLoading={loading}
              className="bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border-[#5865F2]/30"
            >
              <FiLink className="mr-2" /> Conectar Discord
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};