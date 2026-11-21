import { useTranslation } from 'react-i18next';

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <section className="prose">
      <h1>{t('about.title')}</h1>
      <p>{t('about.what')}</p>
      <p>{t('about.notAdvice')}</p>
      <p>{t('about.noAds')}</p>
      <h2>{t('about.privacyTitle')}</h2>
      <p>{t('about.privacy')}</p>
      <h2>{t('about.publisherTitle')}</h2>
      <p>{t('about.publisher')}</p>
    </section>
  );
}
