import React from 'react';
import { useAuthStore } from '../../core/store/auth.store';
import {
  useTransactions,
  useAccounts,
  useCategories,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction
} from '../../infrastructure/hooks/useFinance';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Search,
  Download,
  SlidersHorizontal,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  Tag,
  Briefcase,
  User
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';

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

export function Transactions() {
  const { activeWorkspaceId } = useAuthStore();

  // Queries
  const { data: transactions, isLoading: loadingTx } = useTransactions(activeWorkspaceId);
  const { data: accounts } = useAccounts(activeWorkspaceId);
  const { data: categories } = useCategories(activeWorkspaceId);

  // Mutations
  const createTxMutation = useCreateTransaction(activeWorkspaceId);
  const updateTxMutation = useUpdateTransaction(activeWorkspaceId);
  const deleteTxMutation = useDeleteTransaction(activeWorkspaceId);

  // Layout & Visibility State
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState('ALL'); // ALL, INCOME, EXPENSE, TRANSFER
  const [filterAccount, setFilterAccount] = React.useState('ALL');
  const [filterCategory, setFilterCategory] = React.useState('ALL');

  // Add Transaction Form State
  const [amount, setAmount] = React.useState('');
  const [type, setType] = React.useState('EXPENSE');
  const [description, setDescription] = React.useState('');
  const [accountId, setAccountId] = React.useState('');
  const [toAccountId, setToAccountId] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [txDate, setTxDate] = React.useState(new Date().toISOString().substring(0, 10));
  const [txTime, setTxTime] = React.useState(
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  );
  const [addError, setAddError] = React.useState<string | null>(null);

  // Edit/Delete Transaction State
  const [editingTx, setEditingTx] = React.useState<any | null>(null);
  const [editDesc, setEditDesc] = React.useState('');
  const [editCategoryId, setEditCategoryId] = React.useState('');
  const [editDate, setEditDate] = React.useState('');
  const [editError, setEditError] = React.useState<string | null>(null);

  // Initialize Account and Category defaults for creation
  React.useEffect(() => {
    if (accounts && accounts.length > 0) {
      setAccountId(accounts[0].id);
      if (accounts.length > 1) {
        setToAccountId(accounts[1].id);
      } else {
        setToAccountId(accounts[0].id);
      }
    }
  }, [accounts]);

  React.useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  // Format Helper
  const formatCurrency = (val: number, showDecimals = true) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(val);
  };

  const getAccountEmoji = (accType: string) => {
    if (accType === 'CASH') return '💵';
    if (accType === 'CREDIT_CARD') return '💳';
    return '🏦';
  };

  const getCategoryEmoji = (catName: string) => {
    const lowercase = catName.toLowerCase();
    const found = categoryIconOptions.find(opt => lowercase.includes(opt.label.toLowerCase().split(' / ')[0]));
    if (found) return found.icon;
    if (lowercase.includes('comida') || lowercase.includes('restaurante')) return '🍔';
    if (lowercase.includes('transporte') || lowercase.includes('gasolina')) return '🚗';
    if (lowercase.includes('hogar') || lowercase.includes('servicio')) return '🏠';
    if (lowercase.includes('compra')) return '🛍️';
    if (lowercase.includes('salario') || lowercase.includes('sueldo') || lowercase.includes('ingreso')) return '💰';
    return '🏷️';
  };

  // Parsing Amount Input
  const handleAmountChange = (val: string) => {
    const cleanVal = val.replace(/\./g, '');
    if (cleanVal === '') {
      setAmount('');
      return;
    }
    const parsed = parseInt(cleanVal, 10);
    if (isNaN(parsed)) return;
    const formatted = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parsed);
    setAmount(formatted);
  };

  // Submit Handler: Add Transaction
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const cleanAmount = Number(amount.replace(/\./g, '')) || 0;

    if (cleanAmount <= 0) {
      setAddError('Por favor, ingresa un monto válido mayor a 0.');
      return;
    }

    if (type === 'TRANSFER' && accountId === toAccountId) {
      setAddError('La cuenta de origen y destino deben ser distintas.');
      return;
    }

    const combinedDateTime = new Date(`${txDate}T${txTime}`);

    createTxMutation.mutate({
      amount: cleanAmount,
      type,
      description: description.trim() || 'Movimiento general',
      date: combinedDateTime.toISOString(),
      accountId,
      toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
      categoryId: type === 'EXPENSE' && categoryId ? categoryId : undefined,
    }, {
      onSuccess: () => {
        setShowAddModal(false);
        setAmount('');
        setDescription('');
        setAddError(null);
      },
      onError: (err: any) => {
        setAddError(err.response?.data?.message || 'Error al guardar el movimiento.');
      }
    });
  };

  // Edit Init
  const handleEditInit = (tx: any) => {
    setEditingTx(tx);
    setEditDesc(tx.description || '');
    setEditCategoryId(tx.categoryId || '');
    setEditDate(tx.date.substring(0, 10));
    setEditError(null);
  };

  // Submit Handler: Edit Transaction
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    updateTxMutation.mutate({
      id: editingTx.id,
      description: editDesc,
      categoryId: editCategoryId || undefined,
      date: new Date(editDate).toISOString(),
    }, {
      onSuccess: () => {
        setEditingTx(null);
      },
      onError: (err: any) => {
        setEditError(err.response?.data?.message || 'Error al actualizar el movimiento.');
      }
    });
  };

  // Handler: Delete Transaction
  const handleDeleteTx = (id: string) => {
    deleteTxMutation.mutate(id, {
      onSuccess: () => {
        setEditingTx(null);
      },
      onError: (err: any) => {
        setEditError(err.response?.data?.message || 'Error al eliminar el movimiento.');
      }
    });
  };

  // CSV Export Handler
  const handleDownloadCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;

    const headers = ['Fecha', 'Hora', 'Monto', 'Tipo', 'Descripción', 'Categoría', 'Cuenta'];

    const rows = filteredTransactions.map((tx: any) => {
      const d = new Date(tx.date);
      const dateStr = d.toLocaleDateString('es-CO');
      const timeStr = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
      const amountStr = tx.type === 'EXPENSE' ? `-${tx.amount}` : `+${tx.amount}`;
      const typeStr = tx.type === 'INCOME' ? 'Ingreso' : tx.type === 'EXPENSE' ? 'Egreso' : 'Transferencia';
      const descStr = tx.description || '';
      const catStr = tx.category?.name || 'Sin categoría';
      const accStr = tx.account?.name || '';

      return [dateStr, timeStr, amountStr, typeStr, descStr, catStr, accStr].map(val => `"${String(val).replace(/"/g, '""')}"`);
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `movimientos_${activeWorkspaceId || 'workspace'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search Logic
  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((tx: any) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description?.toLowerCase().includes(query);
        const matchesCategory = tx.category?.name?.toLowerCase().includes(query);
        const matchesAccount = tx.account?.name?.toLowerCase().includes(query);
        const matchesAmount = String(tx.amount).includes(query);
        if (!matchesDesc && !matchesCategory && !matchesAccount && !matchesAmount) {
          return false;
        }
      }

      // 2. Type Filter
      if (filterType !== 'ALL' && tx.type !== filterType) {
        return false;
      }

      // 3. Account Filter
      if (filterAccount !== 'ALL' && tx.accountId !== filterAccount && tx.toAccountId !== filterAccount) {
        return false;
      }

      // 4. Category Filter
      if (filterCategory !== 'ALL') {
        if (filterCategory === 'EMPTY') {
          if (tx.categoryId) return false;
        } else if (tx.categoryId !== filterCategory) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, filterType, filterAccount, filterCategory]);

  // Summary Metrics calculations
  const metrics = React.useMemo(() => {
    let ingresos = 0;
    let gastos = 0;
    const uniqueDates = new Set<string>();

    filteredTransactions.forEach((tx: any) => {
      const dateKey = tx.date.split('T')[0];
      uniqueDates.add(dateKey);

      if (tx.type === 'INCOME') {
        ingresos += Number(tx.amount);
      } else if (tx.type === 'EXPENSE') {
        gastos += Number(tx.amount);
      }
    });

    const daysCount = uniqueDates.size || 1;
    const promDiario = (ingresos + gastos) / daysCount;
    const total = ingresos - gastos;

    return {
      ingresos,
      gastos,
      promDiario,
      total
    };
  }, [filteredTransactions]);

  // Loading state helper
  if (loadingTx) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-500/20 border-t-accent-500 animate-spin" />
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Cargando Movimientos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full pb-16 font-sans">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Movimientos</h1>
          <p className="text-zinc-500 text-xs mt-1">Registra, filtra y exporta las entradas, salidas y transferencias de dinero.</p>
        </div>

        {/* Action Controls */}
        <div className="relative">
          <div className="flex items-center gap-2.5">
            {/* Search Toggle Button */}
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchQuery('');
              }}
              className={`p-3 rounded-xl border transition-all ${showSearch
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'bg-zinc-950/40 border-white/[0.06] hover:border-white/[0.12] text-zinc-400 hover:text-zinc-200'
                }`}
              title="Buscar movimientos"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleDownloadCSV}
              className="p-3 bg-zinc-950/40 border border-white/[0.06] hover:border-white/[0.12] rounded-xl text-zinc-400 hover:text-zinc-200 transition-all"
              title="Descargar CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Filters Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border transition-all ${showFilters
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'bg-zinc-950/40 border-white/[0.06] hover:border-white/[0.12] text-zinc-400 hover:text-zinc-200'
                }`}
              title="Filtrar movimientos"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Emerald Green Trigger Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowAddModal(!showAddModal);
                setAddError(null);
              }}
              className="flex items-center justify-center gap-2 px-5 py-5 bg-[#0c5c36] hover:bg-[#0e6f42] text-white rounded-full font-bold text-xs tracking-wide transition-all shadow-lg shadow-[#0c5c36]/10"
            >
              {showAddModal ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddModal ? 'Cancelar' : 'Nuevo'}</span>
            </motion.button>
          </div>

          {/* Sage Green Floating 'Crear movimiento' Popover */}
          <AnimatePresence>
            {showAddModal && (
              <>
                <div
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setShowAddModal(false)}
                />
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="fixed inset-0 md:absolute md:inset-auto md:top-14 md:right-0 w-full h-full md:w-[360px] md:h-auto bg-[#737f78] border-0 md:border border-[#86928b]/50 text-zinc-950 rounded-none md:rounded-[28px] p-6 shadow-2xl z-40 flex flex-col space-y-4 font-sans select-none overflow-y-auto"
                >
                  <div className="flex justify-between items-center pl-1">
                    <h3 className="text-xl font-bold text-zinc-950 tracking-tight">
                      Crear movimiento
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="p-1 hover:bg-black/10 rounded-full text-zinc-900 md:hidden transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Expense/Income/Transfer Toggle */}
                    <div className="flex bg-black/10 rounded-full p-0.5 border border-black/5 text-[9px] font-bold">
                      <button
                        type="button"
                        onClick={() => setType('EXPENSE')}
                        className={`px-2.5 py-1 rounded-full transition-all ${type === 'EXPENSE' ? 'bg-[#737f78] text-zinc-950 shadow-sm' : 'text-zinc-800'}`}
                      >
                        Egreso
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('INCOME')}
                        className={`px-2.5 py-1 rounded-full transition-all ${type === 'INCOME' ? 'bg-[#737f78] text-zinc-950 shadow-sm' : 'text-zinc-800'}`}
                      >
                        Ingreso
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('TRANSFER')}
                        className={`px-2.5 py-1 rounded-full transition-all ${type === 'TRANSFER' ? 'bg-[#737f78] text-zinc-950 shadow-sm' : 'text-zinc-800'}`}
                      >
                        Transf
                      </button>
                    </div>
                  </div>

                  {addError && (
                    <div className="p-3 bg-[#691818] border border-red-500/30 text-white text-xs font-bold rounded-2xl mx-1 select-text">
                      {addError}
                    </div>
                  )}

                  <form onSubmit={handleAddSubmit} className="space-y-4">

                    {/* Amount field */}
                    <div className="flex items-baseline justify-between border-b border-black/10 pb-1 mx-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        required
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="w-full bg-transparent text-zinc-950 text-3xl font-black focus:outline-none placeholder-zinc-800/40"
                      />
                      <span className="text-sm font-black text-zinc-900 select-none">COP</span>
                    </div>

                    {/* Description Input */}
                    <input
                      type="text"
                      placeholder="Añadir nota/descripción..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-black/5 hover:bg-black/10 rounded-2xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-800/50 font-semibold focus:outline-none focus:bg-black/10 transition-colors"
                    />

                    {/* Source Account Custom Selector */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1">
                        {type === 'TRANSFER' ? 'Cuenta origen' : 'Cuenta'}
                      </span>
                      <CustomSelect
                        value={accountId}
                        onChange={setAccountId}
                        options={(accounts || []).map((acc: any) => ({
                          value: acc.id,
                          label: acc.name,
                          icon: getAccountEmoji(acc.type)
                        }))}
                        variant="popover"
                      />
                    </div>

                    {/* Destination Account Selector (Transfer only) */}
                    {type === 'TRANSFER' && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1">Cuenta destino</span>
                        <CustomSelect
                          value={toAccountId}
                          onChange={setToAccountId}
                          options={(accounts || []).map((acc: any) => ({
                            value: acc.id,
                            label: acc.name,
                            icon: getAccountEmoji(acc.type)
                          }))}
                          variant="popover"
                        />
                      </div>
                    )}

                    {/* Category Custom Selector (Expense only) */}
                    {type === 'EXPENSE' && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1">Categoría</span>
                        <CustomSelect
                          value={categoryId}
                          onChange={setCategoryId}
                          options={[
                            { value: '', label: 'Sin categoría', icon: '🏷️' },
                            ...(categories || []).map((cat: any) => ({
                              value: cat.id,
                              label: cat.name,
                              icon: getCategoryEmoji(cat.name)
                            }))
                          ]}
                          variant="popover"
                        />
                      </div>
                    )}

                    {/* Date & Time Row */}
                    <div className="grid grid-cols-2 gap-3 mx-1">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1 block">Fecha</span>
                        <input
                          type="date"
                          required
                          value={txDate}
                          onChange={(e) => setTxDate(e.target.value)}
                          className="w-full bg-black/5 hover:bg-black/10 rounded-xl px-3 py-2 text-xs text-zinc-900 font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1 block">Hora</span>
                        <input
                          type="time"
                          required
                          value={txTime}
                          onChange={(e) => setTxTime(e.target.value)}
                          className="w-full bg-black/5 hover:bg-black/10 rounded-xl px-3 py-2 text-xs text-zinc-900 font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Confirm Button */}
                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={createTxMutation.isPending}
                        className="w-full bg-[#0c5c36] hover:bg-[#0e6f42] text-white rounded-2xl py-3 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {createTxMutation.isPending ? 'Guardando...' : 'Confirmar'}
                      </motion.button>
                    </div>

                  </form>
                </motion.div>
              </>
            )}
          </AnimatePresence>


        </div>
      </div>

      {/* SEARCH INPUT DISPLAY */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca por descripción, cuenta, categoría o monto..."
                className="w-full bg-[#070707]/60 border border-white/[0.06] rounded-2xl px-5 py-3 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-accent-500/50 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTERS PANEL */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-zinc-950/80 border border-white/[0.05] rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Filter by Type */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Tipo de movimiento</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-accent-500 transition-all"
              >
                <option value="ALL">Todos los tipos</option>
                <option value="INCOME">Ingresos</option>
                <option value="EXPENSE">Egresos</option>
                <option value="TRANSFER">Transferencias</option>
              </select>
            </div>

            {/* Filter by Account */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Cuenta</label>
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-accent-500 transition-all"
              >
                <option value="ALL">Todas las cuentas</option>
                {accounts?.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {getAccountEmoji(acc.type)} {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Category */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Categoría</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-accent-500 transition-all"
              >
                <option value="ALL">Todas las categorías</option>
                <option value="EMPTY">Sin categoría</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryEmoji(cat.name)} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* METRICS SUMMARY CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 select-none">

        {/* Card: Ingresos */}
        <div className="bg-[#070707]/60 border border-white/[0.04] p-6 rounded-[24px] space-y-2">
          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">Ingresos</span>
          <h3 className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(metrics.ingresos)}
          </h3>
          <span className="text-[10px] text-zinc-500 block leading-tight pt-1">
            Convertido al tipo de cambio de cada movimiento
          </span>
        </div>

        {/* Card: Gastos */}
        <div className="bg-[#070707]/60 border border-white/[0.04] p-6 rounded-[24px] space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">Gastos</span>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(metrics.gastos)}
            </h3>
          </div>
        </div>

        {/* Card: Promedio Diario */}
        <div className="bg-[#070707]/60 border border-white/[0.04] p-6 rounded-[24px] space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">Prom diario</span>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(metrics.promDiario)}
            </h3>
          </div>
        </div>

        {/* Card: Total */}
        <div className="bg-[#070707]/60 border border-white/[0.04] p-6 rounded-[24px] space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">Total</span>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(metrics.total)}
            </h3>
          </div>
        </div>

      </div>

      {/* TABULAR TRANSACTIONS LIST */}
      <div className="border border-white/[0.04] bg-[#070707]/30 rounded-[28px] relative overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-white/[0.04] text-xs text-zinc-500 font-bold uppercase tracking-wider select-none">
              <th className="py-5 px-6 font-bold">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Fecha</span>
                </span>
              </th>
              <th className="py-5 px-4 font-bold">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hora</span>
                </span>
              </th>
              <th className="py-5 px-4 font-bold text-right pr-6">
                <span className="flex items-center gap-1.5 justify-end">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Monto</span>
                </span>
              </th>
              <th className="py-5 px-4 font-bold">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Descripción</span>
                </span>
              </th>
              <th className="py-5 px-4 font-bold">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Categoría</span>
                </span>
              </th>
              <th className="py-5 px-4 font-bold">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Autor</span>
                </span>
              </th>
              <th className="py-5 px-6 font-bold">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Cuenta</span>
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.03]">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-zinc-500 select-none">
                  No se encontraron movimientos registrados en este espacio.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx: any) => {
                const txDateObj = new Date(tx.date);

                // Format Date: e.g. "2 Jun 26"
                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const formattedDateStr = `${txDateObj.getDate()} ${months[txDateObj.getMonth()]} ${String(txDateObj.getFullYear()).slice(-2)}`;

                // Format Time: e.g. "12:35 PM"
                let hours = txDateObj.getHours();
                const minutes = String(txDateObj.getMinutes()).padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12;
                const formattedTimeStr = `${hours}:${minutes} ${ampm}`;

                const isEditing = editingTx?.id === tx.id;

                return (
                  <tr
                    key={tx.id}
                    onClick={() => handleEditInit(tx)}
                    className="relative group hover:bg-white/[0.015] active:bg-white/[0.03] transition-all text-sm cursor-pointer select-none"
                  >
                    {/* Date */}
                    <td className="py-6 px-6 font-semibold text-zinc-300">
                      {formattedDateStr}
                    </td>

                    {/* Time */}
                    <td className="py-6 px-4 font-semibold text-zinc-400">
                      {formattedTimeStr}
                    </td>

                    {/* Amount */}
                    <td className={`py-6 px-4 font-black text-right pr-6 ${tx.type === 'INCOME' ? 'text-[#00f2a1]' : tx.type === 'EXPENSE' ? 'text-rose-400' : 'text-zinc-200'
                      }`}>
                      {tx.type === 'EXPENSE' ? '-' : tx.type === 'INCOME' ? '+' : ''}
                      {formatCurrency(Number(tx.amount))}
                      {tx.account?.currency && (
                        <span className="text-[10px] font-bold text-zinc-500 ml-1 uppercase">
                          {tx.account.currency}
                        </span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-6 px-4 text-zinc-200 font-semibold truncate max-w-[180px]" title={tx.description}>
                      {tx.description || 'Movimiento general'}
                    </td>

                    {/* Category */}
                    <td className="py-6 px-4 text-zinc-400 font-bold">
                      {tx.category ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs flex items-center justify-center gap-1"
                            style={{ backgroundColor: `${tx.category.color || '#0c5c36'}25`, border: `1px solid ${tx.category.color || '#0c5c36'}45`, color: tx.category.color || '#00f2a1' }}
                          >
                            <span>{getCategoryEmoji(tx.category.name)}</span>
                            <span>{tx.category.name}</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-medium">Sin categoría</span>
                      )}
                    </td>

                    {/* Author */}
                    <td className="py-6 px-4 text-zinc-400 font-medium">
                      {tx.creator ? (
                        <span className="text-xs text-zinc-300 font-semibold bg-white/[0.04] border border-white/[0.04] px-2.5 py-1 rounded-lg">
                          {tx.creator.name || tx.creator.email}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">Sistema</span>
                      )}
                    </td>

                    {/* Account */}
                    <td className="py-6 px-6 text-zinc-300 font-bold relative">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span>{getAccountEmoji(tx.account?.type)}</span>
                          <span>{tx.account?.name || 'Cuenta'}</span>
                          {tx.toAccount && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500 font-semibold pl-1">
                              <span>➔</span>
                              <span>{getAccountEmoji(tx.toAccount.type)}</span>
                              <span className="text-zinc-400">{tx.toAccount.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sage Green Floating 'Editar movimiento' Popover */}
                      <AnimatePresence>
                        {isEditing && (
                          <>
                            <div
                              className="fixed inset-0 z-30 cursor-default"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTx(null);
                              }}
                            />
                            <motion.div
                              initial={{ scale: 0.92, opacity: 0, y: 15 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              exit={{ scale: 0.92, opacity: 0, y: 15 }}
                              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                              onClick={(e) => e.stopPropagation()}
                              className="fixed inset-0 md:absolute md:inset-auto md:right-6 md:top-1/2 md:-translate-y-1/2 w-full h-full md:w-[360px] md:h-auto bg-[#737f78] border-0 md:border border-[#86928b]/50 text-zinc-950 rounded-none md:rounded-[28px] p-6 shadow-2xl z-40 flex flex-col space-y-4 font-sans normal-case select-none text-left overflow-y-auto"
                            >
                              <div className="flex justify-between items-center pl-1">
                                <h3 className="text-xl font-bold text-zinc-950 tracking-tight">
                                  Editar movimiento
                                </h3>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTx(null);
                                  }}
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

                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditSubmit(e);
                                }}
                                className="space-y-4"
                              >

                                {/* Read-Only Amount Display */}
                                <div className="flex items-baseline justify-between border-b border-black/10 pb-1.5 mx-1 mb-2 select-text">
                                  <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1 block">Monto (No editable)</span>
                                  <div className="text-xl font-black text-zinc-900">
                                    {editingTx.type === 'EXPENSE' ? '-' : editingTx.type === 'INCOME' ? '+' : ''}
                                    {formatCurrency(Number(editingTx.amount))}
                                  </div>
                                </div>

                                {/* Description Input */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1 block">Descripción</span>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Añadir nota/descripción..."
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="w-full bg-black/5 hover:bg-black/10 rounded-2xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-800/50 font-semibold focus:outline-none focus:bg-black/10 transition-colors"
                                  />
                                </div>

                                {/* Category Custom Selector (only if expense) */}
                                {editingTx.type === 'EXPENSE' && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1">Categoría</span>
                                    <CustomSelect
                                      value={editCategoryId}
                                      onChange={setEditCategoryId}
                                      options={[
                                        { value: '', label: 'Sin categoría', icon: '🏷️' },
                                        ...(categories || []).map((cat: any) => ({
                                          value: cat.id,
                                          label: cat.name,
                                          icon: getCategoryEmoji(cat.name)
                                        }))
                                      ]}
                                      variant="popover"
                                    />
                                  </div>
                                )}

                                {/* Date Row */}
                                <div className="space-y-1 mx-1">
                                  <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1 block">Fecha</span>
                                  <input
                                    type="date"
                                    required
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="w-full bg-black/5 hover:bg-black/10 rounded-xl px-3 py-2 text-xs text-zinc-900 font-semibold focus:outline-none"
                                  />
                                </div>

                                {/* Actions: Save, Delete, Cancel */}
                                <div className="flex justify-between items-center pt-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTx(editingTx.id);
                                    }}
                                    disabled={deleteTxMutation.isPending}
                                    className="flex items-center justify-center p-2.5 bg-black/5 hover:bg-black/10 rounded-2xl text-rose-800 hover:text-rose-900 transition-colors disabled:opacity-50"
                                    title="Eliminar movimiento"
                                  >
                                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                                  </button>

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTx(null);
                                      }}
                                      className="px-4 py-2.5 bg-black/5 hover:bg-black/10 text-zinc-800 rounded-2xl text-xs font-bold transition-all"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={updateTxMutation.isPending}
                                      className="px-5 py-2.5 bg-[#0c5c36] hover:bg-[#0e6f42] text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                      {updateTxMutation.isPending ? 'Guardando...' : 'Guardar'}
                                    </button>
                                  </div>
                                </div>

                              </form>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>



    </div>
  );
}
