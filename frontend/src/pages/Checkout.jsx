import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { 
  Copy, Check, Upload, ArrowLeft, Clock, AlertCircle,
  CreditCard, QrCode, FileText, CheckCircle, X
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const Checkout = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);
  
  const [plan, setPlan] = useState(null);
  const [pixInfo, setPixInfo] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Pix, 3: Comprovante, 4: Aguardando

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { redirectTo: `/checkout/${planId}` } });
      return;
    }
    
    fetchData();
  }, [planId, isAuthenticated, navigate]);

  const fetchData = async () => {
    try {
      // Buscar info do plano
      const planResponse = await api.get(`/payments/plans/${planId}`);
      setPlan(planResponse.data);
      
      // Buscar info do Pix
      const pixResponse = await api.get('/payments/pix-info');
      setPixInfo(pixResponse.data);
      
      // Verificar se já tem pagamento pendente
      const paymentsResponse = await api.get('/payments/my-payments?status=pending');
      const pendingPayment = paymentsResponse.data.find(p => p.plan_type === planId);
      
      if (pendingPayment) {
        setPayment(pendingPayment);
        setStep(2);
      }
      
      // Verificar se tem pagamento aguardando aprovação
      const awaitingResponse = await api.get('/payments/my-payments?status=awaiting_approval');
      const awaitingPayment = awaitingResponse.data.find(p => p.plan_type === planId);
      
      if (awaitingPayment) {
        setPayment(awaitingPayment);
        setStep(4);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar informações do plano');
      navigate('/planos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    setCreating(true);
    try {
      const response = await api.post('/payments/create', {
        plan_type: planId
      });
      setPayment(response.data);
      setStep(2);
      toast.success('Pedido criado! Agora faça o pagamento via Pix.');
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar pagamento');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixInfo.key);
      setCopied(true);
      toast.success('Chave Pix copiada!');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const handleUploadReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      await api.post(`/payments/${payment.id}/upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Comprovante enviado! Aguarde a aprovação.');
      setStep(4);
      
      // Atualizar dados do pagamento
      const response = await api.get('/payments/my-payments');
      const updatedPayment = response.data.find(p => p.id === payment.id);
      if (updatedPayment) setPayment(updatedPayment);
      
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar comprovante');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar este pagamento?')) return;
    
    try {
      await api.delete(`/payments/${payment.id}/cancel`);
      toast.success('Pagamento cancelado');
      navigate('/planos');
    } catch (error) {
      toast.error('Erro ao cancelar pagamento');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Link to="/planos" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6">
            <ArrowLeft size={18} className="mr-2" />
            Voltar para Planos
          </Link>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <Check size={20} /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-16 md:w-24 h-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between text-xs text-gray-500 mb-8 px-2">
            <span>Confirmar</span>
            <span>Pagar</span>
            <span>Enviar</span>
            <span>Aprovação</span>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Step 1: Confirmar Plano */}
            {step === 1 && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <CreditCard size={48} className="mx-auto text-blue-600 mb-4" />
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirmar Assinatura</h1>
                  <p className="text-gray-600">Revise os detalhes do seu plano</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Plano</span>
                    <span className="font-semibold text-gray-800">{plan?.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Período</span>
                    <span className="font-semibold text-gray-800">
                      {plan?.duration_days === 90 ? '3 meses' : '1 ano'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Tipo de conta</span>
                    <span className="font-semibold text-gray-800 capitalize">{plan?.user_type}</span>
                  </div>
                  <hr className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(plan?.price)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCreatePayment}
                  disabled={creating}
                  className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
                  data-testid="btn-confirm-payment"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Confirmar e Pagar via Pix
                      <QrCode size={20} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: Pagar via Pix */}
            {step === 2 && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <QrCode size={48} className="mx-auto text-green-600 mb-4" />
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">Pague via Pix</h1>
                  <p className="text-gray-600">Copie a chave Pix e faça o pagamento</p>
                </div>

                {/* Valor */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6 text-center">
                  <p className="text-green-600 text-sm mb-1">Valor a pagar</p>
                  <p className="text-4xl font-bold text-green-700">{formatPrice(payment?.amount)}</p>
                </div>

                {/* Chave Pix */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-500 mb-2">Chave Pix ({pixInfo?.key_type})</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border rounded-lg px-4 py-3 text-sm font-mono break-all">
                      {pixInfo?.key}
                    </code>
                    <Button
                      onClick={handleCopyPix}
                      variant="outline"
                      className={copied ? 'bg-green-50 border-green-500 text-green-600' : ''}
                      data-testid="btn-copy-pix"
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    <strong>Beneficiário:</strong> {pixInfo?.beneficiary_name}
                  </p>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-2 text-amber-600 mb-6">
                  <Clock size={18} />
                  <span className="text-sm">
                    Este pagamento expira em {formatDate(payment?.expires_at)}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={() => setStep(3)}
                    className="w-full py-6 text-lg bg-green-600 hover:bg-green-700"
                    data-testid="btn-go-to-upload"
                  >
                    Já Paguei - Enviar Comprovante
                    <Upload size={20} className="ml-2" />
                  </Button>
                  
                  <button
                    onClick={handleCancelPayment}
                    className="w-full text-sm text-gray-500 hover:text-red-600 py-2"
                  >
                    Cancelar pagamento
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Enviar Comprovante */}
            {step === 3 && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <FileText size={48} className="mx-auto text-blue-600 mb-4" />
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">Enviar Comprovante</h1>
                  <p className="text-gray-600">Faça upload do comprovante de pagamento</p>
                </div>

                <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-8 mb-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleUploadReceipt}
                    className="hidden"
                    data-testid="input-receipt"
                  />
                  
                  <Upload size={48} className="mx-auto text-blue-400 mb-4" />
                  <p className="text-gray-700 mb-2">
                    Arraste o arquivo aqui ou
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    variant="outline"
                    className="border-blue-500 text-blue-600"
                    data-testid="btn-select-file"
                  >
                    {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-4">
                    Formatos aceitos: JPEG, PNG, WebP, PDF (máx. 10MB)
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-amber-800 mb-1">Importante</p>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• O comprovante deve mostrar claramente o valor e destinatário</li>
                        <li>• A aprovação pode levar até 24h úteis</li>
                        <li>• Você receberá uma notificação quando for aprovado</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  ← Voltar para dados do Pix
                </button>
              </div>
            )}

            {/* Step 4: Aguardando Aprovação */}
            {step === 4 && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={40} className="text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">Aguardando Aprovação</h1>
                  <p className="text-gray-600">Seu comprovante foi enviado e está sendo analisado</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Plano</span>
                    <span className="font-semibold text-gray-800">{payment?.plan_name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Valor</span>
                    <span className="font-semibold text-gray-800">{formatPrice(payment?.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Status</span>
                    <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                      Aguardando Aprovação
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Enviado em</span>
                    <span className="font-semibold text-gray-800">{formatDate(payment?.updated_at)}</span>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-green-800 mb-1">O que acontece agora?</p>
                      <p className="text-sm text-green-700">
                        Nossa equipe irá verificar o comprovante em até 24h úteis. 
                        Você receberá uma notificação assim que o pagamento for aprovado.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link to="/admin/notificacoes">
                    <Button className="w-full py-4 bg-blue-600 hover:bg-blue-700">
                      Ver Minhas Notificações
                    </Button>
                  </Link>
                  
                  <Link to="/admin/dashboard">
                    <Button variant="outline" className="w-full py-4">
                      Ir para o Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
