// components/profile/TabContent.js
import React from 'react';
import VipManagementTab from './tabs/VipManagementTab';
import ProfileTab from './tabs/ProfileTab';
import ServerStatsTab from './tabs/ServerStatsTab';
import DailyRewardsTab from './tabs/DailyRewardsTab';

// Componente Principal de Gerenciamento de Tabs
const TabContent = ({ 
  activeTab, 
  userData, 
  session, 
  subscriptionData, 
  serverData, 
  onEditSteamId, 
  onRenewSubscription, 
  onUpgradeSubscription, 
  subscriptionHistory 
}) => {
  switch (activeTab) {
    case 'vip':
      return (
        <VipManagementTab 
          subscriptionData={subscriptionData} 
          subscriptionHistory={subscriptionHistory}
          onRenew={onRenewSubscription}
          onUpgrade={onUpgradeSubscription}
        />
      );
    case 'profile':
      return (
        <ProfileTab 
          userData={userData} 
          session={session} 
          onEditSteamId={onEditSteamId} 
        />
      );
    case 'server':
      return (
        <ServerStatsTab 
          userData={userData} 
          serverData={serverData} 
          onEditSteamId={onEditSteamId}
        />
      );
    case 'rewards':
      return (
        <DailyRewardsTab 
          userData={userData} 
          onEditSteamId={onEditSteamId}
        />
      );
    default:
      return (
        <ProfileTab 
          userData={userData} 
          session={session} 
          onEditSteamId={onEditSteamId} 
        />
      );
  }
};

export default TabContent;