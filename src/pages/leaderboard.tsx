// src/pages/leaderboard.tsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { supabase } from '../lib/supabase/client';
import { formatPlaytime } from '../lib/utils/formatUtils';
import { FaTrophy, FaSkull, FaClock, FaMedal, FaUser, FaFilter, FaCalendarAlt } from 'react-icons/fa';

interface LeaderboardEntry {
  id: string;
  steam_id: string;
  name: string;
  type: string;
  score: number;
  secondary_score: number;
  month: string;
  server_id: string;
}

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState<'kills' | 'playtime' | 'deaths'>('kills');
  const [month, setMonth] = useState(() => getCurrentMonth());
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Buscar dados do leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Contagem de jogadores
        const { count } = await supabase
          .from('leaderboard')
          .select('*', { count: 'exact', head: true })
          .eq('month', month)
          .eq('type', activeTab)
          .eq('server_id', 'game.phanteongames.com:28015');
        
        setTotalPlayers(count || 0);
        
        // Buscar dados de leaderboard
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('month', month)
          .eq('type', activeTab)
          .eq('server_id', 'game.phanteongames.com:28015')
          .order('score', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        setLeaderboardData(data || []);
      } catch (err) {
        console.error('Erro ao buscar leaderboard:', err);
        setError('Falha ao carregar dados do leaderboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [activeTab, month]);
  
  // Obter meses disponíveis (3 meses: atual, anterior e próximo)
  const availableMonths = getAvailableMonths();
  
  return (
    <Layout
      title="Leaderboard - Phanteon Games"
      description="Confira o ranking dos melhores jogadores do servidor Phanteon Games. Veja estatísticas de kills, tempo de jogo e muito mais."
    >
      <div className="container mx-auto px-4 py-8 mt-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Leaderboard</h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Confira os melhores jogadores do servidor. Conquiste seu lugar entre os melhores!
          </p>
        </div>
        
        {/* Filtros */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs para categorias */}
          <div className="bg-zinc-800 rounded-lg p-1 inline-flex">
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'kills' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-700'
              }`}
              onClick={() => setActiveTab('kills')}
            >
              <FaTrophy className="inline mr-2" /> Kills
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'playtime' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-700'
              }`}
              onClick={() => setActiveTab('playtime')}
            >
              <FaClock className="inline mr-2" /> Tempo de Jogo
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === 'deaths' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-300 hover:bg-zinc-700'
              }`}
              onClick={() => setActiveTab('deaths')}
            >
              <FaSkull className="inline mr-2" /> Mortes
            </button>
          </div>
          
          {/* Seletor de mês */}
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-zinc-400" />
            <select
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded px-3 py-2"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {availableMonths.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Tabela de Leaderboard */}
        <Card>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner color="amber" text="Carregando leaderboard..." />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-zinc-500">
              <div className="text-xl mb-2">{error}</div>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <div className="text-xl mb-2">Nenhum dado disponível para este mês</div>
              <p className="mb-4">Tente selecionar outro mês ou categoria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-800">
                    <th className="py-3 px-4 text-left">Posição</th>
                    <th className="py-3 px-4 text-left">Jogador</th>
                    <th className="py-3 px-4 text-right">
                      {activeTab === 'kills' ? 'Kills' : 
                       activeTab === 'playtime' ? 'Tempo de Jogo' : 'Mortes'}
                    </th>
                    <th className="py-3 px-4 text-right">
                      {activeTab === 'kills' ? 'K/D' : 
                       activeTab === 'playtime' ? 'Sessão Média' : 'Kills'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((entry, index) => (
                    <tr key={entry.id} className="border-b border-zinc-700 hover:bg-zinc-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-2 ${
                              index === 0 ? 'bg-amber-500 text-black' :
                              index === 1 ? 'bg-zinc-300 text-black' :
                              'bg-amber-800 text-white'
                            }`}>
                              {index + 1}
                            </div>
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center font-bold text-zinc-400 mr-2">
                              {index + 1}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300 mr-3">
                            <FaUser className="text-sm" />
                          </div>
                          <a 
                            href={`https://steamcommunity.com/profiles/${entry.steam_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-amber-500"
                          >
                            {entry.name}
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {activeTab === 'playtime' 
                          ? formatPlaytime(Math.floor(entry.score / 60)) 
                          : entry.score.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-400">
                        {activeTab === 'kills' 
                          ? entry.secondary_score.toFixed(2)
                          : activeTab === 'playtime'
                            ? '~' + formatPlaytime(Math.floor((entry.score / 30) / 60)) + '/dia'
                            : entry.secondary_score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!isLoading && !error && leaderboardData.length > 0 && (
            <div className="p-4 text-center text-sm text-zinc-500">
              Mostrando os top {leaderboardData.length} jogadores de {totalPlayers} no total
            </div>
          )}
        </Card>
        
        {/* Texto explicativo */}
        <div className="mt-12 max-w-3xl mx-auto">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Sobre o Leaderboard</h2>
              <p className="text-zinc-300 mb-4">
                O leaderboard é atualizado a cada hora com as estatísticas dos jogadores ativos no servidor.
                As pontuações são calculadas mensalmente, com reset no primeiro dia de cada mês.
              </p>
              
              <div className="mb-4">
                <h3 className="font-bold text-zinc-200 mb-2">Categorias:</h3>
                <ul className="list-disc pl-6 text-zinc-400 space-y-1">
                  <li><strong>Kills</strong>: Número total de eliminações de outros jogadores.</li>
                  <li><strong>Tempo de Jogo</strong>: Tempo total em minutos conectado ao servidor.</li>
                  <li><strong>Mortes</strong>: Número total de vezes que o jogador morreu.</li>
                </ul>
              </div>
              
              <p className="text-zinc-400 text-sm italic">
                Nota: Apenas jogadores ativos com pelo menos 1 hora de jogo no mês são exibidos no leaderboard.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

// Função auxiliar para obter o mês atual no formato YYYY-MM
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Função para obter meses disponíveis (atual e 2 anteriores)
function getAvailableMonths() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  
  const months = [];
  
  // Incluir até 2 meses anteriores e o atual
  for (let i = -2; i <= 0; i++) {
    let targetMonth = currentMonth + i;
    let targetYear = currentYear;
    
    // Ajustar para meses do ano anterior
    if (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    const monthValue = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    months.push({
      value: monthValue,
      label: `${monthNames[targetMonth]} ${targetYear}`,
      isCurrent: i === 0
    });
  }
  
  return months;
}

export default LeaderboardPage;