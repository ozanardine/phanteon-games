import React from 'react';
import { useRouter } from 'next/router';
import { FaExclamationTriangle, FaHome, FaArrowLeft } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import Head from 'next/head';

export default function AdminErrorPage({ error, message }) {
  const router = useRouter();
  const errorCode = error || '500';
  const errorMessage = message || 'Ocorreu um erro ao processar sua solicitação';

  return (
    <>
      <Head>
        <title>Erro {errorCode} | Painel Administrativo</title>
      </Head>
      
      <div className="min-h-screen bg-dark-300 flex flex-col items-center justify-center p-4">
        <div className="bg-dark-400 rounded-lg shadow-xl p-8 max-w-md w-full border border-dark-200">
          <div className="text-red-500 text-6xl flex justify-center mb-6">
            <FaExclamationTriangle />
          </div>
          
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Erro {errorCode}
          </h1>
          
          <p className="text-gray-300 text-center mb-8">
            {errorMessage}
          </p>
          
          <div className="flex flex-col space-y-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => router.back()}
              leftIcon={<FaArrowLeft />}
            >
              Voltar
            </Button>
            
            <Button
              variant="primary"
              fullWidth
              onClick={() => router.push('/admin')}
              leftIcon={<FaHome />}
            >
              Painel Admin
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const { query } = context;
  
  return {
    props: {
      error: query.code || null,
      message: query.message || null
    }
  };
} 