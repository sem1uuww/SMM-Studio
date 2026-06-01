/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Configure body-parser with higher limits to support base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize the Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// SMM content generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: 'Класс ИИ не инициализирован. Пожалуйста, убедитесь, что API ключ установлен в настройках окружения.',
      });
    }

    const { inputText, extraContext, settings, imageFiles, textFiles } = req.body;

    if (!inputText && (!textFiles || textFiles.length === 0)) {
      return res.status(400).json({
        error: 'Пожалуйста, введите текст идеи, тезисов или загрузите документ.',
      });
    }

    // Compose Prompt with all settings
    let settingsSummary = `
ПЛАТФОРМА: ${settings.platform} (адаптируй форматирование и длину под особенности этой сети)
ТИП КОНТЕНТА: ${settings.contentType}
ТОНАЛЬНОСТЬ (Tone of Voice): ${settings.toneOfVoice}
УРОВЕНЬ КРЕАТИВНОСТИ: ${settings.creativity}%
ДЛИНА ТЕКСТА: ${
      settings.length === 'Very short' ? 'Очень короткий (до 300 символов, семечко)' :
      settings.length === 'Short' ? 'Короткий (до 600 символов)' :
      settings.length === 'Medium' ? 'Средний (1000-1500 символов)' :
      settings.length === 'Long' ? 'Длинный (1500-2500 символов)' : 'Очень длинный (лонгрид, от 2500 символов)'
    }
ЭМОДЗИ: ${
      settings.emojiLevel === 'None' ? 'Исключить все эмодзи' :
      settings.emojiLevel === 'Minimum' ? 'Использовать самый минимум, только по делу (1-3 штуки)' :
      settings.emojiLevel === 'Moderate' ? 'Умеренное количество' : 'Максимально вовлекающе и богато (много)'
    }
ЦЕЛЬ (Призыв к действию / CTA): ${settings.ctaGoal}${settings.customCta ? ` (${settings.customCta})` : ''}
    `;

    // Structure Toggles
    const strToggles = [];
    if (settings.structure.header) strToggles.push('- Цепляющий заголовок');
    if (settings.structure.subtitle) strToggles.push('- Подзаголовок');
    if (settings.structure.paragraphs) strToggles.push('- Понятное разделение на абзацы');
    if (settings.structure.lists) strToggles.push('- Списки с пунктами для удобства');
    if (settings.structure.cta) strToggles.push('- Понятный CTA (призыв к действию)');
    if (settings.structure.conclusion) strToggles.push('- Резюме или заключение');
    
    if (strToggles.length > 0) {
      settingsSummary += `\nОБЯЗАТЕЛЬНАЯ СТРУКТУРА ТЕКСТА:\n${strToggles.join('\n')}\n`;
    }

    // Style elements tiggered by additional toggles
    const styleAdditions = [];
    if (settings.addHashtags) styleAdditions.push('Добавь 3-5 релевантных хэштегов в конце текста.');
    if (settings.useStorytelling) styleAdditions.push('Используй метод сторителлинга (начни с личной истории, проблемы или интригующего примера).');
    if (settings.addSocialProof) styleAdditions.push('Органично упомяни социальное доказательство (отзывы клиентов, цифры продаж, опыт работы, портфолио, кейсы).');
    if (settings.addDeadline) styleAdditions.push('Упомяни дедлайн (сроки действия, предложение ограничено по времени или количеству).');
    if (settings.boostEngagement) styleAdditions.push('Максимально усиливай вовлечение аудитории, используй цепляющие триггеры любопытства.');
    if (settings.boostSales) styleAdditions.push('Усиль продающую составляющую. Текст должен мягко или твердо подводить к покупке.');
    if (settings.boostExpertise) styleAdditions.push('Сделай фокус на глубокой экспертности, используй авторитетные факты или терминологию бренда.');
    if (settings.useQuestions) styleAdditions.push('Периодически вовлекай читателя риторическими или легкими вопросами внутри или по ходу поста.');
    if (settings.addCommentCall) styleAdditions.push('Добавь в конце сильный призыв оставить свое мнение в комментариях (например: А как вы считаете? Напишите ниже!).');

    if (styleAdditions.length > 0) {
      settingsSummary += `\nДОПОЛНИТЕЛЬНЫЕ ЭЛЕМЕНТЫ СТИЛЯ:\n${styleAdditions.join('\n')}\n`;
    }

    if (settings.brandStyle) {
      settingsSummary += `\nСТИЛЬ И ОПИСАНИЕ БРЕНДА ПОЛЬЗОВАТЕЛЯ:\n${settings.brandStyle}\n`;
    }

    // If text files are present, aggregate them
    let extractedDocsContext = '';
    if (textFiles && textFiles.length > 0) {
      extractedDocsContext = '\n\n--- ТЕКСТ ИЗ ЗАГРУЖЕННЫХ ФАЙЛОВ / ДОКУМЕНТОВ ---\n';
      textFiles.forEach((f: any) => {
        extractedDocsContext += `[Файл: ${f.name}]\n${f.content}\n\n`;
      });
    }

    const systemInstruction = `
Ты — профессиональный SMM-стратег, маркетолог и мастер копирайтинга для малого и среднего бизнеса.
Твоя задача — проанализировать исходную идею или заметку пользователя, загруженные файлы и контекст, а затем сгенерировать идеальный вовлекающий, профессиональный СММ-контент на русском языке.

Твоя работа строится на строгих правилах:
1. Текст должен быть живым, ритмичным, без казенного языка и пустых штампов (избегай "уникальный", "инновационный", "спешите купить" и т.д., если только этого не требует стиль).
2. Заголовки должны "бить в боль" целевой аудитории или интриговать.
3. Форматирование должно быть безупречным: деление на абзацы, красивые списки, уместные эмодзи (согласно настройкам).
4. Обязательно сначала проанализируй целевую аудиторию, цель публикации и оптимальную структуру.

Ты вернешь структурированный ответ в JSON формате по строго заданной схеме.
Основной вариант поста должен точно отвечать настройкам длины и платформы.
Альтернативные варианты должны предлагать другой угол подачи (например, один экстремально короткий/ироничный, другой — в форме личного опыта/интервью, третий — интерактивный опрос).
`;

    const mainPromptPrompt = `
Вот исходная идея/заметка пользователя:
"""
${inputText || 'Черновик предоставлен в загруженных файлах.'}
"""
${extraContext ? `\nДополнительный контекст от пользователя: \n"""\n${extraContext}\n"""\n` : ''}
${extractedDocsContext}

Настройки генератора:
${settingsSummary}

Инструкция:
Проанализируй целевую аудиторию, определи цель поста и разработай оптимальную структуру.
Затем напиши:
1. "mainVariant" — это идеальный основной пост, полностью готовый к копированию. Содержит все теги, списки, ссылки, эмодзи и CTA в зависимости от настроек.
2. "alternatives" — это список из 2-3 альтернативных вариантов этого же поста, но в других стилях подачи. Дай им понятные названия (например, "Игровой с юмором", "Интересный факт", "История факапа", "Провокационный", "Короткая выжимка").

Сгенерируй тексты в сочном профессиональном стиле, соответствующем уровню креативности ${settings.creativity}%.
`;

    // Process parts for Gemini
    const parts: any[] = [];

    // If image attachments exist, include them
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((img: any) => {
        const base64Data = img.content.split(';base64,').pop(); // strip data:image/...;base64,
        parts.push({
          inlineData: {
            mimeType: img.type || 'image/jpeg',
            data: base64Data,
          },
        });
      });
    }

    // Add main prompt text
    parts.push({
      text: mainPromptPrompt,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.OBJECT,
              properties: {
                goal: { type: Type.STRING, description: 'Кратко цель публикации' },
                audience: { type: Type.STRING, description: 'Целевая аудитория' },
                structure: { type: Type.STRING, description: 'Оптимальная структура поста' },
              },
              required: ['goal', 'audience', 'structure'],
            },
            mainVariant: {
              type: Type.STRING,
              description: 'Основной готовый текст поста, с красивым форматированием (абзацы, списки, CTA, хэштеги)',
            },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Стиль или ракурс подачи' },
                  text: { type: Type.STRING, description: 'Текст альтернативного поста' },
                },
                required: ['title', 'text'],
              },
            },
          },
          required: ['analysis', 'mainVariant', 'alternatives'],
        },
      },
    });

    if (!response.text) {
      throw new Error('Модель вернула пустой ответ.');
    }

    const resultData = JSON.parse(response.text.trim());
    return res.json(resultData);
  } catch (error: any) {
    console.error('Ошибка генерации СММ-контента:', error);
    return res.status(500).json({
      error: error.message || 'Ошибка генерации текста. Пожалуйста, попробуйте еще раз.',
    });
  }
});

// Vite or Static files setup
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Ошибка запуска сервера:', err);
});
