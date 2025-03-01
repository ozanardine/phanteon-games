import React from 'react';
import Image from 'next/image';
import Layout from '../components/layout/Layout';
import ServerStatus from '../components/server/ServerStatus';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import JoinServer from '../components/server/JoinServer';
import { useServerStatus } from '../hooks/useServerStatus';
import { FaSteam, FaDiscord, FaCalendarAlt, FaUsers, FaMap } from 'react-icons/fa';

const HomePage = () => {
  const { playerCount, maxPlayers, mapSize, seed, isOnline } = useServerStatus();

  return (
    <Layout 
      title="Phanteon Games - Gaming Community"
      description="Join the best gaming community platform. Active members, exclusive events, and VIP system."
    >
      {/* Hero Section */}
      <section className="relative h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 bg-hero-pattern bg-cover bg-center bg-no-repeat opacity-50" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-900" />
        
        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white text-shadow-lg">
              Welcome to <span className="text-amber-500">Phanteon Games</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-200 mb-8 text-shadow">
              The best gaming community with active servers, exclusive events, and premium features.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                leftIcon={<FaSteam />}
                onClick={() => window.location.href = 'steam://connect/game.phanteongames.com:28015'}
              >
                Connect via Steam
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                leftIcon={<FaDiscord />}
                onClick={() => window.location.href = '/discord'}
              >
                Join Discord
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Server Status Section */}
      <section className="py-16 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Server Status</h2>
              <p className="text-zinc-300 mb-8">
                Our servers are hosted on high-performance hardware with DDoS protection to ensure a smooth gaming experience. Join now and be part of our active community!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <JoinServer 
                  serverAddress="game.phanteongames.com:28015"
                />
              </div>
            </div>
            
            <div className="md:w-1/2">
              <ServerStatus 
                isOnline={isOnline}
                playerCount={playerCount}
                maxPlayers={maxPlayers}
                mapSize={mapSize}
                seed={seed}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-zinc-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Phanteon Games?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center" hoverEffect>
              <div className="p-4">
                <div className="bg-amber-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="text-amber-500 text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Active Community</h3>
                <p className="text-zinc-400">
                  Join a vibrant community of players. Make friends and find teammates for your next adventure.
                </p>
              </div>
            </Card>
            
            <Card className="text-center" hoverEffect>
              <div className="p-4">
                <div className="bg-amber-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaCalendarAlt className="text-amber-500 text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Weekly Events</h3>
                <p className="text-zinc-400">
                  Participate in exciting weekly events with great rewards. PvP tournaments, treasure hunts, and more!
                </p>
              </div>
            </Card>
            
            <Card className="text-center" hoverEffect>
              <div className="p-4">
                <div className="bg-amber-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaMap className="text-amber-500 text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Custom Maps</h3>
                <p className="text-zinc-400">
                  Enjoy unique and carefully balanced maps that provide the best gaming experience for all players.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-rust text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Join?</h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            Become part of our growing community today. Connect with other gamers, participate in events, and enjoy premium features.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="primary">Join Server Now</Button>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;