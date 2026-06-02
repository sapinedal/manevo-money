import React from 'react';
import { useAuthStore } from '../../core/store/auth.store';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory
} from '../../infrastructure/hooks/useFinance';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, Utensils, Car, Home as HomeIcon, Film, Heart, Book, TrendingUp } from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';

const renderCategoryIcon = (iconName: string) => {
  const iconSize = 18;
  switch (iconName) {
    case 'utensils':
      return <Utensils size={iconSize} />;
    case 'car':
      return <Car size={iconSize} />;
    case 'home':
      return <HomeIcon size={iconSize} />;
    case 'film':
      return <Film size={iconSize} />;
    case 'heart':
      return <Heart size={iconSize} />;
    case 'book':
      return <Book size={iconSize} />;
    case 'trending-up':
      return <TrendingUp size={iconSize} />;
    default:
      return <span className="text-xl select-none leading-none">{iconName || '🏷️'}</span>;
  }
};

const categoryIconOptions = [
  { value: '🍔', label: 'Comida / Restaurantes', icon: '🍔' },
  { value: '🚗', label: 'Transporte / Gasolina', icon: '🚗' },
  { value: '🏠', label: 'Hogar / Servicios', icon: '🏠' },
  { value: '🛍️', label: 'Compras / Ropa', icon: '🛍️' },
  { value: '🏥', label: 'Salud / Farmacia', icon: '🏥' },
  { value: '🎓', label: 'Educación / Cursos', icon: '🎓' },
  { value: '🎮', label: 'Entretenimiento / Ocio', icon: '🎮' },
  { value: '✈️', label: 'Viajes / Vacaciones', icon: '✈️' },
  { value: '💰', label: 'Ingresos / Sueldo', icon: '💰' },
  { value: '⚙️', label: 'Otros / Varios', icon: '⚙️' },
];

const categoryColorOptions = [
  { value: '#0c5c36', label: 'Verde Esmeralda', icon: '🟢' },
  { value: '#737f78', label: 'Verde Salvia', icon: '🔘' },
  { value: '#991b1b', label: 'Rojo Carmesí', icon: '🔴' },
  { value: '#3b82f6', label: 'Azul Brillante', icon: '🔵' },
  { value: '#a855f7', label: 'Púrpura Amatista', icon: '🟣' },
  { value: '#eab308', label: 'Amarillo Sol', icon: '🟡' },
  { value: '#f97316', label: 'Naranja Vivo', icon: '🟠' },
];

export function Categories() {
  const { activeWorkspaceId } = useAuthStore();
  const { data: categories, isLoading } = useCategories(activeWorkspaceId);
  const createCategoryMutation = useCreateCategory(activeWorkspaceId);
  const updateCategoryMutation = useUpdateCategory(activeWorkspaceId);
  const deleteCategoryMutation = useDeleteCategory(activeWorkspaceId);

  // Creation Popover State
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [createName, setCreateName] = React.useState('');
  const [createIcon, setCreateIcon] = React.useState('🍔');
  const [createColor, setCreateColor] = React.useState('#0c5c36');
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Inline Editing State
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editIcon, setEditIcon] = React.useState('🍔');
  const [editColor, setEditColor] = React.useState('#0c5c36');
  const [editError, setEditError] = React.useState<string | null>(null);

  const handleEditInit = (cat: any) => {
    if (cat.isSystem) return; // Do not edit system categories
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || '🍔');
    setEditColor(cat.color || '#0c5c36');
    setEditError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createName.trim()) {
      setCreateError('El nombre de la categoría es obligatorio.');
      return;
    }

    createCategoryMutation.mutate({
      name: createName.trim(),
      icon: createIcon,
      color: createColor,
    }, {
      onSuccess: () => {
        setCreateName('');
        setCreateIcon('🍔');
        setCreateColor('#0c5c36');
        setShowCreateForm(false);
      },
      onError: (err: any) => {
        setCreateError(err.response?.data?.message || 'Error al crear la categoría.');
      }
    });
  };

  const handleEditSubmit = (id: string) => {
    setEditError(null);

    if (!editName.trim()) {
      setEditError('El nombre de la categoría es obligatorio.');
      return;
    }

    updateCategoryMutation.mutate({
      id,
      name: editName.trim(),
      icon: editIcon,
      color: editColor,
    }, {
      onSuccess: () => {
        setEditingId(null);
      },
      onError: (err: any) => {
        setEditError(err.response?.data?.message || 'Error al actualizar la categoría.');
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteCategoryMutation.mutate(id, {
      onSuccess: () => {
        setEditingId(null);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-500/20 border-t-accent-500 animate-spin" />
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Cargando Categorías...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full pb-16 font-sans">
      {/* Header section with Create Popover trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Mis Categorías</h1>
          <p className="text-zinc-500 text-xs mt-1">Organiza tus transacciones creando y personalizando categorías de gastos e ingresos.</p>
        </div>

        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setCreateError(null);
            }}
            className="flex items-center justify-center gap-2 px-5 py-5 bg-[#0c5c36] hover:bg-[#0e6f42] text-white rounded-full font-bold text-xs tracking-wide transition-all shadow-lg shadow-[#0c5c36]/10"
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showCreateForm ? 'Cancelar' : 'Nueva'}</span>
          </motion.button>

          {/* Sage Green Floating 'Crear categoría' Popover */}
          <AnimatePresence>
            {showCreateForm && (
              <>
                <div
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setShowCreateForm(false)}
                />
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="absolute top-14 right-0 bg-[#737f78] border border-[#86928b]/50 text-zinc-950 rounded-[28px] p-6 shadow-2xl w-80 z-40 flex flex-col space-y-4 font-sans select-none"
                >
                  <div className="flex justify-between items-center pl-1">
                    <h3 className="text-xl font-bold text-zinc-950 tracking-tight">
                      Nueva categoría
                    </h3>
                  </div>

                  {createError && (
                    <div className="p-3 bg-[#691818] border border-red-500/30 text-white text-xs font-bold rounded-2xl mx-1 select-text">
                      {createError}
                    </div>
                  )}

                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    {/* Category Name */}
                    <input
                      type="text"
                      placeholder="Nombre de la categoría..."
                      required
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full bg-black/5 hover:bg-black/10 rounded-2xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-800/50 font-semibold focus:outline-none focus:bg-black/10 transition-colors"
                    />

                    {/* Icon CustomSelect */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1">Icono</span>
                      <CustomSelect
                        value={createIcon}
                        onChange={setCreateIcon}
                        options={categoryIconOptions}
                        variant="popover"
                      />
                    </div>

                    {/* Color CustomSelect */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1">Color</span>
                      <CustomSelect
                        value={createColor}
                        onChange={setCreateColor}
                        options={categoryColorOptions}
                        variant="popover"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={createCategoryMutation.isPending}
                        className="w-full bg-[#0c5c36] hover:bg-[#0e6f42] text-white rounded-2xl py-3 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Crear Categoría
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Categories grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories?.length === 0 ? (
          <div className="col-span-2 text-sm text-zinc-500 py-16 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20">
            No tienes categorías configuradas. ¡Crea una para comenzar!
          </div>
        ) : (
          categories?.map((cat: any) => {
            const isEditing = editingId === cat.id;
            return (
              <div
                key={cat.id}
                className="relative min-h-[120px]"
              >
                {/* View card */}
                <motion.div
                  layout
                  onClick={() => !cat.isSystem && handleEditInit(cat)}
                  className={`bg-[#070707]/60 border border-white/[0.04] hover:border-white/[0.1] p-6 rounded-[28px] flex justify-between items-center h-full transition-all ${cat.isSystem ? 'cursor-default' : 'cursor-pointer'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg"
                      style={{ backgroundColor: `${cat.color || '#0c5c36'}30`, border: `1px solid ${cat.color || '#0c5c36'}60` }}
                    >
                      {renderCategoryIcon(cat.icon)}
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-zinc-100 truncate max-w-[200px]">{cat.name}</h2>
                      {cat.isSystem ? (
                        <span className="px-2 py-0.5 bg-zinc-800/60 border border-zinc-700/50 text-[9px] font-bold text-zinc-400 rounded-full uppercase tracking-wider">
                          Sistema
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-white/[0.03] border border-white/[0.05] text-[9px] font-bold text-zinc-500 rounded-full uppercase tracking-wider">
                          Personalizada
                        </span>
                      )}
                    </div>
                  </div>

                  {!cat.isSystem && (
                    <div className="opacity-0 hover:opacity-100 p-1.5 text-zinc-500 transition-opacity">
                      <Edit2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>

                {/* Edit Popover (Floating style matching creation popover) */}
                <AnimatePresence>
                  {isEditing && (
                    <>
                      <div
                        className="fixed inset-0 z-30 cursor-default"
                        onClick={() => setEditingId(null)}
                      />
                      <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 15 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="absolute top-14 right-0 bg-[#737f78] border border-[#86928b]/50 text-zinc-950 rounded-[28px] p-6 shadow-2xl w-80 z-40 flex flex-col space-y-4 font-sans select-none"
                      >
                        <div className="flex justify-between items-center pl-1">
                          <h3 className="text-xl font-bold text-zinc-950 tracking-tight">
                            Editar categoría
                          </h3>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 hover:bg-black/5 rounded-full text-zinc-900 transition-colors"
                          >
                            <X className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>

                        {editError && (
                          <div className="p-3 bg-[#691818] border border-red-500/30 text-white text-xs font-bold rounded-2xl mx-1 select-text">
                            {editError}
                          </div>
                        )}

                        <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(cat.id); }} className="space-y-4">
                          {/* Category Name */}
                          <input
                            type="text"
                            required
                            placeholder="Nombre de la categoría..."
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-black/5 hover:bg-black/10 rounded-2xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-800/50 font-semibold focus:outline-none focus:bg-black/10 transition-colors"
                          />

                          {/* Icon CustomSelect */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1">Icono</span>
                            <CustomSelect
                              value={editIcon}
                              onChange={setEditIcon}
                              options={categoryIconOptions}
                              variant="popover"
                            />
                          </div>

                          {/* Color CustomSelect */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1">Color</span>
                            <CustomSelect
                              value={editColor}
                              onChange={setEditColor}
                              options={categoryColorOptions}
                              variant="popover"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between items-center pt-2">
                            <button
                              type="button"
                              onClick={() => handleDelete(cat.id)}
                              className="flex items-center justify-center p-2.5 bg-black/5 hover:bg-black/10 rounded-2xl text-rose-800 hover:text-rose-900 transition-colors"
                              title="Eliminar categoría"
                            >
                              <Trash2 className="w-4 h-4 stroke-[2.5]" />
                            </button>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-4 py-2.5 bg-black/5 hover:bg-black/10 text-zinc-800 rounded-2xl text-xs font-bold transition-all"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2.5 bg-[#0c5c36] hover:bg-[#0e6f42] text-white rounded-2xl text-xs font-bold transition-all"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        </form>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
