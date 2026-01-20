import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Filter,
  RefreshCw,
  X,
  FileImage,
  User,
  Calendar,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const AdminPagamentos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (user?.user_type !== 'admin' && user?.user_type !== 'admin_senior') {
      navigate('/');
      return;
    }
    fetchData();
  }, [filter, user, navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('imovlocal_user'))?.access_token;
      const headers = { Authorization: `Bearer ${token}` };

      // Buscar pagamentos
      const paymentsUrl = filter 
        ? `${API_URL}/payments/admin/list?status_filter=${filter}`
        : `${API_URL}/payments/admin/list`;
      const paymentsResponse = await axios.get(paymentsUrl, { headers });
      setPayments(paymentsResponse.data);

      // Buscar estatísticas
      const statsResponse = await axios.get(`${API_URL}/payments/admin/stats`, { headers });
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const handleViewPayment = async (paymentId) => {
    try {
      const token = JSON.parse(localStorage.getItem('imovlocal_user'))?.access_token;
      const response = await axios.get(`${API_URL}/payments/admin/payment/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedPayment(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Erro ao carregar detalhes do pagamento');
    }
  };

  const handleApprove = async (approved) => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      const token = JSON.parse(localStorage.getItem('imovlocal_user'))?.access_token;
      await axios.post(
        `${API_URL}/payments/admin/payment/${selectedPayment.id}/approve`,
        { 
          approved,
          rejection_reason: approved ? null : rejectionReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(approved ? 'Pagamento aprovado!' : 'Pagamento rejeitado');
      setShowModal(false);
      setSelectedPayment(null);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.detail || 'Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-gray-100 text-gray-700', label: 'Pendente' },
      awaiting: { color: 'bg-yellow-100 text-yellow-700', label: 'Aguardando Aprovação' },
      approved: { color: 'bg-green-100 text-green-700', label: 'Aprovado' },
      rejected: { color: 'bg-red-100 text-red-700', label: 'Rejeitado' },
      expired: { color: 'bg-gray-100 text-gray-500', label: 'Expirado' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/master">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ArrowLeft size={18} className="mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Pagamentos</h1>
              <p className="text-red-100 text-sm">Aprovar pagamentos e gerenciar assinaturas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.awaiting_approval}</p>
                  <p className="text-sm text-gray-500">Aguardando</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.approved}</p>
                  <p className="text-sm text-gray-500">Aprovados</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.total_revenue)}</p>
                  <p className="text-sm text-gray-500">Receita Total</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.month_revenue)}</p>
                  <p className="text-sm text-gray-500">Este Mês</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter size={20} className="text-gray-600" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todos</option>
                <option value="awaiting">Aguardando Aprovação</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
              </select>
            </div>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw size={16} className="mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-bold text-lg">Pagamentos ({payments.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando pagamentos...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plano</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Data</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{payment.user_name}</p>
                        <p className="text-xs text-gray-500">{payment.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{payment.plan_nome}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{formatCurrency(payment.valor)}</td>
                      <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(payment.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPayment(payment.id)}
                        >
                          <Eye size={16} className="mr-1" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Payment Details */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Detalhes do Pagamento</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User size={18} />
                  Dados do Usuário
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nome:</span>
                    <p className="font-medium">{selectedPayment.user_details?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedPayment.user_details?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Telefone:</span>
                    <p className="font-medium">{selectedPayment.user_details?.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <p className="font-medium capitalize">{selectedPayment.user_details?.user_type}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CreditCard size={18} />
                  Dados do Pagamento
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Plano:</span>
                    <p className="font-medium">{selectedPayment.plan_nome}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Valor:</span>
                    <p className="font-bold text-green-600">{formatCurrency(selectedPayment.valor)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p>{getStatusBadge(selectedPayment.status)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Criado em:</span>
                    <p className="font-medium">{formatDate(selectedPayment.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Receipt */}
              {selectedPayment.receipt_url && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileImage size={18} />
                    Comprovante
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    {selectedPayment.receipt_url.endsWith('.pdf') ? (
                      <a 
                        href={`${BACKEND_URL}${selectedPayment.receipt_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 text-center text-blue-600 hover:bg-blue-50"
                      >
                        <FileImage className="w-12 h-12 mx-auto mb-2" />
                        Clique para abrir o PDF
                      </a>
                    ) : (
                      <img 
                        src={`${BACKEND_URL}${selectedPayment.receipt_url}`}
                        alt="Comprovante"
                        className="w-full max-h-96 object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedPayment.status === 'awaiting' && (
                <div className="border-t pt-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo da Rejeição (se aplicável)
                    </label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Ex: Comprovante ilegível, valor incorreto..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleApprove(false)}
                      disabled={processing}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle size={18} className="mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => handleApprove(true)}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <CheckCircle size={18} className="mr-2" />
                      )}
                      Aprovar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminPagamentos;
