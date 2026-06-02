import React from 'react';
import { useAuthStore } from '../../core/store/auth.store';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Plus,
  Settings as SettingsIcon,
  RotateCw,
  Palette,
  MessageSquare,
  LogOut,
  Pause,
  ChevronDown,
  X,
  Share2,
  Trash2,
  Copy,
  Check,
  Menu
} from 'lucide-react';
import { useAccounts, useCreateTransaction } from '../../infrastructure/hooks/useFinance';
import {
  useWorkspaceInvitations,
  useCreateInvitation,
  useRevokeInvitation
} from '../../infrastructure/hooks/useInvitations';
import { useLogout } from '../../infrastructure/hooks/useAuth';
 
interface WorkspaceLayoutProps {
  children: React.ReactNode;
}
 
export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { user, activeWorkspaceId, setActiveWorkspaceId } = useAuthStore();
  const logoutMutation = useLogout();
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(false);
  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);

  // Transfer Form State
  const [transferAmount, setTransferAmount] = React.useState('');
  const [fromAccountId, setFromAccountId] = React.useState('');
  const [toAccountId, setToAccountId] = React.useState('');
  const [transferDesc, setTransferDesc] = React.useState('Transferencia interna');
  const [transferError, setTransferError] = React.useState<string | null>(null);

  // Feedback Form State
  const [feedbackText, setFeedbackText] = React.useState('');
  const [feedbackSuccess, setFeedbackSuccess] = React.useState(false);

  // Sharing Form & List State
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('MEMBER');
  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [shareError, setShareError] = React.useState<string | null>(null);

  const { data: invitations } = useWorkspaceInvitations(activeWorkspaceId);
  const createInvitationMutation = useCreateInvitation(activeWorkspaceId);
  const revokeInvitationMutation = useRevokeInvitation(activeWorkspaceId);

  const currentMembership = user?.memberships?.find(
    (m) => m.workspaceId === activeWorkspaceId
  );
  const isOwnerOrAdmin = currentMembership?.role === 'OWNER' || currentMembership?.role === 'ADMIN';

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShareError(null);
    setGeneratedLink(null);

    if (!inviteEmail.trim()) return;

    createInvitationMutation.mutate({
      email: inviteEmail.trim(),
      role: inviteRole,
    }, {
      onSuccess: (data: any) => {
        setInviteEmail('');
        const link = `${window.location.origin}/invite/${data.token}`;
        setGeneratedLink(link);
      },
      onError: (err: any) => {
        setShareError(err.response?.data?.message || 'Error al generar la invitación.');
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const location = useLocation();
  const { data: accounts } = useAccounts(activeWorkspaceId);
  const createTransactionMutation = useCreateTransaction(activeWorkspaceId);

  React.useEffect(() => {
    if (accounts && accounts.length > 0) {
      setFromAccountId(accounts[0].id);
      if (accounts.length > 1) {
        setToAccountId(accounts[1].id);
      } else {
        setToAccountId(accounts[0].id);
      }
    }
  }, [accounts]);

  const activeWorkspace = user?.memberships?.find(
    (m) => m.workspaceId === activeWorkspaceId
  )?.workspace;

  const navItems = [
    { id: 'dashboard', path: '/app/money/dashboard', label: 'Inicio' },
    { id: 'transactions', path: '/app/money/transactions', label: 'Movimientos' },
    { id: 'categories', path: '/app/money/categories', label: 'Categorías' },
    { id: 'accounts', path: '/app/money/accounts', label: 'Cuentas' },
    { id: 'intentions', path: '/app/money/intentions', label: 'Intenciones' },
  ];


  // Actions
  const handleReload = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
    window.location.reload();
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || Number(transferAmount) <= 0) {
      setTransferError('Por favor, ingresa un monto válido.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setTransferError('La cuenta de origen y destino deben ser diferentes.');
      return;
    }

    createTransactionMutation.mutate({
      amount: Number(transferAmount),
      type: 'TRANSFER',
      description: transferDesc,
      date: new Date().toISOString(),
      accountId: fromAccountId,
      toAccountId: toAccountId,
    }, {
      onSuccess: () => {
        setShowTransferModal(false);
        setTransferAmount('');
        setTransferError(null);
      },
      onError: (err: any) => {
        setTransferError(err.response?.data?.message || 'Error al procesar la transferencia.');
      }
    });
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSuccess(true);
    setFeedbackText('');
    setTimeout(() => {
      setFeedbackSuccess(false);
      setShowFeedbackModal(false);
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-[#030303] text-zinc-100 font-sans antialiased overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileSidebar(false)}
            className="fixed inset-0 bg-black z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`w-72 bg-black flex flex-col justify-between p-6 select-none shrink-0 z-30 fixed md:relative inset-y-0 left-0 transform ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="space-y-6">
          {/* Workspace selector at the top */}
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-950/40 hover:bg-zinc-900/60 border border-white/[0.04] rounded-2xl transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-accent-500/10 text-accent-400 flex items-center justify-center font-bold text-[10px] uppercase">
                  {activeWorkspace?.name.charAt(0) || 'M'}
                </div>
                <span className="font-semibold text-xs text-zinc-300 truncate">
                  {activeWorkspace?.name || 'Manevo'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            <AnimatePresence>
              {showWorkspaceDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowWorkspaceDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 right-0 mt-2 bg-[#09090b] border border-white/[0.06] rounded-2xl shadow-xl z-20 overflow-hidden py-1.5"
                  >
                    <div className="px-3.5 py-1 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      Espacios
                    </div>
                    {user?.memberships?.map((membership) => (
                      <button
                        key={membership.workspaceId}
                        onClick={() => {
                          setActiveWorkspaceId(membership.workspaceId);
                          setShowWorkspaceDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs transition-colors duration-150 ${membership.workspaceId === activeWorkspaceId
                          ? 'bg-accent-500/10 text-accent-400 font-semibold'
                          : 'hover:bg-zinc-900 text-zinc-400'
                          }`}
                      >
                        <span className="truncate">{membership.workspace.name}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Items (capsule style, NO icons as in first screenshot) */}
          <nav className="flex flex-col gap-1.5 pl-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setShowMobileSidebar(false)}
                  className={`w-fit text-sm transition-all duration-200 ${isActive
                    ? 'bg-[#222a25] border border-[#2c3530] text-white font-bold px-5 py-2.5 rounded-full'
                    : 'text-zinc-500 hover:text-zinc-300 font-semibold px-5 py-2.5 rounded-full hover:bg-white/[0.01]'
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Options Button at the bottom */}
        <div className="relative pl-1">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`w-fit text-sm font-semibold transition-all ${showOptions
              ? 'bg-[#222a25] border border-[#2c3530] text-white px-5 py-2.5 rounded-full'
              : 'text-zinc-500 hover:text-zinc-300 px-5 py-2.5 rounded-full hover:bg-white/[0.01]'
              }`}
          >
            Opciones
          </button>

          {/* Sage Green Floating Options Menu (Matches Second Screenshot Exactly) */}
          <AnimatePresence>
            {showOptions && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setShowOptions(false)}
                />
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="absolute bottom-14 left-0 bg-[#737f78] border border-[#86928b]/50 text-zinc-900 rounded-[28px] p-6 shadow-2xl w-64 z-50 flex flex-col space-y-4"
                >
                  <h3 className="text-xl font-bold text-zinc-900 pl-1 tracking-tight select-none">
                    Opciones
                  </h3>

                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        setShowTransferModal(true);
                      }}
                      className="flex items-center gap-3 px-2 py-2 text-zinc-900 hover:bg-black/10 rounded-xl transition-all font-semibold text-sm text-left"
                    >
                      <Plus className="w-4 h-4 text-zinc-800 stroke-[2.5]" />
                      <span>Crear transferencia</span>
                    </button>

                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => {
                          setShowOptions(false);
                          setShowShareModal(true);
                        }}
                        className="flex items-center gap-3 px-2 py-2 text-zinc-900 hover:bg-black/10 rounded-xl transition-all font-semibold text-sm text-left"
                      >
                        <Share2 className="w-4 h-4 text-zinc-800" />
                        <span>Compartir espacio</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowOptions(false)}
                      className="flex items-center gap-3 px-2 py-2 text-zinc-900 hover:bg-black/10 rounded-xl transition-all font-semibold text-sm text-left"
                    >
                      <Pause className="w-4 h-4 text-zinc-800 rotate-90 stroke-[2.5]" />
                      <span>Campos adicionales</span>
                    </button>

                    <Link
                      to="/app/money/settings"
                      onClick={() => setShowOptions(false)}
                      className="flex items-center gap-3 px-2 py-2 text-zinc-900 hover:bg-black/10 rounded-xl transition-all font-semibold text-sm text-left"
                    >
                      <SettingsIcon className="w-4 h-4 text-zinc-800" />
                      <span>Configuración</span>
                    </Link>

                    <button
                      onClick={() => {
                        setShowOptions(false);
                        handleReload();
                      }}
                      className="flex items-center gap-3 px-2 py-2 text-zinc-900 hover:bg-black/10 rounded-xl transition-all font-semibold text-sm text-left"
                    >
                      <RotateCw className="w-4 h-4 text-zinc-800" />
                      <span>Recargar App</span>
                    </button>

                    <button
                      onClick={() => setShowOptions(false)}
                      className="flex items-center gap-3 px-2 py-2 text-zinc-900 hover:bg-black/10 rounded-xl transition-all font-semibold text-sm text-left"
                    >
                      <Palette className="w-4 h-4 text-zinc-800" />
                      <span>Apariencia</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowOptions(false);
                        setShowFeedbackModal(true);
                      }}
                      className="flex items-center gap-3 px-2 py-2 text-zinc-900 hover:bg-black/10 rounded-xl transition-all font-semibold text-sm text-left"
                    >
                      <MessageSquare className="w-4 h-4 text-zinc-800" />
                      <span>Dar Feedback</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowOptions(false);
                        logoutMutation.mutate();
                      }}
                      className="flex items-center gap-3 px-2 py-2 text-[#9a2121] hover:bg-black/10 rounded-xl transition-all font-semibold text-sm text-left"
                    >
                      <LogOut className="w-4 h-4 text-[#9a2121]" />
                      <span>{logoutMutation.isPending ? 'Cerrando...' : 'Cerrar Sesión'}</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Floating Share Workspace Popover */}
          <AnimatePresence>
            {showShareModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setShowShareModal(false);
                    setGeneratedLink(null);
                    setShareError(null);
                  }}
                  className="absolute inset-0 bg-black/85 backdrop-blur-md"
                />
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="relative w-full h-full md:h-auto md:max-w-md bg-[#09090b] border-0 md:border border-white/[0.08] backdrop-blur-md text-zinc-100 rounded-none md:rounded-[28px] p-6 shadow-2xl z-10 flex flex-col space-y-4 font-sans normal-case select-none text-left overflow-y-auto"
                >
                  <div className="flex justify-between items-center pl-1 border-b border-white/[0.05] pb-3">
                    <h3 className="text-lg font-extrabold text-white tracking-tight">
                      Compartir Espacio
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowShareModal(false);
                        setGeneratedLink(null);
                        setShareError(null);
                      }}
                      className="p-1 hover:bg-white/[0.05] rounded-full text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {shareError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl select-text">
                      {shareError}
                    </div>
                  )}

                  {/* Invite Form */}
                  <form onSubmit={handleShareSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 block">Correo Electrónico</span>
                        <input
                          type="email"
                          required
                          placeholder="amigo@correo.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 font-semibold focus:outline-none focus:border-accent-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 block">Rol</span>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-2xl px-3 py-2.5 text-xs text-zinc-300 font-semibold focus:outline-none focus:border-accent-500 transition-colors h-[38px]"
                        >
                          <option value="MEMBER">Miembro</option>
                          <option value="ADMIN">Administrador</option>
                          <option value="VIEWER">Lector</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={createInvitationMutation.isPending}
                      className="w-full py-3 bg-accent-500 hover:bg-accent-400 text-black rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {createInvitationMutation.isPending ? 'Generando...' : 'Generar link de invitación'}
                    </button>
                  </form>

                  {/* Generated Link Display */}
                  {generatedLink && (
                    <div className="p-4 bg-accent-500/10 border border-accent-500/20 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Enlace de Invitación Creado</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedLink}
                          className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(generatedLink)}
                          className="px-3 bg-accent-500 hover:bg-accent-400 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedLink ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <p className="text-[9px] text-zinc-500 leading-relaxed pl-1">
                        Comparte este enlace con el invitado. Vencerá en 7 días y solo se puede utilizar una vez.
                      </p>
                    </div>
                  )}

                  {/* Pending Invitations List */}
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 block">Invitaciones Pendientes</span>
                    <div className="bg-[#030303]/60 border border-white/[0.05] rounded-2xl overflow-hidden divide-y divide-white/[0.03]">
                      {!invitations || invitations.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-600">
                          No hay invitaciones activas o pendientes.
                        </div>
                      ) : (
                        invitations.map((inv: any) => (
                          <div key={inv.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-zinc-200 truncate block">{inv.email}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent-500/10 text-accent-400">
                                  Pendiente
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-zinc-500">
                                <span>Rol: <strong>{inv.role}</strong></span>
                                <span>•</span>
                                <span>Expira: <strong>{new Date(inv.expiresAt).toLocaleDateString()}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => copyToClipboard(`${window.location.origin}/invite/${inv.token}`)}
                                className="p-1.5 hover:bg-white/[0.05] rounded-lg text-zinc-400 hover:text-white transition-colors"
                                title="Copiar Enlace"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('¿Estás seguro de que deseas revocar esta invitación?')) {
                                    revokeInvitationMutation.mutate(inv.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-rose-500/10 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors"
                                title="Revocar Invitación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main panel display container */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#030303]">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 bg-black border-b border-white/[0.04] z-20 select-none">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent-500/10 text-accent-400 flex items-center justify-center font-bold text-xs uppercase">
              {activeWorkspace?.name.charAt(0) || 'M'}
            </div>
            <span className="font-semibold text-xs text-zinc-300 truncate">
              {activeWorkspace?.name || 'Manevo'}
            </span>
          </div>
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="p-1.5 hover:bg-zinc-900 border border-white/[0.04] rounded-xl text-zinc-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* 1. Modal: Crear transferencia */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransferModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="relative w-full h-full md:h-auto md:max-w-md bg-[#09090b] border-0 md:border border-white/[0.08] rounded-none md:rounded-3xl shadow-2xl p-6 md:p-7 z-10 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-6">
                <h4 className="font-extrabold text-lg text-white">Crear transferencia</h4>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="p-1.5 hover:bg-zinc-900 border border-white/[0.04] rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {transferError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl">
                  {transferError}
                </div>
              )}

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Monto (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-2xl px-5 py-4 text-2xl text-white font-extrabold placeholder-zinc-700 focus:outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Desde cuenta</label>
                    <select
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                      className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-accent-500 transition-all"
                    >
                      {accounts?.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(acc.balance))})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Hacia cuenta</label>
                    <select
                      value={toAccountId}
                      onChange={(e) => setToAccountId(e.target.value)}
                      className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-accent-500 transition-all"
                    >
                      {accounts?.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(acc.balance))})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Descripción</label>
                  <input
                    type="text"
                    required
                    value={transferDesc}
                    onChange={(e) => setTransferDesc(e.target.value)}
                    className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-2xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent-500 transition-all"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={createTransactionMutation.isPending}
                  className="w-full py-4 bg-accent-500 hover:bg-[#00d496] disabled:bg-accent-600/50 rounded-2xl text-sm font-bold text-black transition-colors duration-200 mt-4 shadow-lg shadow-accent-500/10"
                >
                  {createTransactionMutation.isPending ? 'Procesando...' : 'Transferir dinero'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal: Feedback */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="relative w-full h-full md:h-auto md:max-w-md bg-[#09090b] border-0 md:border border-white/[0.08] rounded-none md:rounded-3xl shadow-2xl p-6 md:p-7 z-10 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-4 mb-5">
                <h4 className="font-extrabold text-lg text-white">Enviar Feedback</h4>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="p-1.5 hover:bg-zinc-900 border border-white/[0.04] rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {feedbackSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-accent-500/10 border border-accent-500/30 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-5 h-5 text-accent-500" />
                  </div>
                  <h5 className="font-bold text-white text-base">¡Muchas gracias!</h5>
                  <p className="text-xs text-zinc-500">Tu retroalimentación nos ayuda a mejorar Manevo Money.</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    ¿Qué te gustaría ver en Manevo? Háznoslo saber. Leemos todos los mensajes.
                  </p>
                  <textarea
                    required
                    placeholder="Escribe tus comentarios aquí..."
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full bg-[#030303]/60 border border-white/[0.08] rounded-2xl p-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-accent-500 transition-all resize-none"
                  />
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="w-full py-4 bg-accent-500 hover:bg-[#00d496] rounded-2xl text-sm font-bold text-black shadow-lg shadow-accent-500/10 transition-all duration-200"
                  >
                    Enviar Mensaje
                  </motion.button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
