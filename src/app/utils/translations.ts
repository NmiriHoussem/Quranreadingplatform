// Translation utilities for Arabic/English

export type Language = 'en' | 'ar';

export interface Translations {
  // App Name & Branding
  appName: string;
  appNameArabic: string;
  tagline: string;
  metaDescription: string;
  
  // Landing Page Header
  continueAsGuest: string;
  signIn: string;
  
  // Landing Page Hero
  heroTitle: string;
  heroSubtitle: string;
  beginJourney: string;
  
  // How It Works
  howItWorks: string;
  howItWorksSubtitle: string;
  personalTracking: string;
  personalTrackingDesc: string;
  goalOriented: string;
  goalOrientedDesc: string;
  anonymousCircles: string;
  anonymousCirclesDesc: string;
  trackProgress: string;
  trackProgressDesc: string;
  
  // Principles
  ourPrinciples: string;
  completePrivacy: string;
  completePrivacyDesc: string;
  zeroDistractions: string;
  zeroDistractionsDesc: string;
  goalFocused: string;
  goalFocusedDesc: string;
  spirituallyCentered: string;
  spirituallyCenteredDesc: string;
  
  // CTA
  startToday: string;
  startTodayDesc: string;
  getStartedFree: string;
  
  // Footer
  footerText: string;
  
  // Circle Terminology
  circles: string;
  myCircles: string;
  discoverCircles: string;
  discover: string;
  all: string;
  joinCircle: string;
  leaveCircle: string;
  circleMembers: string;
  khatmahCircle: string;
  memorizationCircle: string;
  circleProgress: string;
  yourCircle: string;
  aboutThisCircle: string;
  joinToTrackProgress: string;
  previewCircle: string;
  circleGoals: string;
  aboutCircleGoals: string;
  aboutCircleGoalsDesc: string;
  noUsernamesVisible: string;
  progressTrackedCollectively: string;
  noChatOrComments: string;
  members: string;
  memorized: string;
  joined: string;
  
  // Reading Dashboard - Tabs
  publicKhatmahs: string;
  privateKhatmahs: string;
  createPrivateKhatmah: string;
  noPrivateKhatmahsYet: string;
  noPrivateKhatmahsDesc: string;
  inviteMembers: string;
  trackTogether: string;
  encourageEachOther: string;
  
  // Circle Types
  khatmah: string;
  memorization: string;
  study: string;
  
  // Group Detail Page
  backToGroups: string;
  leaveGoal: string;
  joinGoal: string;
  cannotJoinKhatmah: string;
  viewYourCurrentKhatmah: string;
  previewMode: string;
  previewModeDesc: string;
  openKhatmahReader: string;
  continueMemorizing: string;
  yourProgress: string;
  readingPlan: string;
  of: string;
  daysCompleted: string;
  daySchedule: string;
  previewScheduleDesc: string;
  milestonesAutoMarked: string;
  pagesAutoTracked: string;
  yourMemorizationProgress: string;
  percentComplete: string;
  ayahsMemorized: string;
  totalAyahs: string;
  lastMemorized: string;
  ayah: string;
  markEntireSurahMemorized: string;
  surahCompleted: string;
  progressUpdatesAuto: string;
  aboutThisGroup: string;
  joinGroupDesc: string;
  memorizationGroupDesc: string;
  
  // Circle Actions & States
  alreadyInCircle: string;
  oneCircleLimit: string;
  switchCircleWarning: string;
  viewingAsGuest: string;
  joinToContribute: string;
  
  // Navigation
  dashboard: string;
  reader: string;
  goals: string;
  progress: string;
  settings: string;
  help: string;
  officialWebsite: string;
  
  // Reading & Progress
  pagesRead: string;
  currentPage: string;
  markAsRead: string;
  streak: string;
  khatmahs: string;
  surahsMemorized: string;
  
  // Settings
  darkMode: string;
  lightMode: string;
  darkModeDescription: string;
  lightModeDescription: string;
  appearance: string;
  language: string;
  languagePreference: string;
  languageDescription: string;
  english: string;
  arabic: string;
  recitationStyle: string;
  resetProgress: string;
  signOut: string;
  mushafVersion: string;
  mushafVersionDescription: string;
  mushafImageMode: string;
  mushafTextMode: string;
  readingPreferences: string;
  tajweed: string;
  tajweedDescription: string;
  enableTajweed: string;
  disableTajweed: string;
  
  // Auth
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  signUp: string;
  participateInCircles: string;
  signUpToJoinGoal: string;
  signInToJoinGoal: string;
  whyJoinKhatmahGoals: string;
  whyJoinMemorizationGoals: string;
  stayMotivated: string;
  trackProgressTogether: string;
  buildConsistentHabits: string;
  earnRewardTogether: string;
  createYourAccount: string;
  welcomeBack: string;
  enterYourName: string;
  enterYourEmail: string;
  enterYourPassword: string;
  minimumCharacters: string;
  creatingAccount: string;
  signingIn: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  connected: string;
  myAccount: string;
  helpAndAbout: string;
  
  // Help & Info
  whatIsQuranCircle: string;
  quranCircleDescription: string;
  privacyFirst: string;
  privacyDescription: string;
  howToJoinCircle: string;
  circleFeatures: string;
  
  // Offline Reading
  offlineReading: string;
  offlineReadingDescription: string;
  offlineStorage: string;
  downloadedSurahs: string;
  quickDownload: string;
  downloadByJuz: string;
  customSelection: string;
  selected: string;
  downloadSelected: string;
  downloading: string;
  popularSurahs: string;
  allSurahs: string;
  
  // Settings - Account & Data Management
  signInDescription: string;
  signInSignUp: string;
  dataManagement: string;
  exportYourProgress: string;
  exportProgressDescription: string;
  exportProgress: string;
  appVersion: string;
  builtWithRespect: string;
  
  // Dashboard
  greeting: string;
  guest: string;
  guestMode: string;
  guestModeDesc: string;
  guestModeLink: string;
  progressSyncing: string;
  khatmasCompleted: string;
  continueReading: string;
  complete: string;
  lastRead: string;
  page: string;
  startKhatmah: string;
  startKhatmahDesc: string;
  joinKhatmahDesc: string;
  browseKhatmahCircles: string;
  memorizationProgress: string;
  totalAyahsToMemorize: string;
  yourSurahs: string;
  ayahs: string;
  seeFullList: string;
  more: string;
  showLess: string;
  browseMoreSurahs: string;
  viewAll: string;
  youveJoined: string;
  circle: string;
  viewMyCircles: string;
  joinACircle: string;
  joinCircleDesc: string;
  dayKhatmahChallenge: string;
  
  // Khatmah Group Labels
  completeKhatmahIn: string;
  days: string;
  day: string;
  pagesLabel: string;
  daysLabel: string;
  readEntireQuranIn: string;
  daysWithCommunity: string;
  
  // Reader Page
  readingMode: string;
  memorizationMode: string;
  learningMode: string;
  learning: string;
  testingMode: string;
  testing: string;
  surahs: string;
  surah: string;
  pageNumber: string;
  juz: string;
  juzNumber: string;
  pageCompleted: string;
  markAsMemorized: string;
  reciter: string;
  selectSurah: string;
  totalSurahs: string;
  theOpener: string;
  theCow: string;
  familyOfImran: string;
  
  // Reader Navigation & Actions
  next: string;
  previous: string;
  nextSurah: string;
  previousSurah: string;
  pageOf: string;
  completed: string;
  markPageAsComplete: string;
  autoCompleteHint: string;
  
  // Memorization Controls
  byAyah: string;
  byRange: string;
  byPage: string;
  play: string;
  pause: string;
  repeat: string;
  times: string;
  startAyah: string;
  endAyah: string;
  repeatRange: string;
  repeatEachAyah: string;
  playRange: string;
  
  // Surah Completion Modal
  mashaAllah: string;
  completedMemorizing: string;
  quranQuote: string;
  prophetMuhammad: string;
  continueJourney: string;
  
  // Surah Meanings (114 surahs)
  surahMeanings: string[];
}

export const translations: Record<Language, Translations> = {
  en: {
    // App Name & Branding
    appName: 'Quran Circle',
    appNameArabic: 'حلقة القرآن',
    tagline: 'Your private Quran circle',
    metaDescription: 'A distraction-free platform for reading, memorizing, and completing the Quran through personal tracking and anonymous circle goals',
    
    // Header
    continueAsGuest: 'Continue as Guest',
    signIn: 'Sign In',
    
    // Hero
    heroTitle: 'Your Personal Journey with the Quran',
    heroSubtitle: 'A distraction-free platform for reading, memorizing, and completing the Quran through personal tracking and anonymous circle goals',
    beginJourney: 'Begin Your Journey',
    
    // How It Works
    howItWorks: 'How It Works',
    howItWorksSubtitle: 'A calm, focused approach to Quran reading and memorization',
    personalTracking: 'Personal Tracking',
    personalTrackingDesc: 'Track your reading progress, memorization, and khatma completion privately',
    goalOriented: 'Goal-Oriented',
    goalOrientedDesc: 'Set and achieve personal goals for reading and memorization',
    anonymousCircles: 'Anonymous Circles',
    anonymousCirclesDesc: 'Join circles and contribute anonymously without social pressure',
    trackProgress: 'Track Progress',
    trackProgressDesc: 'Watch your consistency grow with streaks and milestones',
    
    // Principles
    ourPrinciples: 'Our Principles',
    completePrivacy: '🔒 Complete Privacy',
    completePrivacyDesc: 'No profiles, no usernames, no photos. Your journey is between you and Allah.',
    zeroDistractions: '🚫 Zero Distractions',
    zeroDistractionsDesc: 'No comments, no likes, no feeds. Just you and the Quran.',
    goalFocused: '🎯 Goal-Focused',
    goalFocusedDesc: 'Motivation through personal progress and shared goals, not social validation.',
    spirituallyCentered: '🕌 Spiritually Centered',
    spirituallyCenteredDesc: 'Designed to support your connection with the Quran and strengthen your consistency.',
    
    // CTA
    startToday: 'Start Your Journey Today',
    startTodayDesc: 'Join a community of learners focused on consistent Quran reading and memorization',
    getStartedFree: 'Get Started Free',
    
    // Footer
    footerText: '© 2026 Quran Circle • Built with respect for your privacy and spiritual journey',
    
    // Circle Terminology
    circles: 'Circles',
    myCircles: 'My Circles',
    discoverCircles: 'Discover Circles',
    discover: 'Discover',
    all: 'All',
    joinCircle: 'Join Circle',
    leaveCircle: 'Leave Circle',
    circleMembers: 'circle members',
    khatmahCircle: 'Khatmah Circle',
    memorizationCircle: 'Memorization Circle',
    circleProgress: 'Circle Progress',
    yourCircle: 'Your Circle',
    aboutThisCircle: 'About This Circle',
    joinToTrackProgress: 'Join to Track Progress',
    previewCircle: 'Preview Circle',
    circleGoals: 'Circle Goals',
    aboutCircleGoals: 'About Circle Goals',
    aboutCircleGoalsDesc: 'Shared goals and milestones to keep everyone motivated and on track.',
    noUsernamesVisible: 'No Usernames Visible',
    progressTrackedCollectively: 'Progress Tracked Collectively',
    noChatOrComments: 'No Chat or Comments',
    members: 'Members',
    memorized: 'Memorized',
    joined: 'Joined',
    
    // Reading Dashboard - Tabs
    publicKhatmahs: 'Public Khatmahs',
    privateKhatmahs: 'Private Khatmahs',
    createPrivateKhatmah: 'Create Private Khatmah',
    noPrivateKhatmahsYet: 'No Private Khatmahs Yet',
    noPrivateKhatmahsDesc: 'Create a private Khatmah to track your progress with friends and family.',
    inviteMembers: 'Invite Members',
    trackTogether: 'Track Progress Together',
    encourageEachOther: 'Encourage Each Other',
    
    // Circle Types
    khatmah: 'Khatmah',
    memorization: 'Memorization',
    study: 'Study',
    
    // Group Detail Page
    backToGroups: 'Back to Groups',
    leaveGoal: 'Leave Goal',
    joinGoal: 'Join',
    cannotJoinKhatmah: 'Cannot Join Khatmah',
    viewYourCurrentKhatmah: 'View Your Current Khatmah',
    previewMode: 'Preview Mode',
    previewModeDesc: 'View your Khatmah reading plan without joining the circle.',
    openKhatmahReader: 'Open Khatmah Reader',
    continueMemorizing: 'Continue Memorizing',
    yourProgress: 'Your Progress',
    readingPlan: 'Reading Plan',
    of: 'of',
    daysCompleted: 'Days Completed',
    daySchedule: 'Day Schedule',
    previewScheduleDesc: 'View your daily reading schedule for the Khatmah.',
    milestonesAutoMarked: 'Milestones are automatically marked as you read pages in the Reader',
    pagesAutoTracked: 'Pages will be automatically tracked when you join and use the Reader',
    yourMemorizationProgress: 'Your Memorization Progress',
    percentComplete: 'Complete',
    ayahsMemorized: 'Ayahs Memorized',
    totalAyahs: 'Total Ayahs',
    lastMemorized: 'Last memorized',
    ayah: 'Ayah',
    markEntireSurahMemorized: 'Mark Entire Surah as Memorized',
    surahCompleted: 'Surah Completed!',
    progressUpdatesAuto: 'Progress updates automatically as you mark ayahs in Memorization Mode',
    aboutThisGroup: 'About This Group',
    joinGroupDesc: 'Join this group to track your personal progress and be motivated by reading alongside others in the community.',
    memorizationGroupDesc: 'Work on your memorization goals alongside others in the community. Your progress is tracked personally and privately.',
    
    // Circle Actions & States
    alreadyInCircle: 'Already in a Khatmah Circle',
    oneCircleLimit: 'You can only be in one Khatmah reading circle at a time',
    switchCircleWarning: 'Joining this new circle will automatically remove you from your current Khatmah circle',
    viewingAsGuest: "You're viewing this circle as a guest",
    joinToContribute: 'Join to track your progress with this community',
    
    // Navigation
    dashboard: 'Dashboard',
    reader: 'Reader',
    goals: 'Goals',
    progress: 'Progress',
    settings: 'Settings',
    help: 'Help',
    officialWebsite: 'Official Website',
    
    // Reading & Progress
    pagesRead: 'Pages Read',
    currentPage: 'Current Page',
    markAsRead: 'Mark as Read',
    streak: 'Day Streak',
    khatmahs: 'Khatmahs',
    surahsMemorized: 'Surahs Memorized',
    
    // Settings
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    darkModeDescription: 'Switch to dark theme for night reading',
    lightModeDescription: 'Switch to light theme for daytime reading',
    appearance: 'Appearance',
    language: 'Language',
    languagePreference: 'Language Preference',
    languageDescription: 'Choose your preferred language for the interface',
    english: 'English',
    arabic: 'العربية',
    recitationStyle: 'Recitation Style',
    resetProgress: 'Reset Progress',
    signOut: 'Sign Out',
    mushafVersion: 'Mushaf Version',
    mushafVersionDescription: 'Choose between authentic Mushaf images or selectable text',
    mushafImageMode: 'Image',
    mushafTextMode: 'Text',
    readingPreferences: 'Reading Preferences',
    tajweed: 'Tajweed',
    tajweedDescription: 'Enhance your recitation with Tajweed rules',
    enableTajweed: 'Enable Tajweed',
    disableTajweed: 'Disable Tajweed',
    
    // Auth
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Name',
    signUp: 'Sign Up',
    participateInCircles: 'Participate in circle challenges and memorization goals',
    signUpToJoinGoal: 'Sign up to join this goal',
    signInToJoinGoal: 'Sign in to join this goal',
    whyJoinKhatmahGoals: 'Why join Khatmah Circle goals?',
    whyJoinMemorizationGoals: 'Why join Memorization Circle goals?',
    stayMotivated: 'Stay motivated with real-time community progress',
    trackProgressTogether: 'Track your progress alongside others on the same journey',
    buildConsistentHabits: 'Build consistent habits through collective accountability',
    earnRewardTogether: 'Earn the reward of reading together as an Ummah',
    createYourAccount: 'Create Your Account',
    welcomeBack: 'Welcome Back',
    enterYourName: 'Enter Your Name',
    enterYourEmail: 'Enter Your Email',
    enterYourPassword: 'Enter Your Password',
    minimumCharacters: 'Minimum 6 characters',
    creatingAccount: 'Creating Account',
    signingIn: 'Signing In',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    connected: 'Connected',
    myAccount: 'My Account',
    helpAndAbout: 'Help & About',
    
    // Help & Info
    whatIsQuranCircle: 'What is Quran Circle?',
    quranCircleDescription: 'A distraction-free platform for reading and memorizing the Quran with anonymous circle support',
    privacyFirst: 'Privacy First',
    privacyDescription: 'Your personal progress is stored locally on your device. Circle features only sync what\'s necessary.',
    howToJoinCircle: 'How to join a circle?',
    circleFeatures: 'Browse available circles, join challenges, and see how many people are reading alongside you',
    
    // Offline Reading
    offlineReading: 'Offline Reading',
    offlineReadingDescription: 'Download and read the Quran offline on your device',
    offlineStorage: 'Offline Storage',
    downloadedSurahs: 'Downloaded Surahs',
    quickDownload: 'Quick Download',
    downloadByJuz: 'Download by Juz',
    customSelection: 'Custom Selection',
    selected: 'Selected',
    downloadSelected: 'Download Selected',
    downloading: 'Downloading',
    popularSurahs: 'Popular',
    allSurahs: 'All',
    
    // Settings - Account & Data Management
    signInDescription: 'Sign in to access group goals, sync your progress across devices, and join the community.',
    signInSignUp: 'Sign In / Sign Up',
    dataManagement: 'Data Management',
    exportYourProgress: 'Export Your Progress',
    exportProgressDescription: 'Download a backup of all your reading and memorization progress as a JSON file.',
    exportProgress: 'Export Progress',
    appVersion: 'App Version',
    builtWithRespect: 'Built with respect for your privacy and spiritual journey',
    
    // Dashboard
    greeting: 'Hello',
    guest: 'Guest',
    guestMode: 'Guest Mode',
    guestModeDesc: 'You are currently viewing as a guest. To save your progress, sign up or sign in.',
    guestModeLink: 'Sign Up',
    progressSyncing: 'Syncing Progress',
    khatmasCompleted: 'Khatmas Completed',
    continueReading: 'Continue Reading',
    complete: 'Complete',
    lastRead: 'Last Read',
    page: 'Page',
    startKhatmah: 'Start Khatmah',
    startKhatmahDesc: 'Start a new Khatmah reading circle and track your progress.',
    joinKhatmahDesc: 'Join an existing Khatmah reading circle and track your progress with others.',
    browseKhatmahCircles: 'Browse Khatmah Circles',
    memorizationProgress: 'Memorization Progress',
    totalAyahsToMemorize: 'Total Ayahs to Memorize',
    yourSurahs: 'Your Surahs',
    ayahs: 'Ayahs',
    seeFullList: 'See Full List',
    more: 'More',
    showLess: 'Show Less',
    browseMoreSurahs: 'Browse More Surahs',
    viewAll: 'View All',
    youveJoined: 'You\'ve Joined',
    circle: 'Circle',
    viewMyCircles: 'View My Circles',
    joinACircle: 'Join a Circle',
    joinCircleDesc: 'Join a circle to track your progress and share goals with others.',
    dayKhatmahChallenge: 'Day Khatmah Challenge',
    
    // Khatmah Group Labels
    completeKhatmahIn: 'Complete Khatmah in',
    days: 'Days',
    day: 'Day',
    pagesLabel: 'Pages',
    daysLabel: 'days',
    readEntireQuranIn: 'Read the entire Quran in',
    daysWithCommunity: 'days with the community',
    
    // Reader Page
    readingMode: 'Reading Mode',
    memorizationMode: 'Memorization Mode',
    learningMode: 'Learning Mode',
    learning: 'Learning',
    testingMode: 'Testing Mode',
    testing: 'Testing',
    surahs: 'Surahs',
    surah: 'Surah',
    pageNumber: 'Page Number',
    juz: 'Juz',
    juzNumber: 'Juz Number',
    pageCompleted: 'Page Completed',
    markAsMemorized: 'Mark as Memorized',
    reciter: 'Reciter',
    selectSurah: 'Select Surah',
    totalSurahs: 'Total Surahs',
    theOpener: 'The Opener',
    theCow: 'The Cow',
    familyOfImran: 'Family of Imran',
    
    // Reader Navigation & Actions
    next: 'Next',
    previous: 'Previous',
    nextSurah: 'Next Surah',
    previousSurah: 'Previous Surah',
    pageOf: 'Page of',
    completed: 'Completed',
    markPageAsComplete: 'Mark Page as Complete',
    autoCompleteHint: 'Auto-complete hint',
    
    // Memorization Controls
    byAyah: 'By Ayah',
    byRange: 'By Range',
    byPage: 'By Page',
    play: 'Play',
    pause: 'Pause',
    repeat: 'Repeat:',
    times: 'times',
    startAyah: 'Start Ayah',
    endAyah: 'End Ayah',
    repeatRange: 'Repeat Range',
    repeatEachAyah: 'Repeat Each Ayah',
    playRange: 'Play Range',
    
    // Surah Completion Modal
    mashaAllah: 'Masha\'Allah! 🎉',
    completedMemorizing: 'You have completed memorizing',
    quranQuote: '"The best of you are those who learn the Quran and teach it."',
    prophetMuhammad: '— Prophet Muhammad ﷺ',
    continueJourney: 'Continue Your Journey',
    
    // Surah Meanings (All 114 Surahs)
    surahMeanings: [
      'The Opener', 'The Cow', 'Family of Imran', 'The Women', 'The Table Spread',
      'The Cattle', 'The Heights', 'The Spoils of War', 'The Repentance', 'Jonah',
      'Hud', 'Joseph', 'The Thunder', 'Abraham', 'The Rocky Tract',
      'The Bee', 'The Night Journey', 'The Cave', 'Mary', 'Ta-Ha',
      'The Prophets', 'The Pilgrimage', 'The Believers', 'The Light', 'The Criterion',
      'The Poets', 'The Ants', 'The Stories', 'The Spider', 'The Romans',
      'Luqman', 'The Prostration', 'The Combined Forces', 'Sheba', 'Originator',
      'Ya-Sin', 'Those Ranged in Ranks', 'Sad', 'The Groups', 'The Forgiver',
      'Explained in Detail', 'The Consultation', 'The Ornaments of Gold', 'The Smoke', 'The Kneeling Down',
      'The Wind-Curved Sandhills', 'Muhammad', 'The Victory', 'The Rooms', 'Qaf',
      'The Winnowing Winds', 'The Mount', 'The Star', 'The Moon', 'The Most Merciful',
      'The Inevitable', 'The Event', 'The Iron', 'The Pleading Woman', 'The Exile',
      'She that is to be Examined', 'The Ranks', 'The Congregation', 'The Hypocrites', 'The Mutual Disillusion',
      'The Divorce', 'The Prohibition', 'The Sovereignty', 'The Pen', 'The Inevitable Reality',
      'The Ascending Stairways', 'Noah', 'The Jinn', 'The Enshrouded One', 'The Cloaked One',
      'The Resurrection', 'The Human', 'The Emissaries', 'The Tidings', 'The Extractors',
      'He Frowned', 'The Overthrowing', 'The Cleaving', 'The Defrauders', 'The Splitting Open',
      'The Mansions of the Stars', 'The Night Comer', 'The Most High', 'The Overwhelming', 'The Dawn',
      'The City', 'The Sun', 'The Night', 'The Morning Hours', 'The Relief',
      'The Fig', 'The Clot', 'The Power', 'The Clear Proof', 'The Earthquake',
      'The Courser', 'The Calamity', 'The Rivalry in Worldly Increase', 'The Declining Day', 'The Traducer',
      'The Elephant', 'Quraysh', 'The Small Kindness', 'The Abundance', 'The Disbelievers',
      'The Divine Support', 'The Palm Fiber', 'The Sincerity', 'The Daybreak', 'Mankind'
    ],
  },
  
  ar: {
    // App Name & Branding
    appName: 'حلقة القرآن',
    appNameArabic: 'حلقة القرآن',
    tagline: 'حلقتك الخاصة للقرآن',
    metaDescription: 'منصة خالية من التشتيت للقراءة والحفظ وإتمام القرآن من خلال التتبع الشخصي والحلقات المجهولة',
    
    // Header
    continueAsGuest: 'المتابعة كضيف',
    signIn: 'تسجيل الدخول',
    
    // Hero
    heroTitle: 'رحلتك الشخصية مع القرآن',
    heroSubtitle: 'منصة خالية من التشتيت للقراءة والحفظ وإتمام القرآن من خلال التتبع الشخصي والحلقات المجهولة',
    beginJourney: 'ابدأ رحلتك',
    
    // How It Works
    howItWorks: 'كيف يعمل',
    howItWorksSubtitle: 'نهج هادئ ومركز لقراءة وحفظ القرآن',
    personalTracking: 'التتبع الشخصي',
    personalTrackingDesc: 'تتبع تقدم القراءة والحفظ وإتمام الختمة بشكل خاص',
    goalOriented: 'موجه نحو الأهداف',
    goalOrientedDesc: 'حدد وحقق أهدافًا شخصية للقراءة والحفظ',
    anonymousCircles: 'حلقات جهولة',
    anonymousCirclesDesc: 'انضم إلى الحلقات وساهم بشكل مجهول دون ضغط اجتماعي',
    trackProgress: 'تتبع التقدم',
    trackProgressDesc: 'شاهد اتساقك ينمو مع السلاسل والإنجازات',
    
    // Principles
    ourPrinciples: 'مبادئنا',
    completePrivacy: '🔒 خصوصية كاملة',
    completePrivacyDesc: 'لا ملفات شخصية، لا أسماء مستخدمين، لا صور. رحلتك بينك وبين الله.',
    zeroDistractions: '🚫 صفر تشتيت',
    zeroDistractionsDesc: 'لا تعليقات، لا إعجابات، لا تغذيات. فقط أنت والقرآن.',
    goalFocused: '🎯 مركز على الأهداف',
    goalFocusedDesc: 'التحفيز من خلال التقدم الشخصي والأهداف المشتركة، وليس التحقق الاجتماعي.',
    spirituallyCentered: '🕌 مركز روحاني',
    spirituallyCenteredDesc: 'مصمم لدعم ارتباطك بالقرآن وتعزيز اتساقك.',
    
    // CTA
    startToday: 'ابدأ رحلتك اليوم',
    startTodayDesc: 'انضم إلى مجتمع من المتعلمين المركزين على قراءة وحفظ القرآن باستمرار',
    getStartedFree: 'ابدأ مجانًا',
    
    // Footer
    footerText: 'مبنيّ باحترام لخصوصيتك ورحلتك الروحية',
    
    // Circle Terminology
    circles: 'الحلقات',
    myCircles: 'حلقاتي',
    discoverCircles: 'اكتشف الحلقات',
    discover: 'اكتشف',
    all: 'الكل',
    joinCircle: 'انضم للحلقة',
    leaveCircle: 'مغادرة الحلقة',
    circleMembers: 'أعضاء الحلقة',
    khatmahCircle: 'حلقة ختمة',
    memorizationCircle: 'حلقة حفظ',
    circleProgress: 'تقدم الحلقة',
    yourCircle: 'حلقتك',
    aboutThisCircle: 'عن هذه الحلقة',
    joinToTrackProgress: 'انضم لتتبع التقدم',
    previewCircle: 'معاينة الحلقة',
    circleGoals: 'أهداف الحلقات',
    aboutCircleGoals: 'عن أهداف الحلقات',
    aboutCircleGoalsDesc: 'أهداف ومعالم مشتركة للحفاظ على تحفيز الجميع وضمان التقدّم وفق المسار الصحيح.',
    noUsernamesVisible: 'لا أسماء مستخدمين مرئية',
    progressTrackedCollectively: 'تتبع التقدم مجتمعيًا',
    noChatOrComments: 'لا شات أو تعليقات',
    members: 'أعضاء',
    memorized: 'محفوظ',
    joined: 'انضم',
    
    // Reading Dashboard - Tabs
    publicKhatmahs: 'الختمات العامة',
    privateKhatmahs: 'الختمات الخاصة',
    createPrivateKhatmah: 'إنشاء ختمة خاصة',
    noPrivateKhatmahsYet: 'لا ختمات خاصة بعد',
    noPrivateKhatmahsDesc: 'إنشاء ختمة خاصة لتتبع تقدمك مع أصدقائك والعائلة.',
    inviteMembers: 'دعوة الأعضاء',
    trackTogether: 'تتبع التقدم معًا',
    encourageEachOther: 'تشجيع بعضكم البعض',
    
    // Circle Types
    khatmah: 'ختمة',
    memorization: 'حفظ',
    study: 'دراسة',
    
    // Group Detail Page
    backToGroups: 'العودة إلى المجموعات',
    leaveGoal: 'ترك الهدف',
    joinGoal: 'انضم',
    cannotJoinKhatmah: 'لا يمكنك الانضمام إلى الختمة',
    viewYourCurrentKhatmah: 'عرض ختمتك الحالية',
    previewMode: 'لست عضوًا بعد',
    previewModeDesc: 'عرض خطة قراءتك للختمة دون الانضمام إلى الحلقة.',
    openKhatmahReader: 'فتح قارئ الختمة',
    continueMemorizing: 'استمر في الحفظ',
    yourProgress: 'تقدمك',
    readingPlan: 'خطة القراءة',
    of: 'من',
    daysCompleted: 'الأيام المكتملة',
    daySchedule: 'جدول اليوم',
    previewScheduleDesc: 'عرض جدول قراءتك اليومي للختمة.',
    milestonesAutoMarked: 'النقاط الرئيسية معلمة تلقائيًا',
    pagesAutoTracked: 'الصفحات متعقبة تلقائيًا',
    yourMemorizationProgress: 'تقدم حفظك',
    percentComplete: 'مكتمل',
    ayahsMemorized: 'الآيات المحفوظة',
    totalAyahs: 'إجمالي الآيات',
    lastMemorized: 'آخر ما حفظته',
    ayah: 'آية',
    markEntireSurahMemorized: 'وضع علامة على سورة كاملة كمحفوظة',
    surahCompleted: 'السورة مكتمة',
    progressUpdatesAuto: 'تحديثات التقدم تلقائية',
    aboutThisGroup: 'عن هذه المجموعة',
    joinGroupDesc: 'انضم إلى مجموعة لتتبع تقدمك ومشاركة الأهداف مع الآخرين.',
    memorizationGroupDesc: 'مجموعة مركزة على حفظ القرآن مع أهداف مشتركة ومعالم.',
    
    // Circle Actions & States
    alreadyInCircle: 'أنت بالفعل في حلقة ختمة',
    oneCircleLimit: 'يمكنك الانضمام إلى حلقة ختمة واحدة فقط في كل مرة',
    switchCircleWarning: 'الانضمام إلى هذه الحلقة الجديدة سيزيلك تلقائيًا من حلقة الختمة الحالية',
    viewingAsGuest: 'أنت تشاهد هذه الحلقة كضيف',
    joinToContribute: 'انضم لتتمكن من تتبع تقدمك مع هذه المجموعة',
    
    // Navigation
    dashboard: 'لوحة التحكم',
    reader: 'القارئ',
    goals: 'الأهداف',
    progress: 'التقدم',
    settings: 'الإعدادات',
    help: 'المساعدة',
    officialWebsite: 'الموقع الرسمي',
    
    // Reading & Progress
    pagesRead: 'الصفحات المقروءة',
    currentPage: 'الصفحة الحالية',
    markAsRead: 'وضع علامة كمقروء',
    streak: 'سلسلة الأيام',
    khatmahs: 'الختمات',
    surahsMemorized: 'السور المحفوظة',
    
    // Settings
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    darkModeDescription: 'التبديل إلى الوضع الداكن للقراءة الليلية',
    lightModeDescription: 'التبديل إلى الوضع الفاتح للقراءة النهارية',
    appearance: 'المظهر',
    language: 'اللغة',
    languagePreference: 'تفضيلات اللغة',
    languageDescription: 'اختر لغتك المفضلة للواجهة',
    english: 'English',
    arabic: 'العربية',
    recitationStyle: 'أسلوب التلاوة',
    resetProgress: 'إعادة تعيين التقدم',
    signOut: 'تسجيل الخروج',
    mushafVersion: 'نسخة المصحف',
    mushafVersionDescription: 'اختر بين صور المصحف الأصيلة أو النص القابل للتحديد',
    mushafImageMode: 'صورة',
    mushafTextMode: 'نص',
    readingPreferences: 'تفضيلات القراءة',
    tajweed: 'التجويد',
    tajweedDescription: 'تحسين تلاوتك باستخدام قواعد التجويد',
    enableTajweed: 'تمكين التجويد',
    disableTajweed: 'تعطيل التجويد',
    
    // Auth
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    name: 'الاسم',
    signUp: 'إنشاء حساب',
    participateInCircles: 'شارك في تحديات الحلقات وأهداف الحفظ',
    signUpToJoinGoal: 'إنشاء حساب للانضمام إلى هذا الهدف',
    signInToJoinGoal: 'تسجيل الدخول للانضمام',
    whyJoinKhatmahGoals: 'لماذا الانضمام إلى أهداف الختمة؟',
    whyJoinMemorizationGoals: 'لماذا الانضمام إلى أهداف الحفظ؟',
    stayMotivated: 'ابق متحفزًا مع متابعة تقدم المجموعة',
    trackProgressTogether: 'تتبع تقدمك جنبًا إلى جنب مع الآخرين في نفس الرحلة',
    buildConsistentHabits: 'بناء عادات ثابتة من خلال المسؤولية الجماعية',
    earnRewardTogether: 'اكسب أجر القراءة الجماعية كأمة واحدة',
    createYourAccount: 'إنشاء حسابك',
    welcomeBack: 'مرحبًا بك مرة أخرى',
    enterYourName: 'أدخل اسمك',
    enterYourEmail: 'أدخل بريدك الإلكتروني',
    enterYourPassword: 'أدخل كلمة المرور',
    minimumCharacters: '6 أحرف على الأقل',
    creatingAccount: 'إنشاء حساب',
    signingIn: 'تسجيل الدخول',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    dontHaveAccount: "ليس لديك حساب؟",
    connected: 'متصل',
    myAccount: 'حسابي',
    helpAndAbout: 'المساعدة والمزيد',
    
    // Help & Info
    whatIsQuranCircle: 'ما هي حلقة القرآن؟',
    quranCircleDescription: 'منصة خالية من التشتيت لقراءة وحفظ القرآن مع دعم الحلقات المجهولة',
    privacyFirst: 'الخصوصية أولاً',
    privacyDescription: 'يتم تخزين تقدمك الشخصي محليًا على جهازك. ميزات الحلقات تزامن فقط ما هو ضروري.',
    howToJoinCircle: 'كيفية الانضمام إلى حلقة؟',
    circleFeatures: 'تصفح الحلقات المتاحة، وانضم إلى التحديات، وشاهد عدد الأشخاص الذين يقرؤون معك',
    
    // Offline Reading
    offlineReading: 'القراءة دون اتصال بالإنترنت',
    offlineReadingDescription: 'قم بتنزيل السور لقراءتها دون اتصال بالإنترنت في أي وقت وفي أي مكان. مثالي للسفر أو المساجد أو المناطق ذات الاتصال المحدود.',
    offlineStorage: 'تخزين غير متصل بالإنترنت',
    downloadedSurahs: 'السور المحمولة',
    quickDownload: 'تحميل سريع',
    downloadByJuz: 'تحميل حسب الجزء',
    customSelection: 'اختيار مخصص',
    selected: 'مختار',
    downloadSelected: 'تحميل المختار',
    downloading: 'جاري التحميل',
    popularSurahs: 'السور الشائعة',
    allSurahs: 'جميع السور',
    
    // Settings - Account & Data Management
    signInDescription: 'تسجيل الدخول للوصول إلى أهداف المجموعة، ومزامنة تقدمك عبر الأجهزة، وانضمام المجتمع.',
    signInSignUp: 'تسجيل الدخول / إنشاء حساب',
    dataManagement: 'إدارة البيانات',
    exportYourProgress: 'تصدير تقدمك',
    exportProgressDescription: 'تحميل نسخة من تقدم قراءتك وحفظك كملف JSON.',
    exportProgress: 'تصدير التقدم',
    appVersion: 'إصدار التطبيق',
    builtWithRespect: 'مبنٍ باحترام لخصوصيتك ورحلتك الروحية',
    
    // Dashboard
    greeting: 'مرحبا',
    guest: 'ضيف',
    guestMode: 'وضع الضيف',
    guestModeDesc: 'أنت تشاهد كضيف حالياً. لحفظ تقدمك، قم بالتسجيل أو الدخول.',
    guestModeLink: 'إنشاء حساب',
    progressSyncing: 'مزامنة التقدم',
    khatmasCompleted: 'الختمات المكتملة',
    continueReading: 'استمر في القراءة',
    complete: 'مكتمل',
    lastRead: 'آخر قراءة',
    page: 'صفحة',
    startKhatmah: 'بدء ختمة',
    startKhatmahDesc: 'ابدأ حلقة ختمة جديدة وتابع تدمك.',
    joinKhatmahDesc: 'انضم إلى حلقة ختمة موجودة وتابع تدمك مع الآخرين.',
    browseKhatmahCircles: 'تصفح حلقات الختمة',
    memorizationProgress: 'تقدم الحفظ',
    totalAyahsToMemorize: 'إجمالي الآيات للحفظ',
    yourSurahs: 'سورك',
    ayahs: 'آيات',
    seeFullList: 'رؤية القائمة الكاملة',
    more: 'المزيد',
    showLess: 'عرض أقل',
    browseMoreSurahs: 'تصفح المزيد من السور',
    viewAll: 'عرض الكل',
    youveJoined: 'انضمت إلى',
    circle: 'حلقة',
    viewMyCircles: 'عرض حلقاتي',
    joinACircle: 'انضم إلى حلقة',
    joinCircleDesc: 'انضم إلى حلقة لتعقب تقدمك ومشاركة الأهداف مع الآخرين.',
    dayKhatmahChallenge: 'تحدي ختمة يومي',
    
    // Khatmah Group Labels
    completeKhatmahIn: 'إتمام الختمة في',
    days: 'أيام',
    day: 'يوم',
    pagesLabel: 'صفحات',
    daysLabel: 'أيام',
    readEntireQuranIn: 'قراءة القرآن الكريم في',
    daysWithCommunity: 'أيام مع المجتمع',
    
    // Reader Page
    readingMode: 'وضع القراءة',
    memorizationMode: 'وضع الحفظ',
    learningMode: 'وضع التعلم',
    learning: 'تعلم',
    testingMode: 'وضع الاختبار',
    testing: 'اختبار',
    surahs: 'السور',
    surah: 'سوة',
    pageNumber: 'رقم الصفحة',
    juz: 'جزء',
    juzNumber: 'رقم الجزء',
    pageCompleted: 'الصفحة مكتملة',
    markAsMemorized: 'وضع علامة كمحفوظ',
    reciter: 'القارئ',
    selectSurah: 'اختر سورة',
    totalSurahs: 'عدد السور الكلي',
    theOpener: 'المفتوح',
    theCow: 'البقرة',
    familyOfImran: 'عائلة إبراهيم',
    
    // Reader Navigation & Actions
    next: 'التالي',
    previous: 'السابق',
    nextSurah: 'السورة التالية',
    previousSurah: 'السورة السابقة',
    pageOf: 'صفحة من',
    completed: 'مكتمل',
    markPageAsComplete: 'وضع علامة الصفحة كمكتملة',
    autoCompleteHint: 'نصيحة إكمال تلقائي',
    
    // Memorization Controls
    byAyah: 'بآية',
    byRange: 'بمجموعة آيات',
    byPage: 'بصفحة',
    play: 'تشغيل',
    pause: 'وقف',
    repeat: 'تكرار:',
    times: 'مرات',
    startAyah: 'بداية الآية',
    endAyah: 'نهاية الآية',
    repeatRange: 'تكرار المدى',
    repeatEachAyah: 'تكرار كل آية',
    playRange: 'تشغيل المدى',
    
    // Surah Completion Modal
    mashaAllah: 'مَا شَاءَ اللَّهُ',
    completedMemorizing: 'لقد أتممت حفظ هذه السورة',
    quranQuote: '"خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"',
    prophetMuhammad: '— النبي محمد ﷺ',
    continueJourney: 'واصِل رحلتك',
    
    // Surah Meanings (All 114 Surahs) - معاني السور
    surahMeanings: [
      'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة',
      'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس',
      'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر',
      'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه',
      'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان',
      'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم',
      'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر',
      'يس', 'الصافات', 'ص', 'الزمر', 'غافر',
      'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية',
      'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق',
      'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن',
      'الواقعة', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر',
      'الممتحنة', 'الصف', 'الجمعة', 'المنافقون', 'التغابن',
      'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة',
      'المعارج', 'نوح', 'الجن', 'المزمل', 'المدثر',
      'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات',
      'عبس', 'التكوير', 'الانفطار', 'المطففين', 'الانشقاق',
      'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر',
      'البلد', 'الشمس', 'الليل', 'الضحى', 'الشرح',
      'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة',
      'العاديات', 'القارعة', 'التكاثر', 'العصر', 'الهمزة',
      'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون',
      'النصر', 'المسد', 'الإخلاص', 'الفلق', 'الناس'
    ],
  }
};

// Get translation based on current language
export function getTranslations(language: Language): Translations {
  return translations[language];
}

// Get/Set language from localStorage
const LANGUAGE_KEY = 'quran_language';

export function getStoredLanguage(): Language {
  // First, check if user has explicitly set a language preference in settings
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored === 'ar' || stored === 'en') {
    return stored;
  }
  
  // If no stored preference, detect from browser/device language
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // Check if browser language is Arabic (e.g., 'ar', 'ar-SA', 'ar-EG', 'ar-AE', etc.)
  if (browserLang && browserLang.toLowerCase().startsWith('ar')) {
    return 'ar';
  }
  
  // Default to English for all other languages
  return 'en';
}

export function setStoredLanguage(language: Language): void {
  localStorage.setItem(LANGUAGE_KEY, language);
}