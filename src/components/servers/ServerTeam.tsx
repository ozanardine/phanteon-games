import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ServerTeamMember } from '@/types/database.types';
import { Avatar } from '@/components/ui/Avatar';
import { FiUsers, FiStar, FiShield } from 'react-icons/fi';

type ServerTeamProps = {
  team: ServerTeamMember[];
  vipUsers?: any[];
};

export function ServerTeam({ team, vipUsers = [] }: ServerTeamProps) {
  // Agrupar membros da equipe por função
  const teamByRole = team.reduce((acc, member) => {
    if (!acc[member.role]) {
      acc[member.role] = [];
    }
    acc[member.role].push(member);
    return acc;
  }, {} as Record<string, ServerTeamMember[]>);
  
  // Ordenar roles por importância
  const orderedRoles = [
    'Fundador',
    'Administrador',
    'Moderador',
    'Suporte',
    'Desenvolvedor',
    'Designer',
    'Staff',
    'Helper'
  ];
  
  // Função para obter a cor de fundo com base na função
  const getRoleBgColor = (role: string) => {
    role = role.toLowerCase();
    if (role.includes('admin') || role.includes('fundador')) return 'bg-red-500/20 text-red-500';
    if (role.includes('mod')) return 'bg-yellow-500/20 text-yellow-500';
    if (role.includes('suporte') || role.includes('helper')) return 'bg-green-500/20 text-green-500';
    if (role.includes('dev')) return 'bg-blue-500/20 text-blue-500';
    if (role.includes('design')) return 'bg-purple-500/20 text-purple-500';
    return 'bg-gray-500/20 text-gray-500';
  };
  
  // Componente para renderizar um membro da equipe
  const TeamMember = ({ member }: { member: ServerTeamMember }) => (
    <div className="bg-phanteon-dark p-4 rounded-lg flex items-center">
      <Avatar 
        src={member.profiles?.avatar_url || null} 
        alt={member.profiles?.username || 'Membro da equipe'} 
        size="lg"
      />
      <div className="ml-4">
        <h3 className="text-white font-medium">
          {member.profiles?.username || 'Membro da equipe'}
        </h3>
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${getRoleBgColor(member.role)}`}>
          {member.role}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Equipe do Servidor</h2>
            <FiShield className="text-phanteon-orange text-xl" />
          </div>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              Informações sobre a equipe não disponíveis.
            </p>
          ) : (
            <div className="space-y-6">
              {orderedRoles
                .filter(role => teamByRole[role] && teamByRole[role].length > 0)
                .map(role => (
                  <div key={role}>
                    <h3 className="text-lg font-medium text-white mb-3">{role}s</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamByRole[role].map(member => (
                        <TeamMember key={member.id} member={member} />
                      ))}
                    </div>
                  </div>
                ))
              }
              
              {/* Se não encontrar nenhuma das funções ordenadas, mostrar tudo */}
              {Object.keys(teamByRole)
                .filter(role => !orderedRoles.includes(role))
                .map(role => (
                  <div key={role}>
                    <h3 className="text-lg font-medium text-white mb-3">{role}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamByRole[role].map(member => (
                        <TeamMember key={member.id} member={member} />
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </CardContent>
      </Card>
      
      {vipUsers && vipUsers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Apoiadores VIP</h2>
              <FiStar className="text-phanteon-orange text-xl" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 justify-center">
              {vipUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex flex-col items-center"
                >
                  <Avatar 
                    src={user.avatar_url || null} 
                    alt={user.username || 'Apoiador VIP'} 
                    size="lg"
                    className="mb-2"
                  />
                  <p className="text-white text-sm text-center">
                    {user.username || 'Apoiador VIP'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}