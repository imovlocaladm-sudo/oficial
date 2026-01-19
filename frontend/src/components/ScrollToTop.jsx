import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que faz scroll para o topo da página
 * sempre que a rota muda
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll suave para o topo
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // 'smooth' para animação suave
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
