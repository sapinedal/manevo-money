import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, ArrowRight, Check, Mic, MicOff, Hourglass, ChevronLeft } from 'lucide-react';
import { api } from '../../infrastructure/api/client';
import { useAuthStore } from '../../core/store/auth.store';
import { useQueryClient } from '@tanstack/react-query';

interface OnboardingWizardProps {
  onComplete: () => void;
}

function NumberCounter({ target }: { target: number }) {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1600; // 1.6 seconds smooth count animation
    const startValue = 0;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Ease-out cubic formula for slow deceleration
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const currentCount = startValue + easeOutCubic(progress) * (target - startValue);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [target]);

  return <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(count)}</span>;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { activeWorkspaceId } = useAuthStore();
  const queryClient = useQueryClient();

  const [step, setStep] = React.useState(1);
  const [inputText, setInputText] = React.useState('');
  const [isListening, setIsListening] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [parsedAccounts, setParsedAccounts] = React.useState<any[]>([]);

  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'es-ES';
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('La entrada por voz no es soportada en este navegador.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setError(null);
      recognitionRef.current.start();
    }
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handleBackStep = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleOnboardParse = async () => {
    if (!inputText.trim()) {
      setError('Por favor, escribe o dicta cuánto dinero tienes.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const startTime = Date.now();
      const response = await api.post(`/workspaces/${activeWorkspaceId}/onboard-parse`, { text: inputText });
      
      // Keep hourglass spinning for 1.2 seconds to showcase the animation
      const elapsed = Date.now() - startTime;
      if (elapsed < 1200) {
        await new Promise(r => setTimeout(r, 1200 - elapsed));
      }
      
      setParsedAccounts(response.data);

      // Invalidate accounts queries to update the app state
      queryClient.invalidateQueries({ queryKey: ['workspace', activeWorkspaceId, 'accounts'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', activeWorkspaceId, 'dashboard'] });

      // Move to step 3 (Preview)
      setStep(3);
    } catch (e: any) {
      console.error('Failed to parse onboarding financial text', e);
      setError('Ocurrió un error al registrar las cuentas. Por favor, intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleFinish = () => {
    setStep(4);
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const totalParsedMoney = React.useMemo(() => {
    return parsedAccounts.reduce((acc, a) => acc + Number(a.balance || 0), 0);
  }, [parsedAccounts]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="fixed inset-0 bg-[#030303] text-zinc-100 z-50 flex items-center justify-center p-6 select-none font-sans overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-950/10 blur-[120px] pointer-events-none" />

      {/* Floating Back Navigation Chevron */}
      {step > 1 && step < 4 && (
        <button
          onClick={handleBackStep}
          className="absolute top-8 left-8 text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.04]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
      )}

      <AnimatePresence mode="wait" custom={step}>
        {step === 1 && (
          <motion.div
            key="step1"
            custom={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col items-center max-w-md w-full text-center space-y-8"
          >
            {/* Logo in Green Glow Frame */}
            <div className="w-20 h-20 bg-accent-500/10 border border-accent-500/35 rounded-[28px] flex items-center justify-center shadow-lg shadow-accent-500/5">
              <PiggyBank className="w-10 h-10 text-accent-500" />
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold tracking-tight text-white font-display">manevo money</h2>
              <p className="text-zinc-400 text-sm">Configura lo esencial para empezar</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNextStep}
              className="w-full flex items-center justify-center gap-2 py-4 bg-accent-500 hover:bg-[#00d496] rounded-2xl text-sm font-bold text-black shadow-lg shadow-accent-500/10 transition-all duration-200"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            custom={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col items-center max-w-xl w-full space-y-6"
          >
            <div className="w-full text-left space-y-1">
              <span className="text-zinc-400 text-sm font-medium">Empecemos por tu dinero</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">¿Cuánto dinero tienes?</h2>
            </div>

            {error && (
              <div className="w-full p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="w-full relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ejemplo: Tengo 200 en efectivo y 500 en el banco"
                className="w-full h-36 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 text-base text-white placeholder-zinc-600 focus:outline-none focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all resize-none font-medium leading-relaxed"
              />
              {isListening && (
                <div className="absolute right-4 bottom-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-accent-500 font-bold bg-accent-500/10 border border-accent-500/20 px-3 py-1.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                  Escuchando...
                </div>
              )}
            </div>

            <div className="w-full flex gap-4">
              {/* Microphone Voice Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleListening}
                type="button"
                className={`flex-1 py-4 border rounded-full flex justify-center items-center transition-all ${
                  isListening
                    ? 'bg-accent-500/15 border-accent-500 text-accent-500 shadow-lg shadow-accent-500/5'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-white'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
              </motion.button>

              {/* Next Action Button with Hourglass Loader */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOnboardParse}
                disabled={isSaving}
                className="w-32 py-4 bg-accent-500 hover:bg-[#00d496] disabled:bg-accent-600/50 rounded-full flex justify-center items-center text-black font-bold shadow-lg shadow-accent-500/10 transition-all"
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: [0, 180, 180, 360] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  >
                    <Hourglass className="w-5 h-5 text-black" />
                  </motion.div>
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </motion.button>
            </div>

            <button
              onClick={handleSkip}
              className="text-xs text-zinc-500 hover:text-zinc-300 font-semibold transition-colors pt-2"
            >
              Hacerlo después
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            custom={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex flex-col items-center max-w-md w-full space-y-8"
          >
            <div className="w-full text-center space-y-1">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Tu dinero</span>
              <div className="text-4xl md:text-5xl font-black text-white tracking-tight">
                <NumberCounter target={totalParsedMoney} />
              </div>
            </div>

            {/* List of Parsed Accounts */}
            <div className="w-full space-y-3">
              {parsedAccounts.map((account, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="flex justify-between items-center bg-zinc-950/60 border border-white/[0.04] p-4 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {account.type === 'CASH' ? '💵' : account.type === 'CREDIT_CARD' ? '💳' : '🏦'}
                    </span>
                    <span className="text-zinc-300 font-semibold text-sm">{account.name}</span>
                  </div>
                  <span className="text-white font-extrabold text-sm">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(account.balance))}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 py-4 bg-accent-500 hover:bg-[#00d496] rounded-2xl text-sm font-bold text-black shadow-lg shadow-accent-500/10 transition-all duration-200"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center max-w-md w-full text-center space-y-6"
          >
            <div className="w-16 h-16 bg-accent-500/10 border border-accent-500/30 rounded-full flex items-center justify-center shadow-lg shadow-accent-500/5 animate-pulse">
              <Check className="w-8 h-8 text-accent-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">¡Todo listo!</h2>
              <p className="text-zinc-500 text-xs">Preparando tu panel financiero...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
