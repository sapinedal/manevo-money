import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../core/store/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import {
  useInvitationDetails,
  useAcceptInvitation,
  useDeclineInvitation
} from '../../infrastructure/hooks/useInvitations';
import { useLogout } from '../../infrastructure/hooks/useAuth';
import { Mail, Check, X, ShieldAlert, ArrowRight, UserPlus, LogOut } from 'lucide-react';

export function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user, isAuthenticated } = useAuthStore();
  const { data: invite, isLoading, error } = useInvitationDetails(token);
  
  const acceptMutation = useAcceptInvitation();
  const declineMutation = useDeclineInvitation();
  const logoutMutation = useLogout();

  const [localError, setLocalError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Store token in localStorage if they need to log in/register
  React.useEffect(() => {
    if (token) {
      localStorage.setItem('pending_invite_token', token);
    }
  }, [token]);

  const handleAccept = () => {
    if (!token) return;
    setLocalError(null);

    acceptMutation.mutate(token, {
      onSuccess: async (data: any) => {
        // Clear pending invite token
        localStorage.removeItem('pending_invite_token');
        setSuccessMsg('¡Invitación aceptada con éxito!');
        
        // 1. Refetch user profile to update memberships list in the query cache & store
        await queryClient.invalidateQueries({ queryKey: ['me'] });
        
        // 2. Set the newly accepted workspace as active
        useAuthStore.getState().setActiveWorkspaceId(data.workspaceId);
        
        // 3. Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate('/app/money/dashboard');
        }, 1500);
      },
      onError: (err: any) => {
        setLocalError(err.response?.data?.message || 'Error al aceptar la invitación.');
      }
    });
  };

  const handleDecline = () => {
    if (!token) return;
    setLocalError(null);

    declineMutation.mutate(token, {
      onSuccess: () => {
        localStorage.removeItem('pending_invite_token');
        setSuccessMsg('Has rechazado la invitación.');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      },
      onError: (err: any) => {
        setLocalError(err.response?.data?.message || 'Error al rechazar la invitación.');
      }
    });
  };

  const handleLogoutAndRedirect = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col justify-center items-center p-6">
        <div className="w-12 h-12 border-4 border-accent-500/20 border-t-accent-500 rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 text-sm font-semibold tracking-wide">Cargando invitación...</p>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col justify-center items-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-950/40 border border-white/[0.06] rounded-[28px] p-8 text-center space-y-6"
        >
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Invitación Inválida</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              El enlace de invitación ya ha sido utilizado, expiró o no existe. Por favor, solicita una nueva invitación al administrador.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-2xl text-sm font-bold text-white transition-all"
          >
            Ir al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  const isEmailMismatch = isAuthenticated && user && invite.email.toLowerCase() !== user.email.toLowerCase();

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 flex flex-col justify-center items-center p-6 relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-accent-500/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="max-w-md w-full bg-zinc-950/40 border border-white/[0.06] backdrop-blur-md rounded-[32px] p-8 space-y-6 shadow-2xl relative"
      >
        <div className="w-14 h-14 bg-accent-500/10 border border-accent-500/20 rounded-2xl flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-accent-500" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-accent-500 uppercase tracking-widest pl-0.5">Invitación a unirte</span>
          <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
            Únete a {invite.workspace.name}
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            <strong>{invite.invitedBy.name || invite.invitedBy.email}</strong> te ha invitado a colaborar como{' '}
            <span className="text-white font-bold">{invite.role === 'ADMIN' ? 'Administrador' : invite.role === 'VIEWER' ? 'Lector' : 'Miembro'}</span>.
          </p>
        </div>

        {/* Status Messages */}
        {localError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* State Conditional UI */}
        {!isAuthenticated ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-zinc-900/60 border border-white/[0.03] rounded-2xl text-xs text-zinc-500 leading-relaxed flex items-start gap-3">
              <Mail className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <span>
                Esta invitación fue enviada a <strong className="text-zinc-300">{invite.email}</strong>. 
                Debes iniciar sesión con esa cuenta o registrarte para continuar.
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/')}
                className="py-3.5 bg-accent-500 hover:bg-[#00d496] rounded-2xl text-sm font-bold text-black shadow-lg shadow-accent-500/10 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Acceder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-2xl text-sm font-bold text-white transition-all"
              >
                Registrarse
              </button>
            </div>
          </div>
        ) : isEmailMismatch ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400 leading-relaxed space-y-2">
              <div className="flex gap-2 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Conflicto de cuenta</span>
              </div>
              <p>
                Esta invitación está dirigida a <strong className="text-white">{invite.email}</strong>, pero tu cuenta iniciada es <strong className="text-white">{user?.email}</strong>.
              </p>
            </div>
            
            <button
              onClick={handleLogoutAndRedirect}
              className="w-full py-3.5 bg-[#9a2121]/20 hover:bg-[#9a2121]/30 border border-[#9a2121]/40 rounded-2xl text-sm font-bold text-red-400 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión e iniciar con {invite.email}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="p-4 bg-zinc-900/60 border border-white/[0.03] rounded-2xl text-xs text-zinc-500 leading-relaxed">
              Iniciaste sesión como <strong className="text-zinc-300">{user?.email}</strong>. Listo para unirte.
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleDecline}
                disabled={acceptMutation.isPending || declineMutation.isPending}
                className="py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.06] rounded-2xl text-sm font-bold text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Rechazar</span>
              </button>
              
              <button
                onClick={handleAccept}
                disabled={acceptMutation.isPending || declineMutation.isPending}
                className="col-span-2 py-3.5 bg-accent-500 hover:bg-[#00d496] rounded-2xl text-sm font-bold text-black shadow-lg shadow-accent-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {acceptMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Aceptar Invitación</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
