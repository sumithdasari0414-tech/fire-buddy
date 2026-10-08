import { Globe } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { LANGUAGES, Lang } from '@/i18n/translations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t, translating, fallback } = useI18n();
  return (
    <div className="flex items-center gap-2">
      {!compact && <Globe className="w-4 h-4 text-muted-foreground" />}
      <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
        <SelectTrigger className="h-9 w-[150px] text-xs">
          <SelectValue placeholder={t('lang.label')} />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map(l => (
            <SelectItem key={l.code} value={l.code} className="text-xs">
              {l.native} <span className="text-muted-foreground ml-1">({l.label})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {translating && <span className="text-[10px] text-muted-foreground">…</span>}
      {fallback && <span className="text-[10px] text-warning" title={t('lang.fallback')}>EN</span>}
    </div>
  );
}