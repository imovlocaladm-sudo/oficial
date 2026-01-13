import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Institucional */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Institucional</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-red-400 transition-colors">Página inicial</Link></li>
              <li><Link to="/cadastro" className="hover:text-red-400 transition-colors">Cadastre-se</Link></li>
              <li><Link to="/login" className="hover:text-red-400 transition-colors">Área administrativa</Link></li>
            </ul>
          </div>

          {/* Imóveis */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Imóveis</h3>
            <ul className="space-y-2">
              <li><Link to="/destaques" className="hover:text-red-400 transition-colors">Destaques</Link></li>
              <li><Link to="/lancamentos" className="hover:text-red-400 transition-colors">Lançamentos</Link></li>
              <li><Link to="/busca-detalhada" className="hover:text-red-400 transition-colors">Busca detalhada</Link></li>
              <li><Link to="/solicitar" className="hover:text-red-400 transition-colors">Solicite um imóvel</Link></li>
              <li><Link to="/anunciar" className="hover:text-red-400 transition-colors">Anunciar imóveis</Link></li>
            </ul>
          </div>
        </div>

        {/* Social Media */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="text-white font-semibold mb-3">Acompanhe o ImovLocal</h4>
              <div className="flex gap-4">
                <a href="#" className="hover:text-red-400 transition-colors">
                  <Facebook size={24} />
                </a>
                <a href="#" className="hover:text-red-400 transition-colors">
                  <Instagram size={24} />
                </a>
                <a href="#" className="hover:text-red-400 transition-colors">
                  <Mail size={24} />
                </a>
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end">
                <img 
                  src="/assets/images/logo/icone-footer.png" 
                  alt="ImovLocal"
                  className="h-16 w-16 hover:scale-110 transition-transform duration-300"
                  data-testid="logo-footer"
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">Seu imóvel aqui</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>© 2025 IMOVLOCAL - Seu imóvel aqui - Todos os direitos reservados</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
