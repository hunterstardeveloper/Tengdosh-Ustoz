(function () {
  "use strict";

  const STORAGE_KEY = "tu_lang";
  const DEFAULT_LANG = "en";
  const SUPPORTED = ["en", "uz", "ru"];

  const T = {
    en: {
      nav_home: "Home",
      nav_contact: "Contact us",
      nav_account: "Account",
      hero_pill: "Welcome to Tengdosh Ustoz",
      hero_title: "A Space for Your<br>Educational Journey",
      hero_desc: "Discover a sanctuary for learning where knowledge grows and focus is naturally restored.",
      stat_users: "Registered users",
      stat_teachers: "Teachers",
      quote_pill: "Daily Inspiration",
      quote_loading: "Loading inspiration",
      quote_like: "Like",
      quote_copy: "Copy",
      quote_share: "Share",
      quote_copied: "Copied to clipboard",
      schedule_title: "Schedule",
      schedule_hide: "Hide Schedule",
      schedule_show: "Show Upcoming Classes",
      schedule_checking: "Checking for live sessions...",
      schedule_none: "No upcoming sessions at the moment.",
      schedule_no_classes: "No classes scheduled.",
      schedule_live: "LIVE NOW",
      schedule_next: "Next class",
      schedule_join: "Join Live Session",
      schedule_view: "View Details",
      schedule_teacher: "Teacher",
      schedule_time: "Time",
      schedule_room: "Room",
      special_title: "Special",
      coding_title: "Coding Skills",
      soft_title: "Essential Soft Skills",
      card_fullstack: "Full-stack",
      card_fullstack_desc: "Transform static designs into interactive digital experiences. Master React, modern CSS, and performance optimization.",
      card_python: "Python",
      card_python_desc: "Go beyond basic syntax. Learn to architect scalable systems, automate complex workflows, and dive into the foundations of Data Science and AI.",
      card_java: "Java",
      card_java_desc: "Build the backbone of enterprise software. Master Object-Oriented Programming (OOP) and robust backend structures used globally.",
      card_cpp: "C++",
      card_cpp_desc: "Master C++ for competitive programming and real-world software: algorithms, OOP, STL, and performance-focused coding.",
      card_english: "English",
      card_english_desc: "Break the language barrier. Focus on professional communication and technical terminology for global opportunities.",
      card_si: "Self Improvement",
      card_si_desc: "Upgrade your mental OS. Develop high-performance habits and the psychological resilience needed in tech.",
      card_math: "Mathematics",
      card_math_desc: "Level up with functions, limits, derivatives, integrals, and proofs\u2014perfect for olympiad-style thinking and STEM success.",
      card_view: "View Club",
      footer_desc: "Connecting students with peer teachers across Uzbekistan \u2014 a community-driven platform for shared knowledge, growth, and academic excellence since 2026.",
      footer_contact: "Contact Us",
      footer_support_label: "STUDENT SUPPORT",
      footer_email_label: "EMAIL",
      footer_telegram_label: "TELEGRAM",
      footer_support: "Support",
      footer_assistant: "Assistant",
      footer_dev1: "Support Developer 1",
      footer_dev2: "Support Developer 2",
      footer_copy: "Tengdosh Ustoz \u00b7 All rights reserved.",
      contact_title: "Contact",
      contact_desc: "Send a message to the team. If you are logged in, your name, surname and group are auto-filled from your account.",
      contact_message_title: "Message",
      contact_anon: "Send anonymously",
      contact_name: "Name",
      contact_name_ph: "Your name",
      contact_surname: "Surname",
      contact_surname_ph: "Your surname",
      contact_group: "Group",
      contact_group_ph: "e.g. 1-A",
      contact_msg: "Message",
      contact_msg_ph: "Write your message here...",
      contact_send: "Send message",
      contact_cooldown: "Cooldown: ready",
      contact_rules: "Rules",
      contact_rules_desc: "To reduce spam, you can send a message only once every <strong>6\u20137 hours</strong>. If you are registered, your identity fields are auto-filled.",
      contact_rule1: "Use anonymous mode if needed.",
      contact_rule2: "Paste links for video / images / documents.",
      contact_rule3: "Be specific (what happened, where, and when).",
      acc_dashboard: "Learning Dashboard",
      acc_dashboard_sub: "Your subscriptions and activity at a glance.",
      acc_teachers_sub: "Teachers subscribed",
      acc_last_sub: "Last subscription",
      acc_active_subs: "Active Subscriptions",
      acc_no_subs: "No subscriptions yet. Visit a teacher page and press Subscribe.",
      acc_overview: "Overview",
      acc_profile: "Profile",
      acc_settings: "Settings",
      acc_liked: "Liked",
      acc_signout: "Sign Out",
      acc_profile_title: "Profile",
      acc_profile_sub: "Update your display name, phone number, and university group.",
      acc_display_name: "Display name",
      acc_surname: "Surname",
      acc_surname_opt: "(optional)",
      acc_phone: "Phone number",
      acc_phone_req: "(required)",
      acc_group: "Group",
      acc_group_req: "(required)",
      acc_save: "Save changes",
      acc_settings_title: "Settings",
      acc_settings_sub: "Manage your account and subscriptions.",
      acc_danger: "Danger Zone",
      acc_danger_desc: "These actions are irreversible. Please proceed carefully.",
      acc_unsub_all: "Unsubscribe from all teachers",
      acc_liked_title: "Liked Quotes",
      acc_liked_sub: "Quotes you liked on the Home page. Visible only to you.",
      acc_your_likes: "Your likes",
      tbd: "TBD"
    },
    uz: {
      nav_home: "Bosh sahifa",
      nav_contact: "Bog\u2018lanish",
      nav_account: "Hisob",
      hero_pill: "Tengdosh Ustozga xush kelibsiz",
      hero_title: "Ta\u2018lim sayohatingiz<br>uchun makon",
      hero_desc: "Bilim o\u2018sadigan va e\u2018tibor tabiiy ravishda tiklanadigan o\u2018rganish maskani.",
      stat_users: "Ro\u2018yxatdan o\u2018tgan foydalanuvchilar",
      stat_teachers: "O\u2018qituvchilar",
      quote_pill: "Kunlik ilhom",
      quote_loading: "Ilhom yuklanmoqda",
      quote_like: "Yoqdi",
      quote_copy: "Nusxalash",
      quote_share: "Ulashish",
      quote_copied: "Buferga nusxalandi",
      schedule_title: "Dars jadvali",
      schedule_hide: "Jadvalni yashirish",
      schedule_show: "Kelgusi darslarni ko\u2018rsatish",
      schedule_checking: "Jonli sessiyalar tekshirilmoqda...",
      schedule_none: "Hozircha kelgusi sessiyalar yo\u2018q.",
      schedule_no_classes: "Rejalashtirilgan darslar yo\u2018q.",
      schedule_live: "JONLI EFIR",
      schedule_next: "Keyingi dars",
      schedule_join: "Jonli sessiyaga qo\u2018shilish",
      schedule_view: "Batafsil",
      schedule_teacher: "O\u2018qituvchi",
      schedule_time: "Vaqt",
      schedule_room: "Xona",
      special_title: "Maxsus",
      coding_title: "Dasturlash ko\u2018nikmalari",
      soft_title: "Muhim yumshoq ko\u2018nikmalar",
      card_fullstack: "Full-stack",
      card_fullstack_desc: "Statik dizaynlarni interaktiv raqamli tajribalarga aylantiring. React, zamonaviy CSS va ishlash optimizatsiyasini o\u2018rganing.",
      card_python: "Python",
      card_python_desc: "Oddiy sintaksisdan tashqariga chiqing. Kengaytiriladigan tizimlarni loyihalash, murakkab ish jarayonlarini avtomatlashtirish hamda Data Science va AI asoslarini o\u2018rganing.",
      card_java: "Java",
      card_java_desc: "Korporativ dasturiy ta\u2018minotning asosini yarating. Butun dunyoda qo\u2018llaniladigan OOP va mustahkam backend tuzilmalarini o\u2018zlashtiring.",
      card_cpp: "C++",
      card_cpp_desc: "Raqobatbardosh dasturlash va real dasturiy ta\u2018minot uchun C++ ni o\u2018rganing: algoritmlar, OOP, STL va samaradorlikka yo\u2018naltirilgan kodlash.",
      card_english: "Ingliz tili",
      card_english_desc: "Til to\u2018sig\u2018ini buzib o\u2018ting. Global imkoniyatlar uchun professional muloqot va texnik terminologiyaga e\u2018tibor qarating.",
      card_si: "O\u2018z-o\u2018zini rivojlantirish",
      card_si_desc: "Mental tizimingizni yangilang. Texnologiyada zarur bo\u2018lgan yuqori samarali odatlar va psixologik chidamlilikni rivojlantiring.",
      card_math: "Matematika",
      card_math_desc: "Funksiyalar, limitlar, hosilalar, integrallar va isbotlar bilan darajangizni oshiring \u2014 olimpiada fikrlashi va STEM muvaffaqiyati uchun.",
      card_view: "Klubni ko\u2018rish",
      footer_desc: "O\u2018zbekiston bo\u2018ylab talabalarni tengdosh o\u2018qituvchilar bilan bog\u2018laydigan \u2014 umumiy bilim, o\u2018sish va akademik mukammallik uchun jamoaviy platforma, 2026-yildan beri.",
      footer_contact: "Bog\u2018lanish",
      footer_support_label: "TALABA QOLLAB-QUVVATLASHI",
      footer_email_label: "ELEKTRON POCHTA",
      footer_telegram_label: "TELEGRAM",
      footer_support: "Qo\u2018llab-quvvatlash",
      footer_assistant: "Yordamchi",
      footer_dev1: "Dasturchi 1",
      footer_dev2: "Dasturchi 2",
      footer_copy: "Tengdosh Ustoz \u00b7 Barcha huquqlar himoyalangan.",
      contact_title: "Bog\u2018lanish",
      contact_desc: "Jamoaga xabar yuboring. Agar tizimga kirgan bo\u2018lsangiz, ismingiz, familiyangiz va guruhingiz avtomatik to\u2018ldiriladi.",
      contact_message_title: "Xabar",
      contact_anon: "Anonim yuborish",
      contact_name: "Ism",
      contact_name_ph: "Ismingiz",
      contact_surname: "Familiya",
      contact_surname_ph: "Familiyangiz",
      contact_group: "Guruh",
      contact_group_ph: "masalan, 1-A",
      contact_msg: "Xabar",
      contact_msg_ph: "Xabaringizni bu yerga yozing...",
      contact_send: "Xabar yuborish",
      contact_cooldown: "Kutish: tayyor",
      contact_rules: "Qoidalar",
      contact_rules_desc: "Spamni kamaytirish uchun har <strong>6\u20137 soat</strong>da faqat bitta xabar yuborishingiz mumkin. Agar ro\u2018yxatdan o\u2018tgan bo\u2018lsangiz, shaxsiy ma\u2018lumotlaringiz avtomatik to\u2018ldiriladi.",
      contact_rule1: "Kerak bo\u2018lsa anonim rejimdan foydalaning.",
      contact_rule2: "Video / rasm / hujjatlar uchun havolalarni joylashtiring.",
      contact_rule3: "Aniq bo\u2018ling (nima bo\u2018ldi, qayerda va qachon).",
      acc_dashboard: "O\u2018quv boshqaruv paneli",
      acc_dashboard_sub: "Obunalaringiz va faoliyatingiz bir qarashda.",
      acc_teachers_sub: "Obuna bo\u2018lgan o\u2018qituvchilar",
      acc_last_sub: "Oxirgi obuna",
      acc_active_subs: "Faol obunalar",
      acc_no_subs: "Hali obunalar yo\u2018q. O\u2018qituvchi sahifasiga o\u2018ting va Obuna bo\u2018lish tugmasini bosing.",
      acc_overview: "Umumiy ko\u2018rinish",
      acc_profile: "Profil",
      acc_settings: "Sozlamalar",
      acc_liked: "Yoqtirilganlar",
      acc_signout: "Chiqish",
      acc_profile_title: "Profil",
      acc_profile_sub: "Ko\u2018rsatiladigan ismingiz, telefon raqamingiz va universitet guruhingizni yangilang.",
      acc_display_name: "Ko\u2018rsatiladigan ism",
      acc_surname: "Familiya",
      acc_surname_opt: "(ixtiyoriy)",
      acc_phone: "Telefon raqam",
      acc_phone_req: "(majburiy)",
      acc_group: "Guruh",
      acc_group_req: "(majburiy)",
      acc_save: "O\u2018zgarishlarni saqlash",
      acc_settings_title: "Sozlamalar",
      acc_settings_sub: "Hisobingiz va obunalaringizni boshqaring.",
      acc_danger: "Xavfli zona",
      acc_danger_desc: "Bu amallar qaytarib bo\u2018lmaydi. Iltimos, ehtiyot bo\u2018ling.",
      acc_unsub_all: "Barcha o\u2018qituvchilardan obunani bekor qilish",
      acc_liked_title: "Yoqtirilgan iqtiboslar",
      acc_liked_sub: "Bosh sahifada yoqtirgan iqtiboslaringiz. Faqat sizga ko\u2018rinadi.",
      acc_your_likes: "Yoqtirilganlaringiz",
      tbd: "Aniqlanmagan"
    },
    ru: {
      nav_home: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f",
      nav_contact: "\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b",
      nav_account: "\u0410\u043a\u043a\u0430\u0443\u043d\u0442",
      hero_pill: "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c \u0432 Tengdosh Ustoz",
      hero_title: "\u041f\u0440\u043e\u0441\u0442\u0440\u0430\u043d\u0441\u0442\u0432\u043e \u0434\u043b\u044f \u0432\u0430\u0448\u0435\u0433\u043e<br>\u043e\u0431\u0440\u0430\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0433\u043e \u043f\u0443\u0442\u0438",
      hero_desc: "\u041e\u0442\u043a\u0440\u043e\u0439\u0442\u0435 \u0434\u043b\u044f \u0441\u0435\u0431\u044f \u043f\u0440\u043e\u0441\u0442\u0440\u0430\u043d\u0441\u0442\u0432\u043e \u0434\u043b\u044f \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f, \u0433\u0434\u0435 \u0437\u043d\u0430\u043d\u0438\u044f \u0440\u0430\u0441\u0442\u0443\u0442 \u0438 \u0432\u043d\u0438\u043c\u0430\u043d\u0438\u0435 \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u0435\u043d\u043d\u043e \u0432\u043e\u0441\u0441\u0442\u0430\u043d\u0430\u0432\u043b\u0438\u0432\u0430\u0435\u0442\u0441\u044f.",
      stat_users: "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438",
      stat_teachers: "\u041f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u0438",
      quote_pill: "\u0415\u0436\u0435\u0434\u043d\u0435\u0432\u043d\u043e\u0435 \u0432\u0434\u043e\u0445\u043d\u043e\u0432\u0435\u043d\u0438\u0435",
      quote_loading: "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0432\u0434\u043e\u0445\u043d\u043e\u0432\u0435\u043d\u0438\u044f",
      quote_like: "\u041d\u0440\u0430\u0432\u0438\u0442\u0441\u044f",
      quote_copy: "\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c",
      quote_share: "\u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f",
      quote_copied: "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e \u0432 \u0431\u0443\u0444\u0435\u0440",
      schedule_title: "\u0420\u0430\u0441\u043f\u0438\u0441\u0430\u043d\u0438\u0435",
      schedule_hide: "\u0421\u043a\u0440\u044b\u0442\u044c \u0440\u0430\u0441\u043f\u0438\u0441\u0430\u043d\u0438\u0435",
      schedule_show: "\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043f\u0440\u0435\u0434\u0441\u0442\u043e\u044f\u0449\u0438\u0435 \u0437\u0430\u043d\u044f\u0442\u0438\u044f",
      schedule_checking: "\u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u043e\u043d\u043b\u0430\u0439\u043d-\u0441\u0435\u0441\u0441\u0438\u0439...",
      schedule_none: "\u041d\u0430 \u0434\u0430\u043d\u043d\u044b\u0439 \u043c\u043e\u043c\u0435\u043d\u0442 \u043d\u0435\u0442 \u043f\u0440\u0435\u0434\u0441\u0442\u043e\u044f\u0449\u0438\u0445 \u0441\u0435\u0441\u0441\u0438\u0439.",
      schedule_no_classes: "\u0417\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0445 \u0437\u0430\u043d\u044f\u0442\u0438\u0439 \u043d\u0435\u0442.",
      schedule_live: "\u0412 \u042d\u0424\u0418\u0420\u0415",
      schedule_next: "\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0435\u0435 \u0437\u0430\u043d\u044f\u0442\u0438\u0435",
      schedule_join: "\u041f\u0440\u0438\u0441\u043e\u0435\u0434\u0438\u043d\u0438\u0442\u044c\u0441\u044f \u043a \u0441\u0435\u0441\u0441\u0438\u0438",
      schedule_view: "\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435",
      schedule_teacher: "\u041f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044c",
      schedule_time: "\u0412\u0440\u0435\u043c\u044f",
      schedule_room: "\u0410\u0443\u0434\u0438\u0442\u043e\u0440\u0438\u044f",
      special_title: "\u0421\u043f\u0435\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0435",
      coding_title: "\u041d\u0430\u0432\u044b\u043a\u0438 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f",
      soft_title: "\u0412\u0430\u0436\u043d\u044b\u0435 \u043c\u044f\u0433\u043a\u0438\u0435 \u043d\u0430\u0432\u044b\u043a\u0438",
      card_fullstack: "Full-stack",
      card_fullstack_desc: "\u041f\u0440\u0435\u0432\u0440\u0430\u0442\u0438\u0442\u0435 \u0441\u0442\u0430\u0442\u0438\u0447\u043d\u044b\u0435 \u0434\u0438\u0437\u0430\u0439\u043d\u044b \u0432 \u0438\u043d\u0442\u0435\u0440\u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u0446\u0438\u0444\u0440\u043e\u0432\u044b\u0435 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u044b. \u041e\u0441\u0432\u043e\u0439\u0442\u0435 React, \u0441\u043e\u0432\u0440\u0435\u043c\u0435\u043d\u043d\u044b\u0439 CSS \u0438 \u043e\u043f\u0442\u0438\u043c\u0438\u0437\u0430\u0446\u0438\u044e \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u0438.",
      card_python: "Python",
      card_python_desc: "\u0412\u044b\u0439\u0434\u0438\u0442\u0435 \u0437\u0430 \u0440\u0430\u043c\u043a\u0438 \u0431\u0430\u0437\u043e\u0432\u043e\u0433\u043e \u0441\u0438\u043d\u0442\u0430\u043a\u0441\u0438\u0441\u0430. \u041d\u0430\u0443\u0447\u0438\u0442\u0435\u0441\u044c \u043f\u0440\u043e\u0435\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043c\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u0443\u0435\u043c\u044b\u0435 \u0441\u0438\u0441\u0442\u0435\u043c\u044b \u0438 \u043f\u043e\u0433\u0440\u0443\u0437\u0438\u0442\u0435\u0441\u044c \u0432 Data Science \u0438 AI.",
      card_java: "Java",
      card_java_desc: "\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u043e\u0441\u043d\u043e\u0432\u0443 \u043a\u043e\u0440\u043f\u043e\u0440\u0430\u0442\u0438\u0432\u043d\u043e\u0433\u043e \u041f\u041e. \u041e\u0441\u0432\u043e\u0439\u0442\u0435 \u041e\u041e\u041f \u0438 \u043d\u0430\u0434\u0451\u0436\u043d\u044b\u0435 \u0441\u0435\u0440\u0432\u0435\u0440\u043d\u044b\u0435 \u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u044b, \u043f\u0440\u0438\u043c\u0435\u043d\u044f\u0435\u043c\u044b\u0435 \u043f\u043e \u0432\u0441\u0435\u043c\u0443 \u043c\u0438\u0440\u0443.",
      card_cpp: "C++",
      card_cpp_desc: "\u041e\u0441\u0432\u043e\u0439\u0442\u0435 C++ \u0434\u043b\u044f \u0441\u043e\u0440\u0435\u0432\u043d\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0433\u043e \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f: \u0430\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u044b, \u041e\u041e\u041f, STL \u0438 \u043e\u043f\u0442\u0438\u043c\u0438\u0437\u0430\u0446\u0438\u044f \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0441\u0442\u0438.",
      card_english: "\u0410\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u0438\u0439 \u044f\u0437\u044b\u043a",
      card_english_desc: "\u041f\u0440\u0435\u043e\u0434\u043e\u043b\u0435\u0439\u0442\u0435 \u044f\u0437\u044b\u043a\u043e\u0432\u043e\u0439 \u0431\u0430\u0440\u044c\u0435\u0440. \u041f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0435 \u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0438 \u0442\u0435\u0445\u043d\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0442\u0435\u0440\u043c\u0438\u043d\u043e\u043b\u043e\u0433\u0438\u044f \u0434\u043b\u044f \u0433\u043b\u043e\u0431\u0430\u043b\u044c\u043d\u044b\u0445 \u0432\u043e\u0437\u043c\u043e\u0436\u043d\u043e\u0441\u0442\u0435\u0439.",
      card_si: "\u0421\u0430\u043c\u043e\u0440\u0430\u0437\u0432\u0438\u0442\u0438\u0435",
      card_si_desc: "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u0435 \u0441\u0432\u043e\u0451 \u043c\u044b\u0448\u043b\u0435\u043d\u0438\u0435. \u0420\u0430\u0437\u0432\u0438\u0432\u0430\u0439\u0442\u0435 \u044d\u0444\u0444\u0435\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u043f\u0440\u0438\u0432\u044b\u0447\u043a\u0438 \u0438 \u043f\u0441\u0438\u0445\u043e\u043b\u043e\u0433\u0438\u0447\u0435\u0441\u043a\u0443\u044e \u0443\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u043e\u0441\u0442\u044c.",
      card_math: "\u041c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u043a\u0430",
      card_math_desc: "\u0424\u0443\u043d\u043a\u0446\u0438\u0438, \u043f\u0440\u0435\u0434\u0435\u043b\u044b, \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u043d\u044b\u0435, \u0438\u043d\u0442\u0435\u0433\u0440\u0430\u043b\u044b \u0438 \u0434\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044c\u0441\u0442\u0432\u0430 \u2014 \u0438\u0434\u0435\u0430\u043b\u044c\u043d\u043e \u0434\u043b\u044f \u043e\u043b\u0438\u043c\u043f\u0438\u0430\u0434\u043d\u043e\u0433\u043e \u043c\u044b\u0448\u043b\u0435\u043d\u0438\u044f \u0438 \u0443\u0441\u043f\u0435\u0445\u0430 \u0432 STEM.",
      card_view: "\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u0432 \u043a\u043b\u0443\u0431",
      footer_desc: "\u0421\u043e\u0435\u0434\u0438\u043d\u044f\u0435\u043c \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u043e\u0432 \u0441 \u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044f\u043c\u0438 \u043f\u043e \u0432\u0441\u0435\u043c\u0443 \u0423\u0437\u0431\u0435\u043a\u0438\u0441\u0442\u0430\u043d\u0443 \u2014 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430 \u0434\u043b\u044f \u043e\u0431\u043c\u0435\u043d\u0430 \u0437\u043d\u0430\u043d\u0438\u044f\u043c\u0438, \u0440\u043e\u0441\u0442\u0430 \u0438 \u0430\u043a\u0430\u0434\u0435\u043c\u0438\u0447\u0435\u0441\u043a\u043e\u0433\u043e \u043c\u0430\u0441\u0442\u0435\u0440\u0441\u0442\u0432\u0430 \u0441 2026 \u0433\u043e\u0434\u0430.",
      footer_contact: "\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b",
      footer_support_label: "\u041f\u041e\u0414\u0414\u0415\u0420\u0416\u041a\u0410 \u0421\u0422\u0423\u0414\u0415\u041d\u0422\u041e\u0412",
      footer_email_label: "\u042d\u041b. \u041f\u041e\u0427\u0422\u0410",
      footer_telegram_label: "\u0422\u0415\u041b\u0415\u0413\u0420\u0410\u041c",
      footer_support: "\u041f\u043e\u0434\u0434\u0435\u0440\u0436\u043a\u0430",
      footer_assistant: "\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043d\u0442",
      footer_dev1: "\u0420\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a 1",
      footer_dev2: "\u0420\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a 2",
      footer_copy: "Tengdosh Ustoz \u00b7 \u0412\u0441\u0435 \u043f\u0440\u0430\u0432\u0430 \u0437\u0430\u0449\u0438\u0449\u0435\u043d\u044b.",
      contact_title: "\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b",
      contact_desc: "\u041e\u0442\u043f\u0440\u0430\u0432\u044c\u0442\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u043a\u043e\u043c\u0430\u043d\u0434\u0435. \u0415\u0441\u043b\u0438 \u0432\u044b \u0432\u043e\u0448\u043b\u0438 \u0432 \u0441\u0438\u0441\u0442\u0435\u043c\u0443, \u0438\u043c\u044f, \u0444\u0430\u043c\u0438\u043b\u0438\u044f \u0438 \u0433\u0440\u0443\u043f\u043f\u0430 \u0437\u0430\u043f\u043e\u043b\u043d\u044f\u0442\u0441\u044f \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438.",
      contact_message_title: "\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435",
      contact_anon: "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0430\u043d\u043e\u043d\u0438\u043c\u043d\u043e",
      contact_name: "\u0418\u043c\u044f",
      contact_name_ph: "\u0412\u0430\u0448\u0435 \u0438\u043c\u044f",
      contact_surname: "\u0424\u0430\u043c\u0438\u043b\u0438\u044f",
      contact_surname_ph: "\u0412\u0430\u0448\u0430 \u0444\u0430\u043c\u0438\u043b\u0438\u044f",
      contact_group: "\u0413\u0440\u0443\u043f\u043f\u0430",
      contact_group_ph: "\u043d\u0430\u043f\u0440. 1-A",
      contact_msg: "\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435",
      contact_msg_ph: "\u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0432\u0430\u0448\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0437\u0434\u0435\u0441\u044c...",
      contact_send: "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435",
      contact_cooldown: "\u041e\u0436\u0438\u0434\u0430\u043d\u0438\u0435: \u0433\u043e\u0442\u043e\u0432\u043e",
      contact_rules: "\u041f\u0440\u0430\u0432\u0438\u043b\u0430",
      contact_rules_desc: "\u0414\u043b\u044f \u0437\u0430\u0449\u0438\u0442\u044b \u043e\u0442 \u0441\u043f\u0430\u043c\u0430, \u0432\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u044f\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0442\u043e\u043b\u044c\u043a\u043e \u0440\u0430\u0437 \u0432 <strong>6\u20137 \u0447\u0430\u0441\u043e\u0432</strong>. \u0415\u0441\u043b\u0438 \u0432\u044b \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u044b, \u043f\u043e\u043b\u044f \u0437\u0430\u043f\u043e\u043b\u043d\u044f\u044e\u0442\u0441\u044f \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438.",
      contact_rule1: "\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 \u0430\u043d\u043e\u043d\u0438\u043c\u043d\u044b\u0439 \u0440\u0435\u0436\u0438\u043c \u043f\u0440\u0438 \u043d\u0435\u043e\u0431\u0445\u043e\u0434\u0438\u043c\u043e\u0441\u0442\u0438.",
      contact_rule2: "\u0412\u0441\u0442\u0430\u0432\u043b\u044f\u0439\u0442\u0435 \u0441\u0441\u044b\u043b\u043a\u0438 \u043d\u0430 \u0432\u0438\u0434\u0435\u043e / \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f / \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b.",
      contact_rule3: "\u0411\u0443\u0434\u044c\u0442\u0435 \u043a\u043e\u043d\u043a\u0440\u0435\u0442\u043d\u044b (\u0447\u0442\u043e \u043f\u0440\u043e\u0438\u0437\u043e\u0448\u043b\u043e, \u0433\u0434\u0435 \u0438 \u043a\u043e\u0433\u0434\u0430).",
      acc_dashboard: "\u041f\u0430\u043d\u0435\u043b\u044c \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u044f",
      acc_dashboard_sub: "\u0412\u0430\u0448\u0438 \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0438 \u0438 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c \u043e\u0434\u043d\u0438\u043c \u0432\u0437\u0433\u043b\u044f\u0434\u043e\u043c.",
      acc_teachers_sub: "\u041f\u043e\u0434\u043f\u0438\u0441\u043a\u0438 \u043d\u0430 \u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u0435\u0439",
      acc_last_sub: "\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u044f\u044f \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0430",
      acc_active_subs: "\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0438",
      acc_no_subs: "\u041f\u043e\u0434\u043f\u0438\u0441\u043e\u043a \u043f\u043e\u043a\u0430 \u043d\u0435\u0442. \u041f\u0435\u0440\u0435\u0439\u0434\u0438\u0442\u0435 \u043d\u0430 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443 \u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044f \u0438 \u043d\u0430\u0436\u043c\u0438\u0442\u0435 \u041f\u043e\u0434\u043f\u0438\u0441\u0430\u0442\u044c\u0441\u044f.",
      acc_overview: "\u041e\u0431\u0437\u043e\u0440",
      acc_profile: "\u041f\u0440\u043e\u0444\u0438\u043b\u044c",
      acc_settings: "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438",
      acc_liked: "\u041f\u043e\u043d\u0440\u0430\u0432\u0438\u0432\u0448\u0438\u0435\u0441\u044f",
      acc_signout: "\u0412\u044b\u0439\u0442\u0438",
      acc_profile_title: "\u041f\u0440\u043e\u0444\u0438\u043b\u044c",
      acc_profile_sub: "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u0435 \u0438\u043c\u044f, \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430 \u0438 \u0433\u0440\u0443\u043f\u043f\u0443 \u0443\u043d\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442\u0430.",
      acc_display_name: "\u041e\u0442\u043e\u0431\u0440\u0430\u0436\u0430\u0435\u043c\u043e\u0435 \u0438\u043c\u044f",
      acc_surname: "\u0424\u0430\u043c\u0438\u043b\u0438\u044f",
      acc_surname_opt: "(\u043d\u0435\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e)",
      acc_phone: "\u041d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430",
      acc_phone_req: "(\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e)",
      acc_group: "\u0413\u0440\u0443\u043f\u043f\u0430",
      acc_group_req: "(\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e)",
      acc_save: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f",
      acc_settings_title: "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438",
      acc_settings_sub: "\u0423\u043f\u0440\u0430\u0432\u043b\u044f\u0439\u0442\u0435 \u0441\u0432\u043e\u0438\u043c \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u043e\u043c \u0438 \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0430\u043c\u0438.",
      acc_danger: "\u041e\u043f\u0430\u0441\u043d\u0430\u044f \u0437\u043e\u043d\u0430",
      acc_danger_desc: "\u042d\u0442\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043d\u0435\u043e\u0431\u0440\u0430\u0442\u0438\u043c\u044b. \u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0431\u0443\u0434\u044c\u0442\u0435 \u043e\u0441\u0442\u043e\u0440\u043e\u0436\u043d\u044b.",
      acc_unsub_all: "\u041e\u0442\u043f\u0438\u0441\u0430\u0442\u044c\u0441\u044f \u043e\u0442 \u0432\u0441\u0435\u0445 \u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u0435\u0439",
      acc_liked_title: "\u041f\u043e\u043d\u0440\u0430\u0432\u0438\u0432\u0448\u0438\u0435\u0441\u044f \u0446\u0438\u0442\u0430\u0442\u044b",
      acc_liked_sub: "\u0426\u0438\u0442\u0430\u0442\u044b, \u043a\u043e\u0442\u043e\u0440\u044b\u0435 \u0432\u044b \u043e\u0442\u043c\u0435\u0442\u0438\u043b\u0438 \u043d\u0430 \u0413\u043b\u0430\u0432\u043d\u043e\u0439. \u0412\u0438\u0434\u043d\u044b \u0442\u043e\u043b\u044c\u043a\u043e \u0432\u0430\u043c.",
      acc_your_likes: "\u0412\u0430\u0448\u0438 \u043e\u0442\u043c\u0435\u0442\u043a\u0438",
      tbd: "\u041d\u0435 \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u043e"
    }
  };

  function getLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (_) {}
    return DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    applyTranslations(lang);
    document.documentElement.setAttribute("lang", lang);
    document.dispatchEvent(new CustomEvent("tu-lang-changed", { detail: { lang } }));
  }

  function t(key, lang) {
    const l = lang || getLang();
    return (T[l] && T[l][key]) || T.en[key] || key;
  }

  function applyTranslations(lang) {
    const l = lang || getLang();
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = t(key, l);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        if (el.hasAttribute("placeholder")) el.placeholder = val;
        else el.value = val;
      } else {
        if (val.includes("<br>") || val.includes("<strong>")) {
          el.innerHTML = val;
        } else {
          el.textContent = val;
        }
      }
    });

    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-ph"), l);
    });

    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.title = t(el.getAttribute("data-i18n-title"), l);
    });
  }

  function createSwitcher() {
    var current = getLang();
    var wrap = document.createElement("div");
    wrap.className = "lang-switcher";
    wrap.setAttribute("role", "radiogroup");
    wrap.setAttribute("aria-label", "Language");

    SUPPORTED.forEach(function (code) {
      var label = code === "en" ? "EN" : code === "uz" ? "UZ" : "RU";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-btn" + (code === current ? " active" : "");
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(code === current));
      btn.setAttribute("data-lang", code);
      btn.textContent = label;
      btn.addEventListener("click", function () {
        setLang(code);
        wrap.querySelectorAll(".lang-btn").forEach(function (b) {
          var isActive = b.getAttribute("data-lang") === code;
          b.classList.toggle("active", isActive);
          b.setAttribute("aria-checked", String(isActive));
        });
      });
      wrap.appendChild(btn);
    });

    return wrap;
  }

  function injectSwitcher() {
    var target = document.querySelector(".navbar-right");
    if (!target) return;
    var existing = target.querySelector(".lang-switcher");
    if (existing) return;
    var switcher = createSwitcher();
    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      target.insertBefore(switcher, themeBtn);
    } else {
      target.insertBefore(switcher, target.firstChild);
    }
  }

  function init() {
    var lang = getLang();
    document.documentElement.setAttribute("lang", lang);
    injectSwitcher();
    applyTranslations(lang);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.TU_i18n = { t: t, getLang: getLang, setLang: setLang, applyTranslations: applyTranslations, injectSwitcher: injectSwitcher };
})();
