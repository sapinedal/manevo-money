import React from 'react';
import { useAuthStore } from '../../core/store/auth.store';
import { 
  useAccounts, 
  useCreateAccount, 
  useUpdateAccount, 
  useDeleteAccount 
} from '../../infrastructure/hooks/useFinance';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';

const accountTypeOptions = [
  { value: 'BANK', label: 'Cuenta de banco', icon: '🏦' },
  { value: 'CASH', label: 'Efectivo', icon: '💵' },
  { value: 'CREDIT_CARD', label: 'Tarjeta de crédito', icon: '💳' },
];

export function Accounts() {
  const { activeWorkspaceId } = useAuthStore();
  const { data: accounts, isLoading } = useAccounts(activeWorkspaceId);
  const createAccountMutation = useCreateAccount(activeWorkspaceId);
  const updateAccountMutation = useUpdateAccount(activeWorkspaceId);
  const deleteAccountMutation = useDeleteAccount(activeWorkspaceId);

  // Creation Popover State
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [createName, setCreateName] = React.useState('');
  const [createType, setCreateType] = React.useState('BANK');
  const [createBalance, setCreateBalance] = React.useState('');
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Inline Editing State
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editType, setEditType] = React.useState('BANK');
  const [editBalance, setEditBalance] = React.useState('');
  const [editError, setEditError] = React.useState<string | null>(null);

  const getAccountEmoji = (type: string) => {
    if (type === 'CASH') return '💵';
    if (type === 'CREDIT_CARD') return '💳';
    return '🏦';
  };

  const getAccountTypeName = (type: string) => {
    if (type === 'CASH') return 'Efectivo';
    if (type === 'CREDIT_CARD') return 'Tarjeta de crédito';
    return 'Cuenta de banco';
  };

  const handleCreateAmountChange = (val: string) => {
    const cleanVal = val.replace(/\./g, '');
    if (cleanVal === '') {
      setCreateBalance('');
      return;
    }
    const parsed = parseInt(cleanVal, 10);
    if (isNaN(parsed)) return;
    setCreateBalance(new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parsed));
  };

  const handleEditAmountChange = (val: string) => {
    const cleanVal = val.replace(/\./g, '');
    if (cleanVal === '') {
      setEditBalance('');
      return;
    }
    const parsed = parseInt(cleanVal, 10);
    if (isNaN(parsed)) return;
    setEditBalance(new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parsed));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const cleanBalance = Number(createBalance.replace(/\./g, '')) || 0;

    createAccountMutation.mutate({
      name: createName.trim(),
      type: createType,
      balance: cleanBalance,
      currency: 'COP',
    }, {
      onSuccess: () => {
        setCreateName('');
        setCreateBalance('');
        setShowCreateForm(false);
      },
      onError: (err: any) => {
        setCreateError(err.response?.data?.message || 'Error al crear la cuenta.');
      }
    });
  };

  const handleEditInit = (acc: any) => {
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditType(acc.type);
    const formatted = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(acc.balance));
    setEditBalance(formatted);
    setEditError(null);
  };

  const handleEditSubmit = (id: string) => {
    setEditError(null);
    const cleanBalance = Number(editBalance.replace(/\./g, '')) || 0;

    updateAccountMutation.mutate({
      id,
      name: editName.trim(),
      type: editType,
      balance: cleanBalance,
    }, {
      onSuccess: () => {
        setEditingId(null);
      },
      onError: (err: any) => {
        setEditError(err.response?.data?.message || 'Error al actualizar la cuenta.');
      }
    });
  };

  const handleDelete = (id: string) => {
    deleteAccountMutation.mutate(id, {
      onSuccess: () => {
        setEditingId(null);
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-500/20 border-t-accent-500 animate-spin" />
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Cargando Cuentas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full pb-16 font-sans">
      {/* Header section with Create Popover trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Mis Cuentas</h1>
          <p className="text-zinc-500 text-xs mt-1">Administra tus saldos, cuentas bancarias y efectivo disponible.</p>
        </div>
        
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setCreateError(null);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0c5c36] hover:bg-[#0e6f42] text-white rounded-full font-bold text-xs tracking-wide transition-all shadow-lg shadow-[#0c5c36]/10"
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showCreateForm ? 'Cancelar' : 'Nueva cuenta'}</span>
          </motion.button>

          {/* Sage Green Floating 'Crear cuenta' Popover */}
          <AnimatePresence>
            {showCreateForm && (
              <>
                <div
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => {
                    setShowCreateForm(false);
                  }}
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
                      Crear cuenta
                    </h3>
                  </div>

                  {createError && (
                    <div className="p-3 bg-[#691818] border border-red-500/30 text-white text-xs font-bold rounded-2xl mx-1 select-text">
                      {createError}
                    </div>
                  )}

                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    {/* Amount/Balance Input */}
                    <div className="flex items-baseline justify-between border-b border-black/10 pb-1 mx-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        required
                        value={createBalance}
                        onChange={(e) => handleCreateAmountChange(e.target.value)}
                        className="w-full bg-transparent text-zinc-950 text-3xl font-black focus:outline-none placeholder-zinc-800/40"
                      />
                      <span className="text-sm font-black text-zinc-900 select-none">COP</span>
                    </div>

                    {/* Account Name */}
                    <input
                      type="text"
                      placeholder="Nombre de la cuenta..."
                      required
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full bg-black/5 hover:bg-black/10 rounded-2xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-800/50 font-semibold focus:outline-none focus:bg-black/10 transition-colors"
                    />

                    {/* Custom Type Selector */}
                    <CustomSelect
                      value={createType}
                      onChange={setCreateType}
                      options={accountTypeOptions}
                      variant="popover"
                    />

                    {/* Submit Button */}
                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={createAccountMutation.isPending}
                        className="w-full bg-[#0c5c36] hover:bg-[#0e6f42] text-white rounded-2xl py-3 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {createAccountMutation.isPending ? 'Creando...' : 'Crear Cuenta'}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Accounts grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts?.length === 0 ? (
          <div className="col-span-2 text-sm text-zinc-500 py-16 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20">
            No tienes cuentas configuradas. ¡Crea una para comenzar!
          </div>
        ) : (
          accounts?.map((acc: any) => {
            const isEditing = editingId === acc.id;
            return (
              <div
                key={acc.id}
                className="relative min-h-[180px]"
              >
                {/* View card */}
                <motion.div
                  layout
                  onClick={() => handleEditInit(acc)}
                  className="bg-[#070707]/60 border border-white/[0.04] hover:border-white/[0.1] p-6 rounded-[28px] flex flex-col justify-between h-full cursor-pointer transition-all"
                >
                  {/* Top: emoji and type */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.04] px-3 py-1.5 rounded-2xl">
                      <span className="text-sm">{getAccountEmoji(acc.type)}</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {getAccountTypeName(acc.type)}
                      </span>
                    </div>

                    <div className="opacity-0 hover:opacity-100 p-1 text-zinc-500 transition-opacity">
                      <Edit2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Middle: name */}
                  <div className="mt-4">
                    <h2 className="text-base font-bold text-zinc-100 truncate pl-0.5">{acc.name}</h2>
                  </div>

                  {/* Bottom: balance */}
                  <div className="mt-2 flex justify-between items-baseline pl-0.5">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Saldo</span>
                    <span className="text-xl font-black text-white tracking-tight">
                      {formatCurrency(Number(acc.balance))}
                    </span>
                  </div>
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
                            Editar cuenta
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

                        <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(acc.id); }} className="space-y-4">
                          {/* Balance Input */}
                          <div className="flex items-baseline justify-between border-b border-black/10 pb-1 mx-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              required
                              value={editBalance}
                              onChange={(e) => handleEditAmountChange(e.target.value)}
                              className="w-full bg-transparent text-zinc-950 text-3xl font-black focus:outline-none placeholder-zinc-800/40"
                            />
                            <span className="text-sm font-black text-zinc-900 select-none">COP</span>
                          </div>

                          {/* Account Name */}
                          <input 
                            type="text"
                            required
                            placeholder="Nombre de la cuenta..."
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-black/5 hover:bg-black/10 rounded-2xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-800/50 font-semibold focus:outline-none focus:bg-black/10 transition-colors"
                          />

                          {/* Custom Type Selector */}
                          <CustomSelect
                            value={editType}
                            onChange={setEditType}
                            options={accountTypeOptions}
                            variant="popover"
                          />

                          {/* Actions */}
                          <div className="flex justify-between items-center pt-2">
                            <button
                              type="button"
                              onClick={() => handleDelete(acc.id)}
                              className="flex items-center justify-center p-2.5 bg-black/5 hover:bg-black/10 rounded-2xl text-rose-800 hover:text-rose-900 transition-colors"
                              title="Eliminar cuenta"
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
