import React from 'react';
import { motion } from 'framer-motion';
import { PrettyModal } from '../components/ui/PrettyModal';
import { useLogin, useRegister } from '../../infrastructure/hooks/useAuth';
import { X, Lock, Mail, User, PiggyBank, ExternalLink } from 'lucide-react';

export function Landing() {
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const [activeModal, setActiveModal] = React.useState<'login' | 'register' | null>(null);
  const [lastActiveModal, setLastActiveModal] = React.useState<'login' | 'register' | null>(null);
  const [modalTrigger, setModalTrigger] = React.useState<HTMLElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (activeModal) {
      setLastActiveModal(activeModal);
    }
  }, [activeModal]);

  // Form inputs
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate(
      { email, password },
      {
        onError: (err: any) => {
          setError(err.response?.data?.message || 'Credenciales inválidas.');
        },
        onSuccess: () => {
          setActiveModal(null);
        },
      }
    );
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    registerMutation.mutate(
      { email, password, name },
      {
        onError: (err: any) => {
          setError(err.response?.data?.message || 'Error al registrar usuario.');
        },
        onSuccess: () => {
          setActiveModal(null);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col justify-center p-6 md:p-12 relative overflow-hidden select-none font-sans">
      {/* Dynamic green lights behind */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* Main 4-Quadrant Grid */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* QUADRANT 1: Brand & Slogan (Top-Left) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-zinc-950/40 border border-white/[0.04] backdrop-blur-md rounded-3xl p-10 flex flex-col justify-between min-h-[420px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent-500/10 border border-accent-500/30 rounded-2xl flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-accent-500" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">manevo money</span>
          </div>

          <div className="my-10 space-y-4">
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Tu dinero, <br />
              <span className="text-accent-500">claro y simple</span> <br />
              en un lugar bonito.
            </h2>
            <p className="text-zinc-400 text-base max-w-sm">
              Controla tus cuentas bancarias, presupuestos mensuales y metas financieras colaborando con tu equipo o familia.
            </p>
          </div>

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                setError(null);
                setModalTrigger(e.currentTarget);
                setActiveModal('register');
              }}
              className="px-6 py-4 bg-accent-500 hover:bg-[#00d496] rounded-2xl text-sm font-bold text-black shadow-lg shadow-accent-500/15 transition-all duration-200"
            >
              Crear cuenta
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                setError(null);
                setModalTrigger(e.currentTarget);
                setActiveModal('login');
              }}
              className="px-6 py-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-2xl text-sm font-bold text-white transition-all duration-200"
            >
              Iniciar sesión
            </motion.button>
          </div>
        </motion.div>

        {/* QUADRANT 2: Chat Simulation Mockup (Top-Right) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-zinc-950/40 border border-white/[0.04] backdrop-blur-md rounded-3xl p-10 flex flex-col justify-center items-center relative group min-h-[420px]"
        >
          <div className="absolute top-4 right-4 p-1 bg-white/[0.02] border border-white/[0.06] rounded-lg opacity-40 group-hover:opacity-80 transition-opacity">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>

          <div className="w-full max-w-sm bg-[#050505] border border-white/[0.06] rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">IA Integración</span>
              <span className="w-2 h-2 rounded-full bg-accent-500" />
            </div>

            {/* Bubble 1 (User Input) */}
            <div className="flex flex-col items-end space-y-1">
              <div className="bg-zinc-900 border border-white/[0.05] text-zinc-300 rounded-2xl rounded-tr-none px-4 py-3 text-xs max-w-[85%] leading-relaxed shadow-lg">
                Acabo de comprar un café por <span className="font-bold text-white">$4.50</span> en Starbucks ☕
              </div>
              <span className="text-[9px] text-zinc-500 mr-1">11:32 AM</span>
            </div>

            {/* Bubble 2 (System Response) */}
            <div className="flex flex-col items-start space-y-1">
              <div className="bg-accent-500/10 border border-accent-500/20 text-[#00e5a3] rounded-2xl rounded-tl-none px-4 py-3 text-xs max-w-[85%] leading-relaxed shadow-lg">
                ¡Entendido! Registré el gasto de <span className="font-bold">$4.50</span> en Starbucks bajo la categoría <span className="font-bold">Alimentos</span> usando tu cuenta de <span className="font-bold">Efectivo</span>.
              </div>
              <span className="text-[9px] text-zinc-500 ml-1">Manevo AI • 11:32 AM</span>
            </div>
          </div>
        </motion.div>

        {/* QUADRANT 3: Accounts and Categories Visualizer (Bottom-Left) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-zinc-950/40 border border-white/[0.04] backdrop-blur-md rounded-3xl p-8 flex flex-col justify-center items-center relative group min-h-[380px]"
        >
          <div className="absolute top-4 right-4 p-1 bg-white/[0.02] border border-white/[0.06] rounded-lg opacity-40 group-hover:opacity-80 transition-opacity">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="bg-[#050505] border border-white/[0.06] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold text-white">Cuentas</span>
                <span className="text-[10px] text-accent-500 font-semibold px-2 py-0.5 bg-accent-500/10 rounded-full">Activas</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-zinc-900/60 p-3 rounded-xl border border-white/[0.02] text-xs">
                  <span className="font-medium text-zinc-300">Banco de América</span>
                  <span className="font-bold text-white">$12,450.00</span>
                </div>
                <div className="flex justify-between items-center bg-zinc-900/60 p-3 rounded-xl border border-white/[0.02] text-xs">
                  <span className="font-medium text-zinc-300">Efectivo Físico</span>
                  <span className="font-bold text-white">$340.00</span>
                </div>
              </div>
            </div>

            <div className="bg-[#050505] border border-white/[0.06] rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-bold text-white">Categorías</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Suscripciones', 'Alquiler', 'Restaurantes', 'Inversión'].map((tag, i) => (
                  <span key={i} className="text-[10px] font-semibold text-zinc-400 px-3 py-1.5 bg-zinc-900 border border-white/[0.04] rounded-xl">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* QUADRANT 4: Metrics / Dashboard Mockup (Bottom-Right) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-zinc-950/40 border border-white/[0.04] backdrop-blur-md rounded-3xl p-8 flex flex-col justify-center items-center relative group min-h-[380px]"
        >
          <div className="absolute top-4 right-4 p-1 bg-white/[0.02] border border-white/[0.06] rounded-lg opacity-40 group-hover:opacity-80 transition-opacity">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>

          <div className="w-full max-w-sm bg-[#050505] border border-white/[0.06] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-28 h-28 rounded-full bg-accent-500/10 blur-[40px] pointer-events-none" />
            
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Métricas Totales</span>
            <div className="text-4xl font-black text-white mt-1 mb-5 tracking-tight">$12,790.00</div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-semibold">Tasa de Ahorros</span>
                <span className="text-accent-500 font-bold">42.5%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-accent-500 rounded-full" style={{ width: '42.5%' }} />
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* FOOTER */}
      <div className="max-w-7xl mx-auto w-full text-center text-xs text-zinc-600 mt-12 relative z-10">
        &copy; {new Date().getFullYear()} Manevo Money. Todos los derechos reservados.
      </div>

      {/* DYNAMIC MODALS OVERLAY */}
      <PrettyModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        triggerElement={modalTrigger}
        className="w-[calc(100%-2rem)] max-w-md bg-[#09090b] border border-white/[0.08] rounded-3xl shadow-2xl p-8 overflow-hidden h-auto"
      >
        <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-accent-500/5 blur-[70px] pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
          <h4 className="font-extrabold text-xl text-white">
            {lastActiveModal === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
          </h4>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 hover:bg-zinc-900 border border-white/[0.04] rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form 
          onSubmit={lastActiveModal === 'login' ? handleLoginSubmit : handleRegisterSubmit} 
          className="space-y-4"
        >
          {lastActiveModal === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Nombre Completo
              </label>
              <input
                type="text"
                required
                placeholder="Samuel Pineda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loginMutation.isPending || registerMutation.isPending}
            className="w-full py-3.5 bg-accent-500 hover:bg-[#00d496] disabled:bg-accent-600/50 rounded-2xl text-sm font-bold text-black transition-colors duration-200 mt-4 shadow-lg shadow-accent-500/10"
          >
            {loginMutation.isPending || registerMutation.isPending ? 'Procesando...' : lastActiveModal === 'login' ? 'Acceder' : 'Registrarse'}
          </motion.button>

          <div className="text-center text-xs text-zinc-500 mt-4">
            {lastActiveModal === 'login' ? (
              <>
                ¿No tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActiveModal('register');
                  }}
                  className="text-accent-500 font-bold hover:underline"
                >
                  Créala ahora
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActiveModal('login');
                  }}
                  className="text-accent-500 font-bold hover:underline"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </div>
        </form>
      </PrettyModal>
    </div>
  );
}
