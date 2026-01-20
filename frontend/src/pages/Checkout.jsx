import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { 
  Copy, 
  Check, 
  Upload, 
  ArrowLeft, 
  CreditCard, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileImage,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [plan, setPlan] = useState(null);
  const [pixInfo, setPixInfo] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [step, setStep] = useState(1); // 1: Confirmar, 2: PIX, 3: Comprovante, 4: Aguardando

  const planId = searchParams.get('plan');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { returnTo: `/checkout?plan=${planId}` } });
      return;
    }
    
    if (!planId) {
      navigate('/planos');
      return;
    }

    fetchData();
  }, [planId, isAuthenticated, navigate]);

  const fetchData = async () => {
    try {
      // Buscar planos
      const plansResponse = await axios.get(`${API_URL}/payments/plans`);
      const selectedPlan = plansResponse.data.find(p => p.id === planId);
      
      if (!selectedPlan) {
        toast.error('Plano não encontrado');
        navigate('/planos');
        return;
      }

      // Verificar se plano é compatível com tipo de usuário
      if (selectedPlan.user_type !== user?.user_type) {
        toast.error(`Este plano é apenas para usuários do tipo ${selectedPlan.user_type}`);
        navigate('/planos');
        return;
      }

      setPlan(selectedPlan);

      // Buscar info do PIX
      const pixResponse = await axios.get(`${API_URL}/payments/pix-info`);
      setPixInfo(pixResponse.data);

      // Verificar se já tem pagamento pendente
      const token = JSON.parse(localStorage.getItem('imovlocal_user'))?.access_token;
      if (token) {
        const paymentsResponse = await axios.get(`${API_URL}/payments/my-payments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const pendingPayment = paymentsResponse.data.find(
          p => p.status === 'pending' || p.status === 'awaiting'
        );
        
        if (pendingPayment) {
          setPayment(pendingPayment);
          if (pendingPayment.status === 'awaiting') {
            setStep(4);
          } else if (pendingPayment.receipt_url) {
            setStep(3);
          } else {
            setStep(2);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    setCreating(true);
    try {
      const token = JSON.parse(localStorage.getItem('imovlocal_user'))?.access_token;
      const response = await axios.post(
        `${API_URL}/payments/create`,
        { plan_id: planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPayment(response.data);
      setStep(2);
      toast.success('Pedido criado! Agora realize o pagamento via PIX.');
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar pedido');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyPix = useCallback(() => {
    if (pixInfo?.chave) {
      navigator.clipboard.writeText(pixInfo.chave);
      setCopied(true);
      toast.success('Chave PIX copiada!');
      setTimeout(() => setCopied(false), 3000);
    }
  }, [pixInfo]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou PDF.');
        return;
      }
      
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedFile || !payment) return;

    setUploading(true);
    try {
      const token = JSON.parse(localStorage.getItem('imovlocal_user'))?.access_token;
      const formData = new FormData();
      formData.append('receipt', selectedFile);

      await axios.post(
        `${API_URL}/payments/${payment.id}/upload-receipt`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Comprovante enviado! Aguarde a aprovação.');
      setStep(4);
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar comprovante');
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate('/planos')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Planos
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3, 4].map((s, index) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {index < 3 && (
                  <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-red-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Step 1: Confirmar Plano */}
                {step === 1 && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      <CreditCard className="inline-block w-6 h-6 mr-2 text-red-600" />
                      Confirmar Assinatura
                    </h2>
                    <div className="border rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">
                        {plan?.nome}
                      </h3>
                      <p className="text-gray-600 mb-4">{plan?.descricao}</p>
                      <ul className="space-y-2">
                        {plan?.recursos.map((recurso, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-600 mr-2" />
                            {recurso}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      onClick={handleCreatePayment}
                      disabled={creating}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {creating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Criando pedido...
                        </>
                      ) : (
                        <>
                          Continuar para Pagamento
                          <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Step 2: Pagamento PIX */}
                {step === 2 && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      <CreditCard className="inline-block w-6 h-6 mr-2 text-red-600" />
                      Pagamento via PIX
                    </h2>
                    
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                      <p className="text-gray-600 mb-4">
                        Copie a chave PIX abaixo e realize o pagamento de <strong>{formatCurrency(plan?.valor)}</strong> através do seu banco:
                      </p>
                      
                      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                        <p className="text-xs text-gray-500 mb-1">Chave PIX (Aleatória)</p>
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono text-gray-800 break-all">
                            {pixInfo?.chave}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyPix}
                            className="ml-2 flex-shrink-0"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Beneficiário:</strong> {pixInfo?.beneficiario}</p>
                        <p><strong>CNPJ:</strong> {pixInfo?.cnpj}</p>
                        <p><strong>Banco:</strong> {pixInfo?.banco}</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <p className="text-yellow-800 text-sm">
                        <AlertCircle className="inline-block w-4 h-4 mr-1" />
                        <strong>Importante:</strong> Após realizar o pagamento, clique no botão abaixo para enviar o comprovante.
                      </p>
                    </div>

                    <Button
                      onClick={() => setStep(3)}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      Já fiz o pagamento - Enviar Comprovante
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </>
                )}

                {/* Step 3: Enviar Comprovante */}
                {step === 3 && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      <Upload className="inline-block w-6 h-6 mr-2 text-red-600" />
                      Enviar Comprovante
                    </h2>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecione o comprovante de pagamento
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="receipt-upload"
                        />
                        <label htmlFor="receipt-upload" className="cursor-pointer">
                          {selectedFile ? (
                            <div className="flex items-center justify-center gap-3">
                              <FileImage className="w-8 h-8 text-green-600" />
                              <div className="text-left">
                                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                                <p className="text-sm text-gray-500">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedFile(null);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-600 mb-1">
                                Clique para selecionar ou arraste o arquivo
                              </p>
                              <p className="text-sm text-gray-400">
                                JPEG, PNG, WebP ou PDF (máx. 10MB)
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <Button
                      onClick={handleUploadReceipt}
                      disabled={!selectedFile || uploading}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar Comprovante
                          <Upload className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Step 4: Aguardando Aprovação */}
                {step === 4 && (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Aguardando Aprovação
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Seu comprovante foi enviado com sucesso! Nossa equipe irá analisar e aprovar seu pagamento em até <strong>24 horas úteis</strong>.
                    </p>
                    <p className="text-gray-500 text-sm mb-8">
                      Você receberá uma notificação quando seu plano for ativado.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => navigate('/admin/dashboard')}
                      >
                        Ir para Dashboard
                      </Button>
                      <Button
                        onClick={() => navigate('/admin/notificacoes')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Ver Notificações
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
                <h3 className="font-bold text-lg text-gray-800 mb-4">
                  Resumo do Pedido
                </h3>
                
                <div className="border-b pb-4 mb-4">
                  <p className="font-medium text-gray-800">{plan?.nome}</p>
                  <p className="text-sm text-gray-500">{plan?.periodo}</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">{formatCurrency(plan?.valor || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Desconto</span>
                    <span className="text-green-600">R$ 0,00</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-800">Total</span>
                    <span className="text-red-600 text-xl">{formatCurrency(plan?.valor || 0)}</span>
                  </div>
                </div>

                {payment && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">ID do Pedido:</p>
                    <p className="text-sm font-mono text-gray-600">{payment.id?.slice(0, 8)}...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
