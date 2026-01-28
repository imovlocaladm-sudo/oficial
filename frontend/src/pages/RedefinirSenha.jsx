import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedefinirSenha = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona para a página de esqueceu senha
    navigate('/esqueceu-senha');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
};

export default RedefinirSenha;
