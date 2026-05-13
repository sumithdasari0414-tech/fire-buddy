import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Shield, User } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/i18n/I18nProvider';

export default function RoleLanding() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background scanline flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/20 glow-red">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">{t('app.title')}</div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-widest">{t('app.tagline')}</div>
          </div>
        </div>
        <LanguageSelector />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <h1 className="text-3xl md:text-5xl font-black text-center mb-2 tracking-tight">{t('role.choose')}</h1>
          <p className="text-center text-muted-foreground mb-10 text-sm">{t('app.tagline')}</p>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.button
              whileHover={{ y: -6 }}
              onClick={() => navigate('/responder')}
              className="text-left p-8 rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 hover:border-primary transition group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('role.responder')}</h2>
              <p className="text-sm text-muted-foreground">{t('role.responder.desc')}</p>
            </motion.button>

            <motion.button
              whileHover={{ y: -6 }}
              onClick={() => navigate('/victim')}
              className="text-left p-8 rounded-2xl border border-border bg-gradient-to-br from-red-500/10 to-card hover:border-red-500 transition group"
            >
              <div className="w-14 h-14 rounded-xl bg-red-500/15 flex items-center justify-center mb-4 group-hover:bg-red-500/25">
                <User className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('role.victim')}</h2>
              <p className="text-sm text-muted-foreground">{t('role.victim.desc')}</p>
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  );
}