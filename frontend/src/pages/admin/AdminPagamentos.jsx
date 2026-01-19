import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { 
  ArrowLeft, Check, X, Clock, Eye, DollarSign,
  Filter, Search, AlertCircle, CheckCircle, XCircle,
  FileText, User, Calendar
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPagamentos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('awaiting_approval');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [approving, setApproving] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (user?.user_type !== 'admin' && user?.user_type !== 'admin_senior') {
      toast.error('Acesso negado');
      navigate('/');
      return;
    }
    
    fetchData();
  }, [user, navigate, filter]);

  const fetchData = async () => {
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        api.get(`/payments/admin/list?status=${filter}&limit=100`),
        api.get('/payments/admin/stats')
      ]);
      
      setPayments(paymentsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId, approved) => {
    setApproving(true);
    try {
      await api.post(`/payments/admin/${paymentId}/approve`, {
        approved,
        admin_notes: adminNotes
      });
      
      toast.success(approved ? 'Pagamento aprovado!' : 'Pagamento rejeitado');
      setSelectedPayment(null);
      setAdminNotes('');
      fetchData();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setApproving(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'yellow', icon: Clock, label: 'Pendente' },
      awaiting_approval: { color: 'blue', icon: Eye, label: 'Aguardando Aprovação' },
      approved: { color: 'green', icon: CheckCircle, label: 'Aprovado' },
      rejected: { color: 'red', icon: XCircle, label: 'Rejeitado' },
      expired: { color: 'gray', icon: Clock, label: 'Expirado' },
      cancelled: { color: 'gray', icon: X, label: 'Cancelado' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${badge.color}-100 text-${badge.color}-700`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={user?.user_type === 'admin' ? '/admin/master' : '/admin/senior'}>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft size={18} className="mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Gerenciar Pagamentos</h1>
                <p className="text-green-100 text-sm">Aprovar e gerenciar pagamentos Pix</p>
              </div>
            </div>
            
            {stats && (
              <div className="hidden md:flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.by_status?.awaiting_approval || 0}</p>
                  <p className="text-xs text-green-200">Aguardando</p>
                </div>
                <div className="w-px h-10 bg-white/30" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatPrice(stats.monthly_revenue || 0)}</p>
                  <p className="text-xs text-green-200">Este mês</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aguardando</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.by_status?.awaiting_approval || 0}</p>
                </div>
                <Eye className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aprovados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.by_status?.approved || 0}</p>
                </div>
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Receita Total</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(stats.total_revenue || 0)}</p>
                </div>
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Este Mês</p>
                  <p className="text-2xl font-bold text-blue-600">{formatPrice(stats.monthly_revenue || 0)}</p>
                </div>
                <Calendar className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'awaiting_approval', label: 'Aguardando Aprovação', color: 'blue' },
              { value: 'pending', label: 'Pendentes', color: 'yellow' },
              { value: 'approved', label: 'Aprovados', color: 'green' },
              { value: 'rejected', label: 'Rejeitados', color: 'red' },
              { value: '', label: 'Todos', color: 'gray' }
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? `bg-${f.color}-600 text-white`
                    : `bg-gray-100 text-gray-700 hover:bg-gray-200`
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plano</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{payment.user_name}</p>
                          <p className="text-sm text-gray-500">{payment.user_email}</p>
                          <p className="text-xs text-gray-400 capitalize">{payment.user_type}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-800">{payment.plan_name}</p>
                        <p className="text-sm text-gray-500">{payment.duration_days} dias</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-green-600">{formatPrice(payment.amount)}</p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-600">{formatDate(payment.created_at)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {payment.receipt_url && (
                            <a
                              href={`${BACKEND_URL}${payment.receipt_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Ver comprovante"
                            >
                              <FileText size={18} />
                            </a>
                          )}
                          
                          {payment.status === 'awaiting_approval' && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Analisar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Aprovação */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Analisar Pagamento</h2>
                <button onClick={() => setSelectedPayment(null)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              {/* Dados do Pagamento */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Usuário</p>
                    <p className="font-medium">{selectedPayment.user_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{selectedPayment.user_email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Plano</p>
                    <p className="font-medium">{selectedPayment.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Valor</p>
                    <p className="font-bold text-green-600">{formatPrice(selectedPayment.amount)}</p>
                  </div>
                </div>
              </div>

              {/* Comprovante */}
              {selectedPayment.receipt_url && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Comprovante:</p>
                  <a
                    href={`${BACKEND_URL}${selectedPayment.receipt_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    {selectedPayment.receipt_url.endsWith('.pdf') ? (
                      <div className="p-4 bg-gray-100 flex items-center gap-2">
                        <FileText className="text-red-600" size={24} />
                        <span>Abrir PDF do comprovante</span>
                      </div>
                    ) : (
                      <img
                        src={`${BACKEND_URL}${selectedPayment.receipt_url}`}
                        alt="Comprovante"
                        className="w-full max-h-64 object-contain bg-gray-100"
                      />
                    )}
                  </a>
                </div>
              )}

              {/* Notas do Admin */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Motivo da aprovação/rejeição..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(selectedPayment.id, true)}
                  disabled={approving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {approving ? 'Processando...' : (
                    <>
                      <Check size={18} className="mr-2" />
                      Aprovar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleApprove(selectedPayment.id, false)}
                  disabled={approving}
                  variant="outline"
                  className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                >
                  <X size={18} className="mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminPagamentos;
