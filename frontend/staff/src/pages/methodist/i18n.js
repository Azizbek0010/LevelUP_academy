import { createContext, useContext, useEffect, useState, useCallback, createElement } from 'react';

export const LANGS = [
  { code: 'ru', label: 'РУС' },
  { code: 'uz', label: 'UZ' },
  { code: 'en', label: 'EN' },
];

const STORAGE_KEY = 'methodist-lang';
const FALLBACK_LANG = 'ru';

const translations = {
  /* ─── Umumiy / common ─── */
  'app.name': { ru: 'Контент-студия', uz: 'Kontent-studiya', en: 'Content Studio' },
  'common.loading_error': { ru: 'Ошибка загрузки', uz: 'Yuklashda xatolik', en: 'Loading error' },
  'common.loading_failed': { ru: 'Не удалось загрузить данные', uz: 'Ma\'lumotlarni yuklab bo\'lmadi', en: 'Failed to load data' },
  'common.retry': { ru: 'Повторить', uz: 'Qayta urinish', en: 'Retry' },
  'common.no_data': { ru: 'Нет данных', uz: 'Ma\'lumot yo\'q', en: 'No data' },
  'common.all': { ru: 'Все', uz: 'Barchasi', en: 'All' },
  'common.back': { ru: 'Назад', uz: 'Orqaga', en: 'Back' },
  'common.save': { ru: 'Сохранить', uz: 'Saqlash', en: 'Save' },
  'common.cancel': { ru: 'Отмена', uz: 'Bekor qilish', en: 'Cancel' },
  'common.delete': { ru: 'Удалить', uz: 'O\'chirish', en: 'Delete' },
  'common.edit': { ru: 'Изменить', uz: 'Tahrirlash', en: 'Edit' },
  'common.add': { ru: 'Добавить', uz: 'Qo\'shish', en: 'Add' },
  'common.create': { ru: 'Создать', uz: 'Yaratish', en: 'Create' },
  'common.close': { ru: 'Закрыть', uz: 'Yopish', en: 'Close' },
  'common.copy': { ru: 'Дублировать', uz: 'Nusxalash', en: 'Duplicate' },
  'common.tests_count': { ru: '{count} тестов', uz: '{count} ta test', en: '{count} tests' },
  'common.attempts_count': { ru: '{count} попыток', uz: '{count} ta urinish', en: '{count} attempts' },

  /* ─── Dashboard ─── */
  'kpi.types': { ru: 'Типы обучения', uz: 'O\'quv turlari', en: 'Training types' },
  'kpi.topics': { ru: 'Всего тем', uz: 'Jami mavzular', en: 'Total topics' },
  'kpi.tests': { ru: 'Тестов', uz: 'Testlar', en: 'Tests' },
  'kpi.hw': { ru: 'Домашние задания', uz: 'Uy vazifalari', en: 'Homework' },
  'dashboard.subtitle': { ru: 'Создавайте и управляйте учебными материалами', uz: 'O\'quv materiallarini yarating va boshqaring', en: 'Create and manage learning materials' },
  'dashboard.topics_count': { ru: '{count} тем', uz: '{count} ta mavzu', en: '{count} topics' },
  'dashboard.avg_score': { ru: 'Средний балл по тестам', uz: 'Testlar bo\'yicha o\'rtacha ball', en: 'Average test score' },
  'dashboard.great': { ru: 'Отлично', uz: 'A\'lo', en: 'Great' },
  'dashboard.good': { ru: 'Хорошо', uz: 'Yaxshi', en: 'Good' },
  'dashboard.need_work': { ru: 'Нужна работа', uz: 'Ishlash kerak', en: 'Needs work' },
  'dashboard.types_section': { ru: 'Типы обучения', uz: 'O\'quv turlari', en: 'Training types' },
  'dashboard.all_types': { ru: 'Все типы', uz: 'Barcha turlar', en: 'All types' },
  'dashboard.no_types': { ru: 'Нет типов обучения', uz: 'O\'quv turlari yo\'q', en: 'No training types' },
  'dashboard.no_types_hint': { ru: 'Создайте первый тип, чтобы начать', uz: 'Boshlash uchun birinchi turni yarating', en: 'Create the first type to start' },
  'dashboard.create_type': { ru: 'Создать тип', uz: 'Tur yaratish', en: 'Create type' },

  /* ─── Analytics ─── */
  'analytics.title': { ru: 'Аналитика успеваемости', uz: 'O\'zlashtirish tahlili', en: 'Performance Analytics' },
  'analytics.subtitle': { ru: 'Статистика сложностей по предметам и тестам', uz: 'Fanlar va testlar bo\'yicha qiyinchilik statistikasi', en: 'Difficulty statistics by subjects and tests' },
  'analytics.donut_aria': { ru: 'Общий средний балл {num}%', uz: 'Umumiy o\'rtacha ball {num}%', en: 'Overall average score {num}%' },
  'analytics.total_tests': { ru: 'Всего тестов', uz: 'Jami testlar', en: 'Total tests' },
  'analytics.total_attempts': { ru: 'Всего попыток', uz: 'Jami urinishlar', en: 'Total attempts' },
  'analytics.overall_avg': { ru: 'Общий средний', uz: 'Umumiy o\'rtacha', en: 'Overall average' },
  'analytics.performance': { ru: 'Успеваемость', uz: 'O\'zlashtirish', en: 'Performance' },
  'analytics.score_good': { ru: 'Хорошо', uz: 'Yaxshi', en: 'Good' },
  'analytics.score_avg': { ru: 'Средне', uz: 'O\'rtacha', en: 'Average' },
  'analytics.score_hard': { ru: 'Сложно', uz: 'Qiyin', en: 'Hard' },
  'analytics.subject_difficulty': { ru: 'Сложность предметов', uz: 'Fanlar qiyinligi', en: 'Subject difficulty' },
  'analytics.by_avg_score': { ru: 'По среднему баллу', uz: 'O\'rtacha ball bo\'yicha', en: 'By average score' },
  'analytics.low_tests': { ru: 'Тесты с низкими результатами', uz: 'Past natijali testlar', en: 'Tests with low results' },
  'analytics.top5': { ru: 'Топ-5 по сложности', uz: 'Qiyinlik bo\'yicha top-5', en: 'Top 5 by difficulty' },
  'analytics.all_tests': { ru: 'Все тесты', uz: 'Barcha testlar', en: 'All tests' },
  'analytics.full_table': { ru: 'Полная таблица результатов', uz: 'Natijalarning to\'liq jadvali', en: 'Full results table' },
  'analytics.col_title': { ru: 'Название', uz: 'Nomi', en: 'Title' },
  'analytics.col_group': { ru: 'Группа', uz: 'Guruh', en: 'Group' },
  'analytics.col_branch': { ru: 'Филиал', uz: 'Filial', en: 'Branch' },
  'analytics.col_attempts': { ru: 'Попытки', uz: 'Urinishlar', en: 'Attempts' },
  'analytics.col_avg': { ru: 'Средний балл', uz: 'O\'rtacha ball', en: 'Avg. score' },
  'analytics.general_subject': { ru: 'Общее', uz: 'Umumiy', en: 'General' },

  /* ─── Training types ─── */
  'types.title': { ru: 'Типы обучения', uz: 'O\'quv turlari', en: 'Training types' },
  'types.subtitle': { ru: 'Направления подготовки: Backend, Frontend, Python и др.', uz: 'Yo\'nalishlar: Backend, Frontend, Python va boshqalar', en: 'Directions: Backend, Frontend, Python, etc.' },
  'types.add': { ru: 'Добавить тип', uz: 'Tur qo\'shish', en: 'Add type' },
  'types.no_types': { ru: 'Нет типов обучения', uz: 'O\'quv turlari yo\'q', en: 'No training types' },
  'types.no_types_hint': { ru: 'Создайте первый тип, чтобы начать наполнять контентом', uz: 'Kontent bilan to\'ldirishni boshlash uchun birinchi turni yarating', en: 'Create the first type to start adding content' },
  'types.create_first': { ru: 'Создать первый тип', uz: 'Birinchi turni yaratish', en: 'Create first type' },
  'types.topics_count': { ru: '{count} тем', uz: '{count} ta mavzu', en: '{count} topics' },
  'types.description_short': { ru: 'описание', uz: 'tavsif', en: 'description' },
  'types.archive_tooltip': { ru: 'Архивировать', uz: 'Arxivlash', en: 'Archive' },
  'types.open_topics': { ru: 'Открыть темы', uz: 'Mavzularni ochish', en: 'Open topics' },
  'types.archive_confirm': { ru: 'Архивировать тип?', uz: 'Turni arxivlash?', en: 'Archive type?' },
  'types.archive_hidden': { ru: '«{name}» будет скрыт', uz: '«{name}» yashiriladi', en: '«{name}» will be hidden' },
  'types.archive': { ru: 'Архивировать', uz: 'Arxivlash', en: 'Archive' },
  'types.new_title': { ru: 'Новый тип обучения', uz: 'Yangi o\'quv turi', en: 'New training type' },
  'types.new_hint': { ru: 'Создайте направление подготовки', uz: 'Yo\'nalish yarating', en: 'Create a training direction' },
  'types.name_label': { ru: 'Название *', uz: 'Nomi *', en: 'Name *' },
  'types.name_placeholder': { ru: 'Например: Backend', uz: 'Masalan: Backend', en: 'e.g. Backend' },
  'types.name_required': { ru: 'Название обязательно', uz: 'Nomi kiritilishi shart', en: 'Name is required' },
  'types.description_label': { ru: 'Описание', uz: 'Tavsif', en: 'Description' },
  'types.description_placeholder': { ru: 'Кратко о направлении...', uz: 'Yo\'nalish haqida qisqacha...', en: 'Briefly about the direction...' },
  'types.icon_label': { ru: 'Иконка (emoji)', uz: 'Belgi (emoji)', en: 'Icon (emoji)' },

  /* ─── Topics ─── */
  'topics.breadcrumb_types': { ru: 'Типы обучения', uz: 'O\'quv turlari', en: 'Training types' },
  'topics.breadcrumb_topics': { ru: 'Темы', uz: 'Mavzular', en: 'Topics' },
  'topics.title': { ru: 'Темы', uz: 'Mavzular', en: 'Topics' },
  'topics.subtitle': { ru: 'Уроки и тесты внутри направления', uz: 'Yo\'nalish ichidagi darslar va testlar', en: 'Lessons and tests within the direction' },
  'topics.add': { ru: 'Добавить тему', uz: 'Mavzu qo\'shish', en: 'Add topic' },
  'topics.create': { ru: 'Создать тему', uz: 'Mavzu yaratish', en: 'Create topic' },
  'topics.no_topics': { ru: 'Нет тем', uz: 'Mavzular yo\'q', en: 'No topics' },
  'topics.no_topics_hint': { ru: 'Создайте первую тему в этом направлении', uz: 'Bu yo\'nalishda birinchi mavzuni yarating', en: 'Create the first topic in this direction' },
  'topics.lessons_count': { ru: '{count} уроков', uz: '{count} ta dars', en: '{count} lessons' },
  'topics.description_short': { ru: 'описание', uz: 'tavsif', en: 'description' },
  'topics.edit_tooltip': { ru: 'Редактировать', uz: 'Tahrirlash', en: 'Edit' },
  'topics.delete_tooltip': { ru: 'Удалить', uz: 'O\'chirish', en: 'Delete' },
  'topics.archive_tooltip': { ru: 'Архивировать', uz: 'Arxivlash', en: 'Archive' },
  'topics.lessons_and_tests': { ru: 'Уроки и тесты', uz: 'Darslar va testlar', en: 'Lessons and tests' },
  'topics.archive_confirm': { ru: 'Архивировать тему?', uz: 'Mavzuni arxivlash?', en: 'Archive topic?' },
  'topics.archive_hidden': { ru: '«{name}» будет скрыта', uz: '«{name}» yashiriladi', en: '«{name}» will be hidden' },
  'topics.archive': { ru: 'Архивировать', uz: 'Arxivlash', en: 'Archive' },
  'topics.new_title': { ru: 'Новая тема', uz: 'Yangi mavzu', en: 'New topic' },
  'topics.new_hint': { ru: 'Добавьте тему в направление', uz: 'Yo\'nalishga mavzu qo\'shing', en: 'Add a topic to the direction' },
  'topics.name_label': { ru: 'Название *', uz: 'Nomi *', en: 'Name *' },
  'topics.name_placeholder': { ru: 'Например: React Hooks', uz: 'Masalan: React Hooks', en: 'e.g. React Hooks' },
  'topics.name_required': { ru: 'Название обязательно', uz: 'Nomi kiritilishi shart', en: 'Name is required' },
  'topics.description_label': { ru: 'Описание', uz: 'Tavsif', en: 'Description' },
  'topics.description_placeholder': { ru: 'О чём эта тема...', uz: 'Bu mavzu nima haqida...', en: 'What is this topic about...' },
  'topics.description': { ru: 'Описание', uz: 'Tavsif', en: 'Description' },

  /* ─── Lessons ─── */
  'lessons.breadcrumb_types': { ru: 'Типы', uz: 'Turlar', en: 'Types' },
  'lessons.breadcrumb_topics': { ru: 'Темы', uz: 'Mavzular', en: 'Topics' },
  'lessons.breadcrumb_lessons': { ru: 'Уроки', uz: 'Darslar', en: 'Lessons' },
  'lessons.title': { ru: 'Уроки', uz: 'Darslar', en: 'Lessons' },
  'lessons.subtitle': { ru: 'Тесты и практические задания внутри темы', uz: 'Mavzu ichidagi testlar va amaliy topshiriqlar', en: 'Tests and practical tasks within the topic' },
  'lessons.create': { ru: 'Создать урок', uz: 'Dars yaratish', en: 'Create lesson' },
  'lessons.badge_test': { ru: 'Тест', uz: 'Test', en: 'Test' },
  'lessons.badge_practical': { ru: 'Практика', uz: 'Amaliyot', en: 'Practice' },
  'lessons.no_lessons': { ru: 'Нет уроков', uz: 'Darslar yo\'q', en: 'No lessons' },
  'lessons.no_lessons_hint': { ru: 'Создайте первый тест или практическое задание', uz: 'Birinchi test yoki amaliy topshiriq yarating', en: 'Create the first test or practical task' },
  'lessons.questions_count': { ru: '{count} вопросов', uz: '{count} ta savol', en: '{count} questions' },
  'lessons.requirements_count': { ru: '{count} требований', uz: '{count} ta talab', en: '{count} requirements' },
  'lessons.copy_tooltip': { ru: 'Копировать урок', uz: 'Darsni nusxalash', en: 'Copy lesson' },
  'lessons.archive_tooltip': { ru: 'Архивировать', uz: 'Arxivlash', en: 'Archive' },
  'lessons.edit_tooltip': { ru: 'Редактировать', uz: 'Tahrirlash', en: 'Edit' },
  'lessons.archive_confirm': { ru: 'Архивировать урок?', uz: 'Darsni arxivlash?', en: 'Archive lesson?' },
  'lessons.archive': { ru: 'Архивировать', uz: 'Arxivlash', en: 'Archive' },
  'lessons.new_title': { ru: 'Новый урок', uz: 'Yangi dars', en: 'New lesson' },
  'lessons.new_hint': { ru: 'Создайте тест или практическое задание', uz: 'Test yoki amaliy topshiriq yarating', en: 'Create a test or practical task' },
  'lessons.field_title': { ru: 'Название *', uz: 'Nomi *', en: 'Name *' },
  'lessons.title_placeholder': { ru: 'Например: HTML Теги', uz: 'Masalan: HTML teglar', en: 'e.g. HTML Tags' },
  'lessons.title_required': { ru: 'Название обязательно', uz: 'Nomi kiritilishi shart', en: 'Name is required' },
  'lessons.lesson_type_label': { ru: 'Тип урока', uz: 'Dars turi', en: 'Lesson type' },
  'lessons.type_test': { ru: 'Тест (A/B/C/D)', uz: 'Test (A/B/C/D)', en: 'Test (A/B/C/D)' },
  'lessons.type_practical': { ru: 'Практическое задание', uz: 'Amaliy topshiriq', en: 'Practical task' },
  'lessons.desc_label': { ru: 'Описание задания', uz: 'Topshiriq tavsifi', en: 'Task description' },
  'lessons.desc_placeholder': { ru: 'Опишите задание для студента...', uz: 'Talaba uchun topshiriqni tavsiflang...', en: 'Describe the task for the student...' },
  'lessons.instruction_label': { ru: 'Инструкция / Объяснение', uz: 'Yo\'riqnoma / Tushuntirish', en: 'Instruction / Explanation' },
  'lessons.instruction_placeholder': { ru: 'Краткое объяснение темы...', uz: 'Mavzuning qisqacha tushuntirishi...', en: 'Brief topic explanation...' },
  'lessons.coin_label': { ru: 'Награда (коины)', uz: 'Mukofot (koinlar)', en: 'Reward (coins)' },
  'lessons.create_and_edit': { ru: 'Создать и редактировать', uz: 'Yaratish va tahrirlash', en: 'Create and edit' },

  /* ─── Lesson editor ─── */
  'editor.title': { ru: 'Редактор урока', uz: 'Dars muharriri', en: 'Lesson editor' },
  'editor.subtitle': { ru: 'Тест или практическое задание', uz: 'Test yoki amaliy topshiriq', en: 'Test or practical task' },
  'editor.settings_tooltip': { ru: 'Параметры урока', uz: 'Dars parametrlari', en: 'Lesson settings' },
  'editor.test_count': { ru: 'Тест · {count} вопросов', uz: 'Test · {count} ta savol', en: 'Test · {count} questions' },
  'editor.type_practical': { ru: 'Практическое задание', uz: 'Amaliy topshiriq', en: 'Practical task' },
  'editor.requirements_title': { ru: 'Обязательные требования', uz: 'Majburiy talablar', en: 'Mandatory requirements' },
  'editor.requirements_hint': { ru: 'Что студент должен выполнить в задании', uz: 'Talaba vazifada nimani bajarishi kerak', en: 'What the student must complete in the task' },
  'editor.requirement_text': { ru: 'Требование / условие *', uz: 'Talab / shart *', en: 'Requirement *' },
  'editor.requirement_points': { ru: 'Баллы', uz: 'Ball', en: 'Points' },
  'editor.add_requirement': { ru: 'Добавить требование', uz: 'Talab qo\'shish', en: 'Add requirement' },
  'editor.save_requirements': { ru: 'Сохранить требования', uz: 'Talablarni saqlash', en: 'Save requirements' },
  'editor.requirements_total': { ru: 'Итого {points} баллов', uz: 'Jami {points} ball', en: 'Total {points} points' },
  'editor.no_requirements': { ru: 'Требований пока нет. Добавьте первое.', uz: 'Talablar hozircha yo\'q. Birinchisini qo\'shing.', en: 'No requirements yet. Add the first one.' },
  'editor.video_label': { ru: 'Видео-материал:', uz: 'Video material:', en: 'Video material:' },
  'editor.task_desc': { ru: 'Описание задания', uz: 'Topshiriq tavsifi', en: 'Task description' },
  'editor.attachment_label': { ru: 'Вложенный файл к заданию:', uz: 'Topshiriqqa biriktirilgan fayl:', en: 'Attached file to the task:' },
  'editor.no_file': { ru: 'Файл не прикреплен', uz: 'Fayl biriktirilmagan', en: 'No file attached' },
  'editor.instruction': { ru: 'Инструкция / Объяснение', uz: 'Yo\'riqnoma / Tushuntirish', en: 'Instruction / Explanation' },
  'editor.edit_question': { ru: 'Редактировать вопрос', uz: 'Savolni tahrirlash', en: 'Edit question' },
  'editor.add_question': { ru: 'Добавить вопрос', uz: 'Savol qo\'shish', en: 'Add question' },
  'editor.question_type': { ru: 'Тип вопроса', uz: 'Savol turi', en: 'Question type' },
  'editor.question_text': { ru: 'Текст вопроса *', uz: 'Savol matni *', en: 'Question text *' },
  'editor.question_placeholder': { ru: 'Какой тег используется для заголовка?', uz: 'Sarlavha uchun qaysi teg ishlatiladi?', en: 'Which tag is used for the heading?' },
  'editor.option_label': { ru: 'Вариант {letter}', uz: 'Variant {letter}', en: 'Option {letter}' },
  'editor.correct_answer': { ru: 'Правильный ответ *', uz: 'To\'g\'ri javob *', en: 'Correct answer *' },
  'editor.batch_title': { ru: 'Быстрое создание', uz: 'Tez yaratish', en: 'Quick create' },
  'editor.empty_questions': { ru: 'пустых вопросов', uz: 'ta bo\'sh savol', en: 'empty questions' },
  'editor.questions': { ru: 'Вопросы', uz: 'Savollar', en: 'Questions' },
  'editor.no_questions': { ru: 'Нет вопросов. Добавьте первый вопрос выше.', uz: 'Savollar yo\'q. Yuqorida birinchi savolni qo\'shing.', en: 'No questions. Add the first question above.' },
  'editor.delete_confirm': { ru: 'Удалить вопрос?', uz: 'Savolni o\'chirish?', en: 'Delete question?' },
  'editor.settings_title': { ru: 'Параметры урока', uz: 'Dars parametrlari', en: 'Lesson settings' },
  'editor.settings_name': { ru: 'Название *', uz: 'Nomi *', en: 'Name *' },
  'editor.video_url_label': { ru: 'Видео-урок (YouTube/S3 ссылка)', uz: 'Video-dars (YouTube/S3 havola)', en: 'Video lesson (YouTube/S3 link)' },
  'editor.coin_label': { ru: 'Награда (коины)', uz: 'Mukofot (koinlar)', en: 'Reward (coins)' },
  'editor.question_required': { ru: 'Вопрос обязателен', uz: 'Savol kiritilishi shart', en: 'Question is required' },
  'editor.option_required': { ru: 'Вариант {letter} обязателен', uz: 'Variant {letter} kiritilishi shart', en: 'Option {letter} is required' },
  'editor.correct_answer_required': { ru: 'Правильный ответ обязателен', uz: 'To\'g\'ri javob kiritilishi shart', en: 'Correct answer is required' },
  'editor.title_required': { ru: 'Название обязательно', uz: 'Nomi kiritilishi shart', en: 'Name is required' },
  'editor.invalid_url': { ru: 'Некорректная ссылка', uz: 'Noto\'g\'ri havola', en: 'Invalid link' },
  'editor.question_prefix': { ru: 'Вопрос', uz: 'Savol', en: 'Question' },
  'editor.type_choice': { ru: 'Варианты', uz: 'Variantlar', en: 'Options' },
  'editor.type_riddle': { ru: 'Загадка', uz: 'Topishmoq', en: 'Riddle' },
  'editor.type_open': { ru: 'Вопрос и ответ', uz: 'Savol va javob', en: 'Question and answer' },

  /* ─── Profile ─── */
  'profile.role_methodist': { ru: 'Методист', uz: 'Metodist', en: 'Methodist' },
  'profile.email': { ru: 'Email', uz: 'Email', en: 'Email' },
  'profile.branch': { ru: 'Филиал', uz: 'Filial', en: 'Branch' },
  'profile.registered': { ru: 'Зарегистрирован', uz: 'Ro\'yxatdan o\'tgan', en: 'Registered' },
  'profile.load_error': { ru: 'Ошибка загрузки профиля', uz: 'Profilni yuklashda xatolik', en: 'Error loading profile' },
  'profile.personal_data': { ru: 'Личные данные', uz: 'Shaxsiy ma\'lumotlar', en: 'Personal data' },
  'profile.personal_data_hint': { ru: 'Эти данные видит администратор организации.', uz: 'Bu ma\'lumotlarni tashkilot admini ko\'radi.', en: 'The organization administrator sees this data.' },
  'profile.first_name': { ru: 'Имя', uz: 'Ism', en: 'First name' },
  'profile.last_name': { ru: 'Фамилия', uz: 'Familiya', en: 'Last name' },
  'profile.email_hint': { ru: 'Вы входите в систему с этим email, код восстановления пароля также приходит на этот адрес.', uz: 'Siz tizimga shu email orqali kirasiz, parolni tiklash kodi ham shu manzilga keladi.', en: 'You sign in with this email; the password reset code is also sent to this address.' },
  'profile.saved': { ru: 'Сохранено', uz: 'Saqlangan', en: 'Saved' },
  'profile.dirty': { ru: 'Есть несохранённые изменения', uz: 'Saqlanmagan o\'zgarishlar bor', en: 'There are unsaved changes' },
  'profile.enter_name': { ru: 'Введите имя', uz: 'Ism kiriting', en: 'Enter a first name' },
  'profile.enter_last': { ru: 'Введите фамилию', uz: 'Familiya kiriting', en: 'Enter a last name' },
  'profile.invalid_email': { ru: 'Некорректный email', uz: 'Noto\'g\'ri email', en: 'Invalid email' },
  'profile.save_failed': { ru: 'Не удалось сохранить', uz: 'Saqlab bo\'lmadi', en: 'Failed to save' },
  'profile.security': { ru: 'Безопасность', uz: 'Xavfsizlik', en: 'Security' },
  'profile.password': { ru: 'Пароль', uz: 'Parol', en: 'Password' },
  'profile.password_hint': { ru: 'В целях безопасности пароль не изменяется здесь — он восстанавливается через код подтверждения, отправляемый на ваш email.', uz: 'Xavfsizlik maqsadida parol bu yerda o\'zgartirilmaydi — u emailingizga yuboriladigan tasdiqlash kodi orqali tiklanadi.', en: 'For security, the password is not changed here — it is restored via a confirmation code sent to your email.' },
  'profile.reset_password': { ru: 'Восстановить пароль', uz: 'Parolni tiklash', en: 'Reset password' },
  'profile.end_session': { ru: 'Завершить сеанс', uz: 'Seansni yakunlash', en: 'End session' },
  'profile.session_hint': { ru: 'Вы выйдете из аккаунта на этом устройстве.', uz: 'Siz bu qurilmadagi akkauntdan chiqasiz.', en: 'You will be signed out on this device.' },
  'profile.logout': { ru: 'Выйти', uz: 'Chiqish', en: 'Sign out' },
};

const LangContext = createContext({ lang: FALLBACK_LANG, setLang: () => {}, t: (key) => key });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return LANGS.some((l) => l.code === saved) ? saved : FALLBACK_LANG;
    } catch {
      return FALLBACK_LANG;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore storage errors */
    }
  }, [lang]);

  const setLang = useCallback((l) => {
    if (LANGS.some((x) => x.code === l)) setLangState(l);
  }, []);

  const t = useCallback(
    (key, params) => {
      const row = translations[key];
      let out = row ? row[lang] ?? row.ru ?? key : key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          out = out.replace(`{${k}}`, String(v));
        }
      }
      return out;
    },
    [lang]
  );

  return createElement(LangContext.Provider, { value: { lang, setLang, t } }, children);
}

export const useLang = () => useContext(LangContext);

export function registerTranslations(extra) {
  Object.assign(translations, extra);
}
