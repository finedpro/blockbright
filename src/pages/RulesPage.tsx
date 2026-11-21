import { useTranslation } from 'react-i18next';
import { GoldenRules } from '../components/GoldenRules';
import { Icon } from '../components/Icon';

export function RulesPage({ onExit }: { onExit(): void }) {
  const { t } = useTranslation();
  return (
    <section className="rules-page">
      <button type="button" className="back-button no-print" onClick={onExit}><Icon name="back" size={20} />{t('lesson.backToLessons')}</button>
      <GoldenRules />
    </section>
  );
}
