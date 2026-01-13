import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { ArrowLeft, UserCheck, UserX, Pause, Trash2, Filter, UserPlus, X, RefreshCw, Edit } from 'lucide-react';
import { adminAPIService } from '../../services/adminAPI';
import { toast } from 'sonner';

const states = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
];

const AdminGerenciarUsuarios = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({ status: '', userType: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    cpf: '',
    city: '',
    state: 'MS',
    user_type: 'particular',
    creci: '',
    company: ''
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    city: '',
    state: '',
    user_type: '',
    creci: '',
    company: '',
    cnpj: '',
    razao_social: '',
    status: '',
    plan_type: '',
    bio: '',
    new_password: ''
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (user?.user_type !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchUsers();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchUsers(true); // Silent refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, [filter, user, navigate]);

  const fetchUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await adminAPIService.getAllUsers(filter.status || null, filter.userType || null);
      setUsers(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching users:', error);
      if (!silent) toast.error('Erro ao carregar usuários');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  const handleStatusChange = async (userId, newStatus) => {
    const statusText = newStatus === 'active' ? 'ativar' : newStatus === 'paused' ? 'pausar' : 'marcar como pendente';
    if (!window.confirm(`Tem certeza que deseja ${statusText} este usuário?`)) {
      return;
    }

    try {
      await adminAPIService.updateUserStatus(userId, newStatus);
      toast.success('Status do usuário atualizado!');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const confirmDeleteUser = (userId, userName) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await adminAPIService.deleteUser(userToDelete.id);
      toast.success('Usuário excluído com sucesso!');
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.phone || !newUser.cpf) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await adminAPIService.createUser(newUser);
      toast.success('Usuário criado com sucesso!');
      setShowAddModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        phone: '',
        cpf: '',
        city: '',
        state: 'MS',
        user_type: 'particular',
        creci: '',
        company: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.detail || 'Erro ao criar usuário');
    }
  };


  const handleOpenEditModal = async (userId) => {
    try {
      const userDetails = await adminAPIService.getUserDetails(userId);
      setUserToEdit(userDetails);
      setEditUser({
        name: userDetails.name || '',
        email: userDetails.email || '',
        phone: userDetails.phone || '',
        cpf: userDetails.cpf || '',
        city: userDetails.city || '',
        state: userDetails.state || '',
        user_type: userDetails.user_type || '',
        creci: userDetails.creci || '',
        company: userDetails.company || '',
        cnpj: userDetails.cnpj || '',
        razao_social: userDetails.razao_social || '',
        status: userDetails.status || '',
        plan_type: userDetails.plan_type || 'free',
        bio: userDetails.bio || '',
        new_password: ''
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Erro ao carregar detalhes do usuário');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editUser.name || !editUser.email || !editUser.phone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await adminAPIService.fullEditUser(userToEdit.id, editUser);
      toast.success('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      setUserToEdit(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar usuário');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/master">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft size={18} className="mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
                <p className="text-red-100 text-sm">Administração de todos os usuários da plataforma</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-white text-red-600 hover:bg-gray-100"
            >
              <UserPlus size={18} className="mr-2" />
              Adicionar Usuário
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Filter size={20} className="text-gray-600" />
              <h3 className="font-bold text-gray-800">Filtros</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw size={14} />
              <span>Última atualização: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}</span>
              <Button size="sm" variant="outline" onClick={() => fetchUsers()}>
                <RefreshCw size={14} className="mr-1" />
                Atualizar
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todos</option>
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="paused">Pausado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={filter.userType}
                onChange={(e) => setFilter({ ...filter, userType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todos</option>
                <option value="particular">Particular</option>
                <option value="corretor">Corretor</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => fetchUsers()} className="w-full bg-red-600 hover:bg-red-700">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-bold text-lg">Usuários Cadastrados ({users.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Imóveis</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cidade</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.user_type === 'corretor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.user_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.status === 'active' ? 'bg-green-100 text-green-700' :
                          u.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {u.status === 'active' ? 'Ativo' : u.status === 'pending' ? 'Pendente' : 'Pausado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{u.properties_count}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{u.city} - {u.state}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {u.status !== 'active' && (
                            <button
                              onClick={() => handleStatusChange(u.id, 'active')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Ativar"
                            >
                              <UserCheck size={16} />
                            </button>
                          )}
                          {u.status !== 'paused' && (
                            <button
                              onClick={() => handleStatusChange(u.id, 'paused')}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                              title="Pausar"
                            >
                              <Pause size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => confirmDeleteUser(u.id, u.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Modal: Add User */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Adicionar Novo Usuário</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="(67) 99999-9999"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                  <input
                    type="text"
                    value={newUser.cpf}
                    onChange={(e) => setNewUser({ ...newUser, cpf: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuário *</label>
                  <select
                    value={newUser.user_type}
                    onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="particular">Particular</option>
                    <option value="corretor">Corretor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={newUser.city}
                    onChange={(e) => setNewUser({ ...newUser, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={newUser.state}
                    onChange={(e) => setNewUser({ ...newUser, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    {states.map(s => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {newUser.user_type === 'corretor' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CRECI</label>
                      <input
                        type="text"
                        value={newUser.creci}
                        onChange={(e) => setNewUser({ ...newUser, creci: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="CRECI-MS 00000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empresa/Imobiliária</label>
                      <input
                        type="text"
                        value={newUser.company}
                        onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  <UserPlus size={18} className="mr-2" />
                  Criar Usuário
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Confirmar Exclusão</h3>
              <p className="text-center text-gray-600 mb-4">
                Tem certeza que deseja excluir permanentemente o usuário <strong>{userToDelete.name}</strong>?
              </p>
              <p className="text-center text-red-600 text-sm mb-6">
                ⚠️ Esta ação irá remover o usuário e TODOS os seus imóveis cadastrados. Esta ação não pode ser desfeita!
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteUser}
                >
                  Excluir Permanentemente
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

export default AdminGerenciarUsuarios;
