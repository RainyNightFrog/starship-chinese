/**
 * 內建閱讀理解題庫 — 文章 + 每篇 3 題（小五至小六呈分試難度）
 * 由 mockDatabase READING_POOL 匯入使用
 */

/** @typedef {{ question: string, options: string[], correctIndex: number, explanation: string }} ReadingQuestionDef */

/**
 * @typedef {{
 *   passageId: string,
 *   passageTitle: string,
 *   genre: string,
 *   passage: string[],
 *   questions: ReadingQuestionDef[],
 * }} ReadingPassagePack
 */

/** @type {ReadingPassagePack[]} */
export const READING_PASSAGE_PACKS = [
  {
    passageId: 'read-1',
    passageTitle: '抒情文：秋夜思鄉',
    genre: '白話抒情',
    passage: [
      '故鄉的秋夜，總是格外寧靜。微風輕拂，樹影婆娑，遠處傳來幾聲蟲鳴。',
      '我獨坐窗前，望著一輪明月，心中湧起對遠方親人的思念。',
      '然而，我明白只有努力學習，將來才能報答父母的養育之恩。',
      '因此，我把思念化為動力，在書桌前專心致志地溫習。',
    ],
    questions: [
      {
        question: 'Q1. 根據第二段，「我」當時的心情是什麼？',
        options: ['思念遠方的親人', '害怕黑暗', '生氣憤怒', '驕傲自滿'],
        correctIndex: 0,
        explanation: '第二段明確寫出「對遠方親人的思念」。',
      },
      {
        question: 'Q2. 第三段的「然而」表示什麼轉折？',
        options: ['從思念轉為行動的決心', '從快樂變傷心', '從室內到室外', '從白天到黑夜'],
        correctIndex: 0,
        explanation: '「然而」後接明白要努力學習報答父母，是情感轉為行動。',
      },
      {
        question: 'Q3. 本文的中心思想最接近：',
        options: ['把思鄉之情化為學習動力', '故鄉的秋夜最美', '不應該離開家鄉', '月亮令人害怕'],
        correctIndex: 0,
        explanation: '全文由思鄉轉到專心溫習，中心是把思念化為動力。',
      },
    ],
  },
  {
    passageId: 'read-2',
    passageTitle: '議論文：團結的力量',
    genre: '白話議論',
    passage: [
      '團結是人類戰勝困難的重要力量。一個人的力量有限，但眾人齊心，便能移山填海。',
      '正如洪水來襲時，軍民並肩作戰，才能守護家園，成為社會的中流砥柱。',
      '若各自為政、互不相助，便難以渡過難關，最終受害的還是無辜的百姓。',
      '因此，我們在學校也應互相幫助，共同进步，才能面對學習上的挑戰。',
    ],
    questions: [
      {
        question: 'Q1. 第二段舉洪水為例，目的是：',
        options: ['說明團結才能戰勝困難', '描寫洪水很可怕', '介紹軍隊生活', '批評不聽話的人'],
        correctIndex: 0,
        explanation: '例子論證團結作戰才能守護家園。',
      },
      {
        question: 'Q2. 「中流砥柱」在第二段的意思是：',
        options: ['能起核心支柱作用的力量', '河流中間的石头', '一個人的名字', '一種食物'],
        correctIndex: 0,
        explanation: '比喻能起支柱、核心作用的人或力量。',
      },
      {
        question: 'Q3. 作者寫這篇文章的主要目的是：',
        options: ['說服讀者重視團結互助', '介紹水災的成因', '描述軍隊的訓練生活', '批評現代人不讀書'],
        correctIndex: 0,
        explanation: '結尾呼籲在學校也要互相幫助，論證團結的重要。',
      },
    ],
  },
  {
    passageId: 'read-3',
    passageTitle: '文言文短篇：學而時習',
    genre: '文言文',
    passage: [
      '子曰：「學而時習之，不亦說乎？」',
      '譯：孔子說：「學習並且按時溫習，不也很愉快嗎？」',
      '有朋自遠方來，不亦樂乎？',
      '譯：有朋友從遠方來，不也很快樂嗎？',
    ],
    questions: [
      {
        question: 'Q1. 「之」在「學而時習之」中是指：',
        options: ['所學的內容（代詞）', '的（結構助詞）', '去（動詞）', '語氣詞'],
        correctIndex: 0,
        explanation: '「習之」的「之」指代所學知識，作代詞。',
      },
      {
        question: 'Q2. 「不亦說乎」的「說」通：',
        options: ['悅（愉快）', '說話', '勸說', '解說'],
        correctIndex: 0,
        explanation: '「說」在此讀如「悅」，表示愉快。',
      },
      {
        question: 'Q3. 這兩則語錄共同強調：',
        options: ['學習與交友都能帶來快樂', '遠方的朋友最可靠', '不必經常溫習', '孔子最喜歡旅行'],
        correctIndex: 0,
        explanation: '兩則均以「不亦……乎」強調學習與交友的喜悅。',
      },
    ],
  },
  {
    passageId: 'read-4',
    passageTitle: '說明文：紅樹林',
    genre: '說明文',
    passage: [
      '紅樹林生長在潮間帶，環境惡劣，泥土缺氧，鹽分又高。',
      '紅樹有皮孔和露出的根幫助呼吸，鹽腺可把多餘的鹽分排出，就像人類流汗，可說是異曲同工。',
      '紅樹能穩固海岸、過濾污水，也為鳥類和魚類提供食物，是自然界重要的「義士」。',
      '希望大家到濕地公園親身認識這些堅韌的紅樹。',
    ],
    questions: [
      {
        question: 'Q1. 下列哪一項是文章的重點？',
        options: ['說明紅樹的特性與對大自然的貢獻', '說明紅樹的名稱由來', '鼓勵人們前往濕地公園參觀', '記述作者一次普通的見聞'],
        correctIndex: 0,
        explanation: '全文介紹紅樹的構造與生態價值。',
      },
      {
        question: 'Q2. 文中哪一段描述了紅樹面對的生存困難？',
        options: ['第一段', '第二段', '第三段', '第四段'],
        correctIndex: 0,
        explanation: '首段交代潮間帶缺氧、高鹽等困難。',
      },
      {
        question: 'Q3. 第二段「異曲同工」在文中的意思是：',
        options: ['做法不同但效果相似', '完全一樣的方法', '方法錯誤但結果正確', '與人類毫無關係'],
        correctIndex: 0,
        explanation: '紅樹排鹽與人流汗機制不同，目的都是排出多餘鹽分。',
      },
    ],
  },
  {
    passageId: 'read-5',
    passageTitle: '記敘文：重返母校',
    genre: '記敘文',
    passage: [
      '轉眼間畢業已一年，我獨自回到母校，腦海中跟小學同學相處的記憶既瑣碎又難忘。',
      '走在寧靜的操場上，看見一個足球，便想起小學時瘋狂愛上踢足球的情景。',
      '雖然我經常跌倒，同學取笑我沒有運動細胞，但我仍喜歡和許多人一起玩的感覺。',
      '畢業禮那天，我們唱校歌時不禁流下眼淚，友誼一定會留在心中。',
    ],
    questions: [
      {
        question: 'Q1. 作者寫這篇文章的主要目的是？',
        options: ['描述校園活動以表達對母校和同學的思念', '展望離開學校以後的生活', '介紹校園各項體育設施', '說明不能再像以往那樣踢球'],
        correctIndex: 0,
        explanation: '全文借回母校回憶抒發思念。',
      },
      {
        question: 'Q2. 下列哪一項最能說明作者抒發的情感？',
        options: ['懷念母校', '不滿自己的球技', '後悔忽略學業', '對畢業禮感到厭煩'],
        correctIndex: 0,
        explanation: '結尾強調友誼與對母校的懷念。',
      },
      {
        question: 'Q3. 第二段在結構上的作用是：',
        options: ['以具體回憶引出對同學的思念', '說明足球比學業重要', '介紹學校足球隊的戰績', '批評同學不友善'],
        correctIndex: 0,
        explanation: '由足球回憶帶出與同學相處的溫馨片段。',
      },
    ],
  },
  {
    passageId: 'read-6',
    passageTitle: '人物傳記：孔子',
    genre: '說明文',
    passage: [
      '孔子是儒家學派的創始人，被尊為萬世師表。',
      '他整理古代典籍，創立六經，提出「仁」與「禮」的思想。',
      '孔子開創私學之風，有教無類，三千弟子願意學習他都願意教。',
      '後人興建孔廟紀念他，讓世人緬懷這位偉大的教育家。',
    ],
    questions: [
      {
        question: 'Q1. 下列哪一項不是孔子的貢獻？',
        options: ['在世界各地興建孔廟', '創立了儒家思想', '開創了私學的風氣', '把所有重要的典籍進行搜集整理'],
        correctIndex: 0,
        explanation: '興建孔廟是後人紀念，非孔子本人貢獻。',
      },
      {
        question: 'Q2. 本文的中心思想最接近？',
        options: ['介紹孔子的生平、思想與對中華文化的貢獻', '說明孔廟建築的特色', '記述孔子出生日的慶祝活動', '鼓勵讀者背誦《論語》全文'],
        correctIndex: 0,
        explanation: '全文介紹孔子地位與教育文化影響。',
      },
      {
        question: 'Q3. 「有教無類」的意思是：',
        options: ['不論貧富貴賤，只要願意學都教', '只教聰明的學生', '只教貴族子弟', '不教女生'],
        correctIndex: 0,
        explanation: '孔子打破貴族壟斷，推廣平民教育。',
      },
    ],
  },
  {
    passageId: 'read-7',
    passageTitle: '說明文：南極洲與《南極條約》',
    genre: '說明文',
    passage: [
      '南極洲是地球上最寒冷、最乾燥的大陸，四周被冰雪覆蓋。',
      '1959年，《南極條約》簽署，各國同意南極洲只用於和平目的與科學研究。',
      '條約禁止在南極進行軍事活動，也暫停對南極領土的爭議。',
      '作者認為，南極應受國際保護，讓後人仍能在此進行科學考察，而非淪為資源爭奪的戰場。',
    ],
    questions: [
      {
        question: 'Q1. 根據《南極條約》相關描述，作者最想傳遞什麼核心信息？',
        options: ['南極洲應受國際保護，作為和平與科學研究之用，而非領土爭端的對象', '鼓勵各國前往南極洲開採礦產資源', '證明法律條約在極地環境下完全無效', '說明南極洲的氣候已變得適合人類居住'],
        correctIndex: 0,
        explanation: '結尾強調南極應受國際保護，用於和平與科學研究。',
      },
      {
        question: 'Q2. 第二段主要說明：',
        options: ['《南極條約》的簽署背景與目的', '南極企鵝的生活習性', '各國在南極的軍事部署', '南極旅遊的興起'],
        correctIndex: 0,
        explanation: '第二段交代條約簽署及和平、科研用途。',
      },
      {
        question: 'Q3. 下列哪一項是條約禁止的事？',
        options: ['在南極進行軍事活動', '在南極進行科學考察', '各國簽署國際協議', '保護極地生態環境'],
        correctIndex: 0,
        explanation: '第三段明確禁止在南極進行軍事活動。',
      },
    ],
  },
  {
    passageId: 'read-8',
    passageTitle: '記敘文：刀鋒跑手',
    genre: '記敘文',
    passage: [
      '奧斯卡·比斯托利斯出生時雙腳有先天缺陷，十一個月大時不得不接受截肢手術。',
      '失去雙腳後，他並沒有自暴自棄，反而積極練習田徑，裝上義肢後仍能在賽道上奔跑。',
      '他曾說：「若你只想著自己缺少甚麼，你永遠都不會成功。」',
      '比斯托利斯以堅毅的意志面對缺憾，成為「刀鋒跑手」，激勵了無數殘疾運動員。',
    ],
    questions: [
      {
        question: 'Q1. 文中第一段主要是？',
        options: ['記述比斯托利斯小時候的生活', '解釋比斯托利斯失去雙腳的原因', '說明比斯托利斯對參與奧運會的想法', '指出比斯托利斯與其他運動員不同的地方'],
        correctIndex: 1,
        explanation: '首段交代比斯托利斯因先天缺陷而截肢的經歷。',
      },
      {
        question: 'Q2. 作者引述比斯托利斯的說話，目的是甚麼？',
        options: ['說明比斯托利斯有不肯認輸的性格', '指出比斯托利斯能比別人優勝的原因', '指出比斯托利斯能豁然面對自己的缺憾', '解釋比斯托利斯能和常人一樣運動的原因'],
        correctIndex: 2,
        explanation: '引述對話突顯他面對缺憾的積極態度。',
      },
      {
        question: 'Q3. 本文的中心思想最接近：',
        options: ['以堅毅意志克服缺憾，激勵他人', '殘疾運動員比常人更優秀', '義肢科技是最重要發明', '奧運會應禁止殘疾選手參賽'],
        correctIndex: 0,
        explanation: '全文記述比斯托利斯如何以意志面對缺憾並激勵他人。',
      },
    ],
  },
  {
    passageId: 'read-9',
    passageTitle: '說明文：減塑生活',
    genre: '說明文',
    passage: [
      '塑膠製品為生活帶來便利，但大量棄置的膠樽和膠袋卻嚴重威脅海洋生態。',
      '許多海洋生物誤把膠袋當作食物，導致腸道阻塞甚至死亡。',
      '減少使用即棄塑膠，改用可重複使用的水樽和購物袋，是每個市民都能做到的事。',
      '環保不是口號，而是日積月累的習慣；從今天起，讓我們一起為地球減塑。',
    ],
    questions: [
      {
        question: 'Q1. 第一段的寫作目的是：',
        options: ['指出塑膠垃圾對環境的威脅', '介紹塑膠的發明歷史', '說明膠樽的製作方法', '鼓勵多買塑膠產品'],
        correctIndex: 0,
        explanation: '首段指出塑膠棄置對海洋生態的威脅。',
      },
      {
        question: 'Q2. 作者建議讀者：',
        options: ['減少使用即棄塑膠，改用可重複使用的用品', '完全禁止所有塑膠製品', '把膠樽全部燒掉', '不再到海邊游泳'],
        correctIndex: 0,
        explanation: '第三段提出改用可重用水樽和購物袋。',
      },
      {
        question: 'Q3. 本文屬於哪種文體？',
        options: ['說明文', '記敘文', '抒情文', '實用文（書信）'],
        correctIndex: 0,
        explanation: '全文說明塑膠問題及環保做法，屬說明文。',
      },
    ],
  },
  {
    passageId: 'read-10',
    passageTitle: '說明文：勤勞的蜜蜂',
    genre: '說明文',
    passage: [
      '蜜蜂是自然界重要的授粉者，許多農作物都依賴蜜蜂傳播花粉才能結果。',
      '一個蜂群裡，工蜂分工合作：有的採蜜，有的築巢，有的照顧幼蟲，井然有序。',
      '若蜜蜂數量大幅減少，人類的糧食供應也會受到嚴重影響。',
      '因此，我們應保護蜜蜂的棲息地，少用殺蟲劑，讓這些勤勞的小生命繼續為大自然服務。',
    ],
    questions: [
      {
        question: 'Q1. 下列哪一項是蜜蜂對人類的重要貢獻？',
        options: ['為農作物授粉，使植物結果', '製造塑膠代替品', '清理海洋垃圾', '預測天氣變化'],
        correctIndex: 0,
        explanation: '首段指出蜜蜂授粉使農作物結果。',
      },
      {
        question: 'Q2. 第二段主要說明：',
        options: ['蜂群內部分工合作', '蜜蜂的飛行速度', '蜂蜜的營養價值', '如何飼養寵物蜜蜂'],
        correctIndex: 0,
        explanation: '第二段描述工蜂採蜜、築巢、照顧幼蟲的分工。',
      },
      {
        question: 'Q3. 作者對讀者的呼籲是：',
        options: ['保護蜜蜂棲息地，減少使用殺蟲劑', '多養蜜蜂賺取蜂蜜', '禁止所有農藥', '只吃蜂蜜不吃其他食物'],
        correctIndex: 0,
        explanation: '末段呼籲保護棲息地、少用殺蟲劑。',
      },
    ],
  },
  {
    passageId: 'read-11',
    passageTitle: '古詩賞析：靜夜思',
    genre: '古詩',
    passage: [
      '床前明月光，疑是地上霜。',
      '舉頭望明月，低頭思故鄉。',
      '譯：床前灑滿明亮的月光，我一度以為是地上鋪了一層白霜。',
      '譯：抬頭望著天上的明月，低下頭來，不禁思念起故鄉。',
    ],
    questions: [
      {
        question: 'Q1. 「疑是地上霜」運用了哪種修辭？',
        options: ['比喻', '誇張', '擬人', '設問'],
        correctIndex: 0,
        explanation: '把月光比作白霜，是比喻。',
      },
      {
        question: 'Q2. 詩人當時的情感是：',
        options: ['思念故鄉', '讚美月亮', '害怕寒冷', '生氣離家'],
        correctIndex: 0,
        explanation: '末句「低頭思故鄉」點明思鄉之情。',
      },
      {
        question: 'Q3. 「舉頭望明月，低頭思故鄉」在結構上的作用是：',
        options: ['以動作連貫，層層深化思鄉之情', '說明詩人頸部不適', '介紹望月的科學方法', '描寫月亮的形狀'],
        correctIndex: 0,
        explanation: '兩個動作呼應，由望月到思鄉，情感遞進。',
      },
    ],
  },
  {
    passageId: 'read-12',
    passageTitle: '記敘文：社區義工',
    genre: '記敘文',
    passage: [
      '週末，我們班到安老院探訪長者，帶去自製的賀卡和水果。',
      '起初，我有些緊張，不知該說甚麼，但長者們親切的笑容很快讓我放鬆下來。',
      '一位婆婆握著我的手，分享她年輕時讀書的故事，我聽得入迷，也學會了珍惜上學的機會。',
      '離開時，陽光灑在院舍門前，我明白：付出關懷，同時也會收穫成長。',
    ],
    questions: [
      {
        question: 'Q1. 作者起初感到緊張，後來放鬆的原因是：',
        options: ['長者們親切的笑容', '老師的嚴厲批評', '同學的嘲笑', '院舍環境太吵'],
        correctIndex: 0,
        explanation: '第二段指出長者笑容讓作者放鬆。',
      },
      {
        question: 'Q2. 探訪經歷使作者：',
        options: ['學會珍惜上學的機會', '決定不再讀書', '害怕與長者交談', '只想留在家中'],
        correctIndex: 0,
        explanation: '第三段從婆婆的故事學會珍惜上學機會。',
      },
      {
        question: 'Q3. 末段「付出關懷，同時也會收穫成長」是：',
        options: ['作者從經歷中領悟的道理', '長者對作者的命令', '學校校訓的全文', '報章的標題'],
        correctIndex: 0,
        explanation: '末段總結探訪帶來的個人領悟。',
      },
    ],
  },
  {
    passageId: 'read-13',
    passageTitle: '記敘文：學習書法',
    genre: '記敘文',
    passage: [
      '我從小六開始學習書法，第一堂課，老師只讓我反覆寫「一」橫，我覺得很枯燥。',
      '後來，老師解釋：書法講求運筆的輕重緩急，基礎不穩，字便難以端正。',
      '經過數月的練習，我的字跡漸見進步，更明白「循序漸進」的道理。',
      '現在，每當執筆寫字，我都會想起老師的教誨：基本功，是一切的開始。',
    ],
    questions: [
      {
        question: 'Q1. 作者最初覺得書法課：',
        options: ['枯燥乏味', '輕鬆有趣', '太過困難', '完全沒有用'],
        correctIndex: 0,
        explanation: '首段寫反覆寫橫覺得枯燥。',
      },
      {
        question: 'Q2. 老師只讓學生反覆寫基本筆劃，目的是：',
        options: ['打好運筆基礎', '懲罰不專心的學生', '節省墨紙', '準備書法比賽'],
        correctIndex: 0,
        explanation: '第二段解釋基礎不穩字難端正，需練基本功。',
      },
      {
        question: 'Q3. 本文的中心思想最接近：',
        options: ['基本功需要循序漸進，不可急於求成', '書法比所有科目重要', '不必聽從老師教導', '只寫橫便足夠'],
        correctIndex: 0,
        explanation: '全文強調循序漸進練好基本功。',
      },
    ],
  },
  {
    passageId: 'read-14',
    passageTitle: '議論文：網絡安全',
    genre: '白話議論',
    passage: [
      '互聯網為學習和通訊帶來便利，但若缺乏警覺，也可能落入詐騙或網絡欺凌的陷阱。',
      '個人資料一旦外洩，可能被不法分子用作非法用途，後果不堪設想。',
      '我們不應隨便點擊不明連結，也不應在網上向陌生人透露住址和密碼。',
      '只有提高警覺、遵守網絡禮儀，才能享受科技的好處，遠離網絡危機。',
    ],
    questions: [
      {
        question: 'Q1. 第一段指出互聯網的問題是：',
        options: ['可能令使用者落入詐騙或網絡欺凌的陷阱', '完全無法用於學習', '只能給成年人使用', '必定導致近視'],
        correctIndex: 0,
        explanation: '首段指出缺乏警覺可能落入詐騙或欺凌陷阱。',
      },
      {
        question: 'Q2. 作者建議讀者不要：',
        options: ['隨便點擊不明連結，向陌生人透露個人資料', '使用任何電子產品', '在學校使用電腦', '閱讀網上文章'],
        correctIndex: 0,
        explanation: '第三段明確提出不要點不明連結、不要透露住址和密碼。',
      },
      {
        question: 'Q3. 本文的論點是：',
        options: ['提高警覺才能安全使用互聯網', '應完全禁止學生上網', '網絡詐騙並不存在', '個人資料外洩無所謂'],
        correctIndex: 0,
        explanation: '結尾論證需提高警覺、遵守禮儀才能安全上網。',
      },
    ],
  },
  {
    passageId: 'read-15',
    passageTitle: '抒情文：父親的雨傘',
    genre: '白話抒情',
    passage: [
      '那天下雨，我忘記帶傘，站在校門口發愁。',
      '父親突然出現，把大半邊傘傾向我這邊，自己的肩膀卻濕透了。',
      '他沒說甚麼，只是默默陪我走回家，我鼻子一酸，心裡湧起一股暖流。',
      '長大後我才明白，父愛像那把傾斜的傘，總把最好的留給子女。',
    ],
    questions: [
      {
        question: 'Q1. 父親把傘傾向作者，自己的肩膀濕透，表現了：',
        options: ['父親對子女的關愛', '父親不懂使用雨傘', '父親想展示力氣', '父親責怪作者忘記帶傘'],
        correctIndex: 0,
        explanation: '傾斜雨傘、自己淋濕，象徵父親的關愛。',
      },
      {
        question: 'Q2. 「父愛像那把傾斜的傘」運用了：',
        options: ['比喻', '排比', '反問', '誇張'],
        correctIndex: 0,
        explanation: '把父愛比作傾斜的傘，是比喻。',
      },
      {
        question: 'Q3. 本文主要抒發：',
        options: ['對父親的感激與理解', '對下雨天的厭惡', '對同學的思念', '對學校的不滿'],
        correctIndex: 0,
        explanation: '全文借雨傘回憶抒發對父愛的感激。',
      },
    ],
  },
  {
    passageId: 'read-16',
    passageTitle: '說明文：運動與健康',
    genre: '說明文',
    passage: [
      '經常運動能增強心肺功能，提高身體抵抗力，也有助紓緩學習壓力。',
      '世界衛生組織建議，兒童及青少年每天應進行至少六十分鐘的中等強度活動。',
      '運動不必競爭激烈，散步、游泳、騎單車都是良好的選擇。',
      '養成運動習慣，才能以健康的體魄迎接學習與生活的挑戰。',
    ],
    questions: [
      {
        question: 'Q1. 下列哪一項是運動的好處？',
        options: ['增強心肺功能，紓緩學習壓力', '必定奪得奧運金牌', '完全取代睡眠', '使人不必讀書'],
        correctIndex: 0,
        explanation: '首段列出增強心肺、紓緩壓力等好處。',
      },
      {
        question: 'Q2. 世界衛生組織建議青少年每天運動：',
        options: ['至少六十分鐘中等強度活動', '不超過十分鐘', '只在週末進行', '只做劇烈競賽'],
        correctIndex: 0,
        explanation: '第二段明確建議至少六十分鐘中等強度活動。',
      },
      {
        question: 'Q3. 第三段的寫作目的是：',
        options: ['說明運動方式可以多元，不必競爭激烈', '批評學生不愛運動', '介紹奧運會歷史', '推銷健身器材'],
        correctIndex: 0,
        explanation: '第三段舉散步、游泳等，說明運動可多元選擇。',
      },
    ],
  },
  {
    passageId: 'read-17',
    passageTitle: '記敘文：第一次上台',
    genre: '記敘文',
    passage: [
      '學校朗誦比賽，老師推舉我代表班級上台，我既榮幸又害怕。',
      '彩排時，我因緊張而忘詞，幾乎想放棄；同學們卻鼓勵我：「你一定做得到！」',
      '比賽當天，我深吸一口氣，順利完成朗誦，台下響起掌聲。',
      '這次經歷讓我明白：勇氣不是不害怕，而是害怕仍願意嘗試。',
    ],
    questions: [
      {
        question: 'Q1. 作者彩排時想放棄，是因為：',
        options: ['緊張而忘詞', '同學故意搗亂', '老師取消比賽', '舞台燈光太暗'],
        correctIndex: 0,
        explanation: '第二段寫因緊張忘詞幾乎想放棄。',
      },
      {
        question: 'Q2. 同學的鼓勵使作者：',
        options: ['重拾信心完成比賽', '更加害怕上台', '決定轉校', '不再參加任何活動'],
        correctIndex: 0,
        explanation: '在鼓勵下比賽當天順利完成朗誦。',
      },
      {
        question: 'Q3. 末句「勇氣不是不害怕，而是害怕仍願意嘗試」是：',
        options: ['作者從經歷中領悟的道理', '比賽的評分標準', '老師的開場白', '報章廣告標語'],
        correctIndex: 0,
        explanation: '末段總結對勇氣的領悟。',
      },
    ],
  },
  {
    passageId: 'read-18',
    passageTitle: '說明文：中華長城',
    genre: '說明文',
    passage: [
      '長城是古代中國為抵禦外敵而修築的大型軍事防禦工程，綿延數千公里。',
      '它凝聚了無數勞動人民的智慧與汗水，被譽為世界文化遺產。',
      '今天的長城已不再是戰場，而是讓遊客認識歷史、感受民族精神的教材。',
      '保護長城，就是保護我們共同的文化記憶，讓後人也能親眼見證這份歷史瑰寶。',
    ],
    questions: [
      {
        question: 'Q1. 長城最初修建的主要目的是：',
        options: ['抵禦外敵', '方便商人貿易', '舉辦運動比賽', '儲存糧食'],
        correctIndex: 0,
        explanation: '首段指出為抵禦外敵而修築。',
      },
      {
        question: 'Q2. 今天的長城主要作用是：',
        options: ['讓遊客認識歷史、感受民族精神', '繼續用於戰爭', '開採礦產', '阻擋颱風'],
        correctIndex: 0,
        explanation: '第三段說明今日長城是認識歷史的教材。',
      },
      {
        question: 'Q3. 作者認為我們應該：',
        options: ['保護長城這份文化遺產', '拆毁長城興建城市', '禁止遊客參觀', '只在書本閱讀不必親身到訪'],
        correctIndex: 0,
        explanation: '末段呼籲保護長城，傳承文化記憶。',
      },
    ],
  },
];

/**
 * 將文章包轉為 READING_POOL 題目格式
 * @param {ReadingPassagePack[]} packs
 */
export function buildReadingPoolFromPacks(packs = READING_PASSAGE_PACKS) {
  const items = [];
  packs.forEach((pack) => {
    pack.questions.forEach((q, qi) => {
      items.push({
        id: `${pack.passageId}-q${qi + 1}`,
        passageId: pack.passageId,
        passageTitle: pack.passageTitle,
        genre: pack.genre,
        passage: [...pack.passage],
        questionNumberInPassage: qi + 1,
        passageQuestionTotal: pack.questions.length,
        question: q.question,
        options: [...q.options],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      });
    });
  });
  return items;
}

/** 內建閱讀理解完整題池（18 篇 × 3 題 = 54 題） */
export const BUILTIN_READING_POOL = buildReadingPoolFromPacks();
