import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { 
  Bell, Send, Users, Building2, User, Home, ArrowLeft,
  CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { toast } from 'sonner';

const AdminEnviarNotificacoes = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetTypes: []
  });
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    // Verificar se é admin
    if (user?.user_type !== 'admin' && user?.user_type !== 'admin_senior') {
      toast.error('Acesso negado. Apenas administradores.');
      navigate('/');
      return;
    }
    
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const data = await notificationsAPI.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTargetChange = (type) => {
    setFormData(prev => {
      const newTargets = prev.targetTypes.includes(type)
        ? prev.targetTypes.filter(t => t !== type)
        : [...prev.targetTypes, type];
      return { ...prev, targetTypes: newTargets };
    });
  };

  const handleSelectAll = () => {
    if (formData.targetTypes.length === 3) {
      setFormData(prev => ({ ...prev, targetTypes: [] }));
    } else {
      setFormData(prev => ({ ...prev, targetTypes: ['particular', 'corretor', 'imobiliaria'] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Digite um título para a notificação');
      return;
    }
    
    if (!formData.message.trim() || formData.message.length < 10) {
      toast.error('A mensagem deve ter pelo menos 10 caracteres');
      return;
    }
    
    if (formData.targetTypes.length === 0) {
      toast.error('Selecione pelo menos um tipo de usuário');
      return;
    }
    
    setLoading(true);
    setSendResult(null);
    
    try {
      const result = await notificationsAPI.sendAdminNotification(
        formData.title,
        formData.message,
        formData.targetTypes
      );
      
      setSendResult(result);
      toast.success(`Notificação enviada para ${result.notifications_sent} usuários!`);
      
      // Limpar formulário
      setFormData({
        title: '',
        message: '',
        targetTypes: []
      });
      
      // Atualizar estatísticas
      fetchStats();
      
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar notificação');
    } finally {
      setLoading(false);
    }
  };

  const userTypeLabels = {
    particular: { label: 'Particulares', icon: User, color: 'blue' },
    corretor: { label: 'Corretores', icon: Users, color: 'green' },
    imobiliaria: { label: 'Imobiliárias', icon: Building2, color: 'purple' }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Admin Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full">
                <Bell size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Enviar Notificações</h1>
                <p className="text-orange-100">Comunicação segmentada com os usuários</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to={user?.user_type === 'admin' ? '/admin/master' : '/admin/senior'}>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft size={18} className="mr-2" />
                  Voltar
                </Button>
              </Link>
              <Button 
                onClick={logout}
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-orange-600 hover:border-orange-600"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Send size={24} className="text-orange-500" />
                Nova Notificação
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Notificação *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Novidades do ImovLocal"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    maxLength={100}
                    data-testid="notification-title"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 caracteres</p>
                </div>

                {/* Mensagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Digite a mensagem que será enviada aos usuários selecionados..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    maxLength={500}
                    data-testid="notification-message"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.message.length}/500 caracteres</p>
                </div>

                {/* Seleção de Público Alvo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Público Alvo *
                  </label>
                  
                  <div className="flex justify-end mb-3">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      {formData.targetTypes.length === 3 ? 'Desmarcar todos' : 'Selecionar todos'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(userTypeLabels).map(([type, { label, icon: Icon, color }]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTargetChange(type)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.targetTypes.includes(type)
                            ? `border-${color}-500 bg-${color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        data-testid={`target-${type}`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`p-3 rounded-full ${
                            formData.targetTypes.includes(type)
                              ? `bg-${color}-100`
                              : 'bg-gray-100'
                          }`}>
                            <Icon size={24} className={
                              formData.targetTypes.includes(type)
                                ? `text-${color}-600`
                                : 'text-gray-500'
                            } />
                          </div>
                          <span className={`font-medium ${
                            formData.targetTypes.includes(type)
                              ? `text-${color}-700`
                              : 'text-gray-700'
                          }`}>
                            {label}
                          </span>
                          <span className="text-sm text-gray-500">
                            {stats?.active_users_by_type?.[type] || 0} usuários
                          </span>
                          {formData.targetTypes.includes(type) && (
                            <CheckCircle size={20} className={`text-${color}-500`} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview de Destinatários */}
                {formData.targetTypes.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-700 mb-2">
                      <Info size={18} />
                      <span className="font-medium">Resumo do Envio</span>
                    </div>
                    <p className="text-orange-600 text-sm">
                      Esta notificação será enviada para{' '}
                      <strong>
                        {formData.targetTypes.reduce((total, type) => 
                          total + (stats?.active_users_by_type?.[type] || 0), 0
                        )}
                      </strong>{' '}
                      usuários ativos:
                    </p>
                    <ul className="text-sm text-orange-600 mt-2 space-y-1">
                      {formData.targetTypes.map(type => (
                        <li key={type}>
                          • {userTypeLabels[type].label}: {stats?.active_users_by_type?.[type] || 0}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Botão de Envio */}
                <Button
                  type="submit"
                  disabled={loading || formData.targetTypes.length === 0}
                  className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-lg"
                  data-testid="send-notification-btn"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={20} className="mr-2" />
                      Enviar Notificação
                    </>
                  )}
                </Button>
              </form>

              {/* Resultado do Envio */}
              {sendResult && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle size={20} />
                    <span className="font-bold">Notificação Enviada com Sucesso!</span>
                  </div>
                  <p className="text-green-600 text-sm">
                    {sendResult.notifications_sent} notificações foram enviadas.
                  </p>
                  {sendResult.breakdown_by_type && (
                    <ul className="text-sm text-green-600 mt-2">
                      {Object.entries(sendResult.breakdown_by_type).map(([type, count]) => (
                        <li key={type}>• {userTypeLabels[type]?.label || type}: {count}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Estatísticas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Estatísticas de Usuários
              </h3>

              <div className="space-y-4">
                {Object.entries(userTypeLabels).map(([type, { label, icon: Icon, color }]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon size={20} className={`text-${color}-600`} />
                      <span className="text-gray-700">{label}</span>
                    </div>
                    <span className="font-bold text-gray-800">
                      {stats?.active_users_by_type?.[type] || 0}
                    </span>
                  </div>
                ))}

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Total de Usuários Ativos</span>
                    <span className="text-xl font-bold text-orange-600">
                      {stats?.total_active_users || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dicas */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Info size={16} />
                  Dicas
                </h4>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li>• Seja claro e objetivo nas mensagens</li>
                  <li>• Use títulos chamativos</li>
                  <li>• Segmente por tipo de usuário para maior relevância</li>
                  <li>• Evite envios muito frequentes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminEnviarNotificacoes;
