import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Book, Target, Users, TrendingUp, Languages } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { getTranslations, getStoredLanguage, setStoredLanguage, Language } from '../utils/translations';
import ProfileMenu from './ProfileMenu';

interface LandingPageProps {
  isAuthenticated?: boolean;
  onSignOut?: () => void;
}

export default function LandingPage({ isAuthenticated = false, onSignOut }: LandingPageProps) {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>(getStoredLanguage());
  const t = getTranslations(language);

  useEffect(() => {
    // Check if device is mobile/tablet and redirect to dashboard
    const isMobileOrTablet = window.innerWidth <= 1024;
    if (isMobileOrTablet) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    setStoredLanguage(newLang);
  };

  const isRTL = language === 'ar';
  
  // Spiritual Arabic fonts
  const headingFont = isRTL ? "'Amiri', serif" : 'inherit';
  const bodyFont = isRTL ? "'Cairo', sans-serif" : 'inherit';
  const logoFont = isRTL ? "'Amiri', serif" : 'inherit';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Book className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span className="text-2xl text-emerald-900 dark:text-emerald-100 hidden md:inline" style={{ fontFamily: logoFont, fontWeight: isRTL ? 700 : 'inherit' }}>
              {isRTL ? t.appNameArabic : t.appName}
            </span>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
              onClick={toggleLanguage}
              title={language === 'en' ? 'العربية' : 'English'}
            >
              <Languages className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">{language === 'en' ? 'العربية' : 'English'}</span>
            </Button>
            {isAuthenticated ? (
              <ProfileMenu isAuthenticated={isAuthenticated} onSignOut={onSignOut || (() => {})} />
            ) : (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900" style={{ fontFamily: bodyFont }}>
                    {t.continueAsGuest}
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900" style={{ fontFamily: bodyFont }}>
                    {t.signIn}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl text-emerald-900 dark:text-emerald-100 mb-6 max-w-3xl mx-auto" style={{ fontFamily: headingFont, fontWeight: isRTL ? 700 : 'inherit', lineHeight: isRTL ? '1.6' : 'inherit' }}>
          {t.heroTitle}
        </h1>
        <p className="text-xl text-emerald-700 dark:text-emerald-300 mb-10 max-w-2xl mx-auto" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
          {t.heroSubtitle}
        </p>
        <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
          <Button size="lg" className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-8 py-6 text-lg" style={{ fontFamily: bodyFont, fontWeight: isRTL ? 600 : 'inherit' }}>
            {t.beginJourney}
          </Button>
        </Link>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl text-emerald-900 dark:text-emerald-100 text-center mb-4" style={{ fontFamily: headingFont, fontWeight: isRTL ? 700 : 'inherit' }}>
          {t.howItWorks}
        </h2>
        <p className="text-center text-emerald-600 dark:text-emerald-400 mb-12 max-w-2xl mx-auto" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
          {t.howItWorksSubtitle}
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
              <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2" style={{ fontFamily: headingFont, fontWeight: isRTL ? 600 : 'inherit' }}>{t.personalTracking}</h3>
            <p className="text-emerald-600 dark:text-emerald-400" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
              {t.personalTrackingDesc}
            </p>
          </Card>

          <Card className="p-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2" style={{ fontFamily: headingFont, fontWeight: isRTL ? 600 : 'inherit' }}>{t.goalOriented}</h3>
            <p className="text-emerald-600 dark:text-emerald-400" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
              {t.goalOrientedDesc}
            </p>
          </Card>

          <Card className="p-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2" style={{ fontFamily: headingFont, fontWeight: isRTL ? 600 : 'inherit' }}>{t.anonymousCircles}</h3>
            <p className="text-emerald-600 dark:text-emerald-400" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
              {t.anonymousCirclesDesc}
            </p>
          </Card>

          <Card className="p-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2" style={{ fontFamily: headingFont, fontWeight: isRTL ? 600 : 'inherit' }}>{t.trackProgress}</h3>
            <p className="text-emerald-600 dark:text-emerald-400" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
              {t.trackProgressDesc}
            </p>
          </Card>
        </div>
      </section>

      {/* Core Principles */}
      <section className="bg-emerald-50 dark:bg-emerald-900/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-emerald-900 dark:text-emerald-100 text-center mb-12" style={{ fontFamily: headingFont, fontWeight: isRTL ? 700 : 'inherit' }}>
            {t.ourPrinciples}
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-emerald-950 rounded-lg p-6 border border-emerald-100 dark:border-emerald-800">
              <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2" style={{ fontFamily: headingFont, fontWeight: isRTL ? 600 : 'inherit' }}>{t.completePrivacy}</h3>
              <p className="text-emerald-600 dark:text-emerald-400" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
                {t.completePrivacyDesc}
              </p>
            </div>

            <div className="bg-white dark:bg-emerald-950 rounded-lg p-6 border border-emerald-100 dark:border-emerald-800">
              <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2" style={{ fontFamily: headingFont, fontWeight: isRTL ? 600 : 'inherit' }}>{t.zeroDistractions}</h3>
              <p className="text-emerald-600 dark:text-emerald-400" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
                {t.zeroDistractionsDesc}
              </p>
            </div>

            <div className="bg-white dark:bg-emerald-950 rounded-lg p-6 border border-emerald-100 dark:border-emerald-800">
              <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2" style={{ fontFamily: headingFont, fontWeight: isRTL ? 600 : 'inherit' }}>{t.goalFocused}</h3>
              <p className="text-emerald-600 dark:text-emerald-400" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
                {t.goalFocusedDesc}
              </p>
            </div>

            <div className="bg-white dark:bg-emerald-950 rounded-lg p-6 border border-emerald-100 dark:border-emerald-800">
              <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2" style={{ fontFamily: headingFont, fontWeight: isRTL ? 600 : 'inherit' }}>{t.spirituallyCentered}</h3>
              <p className="text-emerald-600 dark:text-emerald-400" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
                {t.spirituallyCenteredDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl text-emerald-900 dark:text-emerald-100 mb-6" style={{ fontFamily: headingFont, fontWeight: isRTL ? 700 : 'inherit' }}>
          {t.startToday}
        </h2>
        <p className="text-emerald-600 dark:text-emerald-400 mb-8 max-w-2xl mx-auto" style={{ fontFamily: bodyFont, lineHeight: isRTL ? '1.8' : 'inherit' }}>
          {t.startTodayDesc}
        </p>
        <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
          <Button size="lg" className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white px-8 py-6 text-lg" style={{ fontFamily: bodyFont, fontWeight: isRTL ? 600 : 'inherit' }}>
            {t.getStartedFree}
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 py-8">
        <div className="container mx-auto px-4 text-center text-emerald-600 dark:text-emerald-400" style={{ fontFamily: bodyFont }}>
          <p>{t.footerText}</p>
        </div>
      </footer>
    </div>
  );
}