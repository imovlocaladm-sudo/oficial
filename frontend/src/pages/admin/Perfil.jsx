import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { 
  ArrowLeft, Save, User, Mail, Phone, MapPin, Building, 
  CreditCard, Camera, Trash2, Lock, Eye, EyeOff, FileText, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../../services/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Perfil = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);
  
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cpf: user?.cpf || '',
    city: user?.city || '',
    state: user?.state || '',
    creci: user?.creci || '',
    company: user?.company || '',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [bioCharCount, setBioCharCount] = useState(user?.bio?.length || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Atualizar contador de caracteres para bio
    if (name === 'bio') {
      setBioCharCount(value.length);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Função para obter URL completa da foto
  const getProfilePhotoUrl = () => {
    if (!user?.profile_photo) return null;
    if (user.profile_photo.startsWith('http')) return user.profile_photo;
    return `${BACKEND_URL}${user.profile_photo}`;
  };

  // Upload de foto de perfil
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido', {
        description: 'Use JPEG, PNG, WebP ou GIF.'
      });
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'O tamanho máximo é 5MB.'
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const updatedUser = await authAPI.uploadProfilePhoto(file);
      updateUser(updatedUser);
      toast.success('Foto atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar foto', {
        description: error.response?.data?.detail || 'Tente novamente.'
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Remover foto de perfil
  const handleRemovePhoto = async () => {
    if (!window.confirm('Deseja realmente remover sua foto de perfil?')) return;

    setUploadingPhoto(true);
    try {
      const updatedUser = await authAPI.deleteProfilePhoto();
      updateUser(updatedUser);
      toast.success('Foto removida com sucesso!');
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Erro ao remover foto', {
        description: error.response?.data?.detail || 'Tente novamente.'
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Salvar alterações do perfil
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const profileData = {
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        creci: formData.creci,
        company: formData.company,
        bio: formData.bio
      };

      const updatedUser = await authAPI.updateProfile(profileData);
      updateUser(updatedUser);
      
      toast.success('Perfil atualizado com sucesso!', {
        description: 'Suas informações foram salvas.',
      });
      
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil', {
        description: error.response?.data?.detail || 'Tente novamente.'
      });
    }
  };

  // Trocar senha
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validações
    if (passwordData.new_password.length < 6) {
      toast.error('Senha muito curta', {
        description: 'A nova senha deve ter pelo menos 6 caracteres.'
      });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Senhas não coincidem', {
        description: 'A nova senha e a confirmação devem ser iguais.'
      });
      return;
    }

    try {
      await authAPI.changePassword(passwordData);
      
      toast.success('Senha alterada com sucesso!', {
        description: 'Use a nova senha no próximo login.',
      });
      
      setChangingPassword(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha', {
        description: error.response?.data?.detail || 'Verifique a senha atual e tente novamente.'
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso!');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ArrowLeft size={18} className="mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Meu Perfil</h1>
              <p className="text-blue-100 text-sm">Gerencie suas informações pessoais</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          
          {/* Profile Header com Foto */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-6">
              {/* Foto de Perfil */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  {user?.profile_photo ? (
                    <img 
                      src={getProfilePhotoUrl()} 
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-white" size={48} />
                  )}
                </div>
                
                {/* Botões de foto */}
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors shadow-lg"
                    title="Alterar foto"
                    data-testid="btn-upload-photo"
                  >
                    <Camera size={16} />
                  </button>
                  {user?.profile_photo && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors shadow-lg"
                      title="Remover foto"
                      data-testid="btn-remove-photo"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  data-testid="input-photo"
                />
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
                <p className="text-gray-600">{user?.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user?.user_type === 'corretor'
                      ? 'bg-blue-100 text-blue-700'
                      : user?.user_type === 'imobiliaria'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user?.user_type === 'corretor' ? 'Corretor' : user?.user_type === 'imobiliaria' ? 'Imobiliária' : 'Particular'}
                  </span>
                  {user?.creci && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      CRECI: {user.creci}
                    </span>
                  )}
                  {user?.plan_type === 'lifetime' && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      ⭐ Vitalício
                    </span>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setEditing(!editing)}
                data-testid="btn-edit-profile"
              >
                {editing ? 'Cancelar' : 'Editar'}
              </Button>
            </div>

            {uploadingPhoto && (
              <div className="mt-4 text-center text-sm text-blue-600">
                Enviando foto...
              </div>
            )}
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Informações Pessoais</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-2" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    data-testid="input-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-2" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard size={16} className="inline mr-2" />
                    CPF
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">CPF não pode ser alterado</p>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-2" />
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!editing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    data-testid="input-city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={!editing}
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    data-testid="input-state"
                  />
                </div>
              </div>

              {/* Corretor Info */}
              {user?.user_type === 'corretor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CRECI</label>
                    <input
                      type="text"
                      name="creci"
                      value={formData.creci}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                      data-testid="input-creci"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building size={16} className="inline mr-2" />
                      Imobiliária
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                      data-testid="input-company"
                    />
                  </div>
                </div>
              )}

              {/* Descrição do Profissional - Tarefa 2.2 */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText size={16} className="inline mr-2" />
                  Descrição do Profissional
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!editing}
                  maxLength={750}
                  rows={4}
                  placeholder="Conte um pouco sobre você, sua experiência e especialidades..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 resize-none"
                  data-testid="input-bio"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    Esta descrição será exibida nos seus anúncios
                  </p>
                  <p className={`text-xs ${bioCharCount > 700 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {bioCharCount}/750 caracteres
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              {editing && (
                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    data-testid="btn-save-profile"
                  >
                    <Save size={18} className="mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* Seção de Troca de Senha - Tarefa 2.3 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Segurança</h3>
                <p className="text-sm text-gray-600">Gerencie sua senha de acesso</p>
              </div>
              {!changingPassword && (
                <Button
                  variant="outline"
                  onClick={() => setChangingPassword(true)}
                  data-testid="btn-change-password"
                >
                  <Lock size={18} className="mr-2" />
                  Trocar Senha
                </Button>
              )}
            </div>

            {changingPassword && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Digite sua senha atual"
                      data-testid="input-current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Mínimo 6 caracteres"
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Confirme a nova senha"
                      data-testid="input-confirm-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Indicador de correspondência de senha */}
                {passwordData.new_password && passwordData.confirm_password && (
                  <div className={`flex items-center gap-2 text-sm ${
                    passwordData.new_password === passwordData.confirm_password 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {passwordData.new_password === passwordData.confirm_password ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Senhas coincidem</span>
                      </>
                    ) : (
                      <span>As senhas não coincidem</span>
                    )}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setChangingPassword(false);
                      setPasswordData({
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                      });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    data-testid="btn-submit-password"
                  >
                    <Lock size={18} className="mr-2" />
                    Alterar Senha
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-200">
            <h3 className="text-xl font-bold text-red-600 mb-4">Zona de Perigo</h3>
            <p className="text-gray-600 mb-4">
              Ao sair da sua conta, você precisará fazer login novamente para acessar a área administrativa.
            </p>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-red-600 text-red-600 hover:bg-red-50"
              data-testid="btn-logout"
            >
              Sair da Conta
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Perfil;
