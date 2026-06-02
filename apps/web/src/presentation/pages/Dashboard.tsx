import React from 'react';
import { useAuthStore } from '../../core/store/auth.store';
import {
  useDashboardMetrics,
  useAccounts,
  useCategories,
  useCreateTransaction,
  useTransactions
} from '../../infrastructure/hooks/useFinance';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Sparkles, SlidersHorizontal } from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';

export function Dashboard() {
  const { activeWorkspaceId } = useAuthStore();
  const { data: metrics, isLoading: loadingMetrics } = useDashboardMetrics(activeWorkspaceId);
  const { data: accounts } = useAccounts(activeWorkspaceId);
  const { data: categories } = useCategories(activeWorkspaceId);
  const { data: transactions } = useTransactions(activeWorkspaceId);
  const createTransactionMutation = useCreateTransaction(activeWorkspaceId);

  const [showAddTxModal, setShowAddTxModal] = React.useState(false);


  const [amount, setAmount] = React.useState('');
  const [type, setType] = React.useState('EXPENSE');
  const [description, setDescription] = React.useState('');
  const [accountId, setAccountId] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const [formattedDate, setFormattedDate] = React.useState('');
  const [formattedTime, setFormattedTime] = React.useState('');

  React.useEffect(() => {
    if (accounts && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts]);

  React.useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  React.useEffect(() => {
    const updateDateTime = () => {
      const d = new Date();
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;

      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeStr = `${hours}:${minutes} ${ampm}`;

      setFormattedDate(dateStr);
      setFormattedTime(timeStr);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanAmount = Number(amount.replace(/\./g, '')) || 0;

    createTransactionMutation.mutate({
      amount: cleanAmount,
      type,
      description: description.trim() || 'Movimiento general',
      date: new Date().toISOString(),
      accountId,
      categoryId: type === 'EXPENSE' && categoryId ? categoryId : undefined,
    }, {
      onSuccess: () => {
        setShowAddTxModal(false);
        setAmount('');
        setDescription('');
        setError(null);
      },
      onError: (err: any) => {
        const apiError = err.response?.data;
        if (apiError && apiError.message) {
          if (Array.isArray(apiError.message)) {
            setError(apiError.message.join(', '));
          } else {
            setError(apiError.message);
          }
        } else {
          setError('Error al guardar el movimiento.');
        }
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDateGroup = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d.getDate()} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
  };

  const getAccountEmoji = (accType: string) => {
    if (accType === 'CASH') return '💵';
    if (accType === 'CREDIT_CARD') return '💳';
    return '🏦';
  };

  const getCategoryEmoji = (catName: string) => {
    const lowercase = catName.toLowerCase();
    if (lowercase.includes('comida') || lowercase.includes('restaurante') || lowercase.includes('almuerzo')) return '🍔';
    if (lowercase.includes('transporte') || lowercase.includes('gasolina') || lowercase.includes('uber')) return '🚗';
    if (lowercase.includes('hogar') || lowercase.includes('servicio') || lowercase.includes('renta')) return '🏠';
    if (lowercase.includes('suscripcion') || lowercase.includes('netflix') || lowercase.includes('spotify')) return '🍿';
    if (lowercase.includes('salario') || lowercase.includes('ingreso') || lowercase.includes('sueldo')) return '💰';
    return '🏷️';
  };

  const groupedTransactions = React.useMemo(() => {
    if (!transactions) return {};
    const groups: Record<string, any[]> = {};
    transactions.forEach((tx: any) => {
      const dateKey = formatDateGroup(tx.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });
    return groups;
  }, [transactions]);

  if (loadingMetrics) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500 font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent-500/20 border-t-accent-500 animate-spin" />
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Cargando Dashboard...</span>
        </div>
      </div>
    );
  }

  const totalBalance = metrics?.netBalance || 0;


  return (
    <div className="space-y-6 w-full pb-16">
      {/* 1. Glowing Emerald Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#051e17] via-[#020b08] to-[#030303] border border-[#0c402f]/40 p-8 min-h-[340px] flex flex-col justify-between shadow-2xl"
      >
        {/* Glowing Green Radial Element */}
        <motion.div
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -right-20 -top-20 w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,_rgba(0,229,163,0.55)_0%,_rgba(0,229,163,0)_70%)] blur-[95px] pointer-events-none z-0"
        />

        {/* Account Pills Capsule List */}
        <div className="flex flex-wrap gap-2.5 z-10">
          {accounts?.map((acc: any) => (
            <div
              key={acc.id}
              className="bg-black/40 border border-white/[0.06] px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-sm text-zinc-400 font-semibold"
            >
              <span>{acc.name}</span>
              <span className="text-white">{formatCurrency(Number(acc.balance))}</span>
            </div>
          ))}
        </div>

        {/* Total Sum Display */}
        <div className="mt-8 z-10 space-y-1">
          <span className="text-zinc-500 text-xs font-semibold tracking-wider">Total</span>
          <h1 className="text-5xl md:text-5xl font-black text-white tracking-tight">
            {formatCurrency(totalBalance)}
          </h1>
        </div>
      </motion.div>

      {/* 2. Action Bar */}
      <div className="flex items-center gap-4 relative z-40">
        {/* Chat input placeholder */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Chatea conmigo"
            className="w-full bg-[#070707]/60 hover:bg-[#0c0c0c]/80 border border-white/[0.06] rounded-[24px] px-6 py-6 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-accent-500/50 transition-all font-medium pr-12 p-4"
          />
          <Sparkles className="absolute right-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 cursor-pointer hover:text-accent-400 transition-colors" />
        </div>

        {/* Floating Add Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowAddTxModal(!showAddTxModal);
          }}
          className="w-20 h-20 bg-accent-500 hover:bg-[#00d496] rounded-full flex items-center justify-center text-black shadow-lg shadow-accent-500/10 hover:shadow-accent-500/25 transition-all duration-200 shrink-0"
        >
          {showAddTxModal ? <X className="w-6 h-6 stroke-[3]" /> : <Plus className="w-6 h-6 stroke-[3]" />}
        </motion.button>

        {/* Sage Green Floating 'Crear movimiento' Dropdown Menu */}
        <AnimatePresence>
          {showAddTxModal && (
            <>
              <div
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => {
                  setShowAddTxModal(false);
                }}
              />
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="fixed inset-0 md:absolute md:inset-auto md:top-16 md:right-0 w-full h-full md:w-80 md:h-auto bg-[#737f78] border-0 md:border border-[#86928b]/50 text-zinc-950 rounded-none md:rounded-[28px] p-6 shadow-2xl z-40 flex flex-col space-y-4 font-sans select-none overflow-y-auto"
              >
                <div className="flex justify-between items-center pl-1">
                  <h3 className="text-xl font-bold text-zinc-950 tracking-tight">
                    Crear movimiento
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddTxModal(false)}
                    className="p-1 hover:bg-black/10 rounded-full text-zinc-900 md:hidden transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  {/* Expense/Income Toggle */}
                  <div className="flex bg-black/10 rounded-full p-0.5 border border-black/5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setType('EXPENSE')}
                      className={`px-3 py-1 rounded-full transition-all ${type === 'EXPENSE' ? 'bg-[#737f78] text-zinc-950 shadow-sm' : 'text-zinc-800'
                        }`}
                    >
                      Egreso
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('INCOME')}
                      className={`px-3 py-1 rounded-full transition-all ${type === 'INCOME' ? 'bg-[#737f78] text-zinc-950 shadow-sm' : 'text-zinc-800'
                        }`}
                    >
                      Ingreso
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-[#691818] border border-red-500/30 text-white text-xs font-bold rounded-2xl mx-1 select-text">
                      {error}
                    </div>
                  )}

                  {/* Amount and Currency */}
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

                  {/* Note/Description text field */}
                  <input
                    type="text"
                    placeholder="Añadir nota/descripción..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/5 hover:bg-black/10 rounded-2xl px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-800/50 font-semibold focus:outline-none focus:bg-black/10 transition-colors"
                  />

                  {/* 1. Category Custom Selector (Only if Expense) */}
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

                  {/* 2. Account Custom Selector */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest pl-1">Cuenta</span>
                    <CustomSelect
                      value={accountId}
                      onChange={setAccountId}
                      options={[
                        { value: '', label: 'Sin cuenta', icon: '🏦' },
                        ...(accounts || []).map((acc: any) => ({
                          value: acc.id,
                          label: acc.name,
                          icon: getAccountEmoji(acc.type)
                        }))
                      ]}
                      variant="popover"
                    />
                  </div>

                  {/* 3. Date & Time Row */}
                  <div className="flex justify-between items-center text-xs font-bold text-zinc-800 px-1 py-1">
                    <span>{formattedDate}</span>
                    <span>{formattedTime}</span>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={createTransactionMutation.isPending}
                    className="w-full py-3 bg-zinc-950 text-white hover:bg-zinc-900 transition-colors rounded-2xl text-xs font-bold shadow-lg shadow-black/10"
                  >
                    {createTransactionMutation.isPending ? 'Guardando...' : 'Confirmar'}
                  </motion.button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Transactions Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white tracking-tight">Movimientos</h2>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-all">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
          </button>
        </div>

        {/* Grouped Transaction List */}
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="text-sm text-zinc-500 py-12 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20">
            No hay movimientos registrados en este espacio.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([dateKey, txList]: [string, any[]]) => (
              <div key={dateKey} className="space-y-3">
                {/* Date Label */}
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  {dateKey}
                </div>

                {/* List Items */}
                <div className="space-y-2.5">
                  {txList.map((tx: any) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between items-center bg-[#070707]/60 border border-white/[0.04] p-4.5 rounded-[22px]"
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Glowing white sphere icon */}
                        <div className="w-8 h-8 rounded-full bg-white/90 border border-white flex items-center justify-center shadow-md shadow-white/10 shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-zinc-100">{tx.description}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{tx.account?.name || 'Cuenta'}</div>
                        </div>
                      </div>

                      {/* Currency balance pill */}
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${tx.type === 'INCOME'
                        ? 'bg-[#00f2a1]/10 border border-[#00f2a1]/25 text-[#00f2a1]'
                        : 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                        }`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
