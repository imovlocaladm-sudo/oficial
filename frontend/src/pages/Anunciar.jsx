import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Home, PlusCircle, Shield, Star } from 'lucide-react';

const Anunciar = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // If user is authenticated, redirect to create property page
    if (isAuthenticated()) {
      navigate('/admin/imoveis/novo');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Anuncie seu Imóvel</h1>
          <p className="text-xl text-orange-100">Alcance milhares de compradores e inquilinos</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Benefits */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Por que anunciar no ImovLocal?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-blue-600" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">Destaque seu Imóvel</h3>
              <p className="text-gray-600">Opções de destaque para seu imóvel aparecer primeiro</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="text-green-600" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">Venda Mais Rápido</h3>
              <p className="text-gray-600">Alcance milhares de interessados qualificados</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-orange-600" size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">Segurança</h3>
              <p className="text-gray-600">Plataforma segura e confiável para seus anúncios</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <PlusCircle size={64} className="text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Comece a Anunciar Agora</h2>
          <p className="text-gray-600 mb-6">
            Crie sua conta gratuitamente e publique seu primeiro imóvel em minutos.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/cadastro')}
              className="bg-orange-500 hover:bg-orange-600 text-lg py-6 px-8"
            >
              Criar Conta Grátis
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              className="text-lg py-6 px-8"
            >
              Já tenho conta
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Particular ou Corretor? Ambos podem anunciar!
          </p>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Como Funciona</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Crie sua Conta</h3>
                <p className="text-gray-600">Cadastre-se gratuitamente como particular ou corretor</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Cadastre seu Imóvel</h3>
                <p className="text-gray-600">Adicione fotos, descrição e todas as informações do imóvel</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Publique e Venda</h3>
                <p className="text-gray-600">Seu anúncio fica disponível imediatamente para milhares de pessoas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Anunciar;