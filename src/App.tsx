/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  History,
  Settings,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  Edit3,
  Sliders,
  Heart,
  FolderHeart,
  Share2,
  RotateCcw,
  Upload,
  User,
  Lightbulb,
  Search,
  Menu,
  X,
  File,
  Sun,
  Moon,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Bookmark,
  FileCheck,
  Zap,
  RefreshCw,
  Send,
  HelpCircle,
  Home,
  ArrowLeft,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { GenerationSettings, AttachmentFile, GenerationProfile, GenerationProject, GenerationResults } from './types';
import { defaultSettings, prebuiltProfiles, initialHistory } from './data';

export default function App() {
  // Application Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('smm_studio_theme');
      return saved !== 'light'; // Default to dark mode if not specified
    } catch {
      return true;
    }
  });

  // Router view state (Dashboard Main Menu vs Editor workspace)
  const [viewMode, setViewMode] = useState<'dashboard' | 'editor'>('dashboard');

  // Active Screen States
  const [activeLeftTab, setActiveLeftTab] = useState<'settings' | 'history'>('settings');

  // Generation Profile Custom State
  const [profiles, setProfiles] = useState<GenerationProfile[]>(prebuiltProfiles);
  const [activeProfileId, setActiveProfileId] = useState<string>('tg-personal');

  // Brief Onboarding Setup Status (Ask user about their company and preferences)
  const [showBriefOnboarding, setShowBriefOnboarding] = useState<boolean>(false);
  const [companyInfo, setCompanyInfo] = useState<string>('');

  // Current Project State
  const [projectId, setProjectId] = useState<string>('new-project');
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [extraContext, setExtraContext] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [settings, setSettings] = useState<GenerationSettings>({ ...defaultSettings });
  
  // App Generation Status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Results view & alternative view
  const [results, setResults] = useState<GenerationResults | null>(null);
  const [selectedAlternativeIdx, setSelectedAlternativeIdx] = useState<number | null>(null);

  // Saved History projects - EMPTY initially unless retrieved from localStorage
  const [history, setHistory] = useState<GenerationProject[]>(() => {
    try {
      const saved = localStorage.getItem('smm_studio_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFavorites, setFilterFavorites] = useState<boolean>(false);

  // Copy Feedback
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  
  // Pending delete state for custom non-blocking confirmation dialog
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  // Inline edit state for results
  const [isEditingMain, setIsEditingMain] = useState<boolean>(false);
  const [editableMainText, setEditableMainText] = useState<string>('');

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync isDark changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('smm_studio_theme', isDark ? 'dark' : 'light');
    } catch {}
  }, [isDark]);

  // Sync history changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('smm_studio_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save SMM projects to localStorage:', e);
    }
  }, [history]);

  // Initialize selected profile settings
  useEffect(() => {
    const prof = profiles.find((p) => p.id === activeProfileId);
    if (prof) {
      setSettings((s) => ({ ...s, ...prof.settings }));
    }
  }, [activeProfileId]);

  // Autosave work-in-progress input changes immediately back to its history item
  useEffect(() => {
    if (projectId === 'new-project') return;

    const currentProj = history.find((p) => p.id === projectId);
    if (!currentProj) return;

    // Guard to prevent redundant sets and infinite loops
    if (
      currentProj.title === projectTitle &&
      currentProj.inputText === inputText &&
      currentProj.extraContext === extraContext &&
      currentProj.companyInfo === companyInfo &&
      JSON.stringify(currentProj.settings) === JSON.stringify(settings) &&
      JSON.stringify(currentProj.attachments) === JSON.stringify(attachments) &&
      currentProj.results === results
    ) {
      return;
    }

    setHistory((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            title: projectTitle || p.title,
            inputText,
            extraContext,
            companyInfo,
            settings: {
              ...settings,
              brandStyle: companyInfo, // Feed company info into the brandStyle parameter for generation
            },
            attachments,
            results,
            timestamp: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  }, [projectId, projectTitle, inputText, extraContext, companyInfo, settings, attachments, results]);

  // Handle Search & Filtered Projects in History
  const filteredProjects = history.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.inputText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFav = filterFavorites ? p.isFavorite : true;
    return matchesSearch && matchesFav;
  });

  // Apply Demo Examples to easily test UI and set up a persistent group
  const handleApplyDemo = (exampleType: 'coffee' | 'course' | 'gym' | 'cleaning') => {
    const newId = `demo-${exampleType}-${Date.now()}`;
    let title = '';
    let text = '';
    let extra = '';
    let compInfo = '';
    
    if (exampleType === 'coffee') {
      title = 'Открытие спешелти кофейни';
      text = 'Мы открываем новую specialty кофейню "Зёрна" в центре Питера. Свежая обжарка Эфиопия и Колумбия, выпечка собственного производства. Каждую субботу проводим бесплатные каппинги для гостей. Дарим скидку 15% на первый заказ по промокоду COFFEE15.';
      extra = 'Сделай текст в уютном интерактивном стиле, напомни, что у нас тепло и можно работать за ноутбуками.';
      compInfo = 'Кофейня "Зёрна" в Санкт-Петербурге. Спешелти зерно, свежая выпечка, место для коворкинга.';
    } else if (exampleType === 'course') {
      title = 'Запуск курса по AI-маркетингу';
      text = 'СТАРТ КУРСА: Нейросети для малого бизнеса. Мы научим предпринимателей автоматизировать SMM, создавать картинки, анализировать конкурентов и писать посты за 15 секунд с помощью современного ИИ и нейросетей. Обучение длится 4 недели, только практика, готовые промпты.';
      extra = 'Пиши как эксперт-практик, очень завлекающе. Нам нужен взрывной CTA с ограниченными местами на первый поток.';
      compInfo = 'Школа AI-маркетинга. Обучение малого бизнеса нейросетям для автоматизации SMM.';
    } else if (exampleType === 'gym') {
      title = 'Акция в фитнес-клубе';
      text = 'Абонемент на 12 месяцев безлимитного фитнеса со скидкой 40%. В стоимость включен бассейн, хаммам, 3 персональные тренировки с тренером и доступ во все групповые залы. Купить можно только до 5 июня включительно.';
      extra = 'Энергичный, спортивный тон. Используй мотивирующие триггеры, чтобы человек встал с дивана и пошел тренироваться.';
      compInfo = 'Современный фитнес-клуб с бассейном, спа-зоной и квалифицированными тренерами.';
    } else if (exampleType === 'cleaning') {
      title = 'Сервис экспресс-уборки квартир';
      text = 'Наш сервис "Чистая Искра" предлагает поддерживающую уборку квартир в Москве и Подмосковье. Занимает всего 2 часа. Все клинеры проверены, привозят свои безопасные эко-средства. Страхуем имущество на 1 млн рублей.';
      extra = 'Сделай упор на освобождение личного времени и заботу о здоровье детей и питомцев. Чистота без лишних забот!';
      compInfo = 'Сервис уборки "Чистая Искра". Выполняем профессиональный клининг в Москве за 2 часа.';
    }

    const formattedDate = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const demoProject: GenerationProject = {
      id: newId,
      title,
      inputText: text,
      extraContext: extra,
      attachments: [],
      timestamp: new Date().toISOString(),
      createdAt: formattedDate,
      isFavorite: false,
      results: null,
      companyInfo: compInfo,
      settings: { 
        ...defaultSettings,
        brandStyle: compInfo,
      },
    };

    setHistory((prev) => [demoProject, ...prev]);
    setProjectId(newId);
    setProjectTitle(title);
    setInputText(text);
    setExtraContext(extra);
    setAttachments([]);
    setSettings({ 
      ...defaultSettings,
      brandStyle: compInfo,
    });
    setCompanyInfo(compInfo);
    setResults(null);
    setSelectedAlternativeIdx(null);
    setIsEditingMain(false);
    setEditableMainText('');
    setErrorMessage('');
    setShowBriefOnboarding(false); // Democards load immediately to full workspace
    setViewMode('editor');
  };

  // Convert File to base64
  const processUploadFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');
      
      reader.onload = (e) => {
        const contentStr = e.target?.result as string || '';
        const newAttachment: AttachmentFile = {
          id: `file-${Date.now()}-${file.name}`,
          name: file.name,
          type: file.type,
          size: file.size,
          content: contentStr,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };

      if (isImg) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadFiles(e.dataTransfer.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Switch to project from history
  const handleLoadProject = (project: GenerationProject) => {
    setProjectId(project.id);
    setProjectTitle(project.title);
    setInputText(project.inputText);
    setExtraContext(project.extraContext);
    setAttachments(project.attachments);
    setSettings({ ...project.settings });
    setCompanyInfo(project.companyInfo || '');
    setResults(project.results);
    setSelectedAlternativeIdx(null);
    setIsEditingMain(false);
    setShowBriefOnboarding(false); // Do not show onboarding when loading an existing project
    if (project.results) {
      setEditableMainText(project.results.mainVariant);
    }
    setViewMode('editor');
  };

  // Set New project empty state - automatically creates a group in the archive (history)
  const handleNewProject = (withOnboarding = true) => {
    const newId = `proj-${Date.now()}`;
    const newCount = history.length + 1;
    const newTitle = `Новая кампания №${newCount}`;
    const formattedDate = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newProject: GenerationProject = {
      id: newId,
      title: newTitle,
      inputText: '',
      extraContext: '',
      attachments: [],
      settings: { ...defaultSettings },
      timestamp: new Date().toISOString(),
      createdAt: formattedDate,
      isFavorite: false,
      results: null,
      companyInfo: '',
    };

    setHistory((prev) => [newProject, ...prev]);
    setProjectId(newId);
    setProjectTitle(newTitle);
    setInputText('');
    setExtraContext('');
    setAttachments([]);
    setSettings({ ...defaultSettings });
    setCompanyInfo('');
    setResults(null);
    setSelectedAlternativeIdx(null);
    setIsEditingMain(false);
    setEditableMainText('');
    setErrorMessage('');
    setShowBriefOnboarding(withOnboarding);
    setViewMode('editor');
  };

  // Save Current state as template Profile
  const handleSaveAsProfile = () => {
    const profileName = prompt('Введите название шаблона (например: Мой VK Магазин):');
    if (!profileName) return;

    const newProfile: GenerationProfile = {
      id: `profile-${Date.now()}`,
      name: profileName,
      settings: { ...settings },
      isCustom: true,
    };

    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
  };

  // Toggle favorite on history item
  const handleToggleFavoriteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  // Duplicate project in history list
  const handleDuplicateProject = (proj: GenerationProject, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: GenerationProject = {
      ...proj,
      id: `proj-${Date.now()}`,
      title: `${proj.title} (Копия)`,
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => [duplicated, ...prev]);
  };

  // Delete project from history
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const confirmDeleteProject = () => {
    if (pendingDeleteId) {
      setHistory((prev) => prev.filter((p) => p.id !== pendingDeleteId));
      if (projectId === pendingDeleteId) {
        handleNewProject();
      }
      setPendingDeleteId(null);
    }
  };

  // Run SMM text generation
  const handleGenerate = async (refinePrompt?: string) => {
    setErrorMessage('');
    setIsLoading(true);

    const stages = [
      'Анализ исходной идеи...',
      'Анализ тональности бренда...',
      'Сегментация целевой аудитории...',
      'Определение структуры постов...',
      'Генерация сочного основного постов...',
      'Разработка альтернативных версий контента...',
    ];

    let currentStageIndex = 0;
    setLoadingStage(stages[0]);

    const stageInterval = setInterval(() => {
      if (currentStageIndex < stages.length - 1) {
        currentStageIndex++;
        setLoadingStage(stages[currentStageIndex]);
      }
    }, 1200);

    try {
      const imageFiles = attachments
        .filter((a) => a.type.startsWith('image/'))
        .map((a) => ({ name: a.name, type: a.type, content: a.content }));

      const textFiles = attachments
        .filter((a) => !a.type.startsWith('image/'))
        .map((a) => ({ name: a.name, content: a.content }));

      const currentInputText = refinePrompt 
        ? `Отредактируй и улучши этот пост согласно пожеланию: "${refinePrompt}". \n\nИсходный пост:\n${editableMainText || results?.mainVariant}`
        : inputText;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText: currentInputText,
          extraContext: refinePrompt ? '' : extraContext,
          settings,
          imageFiles,
          textFiles,
        }),
      });

      clearInterval(stageInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Произошла непредвиденная ошибка на сервере.');
      }

      const responseData: GenerationResults = await response.json();
      
      setResults(responseData);
      setEditableMainText(responseData.mainVariant);
      setIsEditingMain(false);
      setSelectedAlternativeIdx(null);

      // Save to History or update existing project
      const autoTitle = projectTitle.trim() || inputText.split('\n')[0].substring(0, 35) || 'Генерация';
      
      const updatedProject: GenerationProject = {
        id: projectId === 'new-project' ? `proj-${Date.now()}` : projectId,
        title: autoTitle,
        inputText,
        extraContext,
        attachments,
        settings,
        timestamp: new Date().toISOString(),
        isFavorite: false,
        results: responseData,
      };

      if (projectId === 'new-project') {
        setProjectId(updatedProject.id);
        setHistory((prev) => [updatedProject, ...prev]);
      } else {
        setHistory((prev) => prev.map((p) => p.id === projectId ? updatedProject : p));
      }

    } catch (err: any) {
      clearInterval(stageInterval);
      setErrorMessage(err.message || 'Возникла непредвиденная ошибка во время создания контента.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Toggle selected alternative into main variant view
  const handleSelectAlternativeAsMain = (index: number) => {
    if (!results) return;
    setSelectedAlternativeIdx(index);
    setEditableMainText(results.alternatives[index].text);
    setIsEditingMain(false);
  };

  const handleResetToMain = () => {
    if (!results) return;
    setSelectedAlternativeIdx(null);
    setEditableMainText(results.mainVariant);
    setIsEditingMain(false);
  };

  const structureLabels: { [key: string]: string } = {
    header: 'Заголовок 👑',
    subtitle: 'Подзаголовок',
    paragraphs: 'Абзацы',
    lists: 'Списки с пунктами',
    cta: 'СТА (Призыв)',
    conclusion: 'Заключение',
  };

  const contentTypes = [
    'Пост',
    'Серия постов',
    'Рекламный пост',
    'Анонс',
    'Новость',
    'Кейc',
    'История клиента',
    'Обучающий материал',
    'Продающий текст',
    'Информационный текст',
    'Развлекательный текст',
  ];

  const tonesOfVoice = [
    'Дружелюбная',
    'Профессиональная',
    'Деловая',
    'Экспертная',
    'Премиальная',
    'Энергичная',
    'Молодежная',
    'Нейтральная',
    'Агрессивно-продающая',
    'Минималистичная',
  ];

  const ctaGoals = [
    'Написать',
    'Подписаться',
    'Купить',
    'Оставить заявку',
    'Перейти по ссылке',
    'Собственный вариант',
  ];

  return (
    <div id="app_root" className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#030712] bg-gradient-to-b from-[#030712] to-[#0d1527] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* HEADER SECTION */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md px-5 py-4 flex items-center justify-between transition-colors duration-300 ${isDark ? 'bg-[#070d19]/90 border-slate-800/80 shadow-lg shadow-black/10' : 'bg-white/95 border-slate-200/80 shadow-sm shadow-slate-100'}`}>
        <div 
          onClick={() => setViewMode('dashboard')}
          className="flex items-center gap-3.5 cursor-pointer group select-none"
          title="Вернуться в Главное Меню"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-500 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 glow-indigo transition-transform group-hover:scale-105 active:scale-95">
            <Sparkles className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-extrabold tracking-tight font-display flex items-center gap-2 transition-colors ${isDark ? 'text-white' : 'text-slate-900 group-hover:text-indigo-600'}`}>
              Студия SMM Контента
            </h1>
          </div>
        </div>

        {/* Action controls in header */}
        <div className="flex items-center gap-3">
          <div className={`hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${isDark ? 'border-slate-850 bg-slate-900/30 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 relative">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping"></span>
            </span>
            <span>Автоматический помощник активен</span>
          </div>

          {/* Home/Main menu return button */}
          <button
            id="home_router_btn"
            onClick={() => setViewMode('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl border transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${viewMode === 'dashboard' ? (isDark ? 'bg-indigo-650/20 border-indigo-500 text-white shadow-md' : 'bg-indigo-50 border-indigo-300 text-indigo-700 font-extrabold') : (isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200')}`}
            title="Вернуться в главное меню"
          >
            <Home className="w-4 h-4" />
            <span>Панель</span>
          </button>

          {/* Theme switcher */}
          <button
            id="theme_toggle_btn"
            onClick={() => setIsDark(!isDark)}
            className={`p-2.5 rounded-xl border transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
            title={isDark ? 'Включить светлую тему' : 'Включить темную тему'}
          >
            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Clean up workspaces / New Project */}
          <button
            id="new_proj_header_btn"
            onClick={handleNewProject}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl border border-solid transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.97] hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border-indigo-500 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Создать</span>
          </button>
        </div>
      </header>

      {/* WORKSPACE LAYOUT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'dashboard' ? (
          <div className="space-y-8">
            {/* HERO BANNER SECTION */}
            <div className={`p-8 rounded-3xl border relative overflow-hidden transition-all duration-300 ${isDark ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-slate-800/80 shadow-2xl' : 'bg-gradient-to-r from-indigo-50/70 via-white to-sky-50 border-slate-205 shadow-md'}`}>
              <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl -z-10 pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-60 h-60 rounded-full bg-pink-500/5 blur-3xl -z-10 pointer-events-none" />

              <div className="max-w-2xl relative z-10">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 ${isDark ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-100 text-indigo-750'}`}>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  SMM Маркетинг нового поколения
                </div>
                <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-3.5 font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Превращайте ваши сырые заметки в сочные посты
                </h2>
                <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  Интеллектуальная контент-студия адаптирует текст, стилистику, эмодзи и структуру под Telegram и ВКонтакте. Используйте ИИ-инструменты для мгновенной генерации профессиональных постов!
                </p>
                
                <div className="flex flex-wrap gap-3.5">
                  <button
                    onClick={() => {
                      handleNewProject();
                      setViewMode('editor');
                    }}
                    className="px-5 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/15"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Быстрый старт с нуля</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveLeftTab('history');
                      setViewMode('editor');
                    }}
                    className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl border transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 ${isDark ? 'bg-slate-800/40 border-slate-750 text-slate-300 hover:bg-slate-800/80 hover:text-white' : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'}`}
                  >
                    <History className="w-4 h-4" />
                    <span>Войти в Архив ({history.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* INTEGRATED QUICK STATS METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className={`p-5 rounded-2xl border flex items-center gap-4.5 transition-colors duration-300 ${isDark ? 'bg-[#0a0f1d] border-slate-850' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-705'}`}>
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block mb-0.5">Архивный каталог</span>
                  <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-850'}`}>{history.length} проектов</h3>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex items-center gap-4.5 transition-colors duration-300 ${isDark ? 'bg-[#0a0f1d] border-slate-850' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-50 text-pink-705'}`}>
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block mb-0.5">Режимы и шаблоны</span>
                  <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-850'}`}>{profiles.length} пресетов</h3>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex items-center gap-4.5 transition-colors duration-300 ${isDark ? 'bg-[#0a0f1d] border-slate-850' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-705'}`}>
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block mb-0.5">Состояние ИИ-ядра</span>
                  <h3 className={`text-sm font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-850'}`}>
                    ИИ-Ассистент активен
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                  </h3>
                </div>
              </div>
            </div>

            {/* THREE SECTIONS ROW: TEMPLATE CHANNELS GRID & EXAMPLE DEMO CAMPAIGNS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* 1. CONTENT CHANNELS PRESETS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-md font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Bookmark className="w-4.5 h-4.5 text-indigo-400" />
                    Настроенные шаблоны SMM
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">{profiles.length} пресетов</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profiles.map((p) => {
                    const isActive = activeProfileId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setActiveProfileId(p.id);
                          handleNewProject();
                          setViewMode('editor');
                        }}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-40 ${
                          isActive
                            ? (isDark ? 'bg-indigo-650/15 border-indigo-450 shadow-md shadow-indigo-600/5' : 'bg-indigo-50 border-indigo-300 text-indigo-950')
                            : (isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-750' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm')
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-350' : 'bg-slate-100 text-slate-600'}`}>
                              {p.settings.platform}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-500">{p.settings.contentType}</span>
                          </div>
                          <h4 className={`text-sm font-extrabold mb-1.5 ${isDark ? 'text-white' : 'text-slate-850'}`}>{p.name}</h4>
                          <p className="text-slate-500 text-[11px] line-clamp-2 h-8 leading-tight">
                            Тон: {p.settings.toneOfVoice}, Цель: {p.settings.ctaGoal}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2.5">
                          <span className={`text-[10px] font-black uppercase ${isDark ? 'text-pink-400' : 'text-pink-650'}`}>креативность: {p.settings.creativity}%</span>
                          <span className="text-xs text-indigo-550 font-black flex items-center gap-0.5">
                            Выбрать ⚡️
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. DEMO INTERACTIVE CAMPAIGNS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-md font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
                    Попробовать демонстрационные примеры
                  </h3>
                  <span className="text-xs text-pink-500 font-extrabold uppercase">Демо-кампании</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleApplyDemo('coffee')}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-40 ${isDark ? 'bg-slate-900/40 border-slate-850 hover:bg-slate-850 hover:border-slate-750' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 font-black">КОФЕЙНЯ</span>
                        <span className="text-[10px] text-slate-500">Уют & Сервис</span>
                      </div>
                      <h4 className={`text-sm font-extrabold mb-1 ${isDark ? 'text-white' : 'text-slate-850'}`}>Кофейня "Зёрна" ☕️</h4>
                      <p className="text-slate-500 text-[11px] line-clamp-3 leading-snug">
                        Спешелти зерно, бесплатные каппинги по субботам, выпечка, скидка 15% на первый заказ.
                      </p>
                    </div>
                    <div className="text-[11px] text-indigo-600 font-extrabold flex items-center gap-0.5 justify-end">Загрузить пост →</div>
                  </div>

                  <div 
                    onClick={() => handleApplyDemo('course')}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-40 ${isDark ? 'bg-slate-900/40 border-slate-850 hover:bg-slate-850 hover:border-slate-750' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-600 font-black">AI-ОБУЧЕНИЕ</span>
                        <span className="text-[10px] text-slate-500">Практика</span>
                      </div>
                      <h4 className={`text-sm font-extrabold mb-1 ${isDark ? 'text-white' : 'text-slate-850'}`}>Курс по AI-маркетингу 🚀</h4>
                      <p className="text-slate-500 text-[11px] line-clamp-3 leading-snug">
                        Автоматизация контента для малого бизнеса, 4 недели обучения, готовые шаблоны промптов.
                      </p>
                    </div>
                    <div className="text-[11px] text-indigo-600 font-extrabold flex items-center gap-0.5 justify-end">Загрузить пост →</div>
                  </div>

                  <div 
                    onClick={() => handleApplyDemo('gym')}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-40 ${isDark ? 'bg-slate-900/40 border-slate-850 hover:bg-slate-850 hover:border-slate-750' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-black">СПОРТ</span>
                        <span className="text-[10px] text-slate-500">Скидки</span>
                      </div>
                      <h4 className={`text-sm font-extrabold mb-1 ${isDark ? 'text-white' : 'text-slate-850'}`}>Фитнес-сообщество 💪</h4>
                      <p className="text-slate-500 text-[11px] line-clamp-3 leading-snug">
                        Безлимитный абонемент, хаммам, бассейн, 3 занятия с тренером по скидке 40% до 5 июня.
                      </p>
                    </div>
                    <div className="text-[11px] text-indigo-600 font-extrabold flex items-center gap-0.5 justify-end">Загрузить пост →</div>
                  </div>

                  <div 
                    onClick={() => handleApplyDemo('cleaning')}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-40 ${isDark ? 'bg-slate-900/40 border-slate-850 hover:bg-slate-850 hover:border-slate-750' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-650 font-black">КЛИНИНГ</span>
                        <span className="text-[10px] text-slate-500">Гарантия качества</span>
                      </div>
                      <h4 className={`text-sm font-extrabold mb-1 ${isDark ? 'text-white' : 'text-slate-850'}`}>Экспресс-клининг "Искра" 🧹</h4>
                      <p className="text-slate-500 text-[11px] line-clamp-3 leading-snug">
                        Уборка квартир за 2 часа, эко-средства, страхование имущества, освобождение вашего личного времени!
                      </p>
                    </div>
                    <div className="text-[11px] text-indigo-600 font-extrabold flex items-center gap-0.5 justify-end">Загрузить пост →</div>
                  </div>
                </div>
              </div>

            </div>

            {/* RECENT ARCHIVES HISTORY LOGS LIST */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <History className="w-5 h-5 text-indigo-400" />
                  Последние работы из архива
                </h3>
                <button 
                  onClick={() => {
                    setActiveLeftTab('history');
                    setViewMode('editor');
                  }}
                  className="text-xs text-indigo-650 dark:text-indigo-400 hover:opacity-80 font-black flex items-center gap-0.5 cursor-pointer"
                >
                  Показать весь архив ({history.length})
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {history.length === 0 ? (
                <div className={`p-8 rounded-2xl border text-center ${isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <p className="text-sm text-slate-500">Сохраненные черновики отсутствуют. Начните свою первую публикацию!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {history.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadProject(item)}
                      className={`p-5 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between h-48 ${isDark ? 'bg-[#0a0f1d] border-slate-850 hover:bg-slate-850 hover:border-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isDark ? 'bg-indigo-950 text-indigo-300' : 'bg-indigo-50 text-indigo-750'}`}>
                            {item.settings.platform}
                          </span>
                          <span className="text-[10px] text-slate-400">{item.createdAt || 'Недавно'}</span>
                        </div>
                        <h4 className={`font-extrabold text-sm mb-1.5 line-clamp-1 ${isDark ? 'text-white' : 'text-slate-850'}`}>
                          {item.title || 'Черновик'}
                        </h4>
                        <p className="text-slate-500 text-xs line-clamp-3 leading-normal">
                          {item.inputText || item.results?.mainVariant || 'Пустой шаблон'}
                        </p>
                      </div>
                      <div className="border-t border-slate-850 pt-2.5 flex items-center justify-between text-xs text-indigo-500 font-extrabold mt-2.5">
                        <span>Продолжить редактирование</span>
                        <span>⚡</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : showBriefOnboarding ? (
          <div className="lg:col-span-12 flex justify-center items-center py-6 animate-fade-in relative w-full">
            <div className={`w-full max-w-3xl rounded-3xl border p-6 md:p-8 transition-all duration-300 ${isDark ? 'bg-[#070d19]/90 border-slate-800/80 shadow-2xl' : 'bg-white border-slate-200 shadow-xl text-slate-800'}`}>
              
              {/* Onboarding Header */}
              <div className="text-center space-y-3 mb-8">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl shadow-inner animate-pulse">
                  🏢
                </div>
                <h3 className={`text-2xl font-extrabold tracking-tight font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Быстрый старт с нуля 🚀
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Пожалуйста, расскажите немного о себе или вашей компании. Это поможет ИИ генерировать контент точно под вашу специфику бизнеса и Tone of Voice!
                </p>
              </div>

              {/* Step 1: Free form company description text box */}
              <div className="space-y-3 mb-8 text-left">
                <label className={`text-sm font-black uppercase tracking-wider flex items-center gap-1.5 font-display ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  <span>1. О вашей компании, бренде или о себе ✏️</span>
                  <span className="text-[10px] lowercase font-semibold text-slate-400 font-sans">(по желанию)</span>
                </label>
                <textarea
                  value={companyInfo}
                  onChange={(e) => {
                    setCompanyInfo(e.target.value);
                    setSettings((s) => ({ ...s, brandStyle: e.target.value }));
                  }}
                  rows={4}
                  placeholder={`Опишите то, чем занимается ваш бизнес. Например:\n“У нас уютный магазин детских деревянных игрушек ручной работы в Москве. Пишем для любящих родителей, ценим качество, тепло и безопасность. Продаем игрушки с доставкой по РФ. Пишем на 'ты', тепло, делимся историями разработки.”`}
                  className={`w-full text-xs p-4 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all font-sans leading-relaxed ${isDark ? 'bg-slate-900/80 border-slate-850 text-white placeholder-slate-650' : 'bg-slate-5 shadow-inner border-slate-300 text-slate-800 placeholder-slate-450'}`}
                />
                <p className="text-[11px] text-slate-500 leading-normal">
                  💡 Вы можете написать это совершенно в свободной форме. "Сырой" поток мыслей здесь — это идеальное сырье для нашего профессионального SMM-копирайтера!
                </p>
              </div>

              {/* Step 2: SMM Presets list */}
              <div className="space-y-3 mb-8 text-left">
                <label className={`text-sm font-black uppercase tracking-wider flex items-center gap-1.5 font-display ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  <span>2. Прикрепить готовые настройки (SMM-пресет) ⚡️</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {profiles.map((p) => {
                    const isSel = activeProfileId === p.id;
                    const icon = p.id.includes('vk') ? '🌐' : p.id.includes('expert') ? '🎓' : p.id.includes('news') ? '📰' : p.id.includes('personal') ? '📱' : '💼';
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setActiveProfileId(p.id);
                          setSettings((s) => ({ ...s, ...p.settings, brandStyle: companyInfo }));
                        }}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between ${
                          isSel
                            ? (isDark ? 'bg-indigo-650/20 border-indigo-450 shadow-md ring-1 ring-indigo-500/30 text-white' : 'bg-indigo-55/70 border-indigo-400 text-indigo-950')
                            : (isDark ? 'bg-slate-900/40 border-slate-850/80 hover:bg-slate-850 hover:border-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-350' : 'bg-slate-100 text-slate-600'}`}>
                              {icon} {p.settings.platform}
                            </span>
                            <span className="text-[9px] font-bold text-indigo-500 truncate">{p.settings.contentType}</span>
                          </div>
                          <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-850'}`}>{p.name}</h4>
                          <p className={`text-[10px] mt-0.5 leading-snug line-clamp-1 ${isSel ? 'text-indigo-400 dark:text-indigo-300 font-bold' : 'text-slate-500'}`}>
                            Тон: {p.settings.toneOfVoice}, CTA: {p.settings.ctaGoal}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-dashed border-slate-800/20 dark:border-slate-850 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('dashboard');
                    setShowBriefOnboarding(false);
                  }}
                  className={`w-full sm:w-auto text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-xl border transition-all cursor-pointer ${
                    isDark ? 'bg-transparent border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Отмена
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowBriefOnboarding(false);
                  }}
                  className="w-full sm:w-auto text-xs font-black uppercase tracking-wider py-3.5 px-8 rounded-xl border transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/10 hover:shadow-indigo-500/20"
                >
                  Перейти в рабочую область проекта 🚀
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            
            {/* Back action bar in Editor */}
            <div className="lg:col-span-10 flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-850/10 dark:border-slate-850">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850' : 'bg-white border-slate-200 text-slate-750 hover:bg-slate-50'}`}
              >
                <ArrowLeft className="w-4 h-4 text-indigo-500" />
                <span>В главное меню</span>
              </button>
              <div className="text-xs text-slate-500 font-bold">
                Текущий проект: &nbsp;
                <span className={`px-2 py-1 rounded ${isDark ? 'bg-indigo-950 text-indigo-400 font-black' : 'bg-indigo-50 text-indigo-850 font-bold'}`}>
                  {projectTitle || 'Новый черновик'}
                </span>
              </div>
            </div>

            {/* LEFT PANEL CONTROLS - Takes 30% spacing (3 columns of 10) */}
            <aside className="lg:col-span-3 flex flex-col gap-5">
            
            {/* Tabs for parameters vs history archive */}
            <div className={`p-2 rounded-2xl flex gap-1.5 border transition-all duration-300 ${isDark ? 'bg-[#0a0f1d] border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
              <button
                id="tab_settings_trigger"
                onClick={() => setActiveLeftTab('settings')}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-350 flex items-center justify-center gap-2 cursor-pointer transform active:scale-95 ${activeLeftTab === 'settings' ? (isDark ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10 glow-indigo' : 'bg-white text-indigo-700 shadow-sm') : (isDark ? 'text-slate-450 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <Sliders className="w-4 h-4" />
                Параметры
              </button>
              <button
                id="tab_history_trigger"
                onClick={() => setActiveLeftTab('history')}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-350 flex items-center justify-center gap-2 cursor-pointer relative transform active:scale-95 ${activeLeftTab === 'history' ? (isDark ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10 glow-indigo' : 'bg-white text-indigo-700 shadow-sm') : (isDark ? 'text-slate-450 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
              >
                <History className="w-4 h-4" />
                Архив
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[10px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center animate-bounce">
                    {history.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB BUNDLES CONTAINER WITH GLASS STYLING */}
            <div className={`rounded-2xl border p-5 transition-all duration-300 ${isDark ? 'bg-[#070d19]/80 backdrop-blur-md border-slate-800/80 shadow-2xl space-y-4' : 'bg-white border-slate-200/80 shadow-xl'}`}>
              
              {/* TAB 1: GENERATOR PARAMETERS */}
              {activeLeftTab === 'settings' && (
                <div className="flex flex-col gap-5">
                  
                  {/* GENERATION PROFILE SELECTOR (Templates) */}
                  <div className={`border-b border-dashed pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1.5 font-display">
                        <Bookmark className="w-4 h-4 text-indigo-500" />
                        Пресет публикации
                      </label>
                      <button
                        id="save_as_profile_btn"
                        onClick={handleSaveAsProfile}
                        className="text-xs font-black text-pink-500 hover:text-pink-400 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Сохранить текущие параметры как новый шаблон"
                      >
                        <Plus className="w-4 h-4" /> Пресет
                      </button>
                    </div>
                    <select
                      id="profile_select"
                      value={activeProfileId}
                      onChange={(e) => setActiveProfileId(e.target.value)}
                      className={`w-full text-xs font-bold py-2.5 px-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-805'}`}
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id} className={`${isDark ? 'bg-[#0c1220] text-white' : 'bg-white text-slate-800'}`}>
                          {p.name} {p.isCustom ? '⭐️' : '⚙️'}
                        </option>
                      ))}
                    </select>

                    {/* Quick Preset Selector Chips Grid */}
                    <div className="mt-3 space-y-2">
                       <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Быстрые шаблоны:</span>
                       <div className="flex flex-wrap gap-1.5">
                        {profiles.slice(0, 5).map((p) => {
                          const isSel = activeProfileId === p.id;
                          const icon = p.id.includes('vk') ? '🌐' : p.id.includes('expert') ? '🎓' : p.id.includes('news') ? '📰' : p.id.includes('personal') ? '📱' : '💼';
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setActiveProfileId(p.id);
                                setSettings((s) => ({ ...s, ...p.settings, brandStyle: companyInfo }));
                              }}
                              className={`py-1.5 px-2.5 rounded-xl text-[10px] font-bold tracking-tight transition-all duration-200 cursor-pointer transform active:scale-95 border ${
                                isSel
                                  ? (isDark ? 'bg-indigo-650/25 border-indigo-450 text-indigo-200 font-extrabold shadow-sm' : 'bg-indigo-550/20 border-indigo-300 text-indigo-900 font-extrabold')
                                  : (isDark ? 'bg-slate-900 border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-705 shadow-xs')
                              }`}
                              title={p.name}
                            >
                              <span>{icon} {p.name.replace('Telegram для ', '').replace('VK для ', '')}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                    
                    {/* Platform Selector */}
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2 font-display">Целевая платформа</span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 'Telegram', label: 'Telegram ✈️' },
                          { val: 'VK', label: 'VKontakte 🌐' },
                          { val: 'Universal', label: 'Универсал ✨' }
                        ].map((p) => {
                          const isSel = settings.platform === p.val;
                          return (
                            <button
                              key={p.val}
                              id={`platform_btn_${p.val}`}
                              onClick={() => setSettings((s) => ({ ...s, platform: p.val as any }))}
                              className={`py-2.5 px-2 rounded-xl text-xs font-black tracking-wide border transition-all duration-300 cursor-pointer transform active:scale-95 ${isSel ? (isDark ? 'bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-indigo-100 border-indigo-400 text-indigo-900 shadow-sm') : (isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-250 hover:bg-slate-100 text-slate-700')}`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content Type Selector */}
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5 font-display">Тип контента</span>
                      <select
                        id="content_type_select"
                        value={settings.contentType}
                        onChange={(e) => setSettings((s) => ({ ...s, contentType: e.target.value }))}
                        className={`w-full text-xs py-2.5 px-3 rounded-xl border cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
                      >
                        {contentTypes.map((t) => (
                          <option key={t} value={t} className={isDark ? 'bg-[#0c1220] text-white' : 'bg-white text-slate-800'}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tone of Voice Selector */}
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5 font-display">Тональность текста (Tone of Voice)</span>
                      <select
                        id="tone_of_voice_select"
                        value={settings.toneOfVoice}
                        onChange={(e) => setSettings((s) => ({ ...s, toneOfVoice: e.target.value }))}
                        className={`w-full text-xs py-2.5 px-3 rounded-xl border cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
                      >
                        {tonesOfVoice.map((t) => (
                          <option key={t} value={t} className={isDark ? 'bg-[#0c1220] text-white' : 'bg-white text-slate-800'}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Creativity Level Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-display">Креативность (температура)</span>
                        <span className="text-xs font-black text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">{settings.creativity}%</span>
                      </div>
                      <input
                        id="creativity_slider"
                        type="range"
                        min="0"
                        max="100"
                        value={settings.creativity}
                        onChange={(e) => setSettings((s) => ({ ...s, creativity: parseInt(e.target.value) }))}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none ${isDark ? 'bg-slate-800' : 'bg-slate-250'}`}
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-bold">
                        <span>Точно по фактам 🎯</span>
                        <span>Полет фантазии 🚀</span>
                      </div>
                    </div>

                    {/* Text length slider selector */}
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5 font-display">Длина текста</span>
                      <div className={`grid grid-cols-5 gap-1.5 p-1 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                        {(['Very short', 'Short', 'Medium', 'Long', 'Very long'] as const).map((len) => {
                          const labels: { [key: string]: string } = {
                            'Very short': 'XS',
                            'Short': 'S',
                            'Medium': 'M',
                            'Long': 'L',
                            'Very long': 'XL'
                          };
                          const titles: { [key: string]: string } = {
                            'Very short': 'Очень короткий',
                            'Short': 'Короткий',
                            'Medium': 'Средний',
                            'Long': 'Длинный',
                            'Very long': 'Очень длинный'
                          };
                          const isSel = settings.length === len;
                          return (
                            <button
                              key={len}
                              type="button"
                              onClick={() => setSettings((s) => ({ ...s, length: len }))}
                              className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer transform active:scale-95 ${
                                isSel
                                  ? (isDark ? 'bg-gradient-to-r from-indigo-550 to-violet-550 text-white shadow-md' : 'bg-indigo-600 text-white shadow-sm')
                                  : (isDark ? 'text-slate-500 hover:text-slate-350 hover:bg-slate-800/20' : 'text-slate-600 hover:text-slate-900 hover:bg-white/70')
                              }`}
                              title={titles[len]}
                            >
                              {labels[len]}
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-[10px] text-slate-500 text-center mt-1.5 font-bold">
                        {
                          settings.length === 'Very short' ? '⚡️ До 300 символов (короткая мысль)' :
                          settings.length === 'Short' ? '📝 До 600 символов (ёмкий пост)' :
                          settings.length === 'Medium' ? '🗒 1000-1500 символов (стандартный пост)' :
                          settings.length === 'Long' ? '📚 1500-2500 символов (подробный разбор)' : '📖 Свыше 2500 символов (лонгрид)'
                        }
                      </div>
                    </div>

                    {/* Emoji count selection slider */}
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5 font-display">Использование Эмодзи</span>
                      <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl border ${isDark ? 'border-slate-850 bg-slate-900' : 'border-slate-200 bg-slate-100'}`}>
                        {(['None', 'Minimum', 'Moderate', 'Many'] as const).map((level) => {
                          const labels = { None: '❌', Minimum: '◽️', Moderate: '📝', Many: '🔥' };
                          const desc = { None: 'Нет', Minimum: 'Мало', Moderate: 'Умеренно', Many: 'Много' };
                          const isSel = settings.emojiLevel === level;
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setSettings((s) => ({ ...s, emojiLevel: level }))}
                              className={`py-2 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                                isSel
                                  ? (isDark ? 'bg-[#182132] text-white ring-1 ring-slate-700 shadow-md' : 'bg-white border border-indigo-250 text-indigo-950 font-bold shadow-sm')
                                  : (isDark ? 'text-slate-450 hover:text-slate-200 hover:bg-slate-800/10' : 'text-slate-650 hover:text-slate-900 hover:bg-white/40')
                              }`}
                              title={desc[level]}
                            >
                              <span className="text-sm font-bold">{labels[level]}</span>
                              <span className="text-[9px] font-bold">{desc[level]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Structure elements switches */}
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5 font-display">Элементы структуры</span>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(settings.structure).map((key) => {
                          const isTrue = (settings.structure as any)[key];
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                setSettings((s) => ({
                                  ...s,
                                  structure: {
                                    ...s.structure,
                                    [key]: !isTrue,
                                  },
                                }));
                              }}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] text-left transition-all cursor-pointer transform active:scale-95 ${isTrue ? (isDark ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-300 shadow-sm' : 'bg-indigo-50 border-indigo-300 text-indigo-800') : (isDark ? 'bg-slate-900/40 border-slate-850 hover:bg-slate-800 hover:border-slate-800 text-slate-450' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600')}`}
                            >
                              <span className={`w-2.5 h-2.5 rounded-full transition-all shrink-0 ${isTrue ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]' : 'bg-slate-700'}`}></span>
                              <span className="font-semibold truncate">{structureLabels[key]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CTA goal preset and optional custom target */}
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5 font-display">Призыв к действию (CTA Цель)</span>
                      <select
                        id="cta_preset_select"
                        value={settings.ctaGoal}
                        onChange={(e) => setSettings((s) => ({ ...s, ctaGoal: e.target.value }))}
                        className={`w-full text-xs py-2.5 px-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-5 border-slate-300 text-slate-800'}`}
                      >
                        {ctaGoals.map((c) => (
                          <option key={c} value={c} className={isDark ? 'bg-[#0c1220] text-white' : 'bg-white text-slate-800'}>{c}</option>
                        ))}
                      </select>

                      {settings.ctaGoal === 'Собственный вариант' && (
                        <input
                          id="custom_cta_input"
                          type="text"
                          value={settings.customCta}
                          onChange={(e) => setSettings((s) => ({ ...s, customCta: e.target.value }))}
                          placeholder="Например: Записаться на вебинар"
                          className={`w-full mt-2 text-xs py-2.5 px-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/40 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'}`}
                        />
                      )}
                    </div>

                    {/* Brand Style constraints input */}
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5 font-display">Стиль бренда (Brand Style)</span>
                      <textarea
                        id="brand_style_textarea"
                        value={settings.brandStyle}
                        onChange={(e) => {
                          setSettings((s) => ({ ...s, brandStyle: e.target.value }));
                          setCompanyInfo(e.target.value);
                        }}
                        placeholder="Опишите ценности, правила общения бренда (например, пишем от первого лица на 'Ты', избегаем сложных терминов, ценим юмор...)"
                        rows={2.5}
                        className={`w-full text-xs p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/40 outline-none resize-none transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-300 text-slate-805 placeholder-slate-400'}`}
                      />
                    </div>

                  {/* ADDITIONAL TOGGLES BOX (More detailed constraints) */}
                  <div className={`mt-3 border-t pt-4 border-dashed ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className="text-xs font-black uppercase tracking-wider text-pink-400 block mb-3.5 flex items-center gap-1.5 font-display animate-pulse">
                      <SlidersHorizontal className="w-4 h-4 text-pink-400" />
                      Дополнительные настройки
                    </span>
                    <div className="flex flex-col gap-3">
                      {[
                        { key: 'addHashtags', text: 'Добавлять хэштеги 🏷️' },
                        { key: 'useStorytelling', text: 'Использовать сторителлинг 📖' },
                        { key: 'addSocialProof', text: 'Добавлять соц. доказательство 🤝' },
                        { key: 'addDeadline', text: 'Добавлять дедлайн ⏱️' },
                        { key: 'boostEngagement', text: 'Усиливать вовлечение 💬' },
                        { key: 'boostSales', text: 'Усиливать продажи 🛒' },
                        { key: 'boostExpertise', text: 'Усиливать экспертность 🎓' },
                        { key: 'useQuestions', text: 'Использовать риторические вопросы ❓' },
                        { key: 'addCommentCall', text: 'Призыв к комментариям 📣' },
                      ].map((item) => {
                        const isChecked = (settings as any)[item.key];
                        return (
                          <label key={item.key} className="flex items-center justify-between cursor-pointer select-none group">
                            <span className="text-xs text-slate-450 group-hover:text-slate-200 transition-colors">{item.text}</span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setSettings((s) => ({ ...s, [item.key]: !isChecked }));
                                }}
                                className="sr-only"
                              />
                              <div className={`block w-9 h-5 rounded-full transition-colors duration-300 ${isChecked ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-800'}`}></div>
                              <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${isChecked ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: PROJECTS ARCHIVE & HISTORY */}
              {activeLeftTab === 'history' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  {/* Search query field */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute top-3.5 left-3.5" />
                    <input
                      id="history_search_input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Искать в истории..."
                      className={`w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-slate-450'}`}
                    />
                  </div>

                  {/* Filter bookmarks only */}
                  <div className="flex items-center gap-2">
                    <button
                      id="toggle_favorites_btn"
                      onClick={() => setFilterFavorites(!filterFavorites)}
                      className={`text-xs py-2 px-3.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${filterFavorites ? 'bg-amber-400/20 border-amber-450 text-amber-300 shadow-md' : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      <Heart className={`w-4 h-4 ${filterFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
                      Только Избранное
                    </button>
                    {filterFavorites && (
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">Активен</span>
                    )}
                  </div>

                  {/* History feed list */}
                  <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1">
                    {filteredProjects.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-500 flex flex-col items-center gap-2">
                        <History className="w-9 h-9 text-slate-700 opacity-60 animate-pulse" />
                        <span>История пуста или нет результатов по фильтрам</span>
                      </div>
                    ) : (
                      filteredProjects.map((p) => {
                        const isCurrent = p.id === projectId;
                        const dateStr = new Date(p.timestamp).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                        });
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleLoadProject(p)}
                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer hover:translate-x-1 duration-250 ${isCurrent ? (isDark ? 'bg-indigo-650/10 border-indigo-500 text-white shadow-md' : 'bg-indigo-50 border-indigo-400 text-indigo-900') : (isDark ? 'bg-slate-900/60 border-slate-800/85 hover:bg-slate-850 hover:border-slate-750' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-xs font-black truncate max-w-[150px] font-display">{p.title}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleFavoriteHistory(p.id, e)}
                                  className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-450 hover:text-amber-400' : 'hover:bg-slate-200 text-slate-500 hover:text-amber-600'}`}
                                  title="Добавить в избранное"
                                >
                                  <Heart className={`w-3.5 h-3.5 ${p.isFavorite ? 'fill-amber-400 text-amber-450' : ''}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDuplicateProject(p, e)}
                                  className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-450 hover:text-indigo-450' : 'hover:bg-slate-200 text-slate-500 hover:text-indigo-600'}`}
                                  title="Дублировать генерацию"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteProject(p.id, e)}
                                  className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-450 hover:text-red-400' : 'hover:bg-slate-200 text-slate-500 hover:text-red-650'}`}
                                  title="Удалить"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{p.inputText || 'Загруженные файлы'}</p>
                            
                            <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-800/40 text-[9px] text-slate-500">
                              <span>{p.settings.platform} — {p.settings.contentType}</span>
                              <span>{dateStr}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              )}

            </div>
          </aside>

          {/* RIGHT WORKZONE CANVAS - Takes 70% spacing (7 columns of 10) */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            
            {/* BRAND PROFILE WIDGET */}
            <div className={`p-4 md:p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
              isDark ? 'bg-[#070d19]/80 backdrop-blur-md border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">🏢</span>
                  <div>
                    <h4 className={`text-sm font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900 font-display'}`}>
                      Профиль компании и предпочтения
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal max-w-lg">
                      Этот контекст автоматически вплетается в каждый генерируемый пост для идеального попадания в ваш бренд-стиль.
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowBriefOnboarding(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all transform active:scale-95 cursor-pointer ${
                    isDark ? 'bg-slate-900/60 border-slate-800 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Изменить</span>
                </button>
              </div>

              <div className="mt-3">
                {companyInfo.trim() ? (
                  <p className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed ${
                    isDark ? 'bg-slate-950/60 border-slate-850/85 text-slate-350' : 'bg-slate-5 border-slate-200 text-slate-700'
                  }`}>
                    {companyInfo}
                  </p>
                ) : (
                  <p className={`p-3 rounded-xl border border-dashed text-xs text-slate-500 leading-relaxed ${
                    isDark ? 'bg-slate-950/30 border-slate-850' : 'bg-slate-50 border-slate-205'
                  }`}>
                    ⚠️ Описание бренда не заполнено. Каждый пост будет генерироваться абстрактно. Нажмите кнопку <strong>«Изменить»</strong>, чтобы ввести ваши предпочтения и особенности компании!
                  </p>
                )}
              </div>
            </div>
            
            {/* INPUT PANEL MAIN BOARD */}
            <div className={`p-5 md:p-7 rounded-3xl border transition-all duration-300 ${isDark ? 'bg-[#070d19]/80 backdrop-blur-md border-slate-800/80 shadow-2xl' : 'bg-white border-slate-200/80 shadow-xl shadow-slate-105'}`}>
              
              {/* Draft/Notes input header along with design presets */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-550/30 text-pink-400 flex items-center justify-center font-extrabold text-xs">01</span>
                  <div>
                    <h3 className={`text-base font-black tracking-tight flex items-center gap-2 font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Идея, черновик или заметка
                    </h3>
                    <p className="text-[11px] text-slate-500">Введите сырые тезисы, ссылки, ТЗ или исходный текст идеи</p>
                  </div>
                </div>

                {/* Instant examples templates helper */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 font-display">Шаблоны:</span>
                  <button
                    onClick={() => handleApplyDemo('coffee')}
                    className={`px-3 py-1.5 text-xs rounded-xl font-extrabold transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${isDark ? 'bg-slate-900 border border-slate-800 text-amber-300 hover:bg-slate-850' : 'bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 shadow-sm'}`}
                  >
                    ☕️ Кофейня
                  </button>
                  <button
                    onClick={() => handleApplyDemo('course')}
                    className={`px-3 py-1.5 text-xs rounded-xl font-extrabold transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${isDark ? 'bg-slate-900 border border-slate-800 text-indigo-300 hover:bg-slate-850' : 'bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 shadow-sm'}`}
                  >
                    🚀 IT-Курс
                  </button>
                  <button
                    onClick={() => handleApplyDemo('gym')}
                    className={`px-3 py-1.5 text-xs rounded-xl font-extrabold transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${isDark ? 'bg-slate-900 border border-slate-800 text-pink-300 hover:bg-slate-850' : 'bg-pink-50 border border-pink-200 hover:bg-pink-100 text-pink-900 shadow-sm'}`}
                  >
                    💪 Фитнес
                  </button>
                </div>
              </div>

              {/* Editable Name tag of current project for user */}
              <div className="mb-3">
                <input
                  id="project_title_input"
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Название проекта (например: Новогодний розыгрыш, Анонс нового продукта...)"
                  className={`w-full text-sm font-extrabold py-3 px-4 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-305 text-slate-800 placeholder-slate-450'}`}
                />
              </div>

              {/* MAIN TEXTAREA FOR RAW INPUT */}
              <div className="relative">
                <textarea
                  id="main_input_textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Опишите суть публикации. Чем подробнее вы распишете ключевые моменты, преимущества и предложение, тем точнее и цельнее получится готовый пост."
                  rows={6}
                  className={`w-full text-sm p-4 rounded-xl border focus:ring-2 focus:ring-indigo-500/40 outline-none resize-y transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'}`}
                />
                
                {/* Character/Words count indicator */}
                <div className={`absolute right-3.5 bottom-3.5 text-[10px] font-extrabold rounded-lg px-2.5 py-1 pointer-events-none border ${isDark ? 'text-slate-400 bg-[#0d1425]/90 border-slate-800' : 'text-slate-550 bg-slate-50/95 border-slate-205'}`}>
                  {inputText.length} симв. / {inputText.split(/\s+/).filter(Boolean).length} слов
                </div>
              </div>

              {/* DRAG-AND-DROP FILE UPLOAD BLOCK */}
              <div className="mt-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2 font-display flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-slate-400" />
                  Визуальные материалы и ТЗ документы
                </span>

                <div
                  id="file_drop_zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300 transform active:scale-[0.99] ${isDragging ? (isDark ? 'bg-indigo-550/10 border-indigo-400' : 'bg-indigo-50 border-indigo-300') : (isDark ? 'hover:bg-slate-850/50 bg-slate-900/40' : 'hover:bg-slate-50 bg-slate-50/50')} ${isDark ? 'border-slate-800' : 'border-slate-250'}`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && processUploadFiles(e.target.files)}
                    className="hidden"
                    multiple
                    accept="image/*,text/*,application/json"
                  />
                  
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center animate-pulse shadow-md">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xs font-black font-display ${isDark ? 'text-white' : 'text-slate-850'}`}>Перетащите файлы сюда или нажмите для выбора</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Изображения для анализа содержимого или файлы ТЗ (.txt)</p>
                    </div>
                  </div>
                </div>

                {/* ATTACHED FILES VIEW LIST */}
                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                    {attachments.map((file) => {
                      const isImage = file.type.startsWith('image/');
                      return (
                        <div
                          key={file.id}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 relative group ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                        >
                          {isImage ? (
                            <img
                              src={file.content}
                              alt={file.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700/50"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
                              <File className="w-5.3 h-5.3" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-[10px] font-bold text-slate-200 truncate">{file.name}</p>
                            <p className="text-[8px] text-slate-500 font-bold">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAttachment(file.id);
                            }}
                            className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg absolute top-1 right-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Удалить файл"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CONTEXT BLOCK FOR EXTRA AI INSTRUCTIONS */}
              <div className={`mt-4 pt-4 border-t border-dashed ${isDark ? 'border-slate-800' : 'border-slate-150'}`}>
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5 font-display flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  Особые инструкции или фокус поста
                </span>
                
                <input
                  id="context_input"
                  type="text"
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Например: 'Сделай упор на выгоду покупки до конца недели', 'Пиши емко без умных терминов'..."
                  className={`w-full text-xs py-2.5 px-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-650' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-450'}`}
                />
              </div>

              {/* GENERATION TRIGGER CENTRAL BUTTON */}
              <div className="mt-6 flex flex-col items-center">
                <button
                  id="generate_trigger_btn"
                  onClick={() => handleGenerate()}
                  disabled={isLoading}
                  className={`w-full py-4.5 px-6 rounded-2xl font-black text-xs tracking-widest text-white uppercase flex items-center justify-center gap-3 transition-all transform hover:scale-[1.015] active:scale-[0.985] cursor-pointer shadow-lg select-none ${isLoading ? 'bg-indigo-900 text-slate-400 saturate-50 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 via-indigo-600 to-cyan-500 hover:shadow-xl hover:shadow-indigo-550/20 glow-indigo'}`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-white" />
                      <span>{loadingStage}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-200" />
                      <span>Сгенерировать готовый пост</span>
                    </>
                  )}
                </button>

                {errorMessage && (
                  <div className="mt-3.5 p-3.5 w-full rounded-xl border border-red-500/40 bg-red-500/10 text-xs text-red-300 flex items-center gap-2">
                    <span className="font-black text-white shrink-0">ВНИМАНИЕ:</span>
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

            </div>

            {/* RESULTS CONTENT BOARD VIEW */}
            {results && (
              <div className={`p-5 md:p-8 rounded-3xl border transition-all duration-300 animate-fade-in ${isDark ? 'bg-[#070d19]/80 backdrop-blur-md border-slate-800 shadow-2xl shadow-indigo-950/5' : 'bg-white border-slate-200/80 shadow-xl shadow-slate-100'}`}>
                
                {/* STRATEGY HUB (BENTO BOX) */}
                <div className="mb-6">
                  <span className="text-xs tracking-wider font-extrabold uppercase text-indigo-400 block mb-3 font-display">
                    🎯 Стратегия и рекомендации по публикации
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-350' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <span className={`font-extrabold block mb-1.5 text-[11px] uppercase tracking-wide ${isDark ? 'text-indigo-400' : 'text-indigo-650'}`}>🎯 Цель</span>
                      <p className="text-[11px] leading-relaxed">{results.analysis.goal}</p>
                    </div>
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-350' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <span className={`font-extrabold block mb-1.5 text-[11px] uppercase tracking-wide ${isDark ? 'text-indigo-400' : 'text-indigo-650'}`}>👥 Аудитория (ЦА)</span>
                      <p className="text-[11px] leading-relaxed">{results.analysis.audience}</p>
                    </div>
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-350' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <span className={`font-extrabold block mb-1.5 text-[11px] uppercase tracking-wide ${isDark ? 'text-indigo-400' : 'text-indigo-650'}`}>📐 Структура</span>
                      <p className="text-[11px] leading-relaxed">{results.analysis.structure}</p>
                    </div>
                  </div>
                </div>

                {/* MAIN VARIANT GENERATED VIEW */}
                <div className={`rounded-2xl border p-5 md:p-6 ${isDark ? 'bg-slate-900/60 border-slate-800 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
                  
                  {/* Result Header & Core Action Tools */}
                  <div className={`flex items-center justify-between mb-4 border-b pb-3 flex-wrap gap-2 ${isDark ? 'border-slate-800' : 'border-slate-150'}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-extrabold text-sm shadow-sm">✨</span>
                      <span className={`text-sm font-black tracking-wider font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>Готовый вариант</span>
                      
                      {selectedAlternativeIdx !== null && (
                        <button
                          onClick={handleResetToMain}
                          className="text-[10px] bg-slate-800 text-slate-400 hover:text-white px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all border border-slate-700"
                        >
                          Сбросить к оригиналу <RotateCcw className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Character limit feedback counter */}
                      <span className="text-[10px] text-slate-500 font-bold mr-1">
                        {editableMainText.length} символов
                      </span>

                      {/* Edit Button */}
                      <button
                        onClick={() => setIsEditingMain(!isEditingMain)}
                        className={`text-xs px-3.5 py-2.5 rounded-xl border flex items-center gap-1.5 cursor-pointer font-black transition-all transform active:scale-95 ${isEditingMain ? 'bg-green-500/15 border-green-500/40 text-green-300 shadow-sm' : (isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750' : 'bg-slate-100 border-slate-205 text-slate-700 hover:bg-slate-150')}`}
                      >
                        <Edit3 className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                        {isEditingMain ? 'Сохранить текущие правки' : 'Редактировать текст'}
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyText(editableMainText, 'main')}
                        className={`text-xs px-3.5 py-2.5 rounded-xl border flex items-center gap-1.5 cursor-pointer font-black transition-all transform active:scale-95 ${copiedStates['main'] ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md' : 'bg-indigo-600 border-indigo-550 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/15 glow-indigo'}`}
                      >
                        {copiedStates['main'] ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-white" />}
                        {copiedStates['main'] ? 'Скопировано!' : 'Копировать'}
                      </button>
                    </div>
                  </div>

                  {/* DISPLAY / EDIT AREA */}
                  {isEditingMain ? (
                    <textarea
                      value={editableMainText}
                      onChange={(e) => setEditableMainText(e.target.value)}
                      rows={10}
                      className={`w-full text-sm font-sans p-4 rounded-xl border outline-none resize-y font-mono whitespace-pre-wrap leading-relaxed focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-inner ${isDark ? 'bg-slate-950 border-indigo-500/50 text-white' : 'bg-white border-indigo-30 shadow-sm text-slate-900 border-indigo-300/65'}`}
                    />
                  ) : (
                    <div className={`text-sm font-sans whitespace-pre-wrap leading-relaxed select-text font-medium ${isDark ? 'text-slate-200' : 'text-slate-850'}`}>
                      {editableMainText}
                    </div>
                  )}

                  {/* MINI AI ACTIONS POLISHER */}
                  <div className={`mt-5 pt-4 border-t border-dashed ${isDark ? 'border-slate-800' : 'border-slate-150'}`}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-pink-500 dark:text-pink-400 block mb-2.5 font-display">
                      💡 Быстрые интеллектуальные действия
                    </span>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '✂️ Сделать короче', action: 'Сделай этот пост короче, лаконичнее, собери самую суть. Без воды.' },
                        { label: '📈 Сделать длиннее', action: 'Чуть расширь этот пост, покажи больше деталей и ценных выводов.' },
                        { label: '🔥 Более продающим', action: 'Добавь сильных триггеров продаж, зацепи потенциального покупателя, усиль блок CTA.' },
                        { label: '🎓 Более экспертным', action: 'Сделай текст более профессиональным, убери лишнюю воду, добавь экспертной глубины.' },
                        { label: '🤝 Более дружелюбным', action: 'Перепиши пост в теплом, дружественном тоне, будь ближе к читателю, делись опытом.' },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          disabled={isLoading}
                          onClick={() => handleGenerate(item.action)}
                          className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all transform hover:scale-[1.02] cursor-pointer ${isDark ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-350 hover:text-white' : 'border-slate-205 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 shadow-sm'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ALTERNATIVE CORNER VIEW */}
                <div className="mt-7">
                  <span className="text-xs tracking-wider font-extrabold uppercase text-pink-400 block mb-3.5 font-display flex items-center gap-1.5">
                    🔄 Альтернативные концепты и ракусы подачи
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.alternatives.map((alt, idx) => {
                      const isSelected = selectedAlternativeIdx === idx;
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${isSelected ? (isDark ? 'bg-indigo-550/10 border-indigo-400 shadow-md' : 'bg-indigo-50 border-indigo-300 shadow-sm') : (isDark ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-850/50 hover:border-slate-750' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm')}`}
                        >
                          <div>
                            <span className={`text-xs font-black block mb-1.5 font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              👉 {alt.title}
                            </span>
                            <p className={`text-xs line-clamp-4 leading-relaxed font-normal mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{alt.text}</p>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                handleCopyText(alt.text, `alt-${idx}`);
                              }}
                              className="px-3 py-2 text-xs rounded-xl font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center gap-1 cursor-pointer transform active:scale-95 transition-all"
                            >
                              {copiedStates[`alt-${idx}`] ? 'Скопировано!' : 'Копировать'}
                            </button>
                            <button
                              onClick={() => handleSelectAlternativeAsMain(idx)}
                              className="px-3 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer font-black transform active:scale-95 transition-all"
                            >
                              Выбрать этот 📌
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </section>

        </div>
        )}
      </main>

      {/* FOOTER BAR WITH INFORMATIONAL DETAILS */}
      <footer className={`mt-20 text-center border-t py-10 text-xs transition-colors duration-300 ${isDark ? 'border-slate-850 text-slate-500 bg-[#02050c]' : 'border-slate-205 text-slate-400 bg-white'}`}>
        <div className="max-w-4xl mx-auto px-5 flex flex-col items-center gap-3">
          <p className={`font-semibold leading-relaxed font-display ${isDark ? 'text-slate-450' : 'text-slate-600'}`}>
            Интеллектуальная SMM-платформа оптимизирована для быстрой адаптации текстов. Все процессы генерации происходят на базе защищенного облачного ИИ-сервера.
          </p>
          <p className="font-medium text-slate-500">© 2026 Студия SMM Контента — Все данные проекта сохраняются мгновенно на вашем устройстве.</p>
        </div>
      </footer>

      {/* CUSTOM CONFIRMATION DELETE MODAL */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setPendingDeleteId(null)}
          />
          <div className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl transition-all scale-100 ${
            isDark 
              ? 'bg-[#0d1527] border-slate-800 text-white' 
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-200'
          }`}>
            <h3 className="text-sm font-black uppercase tracking-wider mb-2 font-display text-pink-500">
              ⚠️ Удалить запись?
            </h3>
            <p className={`text-xs leading-relaxed mb-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Вы действительно хотите стереть эту генерацию из архива истории? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isDark 
                    ? 'border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white' 
                    : 'border-slate-250 hover:bg-slate-100 text-slate-605'
                }`}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-md cursor-pointer transition-all transform active:scale-95"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
