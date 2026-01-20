import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bannersAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MousePointerClick,
  Image as ImageIcon,
  ExternalLink,
  BarChart3,
  Power,
  PowerOff,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const AdminGerenciarBanners = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerStats, setBannerStats] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    link_url: '',
    position: 'home_topo',
    order: 0,
    status: 'active',
    image: null
  });

  // Position options
  const positionOptions = [
    { value: 'home_topo', label: 'Home - Topo da Página' },
    { value: 'home_meio', label: 'Home - Entre Destaques e Lançamentos' },
    { value: 'busca_lateral', label: 'Busca Detalhada - Lateral' },
    { value: 'busca_topo', label: 'Busca - Topo da Página' },
    { value: 'imovel_lateral', label: 'Detalhes do Imóvel - Lateral' },
    { value: 'rodape', label: 'Rodapé do Site' }
  ];

  useEffect(() => {
    if (user?.user_type !== 'admin' && user?.user_type !== 'admin_senior') {
      navigate('/');
      return;
    }
    loadBanners();
  }, [user, navigate]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await bannersAPI.getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
      toast.error('Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.link_url) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!editingBanner && !formData.image) {
      toast.error('Selecione uma imagem para o banner');
      return;
    }

    try {
      if (editingBanner) {
        // Update existing banner
        await bannersAPI.updateBanner(editingBanner.id, formData, formData.image);
        toast.success('Banner atualizado com sucesso!');
      } else {
        // Create new banner
        await bannersAPI.createBanner(formData, formData.image);
        toast.success('Banner criado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
      loadBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar banner');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      link_url: banner.link_url,
      position: banner.position,
      order: banner.order,
      status: banner.status,
      image: null
    });
    setImagePreview(`${process.env.REACT_APP_BACKEND_URL}${banner.image_url}`);
    setIsDialogOpen(true);
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Tem certeza que deseja excluir este banner?')) {
      return;
    }

    try {
      await bannersAPI.deleteBanner(bannerId);
      toast.success('Banner excluído com sucesso!');
      loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Erro ao excluir banner');
    }
  };

  const handleViewStats = async (bannerId) => {
    try {
      const stats = await bannersAPI.getBannerStats(bannerId);
      setBannerStats(stats);
      setIsStatsDialogOpen(true);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const toggleStatus = async (banner) => {
    try {
      const newStatus = banner.status === 'active' ? 'inactive' : 'active';
      await bannersAPI.updateBanner(banner.id, { status: newStatus });
      toast.success(`Banner ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
      loadBanners();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Erro ao alterar status do banner');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      link_url: '',
      position: 'home_topo',
      order: 0,
      status: 'active',
      image: null
    });
    setImagePreview(null);
    setEditingBanner(null);
  };

  const getPositionLabel = (position) => {
    const option = positionOptions.find(opt => opt.value === position);
    return option ? option.label : position;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/master')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title-banners">
                Gerenciar Banners Publicitários
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie os banners exibidos em diferentes áreas do site
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              data-testid="add-banner-btn"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Banner
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Banners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{banners.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Banners Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {banners.filter(b => b.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Visualizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {banners.reduce((sum, b) => sum + b.views, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Cliques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {banners.reduce((sum, b) => sum + b.clicks, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Banners Grid */}
        {banners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center mb-4">
                Nenhum banner cadastrado ainda.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <Card key={banner.id} className="overflow-hidden">
                <div className="relative">
                  <img
                    src={`${process.env.REACT_APP_BACKEND_URL}${banner.image_url}`}
                    alt={banner.title}
                    className="w-full h-48 object-cover"
                  />
                  <Badge 
                    className={`absolute top-2 right-2 ${
                      banner.status === 'active' 
                        ? 'bg-green-500' 
                        : 'bg-gray-500'
                    }`}
                  >
                    {banner.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg">{banner.title}</CardTitle>
                  <CardDescription>
                    {getPositionLabel(banner.position)}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizações
                      </span>
                      <span className="font-semibold">{banner.views}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <MousePointerClick className="h-4 w-4 mr-1" />
                        Cliques
                      </span>
                      <span className="font-semibold">{banner.clicks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">CTR</span>
                      <span className="font-semibold">
                        {banner.views > 0 
                          ? ((banner.clicks / banner.views) * 100).toFixed(2)
                          : '0.00'
                        }%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStats(banner.id)}
                      className="flex-1"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Stats
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(banner)}
                      className="flex-1"
                    >
                      {banner.status === 'active' ? (
                        <PowerOff className="h-4 w-4 mr-1" />
                      ) : (
                        <Power className="h-4 w-4 mr-1" />
                      )}
                      {banner.status === 'active' ? 'Pausar' : 'Ativar'}
                    </Button>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(banner)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(banner.id)}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Editar Banner' : 'Novo Banner'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do banner publicitário
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título (Identificação Interna) *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Banner Construtora XYZ - Janeiro 2026"
                required
              />
            </div>

            <div>
              <Label htmlFor="link_url">URL de Destino *</Label>
              <Input
                id="link_url"
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://www.exemplo.com.br"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                URL para onde o usuário será direcionado ao clicar
              </p>
            </div>

            <div>
              <Label htmlFor="position">Posição no Site *</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData({ ...formData, position: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order">Ordem de Exibição</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Menor número = maior prioridade
                </p>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="image">
                Imagem do Banner {!editingBanner && '*'}
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={!editingBanner}
              />
              <p className="text-sm text-gray-500 mt-1">
                Formatos: JPG, PNG, WebP, GIF • Tamanho máximo: 5MB
              </p>

              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Pré-visualização:</p>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded border"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingBanner ? 'Atualizar' : 'Criar'} Banner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estatísticas do Banner</DialogTitle>
            <DialogDescription>
              {bannerStats?.title}
            </DialogDescription>
          </DialogHeader>

          {bannerStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bannerStats.views}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                      <MousePointerClick className="h-4 w-4 mr-2" />
                      Cliques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bannerStats.clicks}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Taxa de Cliques (CTR)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {bannerStats.ctr}%
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {bannerStats.ctr >= 2 
                      ? '🎉 Excelente performance!' 
                      : bannerStats.ctr >= 1
                      ? '👍 Boa performance'
                      : '💡 Considere ajustar a posição ou imagem'
                    }
                  </p>
                </CardContent>
              </Card>

              <div className="text-sm text-gray-600">
                <p><strong>Posição:</strong> {getPositionLabel(bannerStats.position)}</p>
                <p><strong>Status:</strong> {bannerStats.status === 'active' ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsStatsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGerenciarBanners;
