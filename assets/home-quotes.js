(function () {
  "use strict";

  const multiQuotes = [
    {
        en: "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
        uz: "Kelajak o'z orzularining go'zalligiga ishonadiganlarga tegishli. - Eleanor Ruzvelt",
        ru: "Будущее принадлежит тем, кто верит в красоту своей мечты. - Элеонора Рузвельт"
    },
    {
        en: "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
        uz: "Muvaffaqiyat - bu kundan kunga takrorlanadigan kichik harakatlar yig'indisidir. - Robert Kolliyer",
        ru: "Успех — это сумма небольших усилий, повторяющихся изо дня в день. - Роберт Кольер"
    },
    {
        en: "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
        uz: "Soatga qaramang; u nima qilsa, shuni qiling. Harakatda davom eting. - Sem Levenson",
        ru: "Не смотрите на часы; делайте то же, что и они. Идите вперед. - Сэм Левенсон"
    },
    {
        en: "The only way to do great work is to love what you do. - Steve Jobs",
        uz: "Buyuk ishlarni qilishning yagona yo'li - o'z ishingizni sevishdir. - Stiv Jobs",
        ru: "Единственный способ делать великие дела — любить то, что вы делаете. - Стив Джобс"
    },
    {
        en: "Study hard, for the well is deep, and our brains are shallow. - Richard Baxter",
        uz: "Qattiq o'qing, chunki quduq chuqur, bizning miyamiz esa sayoz. - Richard Bakster",
        ru: "Усердно учитесь, ибо колодец глубок, а наши умы мелки. - Ричард Бакстер"
    },
    {
        en: "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
        uz: "Ta'lim - bu dunyoni o'zgartirish uchun ishlatishingiz mumkin bo'lgan eng kuchli quroldir. - Nelson Mandela",
        ru: "Образование — это самое мощное оружие, которое вы можете использовать, чтобы изменить мир. - Нельсон Мандела"
    },
    {
        en: "The beautiful thing about learning is that no one can take it away from you. - B.B. King",
        uz: "O'rganishning eng go'zal tomoni shundaki, uni sizdan hech kim tortib ololmaydi. - B.B. King",
        ru: "Самое прекрасное в обучении то, что никто не может его у вас отнять. - Би Би Кинг"
    },
    {
        en: "The roots of education are bitter, but the fruit is sweet. - Aristotle",
        uz: "Ta'limning ildizlari achchiq, ammo mevasi shirin. - Aristotel",
        ru: "Корни образования горьки, но плоды сладки. - Аристотель"
    },
    {
        en: "An investment in knowledge pays the best interest. - Benjamin Franklin",
        uz: "Bilimga qilingan sarmoya eng yaxshi foyda keltiradi. - Benjamin Franklin",
        ru: "Инвестиции в знания приносят самые высокие дивиденды. - Бенджамин Франклин"
    },
    {
        en: "What we learn with pleasure we never forget. - Alfred Mercier",
        uz: "Mamnuniyat bilan o'rgangan narsalarimizni hech qachon unutmaymiz. - Alfred Mersye",
        ru: "То, что мы изучаем с удовольствием, мы никогда не забываем. - Альфред Мерсье"
    },
    {
        en: "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
        uz: "Ertangi kunni anglashimizning yagona chegarasi - bu bugungi shubhalarimizdir. - Franklin D. Ruzvelt",
        ru: "Единственным пределом наших завтрашних свершений станут наши сегодняшние сомнения. - Франклин Д. Рузвельт"
    },
    {
        en: "The best way to predict the future is to create it. - Peter Drucker",
        uz: "Kelajakni bashorat qilishning eng yaxshi usuli uni yaratishdir. - Piter Druker",
        ru: "Лучший способ предсказать будущее — создать его. - Питер Друкер"
    },
    {
        en: "You are never too old to set another goal or to dream a new dream. - C.S. Lewis",
        uz: "Yangi maqsad qo'yish yoki yangi orzu qilish uchun hech qachon qari emassiz. - C.S. Lyuis",
        ru: "Вы никогда не слишком стары, чтобы поставить перед собой новую цель или мечтать о новом. - К.С. Льюис"
    },
    {
        en: "It does not matter how slowly you go as long as you do not stop. - Confucius",
        uz: "To'xtab qolmasangiz bo'ldi, qanchalik sekin yurishingiz muhim emas. - Konfutsiy",
        ru: "Неважно, насколько медленно вы идете, главное — не останавливаться. - Конфуций"
    },
    {
        en: "Your education is a dress rehearsal for a life that is yours to lead. - Nora Ephron",
        uz: "Sizning ta'limingiz – o'zingiz boshqaradigan hayot uchun bosh repetitsiyadir. - Nora Efron",
        ru: "Ваше образование — это генеральная репетиция жизни, которую вам предстоит прожить. - Нора Эфрон"
    },
    {
        en: "The mind is not a vessel to be filled, but a fire to be kindled. - Plutarch",
        uz: "Aql to'ldirilishi kerak bo'lgan idish emas, balki yoqilishi kerak bo'lgan olovdir. - Plutarx",
        ru: "Ум — это не сосуд, который нужно наполнить, а огонь, который нужно зажечь. - Плутарх"
    },
    {
        en: "Learning is a treasure that will follow its owner everywhere. - Chinese Proverb",
        uz: "Ilm shunday xazinadirki, o'z egasiga har joyda hamroh bo'ladi. - Xitoy maqoli",
        ru: "Обучение — это сокровище, которое повсюду следует за своим владельцем. - Китайская пословица"
    },
    {
        en: "The journey of a thousand miles begins with one step. - Lao Tzu",
        uz: "Ming chaqirimlik yo'l ham bir qadamdan boshlanadi. - Lao Szi",
        ru: "Путешествие в тысячу миль начинается с одного шага. - Лао-Цзы"
    },
    {
        en: "In learning, you will teach, and in teaching, you will learn. - Phil Collins",
        uz: "O'rganish orqali siz o'rgatasiz, o'rgatish orqali esa o'rganasiz. - Fil Kollinz",
        ru: "Обучаясь, вы будете учить, а обучая, вы будете учиться. - Фил Коллинз"
    },
    {
        en: "Tell me and I forget. Teach me and I remember. Involve me and I learn. - Benjamin Franklin",
        uz: "Aytib bersang, unutaman. O'rgatsang, eslab qolaman. Jalb qilsang, o'rganaman. - Benjamin Franklin",
        ru: "Скажи мне — и я забуду. Учи меня — и я запомню. Вовлеки меня — и я выучу. - Бенджамин Франклин"
    },
    {
        en: "The only thing worse than being blind is having sight but no vision. - Helen Keller",
        uz: "Ko'r bo'lishdan ham yomonroq narsa – ko'ra turib, istiqbolni ko'ra olmaslikdir. - Xelen Keller",
        ru: "Единственное, что хуже слепоты, — это иметь зрение, но не иметь видения. - Хелен Келлер"
    },
    {
        en: "Life is 10% what happens to us and 90% how we react to it. - Charles R. Swindoll",
        uz: "Hayotimizning 10% i nima sodir bo'lishidan, 90% i esa unga qanday munosabat bildirishimizdan iborat. - Charlz R. Svindoll",
        ru: "Жизнь на 10% состоит из того, что с нами происходит, и на 90% из того, как мы на это реагируем. - Чарльз Р. Свиндолл"
    },
    {
        en: "The only way to achieve the impossible is to believe it is possible. - Charles Kingsleigh",
        uz: "Imkonsiz narsaga erishishning yagona yo'li uning mumkinligiga ishonishdir. - Charlz Kingsli",
        ru: "Единственный способ достичь невозможного — поверить, что это возможно. - Чарльз Кингсли"
    },
    {
        en: "You miss 100% of the shots you don't take. - Wayne Gretzky",
        uz: "Otmagan zarbaringizning 100 foizi nishonga tegmaydi. - Ueyn Gretski",
        ru: "Вы промахиваетесь в 100% случаев, когда не бросаете. - Уэйн Гретцки"
    },
    {
        en: "Believe you can and you're halfway there. - Theodore Roosevelt",
        uz: "Qo'limdan keladi deb ishoning va siz yo'lning yarmini bosib o'tdingiz. - Teodor Ruzvelt",
        ru: "Поверьте, что сможете, и вы уже на полпути. - Теодор Рузвельт"
    },
    {
        en: "Act as if what you do makes a difference. It does. - William James",
        uz: "Sizning xatti-harakatingiz ahamiyatga egadek harakat qiling. Haqiqatan ham shunday. - Uilyam Jeyms",
        ru: "Действуйте так, как будто то, что вы делаете, имеет значение. Так оно и есть. - Уильям Джеймс"
    },
    {
        en: "Success is not how high you have climbed, but how you make a positive difference to the world. - Roy T. Bennett",
        uz: "Muvaffaqiyat qanchalik balandga ko'tarilganingiz emas, balki dunyoga qanday ijobiy o'zgarish kiritganingiz bilan o'lchanadi. - Roy T. Bennet",
        ru: "Успех — это не то, как высоко вы поднялись, а то, как вы позитивно влияете на мир. - Рой Т. Беннетт"
    },
    {
        en: "What lies behind us and what lies before us are tiny matters compared to what lies within us. - Ralph Waldo Emerson",
        uz: "Bizning ortimizda va oldimizda turgan narsalar bizning ichimizdagi narsalarga qaraganda juda kichikdir. - Ralf Uoldo Emerson",
        ru: "То, что позади нас, и то, что впереди нас, — мелочи по сравнению с тем, что внутри нас. - Ральф Уолдо Эмерсон"
    },
    {
        en: "The best revenge is massive success. - Frank Sinatra",
        uz: "Eng yaxshi qasos bu - ulkan muvaffaqiyatdir. - Frenk Sinatra",
        ru: "Лучшая месть — это огромный успех. - Фрэнк Синатра"
    },
    {
        en: "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
        uz: "Vaqtingiz chegaralangan, uni birovning hayotini yashashga sarflamang. - Stiv Jobs",
        ru: "Ваше время ограничено, не тратьте его, живя чужой жизнью. - Стив Джобс"
    },
    {
        en: "The only person you are destined to become is the person you decide to be. - Ralph Waldo Emerson",
        uz: "Taqdiringizda bitilgan yagona inson bu – siz o'zingiz bo'lishga qaror qilgan insondir. - Ralf Uoldo Emerson",
        ru: "Единственный человек, которым вам суждено стать, — это человек, которым вы решите быть. - Ральф Уолдо Эмерсон"
    },
    {
        en: "Education is not preparation for life; education is life itself. - John Dewey",
        uz: "Ta'lim hayotga tayyorgarlik emas; ta'limning o'zi hayotdir. - Jon Dyui",
        ru: "Образование — это не подготовка к жизни; образование — это сама жизнь. - Джон Дьюи"
    },
    {
        en: "Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi",
        uz: "Ertaga o'ladigandek yashang. Mangu yashaydigan kishidek o'rganing. - Mahatma Gandi",
        ru: "Живи так, будто завтра умрешь. Учись так, будто будешь жить вечно. - Махатма Ганди"
    },
    {
        en: "The more that you read, the more things you will know. - Dr. Seuss",
        uz: "Qancha ko'p o'qisangiz, shuncha ko'p narsalarni bilib olasiz. - Doktor Syuz",
        ru: "Чем больше вы читаете, тем больше вещей вы узнаете. - Доктор Сьюз"
    },
    {
        en: "Reading is to the mind what exercise is to the body. - Joseph Addison",
        uz: "Jismoniy mashqlar tana uchun qanday bo'lsa, o'qish ham aql uchun shundaydir. - Jozef Addison",
        ru: "Чтение для ума — то же, что упражнения для тела. - Джозеф Аддисон"
    },
    {
        en: "Learning never exhausts the mind. - Leonardo da Vinci",
        uz: "O'rganish hech qachon aqlni charchatmaydi. - Leonardo da Vinchi",
        ru: "Обучение никогда не истощает ум. - Леонардо да Винчи"
    },
    {
        en: "Change is the end result of all true learning. - Leo Buscaglia",
        uz: "O'zgarish haqiqiy o'rganishning yakuniy natijasidir. - Leo Buskalyo",
        ru: "Изменения — это конечный результат любого истинного обучения. - Лео Бускалья"
    },
    {
        en: "Develop a passion for learning. If you do, you will never cease to grow. - Anthony J. D'Angelo",
        uz: "O'rganishga ishtiyoq paydo qiling. Shunday qilsangiz, o'sishdan hech qachon to'xtamaysiz. - Entoni J. D'Anjelo",
        ru: "Развивайте страсть к обучению. Если вы это сделаете, вы никогда не перестанете расти. - Энтони Дж. Д'Анджело"
    },
    {
        en: "Intelligence plus character—that is the goal of true education. - Martin Luther King Jr.",
        uz: "Aql va xarakter - chinakam ta'limning maqsadi shudir. - Martin Lyuter King Jr.",
        ru: "Интеллект плюс характер — вот цель истинного образования. - Мартин Лютер Кинг-младший"
    },
    {
        en: "Education is not the filling of a pail, but the lighting of a fire. - W.B. Yeats",
        uz: "Ta'lim chelakni to'ldirish emas, balki olovni yoqishdir. - V.B. Yeyts",
        ru: "Образование — это не наполнение ведра, а зажжение огня. - Уильям Батлер Йейтс"
    },
    {
        en: "The beautiful thing about learning is nobody can take it away from you. - B.B. King",
        uz: "O'rganishning go'zalligi shundaki, uni hech kim sizdan tortib ololmaydi. - B.B. King",
        ru: "Прелесть обучения в том, что никто не сможет отнять его у вас. - Би Би Кинг"
    },
    {
        en: "Knowledge is power. - Francis Bacon",
        uz: "Bilim - bu kuch. - Frensis Bekon",
        ru: "Знание — сила. - Фрэнсис Бэкон"
    },
    {
        en: "An investment in knowledge pays the best interest. - Benjamin Franklin",
        uz: "Bilimga qilingan sarmoya eng yaxshi foyda keltiradi. - Benjamin Franklin",
        ru: "Инвестиции в знания приносят лучшие проценты. - Бенджамин Франклин"
    },
    {
        en: "Tell me and I forget. Teach me and I remember. Involve me and I learn. - Benjamin Franklin",
        uz: "Aytib bersang, unutaman. O'rgatsang, eslab qolaman. Jalb qilsang, o'rganaman. - Benjamin Franklin",
        ru: "Скажи мне, и я забуду. Научи меня, и я запомню. Вовлеки меня, и я научусь. - Бенджамин Франклин"
    },
    {
        en: "Learning is not attained by chance; it must be sought for with ardor and attended to with diligence. - Abigail Adams",
        uz: "Ilm tasodifan olinmaydi; uni ishtiyoq bilan izlash va qunt bilan egallash kerak. - Abigeyl Adams",
        ru: "Обучение не достигается случайно; его нужно искать с пылом и относиться к нему с усердием. - Эбигейл Адамс"
    },
    {
        en: "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
        uz: "Muvaffaqiyat - bu har kuni takrorlanadigan kichik harakatlar yig'indisidir. - Robert Kolliyer",
        ru: "Успех — это сумма небольших усилий, повторяющихся изо дня в день. - Роберт Кольер"
    },
    {
        en: "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
        uz: "Soatga qaramang; u nima qilsa, shuni qiling. Harakatda davom eting. - Sem Levenson",
        ru: "Не смотрите на часы; делайте то же, что и они. Идите вперед. - Сэм Левенсон"
    },
    {
        en: "It does not matter how slowly you go as long as you do not stop. - Confucius",
        uz: "To'xtab qolmasangiz bo'ldi, qanchalik sekin yurishingiz muhim emas. - Konfutsiy",
        ru: "Неважно, насколько медленно вы идете, главное — не останавливаться. - Конфуций"
    },
    {
        en: "Perseverance is not a long race; it is many short races one after the other. - Walter Elliot",
        uz: "Qat'iyat uzoq yugurish emas; bu birin-ketin keladigan ko'plab qisqa poygalardir. - Uolter Elliot",
        ru: "Настойчивость — это не долгая гонка; это много коротких гонок одна за другой. - Уолтер Эллиот"
    },
    {
        en: "Little by little, one travels far. - J.R.R. Tolkien",
        uz: "Kichik qadamlar bilan uzoq manzilga yetish mumkin. - J.R.R. Tolkin",
        ru: "Мало-помалу человек путешествует далеко. - Дж.Р.Р. Толкин"
    },
    {
        en: "A journey of a thousand miles begins with a single step. - Lao Tzu",
        uz: "Ming chaqirimlik yo'l bitta qadamdan boshlanadi. - Lao Szi",
        ru: "Путешествие в тысячу миль начинается с одного шага. - Лао-Цзы"
    },
    {
        en: "Do what you can, with what you have, where you are. - Theodore Roosevelt",
        uz: "Qo'lingizdan kelganini, o'zingizda bor narsa bilan va turgan joyingizda qiling. - Teodor Ruzvelt",
        ru: "Делайте то, что можете, с тем, что у вас есть, там, где вы находитесь. - Теодор Рузвельт"
    },
    {
        en: "Believe you can and you're halfway there. - Theodore Roosevelt",
        uz: "Qodirligingizga ishoning va siz manzilning yarmidasiz. - Teodor Ruzvelt",
        ru: "Поверьте, что сможете, и вы на полпути к цели. - Теодор Рузвельт"
    },
    {
        en: "Act as if what you do makes a difference. It does. - William James",
        uz: "Qilayotgan ishingiz ahamiyatga egadek harakat qiling. Chindan ham shunday. - Uilyam Jeyms",
        ru: "Действуйте так, как будто то, что вы делаете, имеет значение. Так оно и есть. - Уильям Джеймс"
    },
    {
        en: "The harder you work for something, the greater you'll feel when you achieve it. - Unknown",
        uz: "Biror narsa uchun qanchalik qattiq ishlaganingiz sari, unga erishganda o'zingizni shunchalik ajoyib his qilasiz. - Noma'lum",
        ru: "Чем усерднее вы над чем-то работаете, тем лучше вы будете себя чувствовать, когда достигнете этого. - Неизвестный"
    },
    {
        en: "Dream bigger. Do bigger. - Unknown",
        uz: "Kattaroq orzu qiling. Kattaroq ishlarni qiling. - Noma'lum",
        ru: "Мечтай по-крупному. Делай больше. - Неизвестный"
    },
    {
        en: "Don't stop until you're proud. - Unknown",
        uz: "O'zingizdan faxrlanmaguningizcha to'xtamang. - Noma'lum",
        ru: "Не останавливайтесь, пока не будете гордиться собой. - Неизвестный"
    },
    {
        en: "Your only limit is your mind. - Unknown",
        uz: "Yagona chegarangiz bu sizning aqlingiz. - Noma'lum",
        ru: "Ваш единственный предел — ваш разум. - Неизвестный"
    },
    {
        en: "Push yourself, because no one else is going to do it for you. - Unknown",
        uz: "O'zingizni oldinga unding, chunki buni siz uchun hech kim qilib bermaydi. - Noma'lum",
        ru: "Заставляйте себя, потому что никто другой не сделает это за вас. - Неизвестный"
    },
    {
        en: "Great things never come from comfort zones. - Unknown",
        uz: "Buyuk narsalar hech qachon qulaylik hududidan chiqmaydi. - Noma'lum",
        ru: "Великие дела никогда не рождаются в зоне комфорта. - Неизвестный"
    },
    {
        en: "Success doesn't just find you. You have to go out and get it. - Unknown",
        uz: "Muvaffaqiyat o'z-o'zidan sizni topmaydi. Borib, uni o'zingiz olishingiz kerak. - Noma'lum",
        ru: "Успех не приходит сам. Вы должны пойти и взять его. - Неизвестный"
    },
    {
        en: "The key to success is to focus on goals, not obstacles. - Unknown",
        uz: "Muvaffaqiyat kaliti - to'siqlarga emas, balki maqsadlarga diqqatni qaratishdir. - Noma'lum",
        ru: "Ключ к успеху — сосредоточиться на целях, а не на препятствиях. - Неизвестный"
    },
    {
        en: "Dream it. Wish it. Do it. - Unknown",
        uz: "Orzu qiling. Xohlang. Bajarib ko'rsating. - Noma'lum",
        ru: "Мечтайте. Желайте. Делайте. - Неизвестный"
    },
    {
        en: "Stay positive, work hard, make it happen. - Unknown",
        uz: "Ijobiy bo'ling, qattiq ishlang, amalga oshiring. - Noma'lum",
        ru: "Оставайтесь на позитиве, усердно работайте, воплощайте в жизнь. - Неизвестный"
    },
    {
        en: "Your time is limited, so don't waste it living someone else's life. - Steve Jobs",
        uz: "Vaqtingiz cheklangan, shuning uchun uni birovning hayotiga sarflamang. - Stiv Jobs",
        ru: "Ваше время ограничено, поэтому не тратьте его, живя чужой жизнью. - Стив Джобс"
    },
    {
        en: "Innovation distinguishes between a leader and a follower. - Steve Jobs",
        uz: "Innovatsiya - yetakchi va izdoshni ajratib turadigan narsadir. - Stiv Jobs",
        ru: "Инновации отличают лидера от последователя. - Стив Джобс"
    },
    {
        en: "Sometimes life hits you in the head with a brick. Don't lose faith. - Steve Jobs",
        uz: "Ba'zida hayot boshingizga g'isht bilan uradi. Umidingizni yo'qotmang. - Stiv Jobs",
        ru: "Иногда жизнь бьет вас кирпичом по голове. Не теряйте веры. - Стив Джобс"
    },
    {
        en: "Everything you can imagine is real. - Pablo Picasso",
        uz: "Siz tasavvur qila oladigan hamma narsa haqiqiydir. - Pablo Pikasso",
        ru: "Всё, что вы можете себе представить, реально. - Пабло Пикассо"
    },
    {
        en: "Done is better than perfect. - Sheryl Sandberg",
        uz: "Bajarilgan ish mukammalidan afzaldir. - Sheril Sandberg",
        ru: "Сделанное лучше идеального. - Шерил Сэндберг"
    },
    {
        en: "If you're going through hell, keep going. - Winston Churchill",
        uz: "Agar jahannamdan o'tayotgan bo'lsangiz ham, harakatdan to'xtamang. - Uinston Cherchill",
        ru: "Если вы идете через ад, продолжайте идти. - Уинстон Черчилль"
    },
    {
        en: "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
        uz: "Muvaffaqiyat yakuniy emas, mag'lubiyat esa halokatli emas: davom etishga bo'lgan jasorat eng muhimdir. - Uinston Cherchill",
        ru: "Успех не окончателен, неудачи не фатальны: значение имеет лишь мужество продолжать. - Уинстон Черчилль"
    },
    {
        en: "Attitude is a little thing that makes a big difference. - Winston Churchill",
        uz: "Munosabat kichik narsa, lekin u katta farq qiladi. - Uinston Cherchill",
        ru: "Отношение — это мелочь, которая имеет большое значение. - Уинстон Черчилль"
    },
    {
        en: "What you get by achieving your goals is not as important as what you become by achieving your goals. - Zig Ziglar",
        uz: "Maqsadlaringizga erishish orqali oladigan narsangiz, maqsadlarga erishish orqali qanday insonga aylanishingizdek muhim emas. - Zig Ziglar",
        ru: "То, что вы получаете, достигая своих целей, не так важно, как то, кем вы становитесь, достигая их. - Зиг Зиглар"
    },
    {
        en: "You don't have to be great to start, but you have to start to be great. - Zig Ziglar",
        uz: "Boshlash uchun buyuk bo'lishingiz shart emas, lekin buyuk bo'lish uchun boshlashingiz kerak. - Zig Ziglar",
        ru: "Вам не нужно быть великим, чтобы начать, но вы должны начать, чтобы быть великим. - Зиг Зиглар"
    },
    {
        en: "People often say that motivation doesn't last. Well, neither does bathing—that's why we recommend it daily. - Zig Ziglar",
        uz: "Odamlar ko'pincha motivatsiya uzoqqa bormaydi deyishadi. Cho'milish ham xuddi shunday - shuning uchun uni har kuni tavsiya qilamiz. - Zig Ziglar",
        ru: "Люди часто говорят, что мотивация не длится долго. Ну, как и купание — вот почему мы рекомендуем делать это ежедневно. - Зиг Зиглар"
    },
    {
        en: "Either you run the day or the day runs you. - Jim Rohn",
        uz: "Yoki siz kuningizni boshqarasiz, yoki kun sizni boshqaradi. - Jim Ron",
        ru: "Либо вы управляете днем, либо день управляет вами. - Джим Рон"
    },
    {
        en: "Discipline is the bridge between goals and accomplishment. - Jim Rohn",
        uz: "Intizom - maqsadlar va ularga erishish orasidagi ko'prikdir. - Jim Ron",
        ru: "Дисциплина — это мост между целями и достижениями. - Джим Рон"
    },
    {
        en: "Motivation is what gets you started. Habit is what keeps you going. - Jim Ryun",
        uz: "Motivatsiya sizni boshlashga undaydi. Odat esa davom etishingizni ta'minlaydi. - Jim Rayun",
        ru: "Мотивация — это то, что заставляет вас начать. Привычка — это то, что заставляет вас продолжать. - Джим Райан"
    },
    {
        en: "Champions keep playing until they get it right. - Billie Jean King",
        uz: "Chempionlar to'g'ri bajarmagunlaricha o'ynashda davom etadilar. - Billi Jin King",
        ru: "Чемпионы продолжают играть, пока не сделают все правильно. - Билли Джин Кинг"
    },
    {
        en: "You are capable of amazing things. - Unknown",
        uz: "Siz ajoyib narsalarga qodirsiz. - Noma'lum",
        ru: "Вы способны на удивительные вещи. - Неизвестный"
    },
    {
        en: "Be so good they can't ignore you. - Steve Martin",
        uz: "Shunday zo'r bo'lingki, ular sizni e'tiborsiz qoldirolmasin. - Stiv Martin",
        ru: "Будьте настолько хороши, чтобы вас не могли игнорировать. - Стив Мартин"
    },
    {
        en: "Work gives you meaning and purpose and life is empty without it. - Stephen Hawking",
        uz: "Mehnat sizga ma'no va maqsad beradi, usiz hayot bo'm-bo'sh. - Stiven Xoking",
        ru: "Работа дает вам смысл и цель, и без нее жизнь пуста. - Стивен Хокинг"
    },
    {
        en: "The only way to do great work is to love what you do. - Steve Jobs",
        uz: "Buyuk ishlarni qilishning yagona yo'li o'z ishingizni sevishdir. - Stiv Jobs",
        ru: "Единственный способ делать великие дела — любить то, что вы делаете. - Стив Джобс"
    },
    {
        en: "Don't wish it were easier. Wish you were better. - Jim Rohn",
        uz: "Osonroq bo'lishini orzu qilmang. Yaxshiroq bo'lishni orzu qiling. - Jim Ron",
        ru: "Не желайте, чтобы было проще. Желайте, чтобы вы были лучше. - Джим Рон"
    },
    {
        en: "Try not to become a person of success, but rather try to become a person of value. - Albert Einstein",
        uz: "Muvaffaqiyatli inson bo'lishga emas, qadr-qimmatli inson bo'lishga intiling. - Albert Eynshteyn",
        ru: "Стремитесь стать не успешным человеком, а ценным. - Альберт Эйнштейн"
    },
    {
        en: "Life is like riding a bicycle. To keep your balance you must keep moving. - Albert Einstein",
        uz: "Hayot velosiped haydashga o'xshaydi. Muvozanatni saqlash uchun harakatni davom ettirish kerak. - Albert Eynshteyn",
        ru: "Жизнь — как вождение велосипеда. Чтобы сохранить равновесие, ты должен двигаться. - Альберт Эйнштейн"
    },
    {
        en: "Strive for progress, not perfection. - Unknown",
        uz: "Mukammallikka emas, taraqqiyotga intiling. - Noma'lum",
        ru: "Стремитесь к прогрессу, а не к совершенству. - Неизвестный"
    },
    {
        en: "Success is the product of daily habits—not once-in-a-lifetime transformations. - James Clear",
        uz: "Muvaffaqiyat umrda bir marta yuz beradigan o'zgarish emas, balki kundalik odatlarning mahsulidir. - Jeyms Klir",
        ru: "Успех — это продукт ежедневных привычек, а не трансформаций раз в жизни. - Джеймс Клир"
    },
    {
        en: "You do not rise to the level of your goals. You fall to the level of your systems. - James Clear",
        uz: "Siz maqsadlaringiz darajasiga ko'tarilmaysiz. Siz o'z tizimlaringiz darajasiga tushasiz. - Jeyms Klir",
        ru: "Вы не поднимаетесь до уровня своих целей. Вы падаете до уровня своих систем. - Джеймс Клир"
    },
    {
        en: "Habits are the compound interest of self-improvement. - James Clear",
        uz: "Odatlar - o'z-o'zini rivojlantirishning murakkab foizlaridir. - Jeyms Klir",
        ru: "Привычки — это сложный процент самосовершенствования. - Джеймс Клир"
    },
    {
        en: "Focus on being productive instead of busy. - Tim Ferriss",
        uz: "Band bo'lish o'rniga samarali bo'lishga diqqat qarating. - Tim Ferriss",
        ru: "Сосредоточьтесь на продуктивности, а не на занятости. - Тим Феррисс"
    },
    {
        en: "What we fear doing most is usually what we most need to do. - Tim Ferriss",
        uz: "Biz qilishdan eng ko'p qo'rqadigan narsa, odatda biz eng ko'p qilishimiz kerak bo'lgan narsadir. - Tim Ferriss",
        ru: "То, что мы больше всего боимся делать, обычно то, что нам нужно сделать больше всего. - Тим Феррисс"
    },
    {
        en: "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
        uz: "Daraxt ekish uchun eng yaxshi vaqt 20 yil oldin edi. Ikkinchi eng yaxshi vaqt - hozir. - Xitoy maqoli",
        ru: "Лучшее время, чтобы посадить дерево, было 20 лет назад. Второе лучшее время — сейчас. - Китайская пословица"
    },
    {
        en: "Don't let what you cannot do interfere with what you can do. - John Wooden",
        uz: "Qila olmaydigan narsangiz, qila oladigan narsangizga xalaqit berishiga yo'l qo'ymang. - Jon Vuden",
        ru: "Не позволяйте тому, что вы не можете сделать, мешать тому, что вы можете сделать. - Джон Вуден"
    },
    {
        en: "Make each day your masterpiece. - John Wooden",
        uz: "Har bir kuningizni asarga aylantiring. - Jon Vuden",
        ru: "Сделайте каждый день своим шедевром. - Джон Вуден"
    },
    {
        en: "Success is peace of mind, which is a direct result of self-satisfaction. - John Wooden",
        uz: "Muvaffaqiyat bu ko'ngil xotirjamligidir, bu o'z-o'zidan mamnunlikning bevosita natijasidir. - Jon Vuden",
        ru: "Успех — это душевный покой, который является прямым результатом самоудовлетворения. - Джон Вуден"
    },
    {
        en: "Fall seven times, stand up eight. - Japanese Proverb",
        uz: "Yetti marta yiqil, sakkiz marta tur. - Yapon maqoli",
        ru: "Упади семь раз, встань восемь. - Японская пословица"
    },
    {
        en: "Even if you fall on your face, you're still moving forward. - Victor Kiam",
        uz: "Hatto yuz tuban yiqilsangiz ham, siz baribir oldinga harakat qilyapsiz. - Viktor Kiam",
        ru: "Даже если вы упадете лицом вниз, вы всё равно движетесь вперед. - Виктор Киам"
    },
    {
        en: "Start small. Think big. Don't worry about too many things at once. - Unknown",
        uz: "Kichikdan boshlang. Katta o'ylang. Bir vaqtning o'zida ko'p narsalar haqida qayg'urmang. - Noma'lum",
        ru: "Начни с малого. Мысли масштабно. Не беспокойся о слишком многих вещах сразу. - Неизвестный"
    },
    {
        en: "One day or day one. You decide. - Unknown",
        uz: "Qachondir bir kun yoki birinchi kun. Siz hal qilasiz. - Noma'lum",
        ru: "В один день или день первый. Решать тебе. - Неизвестный"
    },
    {
        en: "Your future is created by what you do today, not tomorrow. - Robert Kiyosaki",
        uz: "Sizning kelajagingiz ertaga emas, bugun qilayotgan ishlaringiz orqali yaratiladi. - Robert Kiyosaki",
        ru: "Ваше будущее создается тем, что вы делаете сегодня, а не завтра. - Роберт Кийосаки"
    },
    {
        en: "Winners are not afraid of losing. But losers are. - Robert Kiyosaki",
        uz: "G'oliblar yutqazishdan qo'rqmaydi. Ammo mag'lublar qo'rqishadi. - Robert Kiyosaki",
        ru: "Победители не боятся проигрывать. А неудачники боятся. - Роберт Кийосаки"
    },
    {
        en: "The only place where success comes before work is in the dictionary. - Vidal Sassoon",
        uz: "Muvaffaqiyat mehnatdan oldin keladigan yagona joy - bu lug'atdir. - Vidal Sassun",
        ru: "Единственное место, где успех предшествует работе, — это словарь. - Видал Сассун"
    },
    {
        en: "Success is getting what you want. Happiness is wanting what you get. - Dale Carnegie",
        uz: "Muvaffaqiyat xohlagan narsangizni olishdir. Baxt esa o'zingizda bor narsani xohlashdir. - Deyl Karnegi",
        ru: "Успех — это получение того, чего вы хотите. Счастье — это желание того, что вы получаете. - Дейл Карнеги"
    },
    {
        en: "Most of the important things in the world have been accomplished by people who have kept on trying. - Dale Carnegie",
        uz: "Dunyodagi eng muhim ishlarning aksariyatini urinishni kanda qilmagan odamlar bajargan. - Deyl Karnegi",
        ru: "Большинство важных вещей в мире были достигнуты людьми, которые продолжали пытаться. - Дейл Карнеги"
    },
    {
        en: "If you want to conquer fear, don't sit home and think about it. Go out and get busy. - Dale Carnegie",
        uz: "Qo'rquvni yengmoqchi bo'lsangiz, uyda o'tirib u haqida o'ylamang. Tashqariga chiqing va band bo'ling. - Deyl Karnegi",
        ru: "Если вы хотите победить страх, не сидите дома и не думайте об этом. Выйдите и займитесь делом. - Дейл Карнеги"
    },
    {
        en: "You miss 100% of the shots you don't take. - Wayne Gretzky",
        uz: "Otmagan zarbaringizning 100 foizi nishonga tegmaydi. - Ueyn Gretski",
        ru: "Вы промахиваетесь в 100% случаев, когда не бросаете. - Уэйн Гретцки"
    },
    {
        en: "You can't cross the sea merely by standing and staring at the water. - Rabindranath Tagore",
        uz: "Faqatgina suvga tikilib turib, dengizni kesib o'ta olmaysiz. - Rabindranat Tagor",
        ru: "Вы не сможете пересечь море, просто стоя и глядя на воду. - Рабиндранат Тагор"
    },
    {
        en: "Everything has beauty, but not everyone sees it. - Confucius",
        uz: "Hamma narsada go'zallik bor, lekin uni hamma ham ko'ravermaydi. - Konfutsiy",
        ru: "Во всем есть красота, но не каждый ее видит. - Конфуций"
    },
    {
        en: "Our greatest glory is not in never falling, but in rising every time we fall. - Confucius",
        uz: "Bizning eng katta shon-sharafimiz hech qachon yiqilmaslikda emas, balki har yiqilganimizda o'rnimizdan turishdadir. - Konfutsiy",
        ru: "Наша величайшая слава не в том, чтобы никогда не падать, а в том, чтобы подниматься каждый раз, когда мы падаем. - Конфуций"
    },
    {
        en: "Study the past if you would define the future. - Confucius",
        uz: "Kelajakni belgilamoqchi bo'lsangiz, o'tmishni o'rganing. - Konfutsiy",
        ru: "Изучайте прошлое, если хотите определить будущее. - Конфуций"
    },
    {
        en: "If you can't explain it simply, you don't understand it well enough. - Albert Einstein",
        uz: "Agar buni oddiy qilib tushuntirib bera olmasangiz, demak uni o'zingiz yaxshi tushunmaysiz. - Albert Eynshteyn",
        ru: "Если вы не можете объяснить это просто, вы не понимаете это достаточно хорошо. - Альберт Эйнштейн"
    },
    {
        en: "Imagination is more important than knowledge. - Albert Einstein",
        uz: "Tasavvur bilimdan ko'ra muhimroqdir. - Albert Eynshteyn",
        ru: "Воображение важнее знаний. - Альберт Эйнштейн"
    },
    {
        en: "The only source of knowledge is experience. - Albert Einstein",
        uz: "Bilimning yagona manbasi tajribadir. - Albert Eynshteyn",
        ru: "Единственным источником знаний является опыт. - Альберт Эйнштейн"
    },
    {
        en: "Be yourself; everyone else is already taken. - Oscar Wilde",
        uz: "O'zingiz bo'ling; qolgan barcha rollar band. - Oskar Uayld",
        ru: "Будьте собой; все остальные роли уже заняты. - Оскар Уайльд"
    },
    {
        en: "We are what we repeatedly do. Excellence, then, is not an act, but a habit. - Aristotle",
        uz: "Biz doimo bajaradigan ishlarimizdan iboratmiz. Demak, mukammallik - bu harakat emas, balki odatdir. - Aristotel",
        ru: "Мы то, что мы делаем постоянно. Следовательно, совершенство — это не действие, а привычка. - Аристотель"
    },
    {
        en: "Quality is not an act, it is a habit. - Aristotle",
        uz: "Sifat bu bir martalik ish emas, bu odatdir. - Aristotel",
        ru: "Качество — это не действие, это привычка. - Аристотель"
    },
    {
        en: "The secret of your future is hidden in your daily routine. - Mike Murdock",
        uz: "Sizning kelajagingiz siri kundalik tartibingizda yashiringan. - Mayk Myurdok",
        ru: "Секрет вашего будущего скрыт в вашей повседневной рутине. - Майк Мёрдок"
    },
    {
        en: "The pain you feel today will be the strength you feel tomorrow. - Unknown",
        uz: "Bugun siz his qilayotgan og'riq, ertaga kuchga aylanadi. - Noma'lum",
        ru: "Боль, которую вы чувствуете сегодня, станет вашей силой завтра. - Неизвестный"
    },
    {
        en: "Don't downgrade your dream just to fit your reality. Upgrade your conviction to match your destiny. - Unknown",
        uz: "Orzuyingizni reallikka moslash uchun pastlatmang. Qat'iyatingizni taqdiringizga mos ravishda yuksaltiring. - Noma'lum",
        ru: "Не занижайте свою мечту, чтобы она соответствовала вашей реальности. Улучшайте свою убежденность, чтобы она соответствовала вашей судьбе. - Неизвестный"
    },
    {
        en: "Work hard, be kind, and amazing things will happen. - Conan O'Brien",
        uz: "Qattiq ishlang, mehribon bo'ling, va ajoyib narsalar sodir bo'ladi. - Konan O'Brayen",
        ru: "Усердно работайте, будьте добрыми, и произойдут удивительные вещи. - Конан О'Брайен"
    },
    {
        en: "Never let success get to your head and never let failure get to your heart. - Unknown",
        uz: "Hech qachon muvaffaqiyat boshingizni aylantirishiga, mag'lubiyat esa dilingizni xufton qilishiga yo'l qo'ymang. - Noma'lum",
        ru: "Никогда не позволяйте успеху вскружить вам голову, а неудаче — поразить ваше сердце. - Неизвестный"
    },
    {
        en: "It always seems impossible until it's done. - Nelson Mandela",
        uz: "Toki bajarilmagunicha hammasi imkonsiz bo'lib tuyulaveradi. - Nelson Mandela",
        ru: "Это всегда кажется невозможным, пока не сделано. - Нельсон Мандела"
    },
    {
        en: "I never lose. Either I win or I learn. - Nelson Mandela",
        uz: "Men hech qachon yutqazmayman. Yo g'alaba qozonaman, yoki o'rganaman. - Nelson Mandela",
        ru: "Я никогда не проигрываю. Либо я побеждаю, либо учусь. - Нельсон Мандела"
    },
    {
        en: "After climbing a great hill, one only finds that there are many more hills to climb. - Nelson Mandela",
        uz: "Katta cho'qqiga chiqqandan so'ng, inson zabt etish kerak bo'lgan yana ko'plab cho'qqilar borligini tushunadi. - Nelson Mandela",
        ru: "Взобравшись на высокую гору, понимаешь, что есть еще много гор, на которые нужно взобраться. - Нельсон Мандела"
    },
    {
        en: "Do what you feel in your heart to be right—for you'll be criticized anyway. - Eleanor Roosevelt",
        uz: "Qalbingiz to'g'ri deb bilgan narsani qiling - chunki baribir sizni tanqid qilishadi. - Eleanor Ruzvelt",
        ru: "Делайте то, что подсказывает вам сердце — ведь вас всё равно будут критиковать. - Элеонора Рузвельт"
    },
    {
        en: "No one can make you feel inferior without your consent. - Eleanor Roosevelt",
        uz: "Sizning ruxsatingizsiz hech kim sizni o'zingizni past his qilishingizga majbur qila olmaydi. - Eleanor Ruzvelt",
        ru: "Никто не может заставить вас чувствовать себя неполноценным без вашего согласия. - Элеонора Рузвельт"
    },
    {
        en: "With the new day comes new strength and new thoughts. - Eleanor Roosevelt",
        uz: "Yangi kun bilan birga yangi kuch va yangi o'ylar keladi. - Eleanor Ruzvelt",
        ru: "С новым днем приходят новые силы и новые мысли. - Элеонора Рузвельт"
    },
    {
        en: "Do one thing every day that scares you. - Eleanor Roosevelt",
        uz: "Har kuni o'zingizni qo'rqitadigan bitta ishni qiling. - Eleanor Ruzvelt",
        ru: "Делайте каждый день одну вещь, которая вас пугает. - Элеонора Рузвельт"
    },
    {
        en: "Be the change that you wish to see in the world. - Mahatma Gandhi",
        uz: "Dunyoda ko'rishni istagan o'zgarishning o'zi bo'ling. - Mahatma Gandi",
        ru: "Станьте тем изменением, которое вы хотите видеть в мире. - Махатма Ганди"
    },
    {
        en: "Happiness is when what you think, what you say, and what you do are in harmony. - Mahatma Gandhi",
        uz: "Baxt - bu fikrlaringiz, so'zlaringiz va amallaringiz o'zaro hamohangligidir. - Mahatma Gandi",
        ru: "Счастье — это когда то, что вы думаете, то, что вы говорите, и то, что вы делаете, находятся в гармонии. - Махатма Ганди"
    },
    {
        en: "The best way to find yourself is to lose yourself in the service of others. - Mahatma Gandhi",
        uz: "O'zlikni topishning eng yaxshi usuli bu – o'zini boshqalarga xizmat qilishga bag'ishlashdir. - Mahatma Gandi",
        ru: "Лучший способ найти себя — потерять себя в служении другим. - Махатма Ганди"
    },
    {
        en: "The future belongs to those who prepare for it today. - Malcolm X",
        uz: "Kelajak bugundan tayyorgarlik ko'rganlarga tegishlidir. - Malkolm Iks",
        ru: "Будущее принадлежит тем, кто готовится к нему сегодня. - Малкольм Икс"
    },
    {
        en: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today. - Malcolm X",
        uz: "Ta'lim - bu kelajak pasportidir, chunki ertangi kun bugundan tayyorgarlik ko'rganlarga tegishlidir. - Malkolm Iks",
        ru: "Образование — это паспорт в будущее, ибо завтрашний день принадлежит тем, кто готовится к нему сегодня. - Малкольм Икс"
    },
    {
        en: "If you want to lift yourself up, lift up someone else. - Booker T. Washington",
        uz: "Agar o'zingizni yuqoriga ko'tarmoqchi bo'lsangiz, boshqalarni ko'taring. - Buker T. Vashington",
        ru: "Если вы хотите возвыситься, поднимите кого-нибудь другого. - Букер Т. Вашингтон"
    },
    {
        en: "Associate yourself with people of good quality, for it is better to be alone than in bad company. - Booker T. Washington",
        uz: "Yaxshi odamlar bilan suhbatdosh bo'ling, chunki yomon davradan ko'ra yolg'iz bo'lgan afzal. - Buker T. Vashington",
        ru: "Общайтесь с людьми хорошего качества, ибо лучше быть одному, чем в плохой компании. - Букер Т. Вашингтон"
    },
    {
        en: "I am not a product of my circumstances. I am a product of my decisions. - Stephen R. Covey",
        uz: "Men sharoitlarimning emas, qabul qilgan qarorlarimning mahsuliman. - Stiven R. Kovi",
        ru: "Я не продукт моих обстоятельств. Я продукт моих решений. - Стивен Р. Кови"
    },
    {
        en: "The main thing is to keep the main thing the main thing. - Stephen R. Covey",
        uz: "Eng asosiysi shuki, asosiy narsani doim asosiy o'rinda saqlashdir. - Stiven R. Kovi",
        ru: "Главное — чтобы главное оставалось главным. - Стивен Р. Кови"
    },
    {
        en: "Strength does not come from physical capacity. It comes from an indomitable will. - Mahatma Gandhi",
        uz: "Kuch jismoniy qobiliyatdan emas, yengilmas irodadan kelib chiqadi. - Mahatma Gandi",
        ru: "Сила исходит не от физических возможностей. Она исходит от неукротимой воли. - Махатма Ганди"
    },
    {
        en: "Don't count the days, make the days count. - Muhammad Ali",
        uz: "Kunlarni sanamang, balki kunlar mazmunli o'tishini ta'minlang. - Muhammad Ali",
        ru: "Не считайте дни, делайте так, чтобы дни считались. - Мухаммед Али"
    },
    {
        en: "I hated every minute of training, but I said, 'Don't quit.' - Muhammad Ali",
        uz: "Mashg'ulotlarning har bir daqiqasidan nafratlanardim, lekin o'zimga 'Taslim bo'lma' derdim. - Muhammad Ali",
        ru: "Я ненавидел каждую минуту тренировок, но я говорил: «Не сдавайся». - Мухаммед Али"
    },
    {
        en: "Service to others is the rent you pay for your room here on earth. - Muhammad Ali",
        uz: "Boshqalarga xizmat qilish - bu Yerdagi joyingiz uchun to'laydigan ijarangizdir. - Muhammad Ali",
        ru: "Служение другим — это арендная плата, которую вы платите за свое место здесь, на земле. - Мухаммед Али"
    },
    {
        en: "Believe in yourself and all that you are. - Christian D. Larson",
        uz: "O'zingizga va o'zingizda bor barcha narsalarga ishoning. - Kristian D. Larson",
        ru: "Верьте в себя и во всё, что вы есть. - Кристиан Д. Ларсон"
    },
    {
        en: "Keep your face always toward the sunshine—and shadows will fall behind you. - Walt Whitman",
        uz: "Yuzingizni doim quyosh nuriga qaratib turing — shunda soyalar ortingizda qoladi. - Uolt Uitmen",
        ru: "Держите лицо всегда обращенным к солнцу, и тени останутся позади вас. - Уолт Уитмен"
    },
    {
        en: "You are never too old to set another goal or to dream a new dream. - C.S. Lewis",
        uz: "Yangi maqsad qo'yish yoki yangi orzu qilish uchun hech qachon qari emassiz. - C.S. Lyuis",
        ru: "Вы никогда не слишком стары, чтобы поставить новую цель или мечтать о новом. - К.С. Льюис"
    },
    {
        en: "Progress is impossible without change, and those who cannot change their minds cannot change anything. - George Bernard Shaw",
        uz: "O'zgarishsiz taraqqiyotning iloji yo'q, o'z fikrini o'zgartira olmagan inson esa hech narsani o'zgartira olmaydi. - Jorj Bernard Shou",
        ru: "Прогресс невозможен без изменений, и те, кто не может изменить свое мнение, не могут изменить ничего. - Джордж Бернард Шоу"
    },
    {
        en: "The man who moves a mountain begins by carrying away small stones. - Confucius",
        uz: "Tog'ni ko'chirmoqchi bo'lgan inson ishni mayda toshlarni tashishdan boshlaydi. - Konfutsiy",
        ru: "Человек, который передвигает гору, начинает с того, что уносит маленькие камни. - Конфуций"
    },
    {
        en: "If you don't like something, change it. If you can't change it, change your attitude. - Maya Angelou",
        uz: "Agar biror narsa yoqmasa, uni o'zgartiring. Agar o'zgartira olmasangiz, munosabatingizni o'zgartiring. - Mayya Enjelou",
        ru: "Если вам что-то не нравится, измените это. Если не можете изменить, измените свое отношение. - Майя Энджелоу"
    },
    {
        en: "Nothing will work unless you do. - Maya Angelou",
        uz: "Siz ishlamaguningizcha hech narsa ishlamaydi. - Mayya Enjelou",
        ru: "Ничего не сработает, пока вы не начнете действовать. - Майя Энджелоу"
    },
    {
        en: "You may encounter many defeats, but you must not be defeated. - Maya Angelou",
        uz: "Siz ko'plab mag'lubiyatlarga uchrashingiz mumkin, ammo mag'lub bo'lmasligingiz kerak. - Mayya Enjelou",
        ru: "Вы можете столкнуться со многими поражениями, но вы не должны быть побеждены. - Майя Энджелоу"
    },
    {
        en: "Everything you've ever wanted is on the other side of fear. - George Addair",
        uz: "Siz doim xohlagan narsalaringizning hammasi qo'rquvning narigi tomonidadir. - Jorj Addeyir",
        ru: "Всё, что вы когда-либо хотели, находится по ту сторону страха. - Джордж Аддейр"
    },
    {
        en: "Don't be afraid to give up the good to go for the great. - John D. Rockefeller",
        uz: "Buyukka erishish uchun yaxshidan voz kechishdan qo'rqmang. - Jon D. Rokfeller",
        ru: "Не бойтесь отказаться от хорошего ради великого. - Джон Д. Рокфеллер"
    },
    {
        en: "I find that the harder I work, the more luck I seem to have. - Thomas Jefferson",
        uz: "Shuni payqadimki, qanchalik ko'p ishlasam, menda shuncha ko'p omad bo'lyapti. - Tomas Jefferson",
        ru: "Я обнаружил, что чем усерднее я работаю, тем больше мне везет. - Томас Джефферсон"
    },
    {
        en: "If you can dream it, you can do it. - Walt Disney",
        uz: "Agar orzu qila olsangiz, unga erisha olasiz. - Uolt Disney",
        ru: "Если вы можете мечтать об этом, вы можете это сделать. - Уолт Дисней"
    },
    {
        en: "The way to get started is to quit talking and begin doing. - Walt Disney",
        uz: "Boshlashning eng yaxshi yo'li - gapirishni to'xtatib, harakatga o'tishdir. - Uolt Disney",
        ru: "Лучший способ начать — это перестать говорить и начать делать. - Уолт Дисней"
    },
    {
        en: "When you believe in a thing, believe in it all the way. - Walt Disney",
        uz: "Biror narsaga ishonsangiz, unga to'laqonli va oxirigacha ishoning. - Uolt Disney",
        ru: "Если вы верите во что-то, верьте в это до конца. - Уолт Дисней"
    },
    {
        en: "Failure is another stepping stone to greatness. - Oprah Winfrey",
        uz: "Mag'lubiyat bu buyuklik sari eltuvchi yana bir pog'onadir. - Opra Uinfri",
        ru: "Неудача — это еще одна ступенька к величию. - Опра Уинфри"
    },
    {
        en: "Turn your wounds into wisdom. - Oprah Winfrey",
        uz: "Yaralaringizni donolikka aylantiring. - Opra Uinfri",
        ru: "Превратите свои раны в мудрость. - Опра Уинфри"
    },
    {
        en: "Surround yourself with only people who are going to lift you higher. - Oprah Winfrey",
        uz: "O'zingizni faqat sizni yuqoriga tortadigan insonlar bilan o'rab oling. - Opra Uinfri",
        ru: "Окружайте себя только теми людьми, которые поднимут вас выше. - Опра Уинфри"
    },
    {
        en: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment. - Ralph Waldo Emerson",
        uz: "Sizni tinmay boshqa birovga aylantirishga urinadigan dunyoda o'zligingizcha qolish eng katta yutuqdir. - Ralf Uoldo Emerson",
        ru: "Быть самим собой в мире, который постоянно пытается сделать из вас кого-то другого, — величайшее достижение. - Ральф Уолдо Эмерсон"
    },
    {
        en: "Do not go where the path may lead, go instead where there is no path and leave a trail. - Ralph Waldo Emerson",
        uz: "Yo'l olib boradigan joyga bormang, uning o'rniga yo'l bo'lmagan joyga boring va o'z izingizni qoldiring. - Ralf Uoldo Emerson",
        ru: "Не идите туда, куда может привести путь, идите туда, где нет пути, и оставьте след. - Ральф Уолдо Эмерсон"
    },
    {
        en: "Don't let yesterday take up too much of today. - Will Rogers",
        uz: "Kecha o'tgan kun buguningizning ko'p qismini tortib olishiga yo'l qo'ymang. - Uill Rojers",
        ru: "Не позволяйте вчерашнему дню занимать слишком много сегодняшнего. - Уилл Роджерс"
    },
    {
        en: "Even if you're on the right track, you'll get run over if you just sit there. - Will Rogers",
        uz: "Hatto to'g'ri yo'lda bo'lsangiz ham, joyingizda jimgina o'tiraversangiz, sizni bosib o'tib ketishadi. - Uill Rojers",
        ru: "Даже если вы на правильном пути, вас переедут, если вы будете просто сидеть. - Уилл Роджерс"
    },
    {
        en: "Success is going from failure to failure without losing enthusiasm. - Winston Churchill",
        uz: "Muvaffaqiyat ishtiyoqni yo'qotmasdan mag'lubiyatdan mag'lubiyatga borishdir. - Uinston Cherchill",
        ru: "Успех — это движение от неудачи к неудаче без потери энтузиазма. - Уинстон Черчилль"
    },
    {
        en: "Keep going. Everything you need will come to you at the perfect time. - Unknown",
        uz: "Harakatda davom eting. Sizga kerak bo'lgan hamma narsa eng mos vaqtda keladi. - Noma'lum",
        ru: "Продолжайте идти. Всё, что вам нужно, придет к вам в идеальное время. - Неизвестный"
    },
    {
        en: "Dream big and dare to fail. - Norman Vaughan",
        uz: "Katta orzular qiling va omadsizlikka uchrashdan qo'rqmang. - Norman Von",
        ru: "Мечтайте по-крупному и не бойтесь ошибаться. - Норман Воган"
    },
    {
        en: "Whether you think you can or you think you can't, you're right. - Henry Ford",
        uz: "Qo'limdan keladi deb o'ylasangiz ham, kelmaydi deb o'ylasangiz ham siz haqsiz. - Genri Ford",
        ru: "Думаете ли вы, что можете, или думаете, что не можете, — вы правы. - Генри Форд"
    },
    {
        en: "Start where you are. Use what you have. Do what you can. - Arthur Ashe",
        uz: "O'z turgan joyingizdan boshlang. Bor imkoniyatingizdan foydalaning. Qodir bo'lganingizni bajaring. - Artur Esh",
        ru: "Начните там, где вы находитесь. Используйте то, что у вас есть. Делайте то, что можете. - Артур Эш"
    },
    {
        en: "Hard work beats talent when talent doesn't work hard. - Tim Notke",
        uz: "Iqtidor mehnat qilmaganda, mashaqqatli mehnat iqtidor ustidan g'alaba qozonadi. - Tim Notke",
        ru: "Тяжелый труд побеждает талант, когда талант не трудится усердно. - Тим Нотке"
    },
    {
        en: "Opportunities don't happen. You create them. - Chris Grosser",
        uz: "Imkoniyatlar o'z-o'zidan paydo bo'lmaydi. Ularni o'zingiz yaratasiz. - Kris Grosser",
        ru: "Возможности не случаются. Вы сами их создаете. - Крис Гроссер"
    },
    {
        en: "Don't limit your challenges. Challenge your limits. - Jerry Dunn",
        uz: "O'z qiyinchiliklaringizni chegaralamang. O'z chegaralaringizga qiyinchilik yarating. - Jerri Dann",
        ru: "Не ограничивайте свои вызовы. Бросьте вызов своим ограничениям. - Джерри Данн"
    },
    {
        en: "The secret of getting ahead is getting started. - Mark Twain",
        uz: "Oldinga o'tib ketishning siri - birinchi qadamni tashlashdir. - Mark Tven",
        ru: "Секрет того, чтобы вырваться вперед, — это просто начать. - Марк Твен"
    },
    {
        en: "The expert in anything was once a beginner. - Helen Hayes",
        uz: "Barcha ishdagi ekspertlar qachondir boshlovchi bo'lishgan. - Xelen Xeyz",
        ru: "Эксперт в любом деле когда-то был новичком. - Хелен Хейз"
    },
    {
        en: "Success usually comes to those who are too busy to be looking for it. - Henry David Thoreau",
        uz: "Muvaffaqiyat odatda uni izlash bilan bandsiz insonlarga keladi. - Genri Devid Toro",
        ru: "Успех обычно приходит к тем, кто слишком занят, чтобы искать его. - Генри Дэвид Торо"
    },
    {
        en: "Failure is simply the opportunity to begin again, this time more intelligently. - Henry Ford",
        uz: "Omadsizlik bu shunchaki boshqatdan, bu safar yanada aqlliroq boshlash imkoniyatidir. - Genri Ford",
        ru: "Неудача — это просто возможность начать всё сначала, на этот раз более разумно. - Генри Форд"
    },
    {
        en: "A little progress each day adds up to big results. - Satya Nani",
        uz: "Har kungi kichik yutuqlar yig'ilib, katta natijalarga aylanadi. - Satya Nani",
        ru: "Небольшой прогресс каждый день складывается в большие результаты. - Сатья Нани"
    },
    {
        en: "Small deeds done are better than great deeds planned. - Peter Marshall",
        uz: "Rejalashtirilgan buyuk ishlardan ko'ra bajarilgan kichik amallar afzaldir. - Piter Marshall",
        ru: "Сделанные маленькие дела лучше запланированных великих. - Питер Маршалл"
    },
    {
        en: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart. - Roy T. Bennett",
        uz: "Xayolingizdagi qo'rquvlar sizni boshqarishiga yo'l qo'ymang. Qalbingizdagi orzularingizga ergashing. - Roy T. Bennet",
        ru: "Не поддавайтесь страхам в вашем уме. Руководствуйтесь мечтами в вашем сердце. - Рой Т. Беннетт"
    },
    {
        en: "You become what you believe. - Oprah Winfrey",
        uz: "Siz nimaga ishonsangiz, o'shanga aylanasiz. - Opra Uinfri",
        ru: "Вы становитесь тем, во что верите. - Опра Уинфри"
    },
    {
        en: "Work hard in silence, let success make the noise. - Frank Ocean",
        uz: "Jimjimadorlikda mehnat qiling, shovqinni esa muvaffaqiyat ko'tarsin. - Frenk Oushen",
        ru: "Усердно работайте в тишине, пусть успех шумит за вас. - Фрэнк Оушен"
    }
];

  window.quotes = [];

  function applyQuotesLanguage(lang) {
    const nextLang = typeof lang === "string" && lang ? lang : "en";
    window.quotes.length = 0;
    multiQuotes.forEach((quote) => window.quotes.push(quote[nextLang] || quote.en));
  }

  const initialLang = localStorage.getItem("tu_lang") || "en";
  applyQuotesLanguage(initialLang);

  document.addEventListener("tu-lang-changed", (event) => {
    const lang = event && event.detail && event.detail.lang ? event.detail.lang : initialLang;
    applyQuotesLanguage(lang);
  });
})();
