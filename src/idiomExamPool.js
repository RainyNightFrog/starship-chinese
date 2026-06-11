import { isPlayableVocabExamItem } from './sharedIdiomQuality.js';

/**
 * 核心詞彙語意池（30 題）— 小五/小六呈分試難度
 * ─────────────────────────────────────────────
 * 詞語、題幹、正確語意、干擾項、提示徹底分離：
 * · hint 只給方向，絕不洩漏正確選項文字
 * · 答錯後才透過 explanation 顯示完整語意
 */

export const IDIOM_EXAM_POOL = [
  // === 【A組：心境與情感描寫（呈分試高頻雙字/四字詞）】 ===
  {
    id: 'voc_001',
    word: '雀躍萬分',
    questionText: '文中主角表現得「雀躍萬分」，這代表他當時的心情是怎樣的？',
    options: [
      '形容人因極度興奮、高興而跳躍起來',
      '形容人感到驚慌失措，像鳥類一樣四處亂飛',
      '指看到鳥類在樹頭跳躍的優美風景',
      '形容內心感到無比的慚愧和內疚',
    ],
    correctAnswerIndex: 0,
    hint: '提示：通常用來描寫收到心儀禮物、獲得比賽冠軍時的狂喜心態。',
  },
  {
    id: 'voc_002',
    word: '落寞',
    questionText: '根據文章脈絡，主角臉上閃過一絲「落寞」的神情，這裡的「落寞」是指：',
    options: [
      '形容性格粗心大意，經常遺失隨身物品',
      '指環境非常熱鬧，充滿了歡聲笑語',
      '形容冷清、孤單、失落的心情',
      '比喻一個人居功自傲，瞧不起旁人',
    ],
    correctAnswerIndex: 2,
    hint: '提示：多用於配角受到冷落，或主角的願望落空時的低落神態。',
  },
  {
    id: 'voc_003',
    word: '忐忑不安',
    questionText: '主角心裡「忐忑不安」，以下哪一項最符合這個詞語在文中的意思？',
    options: [
      '心神極為安定，對自己充滿了信心',
      '形容心神不定，內心非常膽怯或焦慮',
      '指身體因為生病而感到虛弱無力',
      '形容一個人性格古怪，讓人難以捉摸',
    ],
    correctAnswerIndex: 1,
    hint: '提示：呈分試中常用來描寫作弊怕被發現、或等待公佈差勁成績時的心理。',
  },
  {
    id: 'voc_004',
    word: '熱淚盈眶',
    questionText: '看著眼前的場景，主角不禁「熱淚盈眶」，這指的是：',
    options: [
      '形容眼睛因為受到煙霧刺激而感到酸痛',
      '比喻因極度高興、感激或悲傷，眼眶裡充滿了淚水',
      '指眼部受到外傷，需要立刻進行醫療處理',
      '形容一個人生性懦弱，遇到小事就喜歡哭泣',
    ],
    correctAnswerIndex: 1,
    hint: '提示：多用於感人至深的結局，如看到別人的無私奉獻或久別重逢。',
  },
  {
    id: 'voc_005',
    word: '自慚形穢',
    questionText: '面對優秀的對手，主角不免感到「自慚形穢」，這代表：',
    options: [
      '因為自己的外貌或才能不如別人，而感到慚愧、自卑',
      '故意隱藏自己的實力，表現得非常謙虛',
      '形容一個人身體骯髒，不講究個人衛生',
      '指性格傲慢，不願意與不如自己的人交往',
    ],
    correctAnswerIndex: 0,
    hint: '提示：常用於主角與完美的榜樣進行對比時，內心產生的心理落差。',
  },
  {
    id: 'voc_006',
    word: '意氣風發',
    questionText: '以下哪一項最符合「意氣風發」在文章中的語意？',
    options: [
      '形容一個人脾氣暴躁，經常對身邊的人發火',
      '指身體抱恙，需要多吹風來保持清醒',
      '形容精神振奮，氣概豪邁，充滿了朝氣與自信',
      '比喻做事缺乏主見，容易受到外界風氣的影響',
    ],
    correctAnswerIndex: 2,
    hint: '提示：常用來描寫主角在順境中、或成功克服重重困難後的驕傲與豪邁。',
  },

  // === 【B組：處事態度與意志力（呈分試必考正向詞彙）】 ===
  {
    id: 'idiom_001',
    word: '廢寢忘食',
    questionText: '「廢寢忘食」可以用來形容以下哪一種處事態度？',
    options: [
      '形容人生活貧困，連吃飯、睡覺的地方都沒有',
      '形容人非常專心努力，顧不得睡覺，忘記了吃飯',
      '形容人身體虛弱，因為生病而無法飲食、休息',
      '形容人做事缺乏計劃，黑白顛倒、飲食不定時',
    ],
    correctAnswerIndex: 1,
    hint: '提示：通常用來讚美學生或主角為了達到目標而極度刻苦、專注的態度。',
  },
  {
    id: 'idiom_002',
    word: '鍥而不捨',
    questionText: '文中提到主角抱著「鍥而不捨」的精神，這代表他的態度是：',
    options: [
      '做事不夠果斷，常常半途而廢',
      '有恆心、有毅力，堅持到底而不放棄',
      '思想頑固，不願意接受別人的勸告',
      '做事不講求方法，盲目地硬拼',
    ],
    correctAnswerIndex: 1,
    hint: '提示：形容堅持不懈的精神。',
  },
  {
    id: 'voc_009',
    word: '半途而廢',
    questionText: '句子中若出現「半途而廢」，其代表的反面行為指的是：',
    options: [
      '做事做了一半就放棄，不能堅持到底',
      '指在旅途中廢棄了多餘的行李',
      '形容做事情非常有計劃，分階段逐步完成',
      '比喻在道路中間遇到了無法克服的自然災害',
    ],
    correctAnswerIndex: 0,
    hint: '提示：高年級寓言故事或反面教材中，最常用來警惕學生的詞語。',
  },
  {
    id: 'voc_010',
    word: '破釜沉舟',
    questionText: '文中主角在面臨絕境時展現了「破釜沉舟」的決心，這指的是：',
    options: [
      '做事不顧後果，把家裡的財產和工具全部破壞',
      '比喻下定決心，做事果斷，不留退路，非取得成功不可',
      '形容做事遇到困難就立刻退縮，選擇逃避',
      '指在船隻損壞時，能夠冷靜地進行修補與自救',
    ],
    correctAnswerIndex: 1,
    hint: '提示：強調下定決心、背水一戰的精神。',
  },
  {
    id: 'voc_011',
    word: '腳踏實地',
    questionText: '以下哪一項最符合「腳踏實地」的詞義解釋？',
    options: [
      '形容走路時步履沉重，在地面留下深深的腳印',
      '比喻做事認真、紮實、一步一腳印，不抱不切實際的幻想',
      '形容一個人性格保守，不願意接受新技術',
      '指單純進行戶外體育鍛鍊，親近大自然',
    ],
    correctAnswerIndex: 1,
    hint: '提示：高年級記敘文中讚揚主角務實求學或工作的核心美德。',
  },
  {
    id: 'voc_012',
    word: '全力以赴',
    questionText: '「全力以赴」這個詞語在文章中，主要是用來形容：',
    options: [
      '把全部的力量都投入到某件事情當中去',
      '指呼喚身邊所有的夥伴一起逃跑',
      '形容力氣非常大，能夠獨自搬動重物',
      '比喻做事不自量力，最終導致慘痛失敗',
    ],
    correctAnswerIndex: 0,
    hint: '提示：常用於描寫主角面對即將到來的呈分試或體育比賽時的堅定態度。',
  },

  // === 【C組：人際關係與品德（呈分試記敘文高頻考點）】 ===
  {
    id: 'voc_013',
    word: '莫逆之交',
    questionText: '根據香港小學中文科的詞彙規範，以下哪一項是「莫逆之交」的正確語意？',
    options: [
      '指彼此思想完全相反，無法溝通的朋友',
      '指情投意合、非常要好，沒有利害衝突的知心朋友',
      '形容在商場上互相利用、各懷鬼胎的夥伴',
      '指剛剛認識，交情還不深厚的朋友',
    ],
    correctAnswerIndex: 1,
    hint: '提示：高年級常見的「友情類」記敘文核心詞彙。',
  },
  {
    id: 'voc_014',
    word: '推心置腹',
    questionText: '主角與朋友「推心置腹」地談了一晚，這代表他們：',
    options: [
      '互相推脫責任，不願意承擔錯誤',
      '比喻真心誠意地待人，毫無保留地吐露心聲',
      '形容兩個人在體育競賽中發生了肢體碰撞',
      '指談話內容非常膚淺，只是敷衍了事',
    ],
    correctAnswerIndex: 1,
    hint: '提示：形容朋友或親人之間極致坦誠、解開心結的溝通狀態。',
  },
  {
    id: 'voc_015',
    word: '視若無睹',
    questionText: '面對路人的困境，他竟然「視若無睹」，這指的是：',
    options: [
      '眼睛突然失明，看不見任何東西',
      '雖然看見了，卻像沒有看見一樣不予理睬，形容冷漠',
      '形容觀察非常仔細，連細微的地方都不放過',
      '指故意閉上眼睛進行冥想與休息',
    ],
    correctAnswerIndex: 1,
    hint: '提示：常用於反面角色的冷漠，或主角前期缺乏同理心時的行為描寫。',
  },
  {
    id: 'voc_016',
    word: '相濡以沫',
    questionText: '兩位老人在困境中「相濡以沫」，這句話的意思最接近以下哪一項？',
    options: [
      '形容兩個人在下雨天互相推搡，身上沾滿了泥水',
      '比喻在同處困境時，用微薄的力量互相幫助、互相扶持',
      '指兩個人因為意見不合而在街頭大聲爭吵',
      '形容生活非常富裕，互相贈送昂貴的禮物',
    ],
    correctAnswerIndex: 1,
    hint: '提示：難度較高，常用於描寫親人、同胞在艱苦環境下相依為命的深厚感情。',
  },
  {
    id: 'voc_017',
    word: '責無旁貸',
    questionText: '這項保護校園環境的工作，我們「責無旁貸」：',
    options: [
      '這項工作有很大的風險，絕對不能輕易答應',
      '自己應盡的責任，絕對不能推卸給別人',
      '這是一筆不需要償還的貸款，非常划算',
      '形容這件事情微不足道，不需要大家去關心',
    ],
    correctAnswerIndex: 1,
    hint: '提示：常用於論說文或記敘文結尾，引導學生承擔班級、社會或家庭責任。',
  },
  {
    id: 'voc_018',
    word: '忘恩負義',
    questionText: '以下哪一項最符合「忘恩負義」的反面品德定義？',
    options: [
      '忘記了過去的仇恨，選擇原諒別人',
      '忘記了別人對自己的恩情，做出對不起別人的事情',
      '形容記憶力非常差，常常忘記重要的事情',
      '指一個人過度熱心，常常幫倒忙',
    ],
    correctAnswerIndex: 1,
    hint: '提示：常用於寓言故事（如東郭先生與狼）中對反面角色的譴責。',
  },

  // === 【D組：環境、世事與社會現象（說明文/論說文/高難度借景抒情）】 ===
  {
    id: 'voc_019',
    word: '滄海桑田',
    questionText: '「滄海桑田」這個四字詞在成語探究中，主要是用來形容：',
    options: [
      '漁民在海邊辛勤耕作，希望獲得大豐收的情景',
      '大自然環境保護得非常好，風景美不勝收',
      '比喻世事變化巨大或世事無常',
      '形容海洋資源豐富，有著無盡的寶藏',
    ],
    correctAnswerIndex: 2,
    hint: '提示：常用於舊地重遊、古蹟變遷、或時代進步發展的社會性文章。',
  },
  {
    id: 'voc_020',
    word: '賞心悅目',
    questionText: '這裡的風景令人「賞心悅目」，這代表：',
    options: [
      '形容景色非常優美，讓人看了心情舒暢、非常高興',
      '指看風景需要耗費大量的時間和金錢',
      '形容風景非常恐怖，讓人看了感到驚慌害怕',
      '比喻一個人的眼神非常銳利，能夠看穿別人的心思',
    ],
    correctAnswerIndex: 0,
    hint: '提示：寫景抒情文的標配高頻詞，用來引出主角愉悅的心境。',
  },
  {
    id: 'idiom_003',
    word: '名落孫山',
    questionText: '若考卷中出現「名落孫山」一詞，它最準確的意思是：',
    options: [
      '到著名風景區遊覽，卻不小心迷失了方向',
      '名字寫錯了地方，需要重新修改登記',
      '考試或選拔沒有被錄取，榜上無名',
      '人名聲敗壞，受到了大眾的譴責',
    ],
    correctAnswerIndex: 2,
    hint: '提示：常用來描寫考試或比賽面臨挫折時的情境。',
  },
  {
    id: 'idiom_004',
    word: '不可或缺',
    questionText: '句子中若使用「不可或缺」，其代表的核心語意是什麼？',
    options: [
      '事情非常多，多到完全無法應付',
      '非常重要，絕對不能缺少',
      '物件有嚴重的瑕疵，不夠完美',
      '機會非常難得，一旦錯過就不再回來',
    ],
    correctAnswerIndex: 1,
    hint: '提示：表示絕對必要、必不可少的存在。',
  },
  {
    id: 'idiom_005',
    word: '出類拔萃',
    questionText: '以下哪一項最符合「出類拔萃」的詞義解釋？',
    options: [
      '人品格高尚，喜歡親近大自然',
      '人才華或能力遠超同類，表現極優秀',
      '做事喜歡走捷徑，不循規蹈矩',
      '人性格孤僻，無法融入群體生活',
    ],
    correctAnswerIndex: 1,
    hint: '提示：形容超出同類之上，非常傑出。',
  },
  {
    id: 'voc_024',
    word: '煥然一新',
    questionText: '經過一翻粉飾，校園面貌「煥然一新」，這指的是：',
    options: [
      '形容建築物非常老舊，即將面臨倒塌',
      '指光線非常刺眼，讓人無法直視',
      '形容事物改變了舊面貌，呈現出乾淨、光彩的全新氣象',
      '比喻天氣變化無常，突然下起了大雨',
    ],
    correctAnswerIndex: 2,
    hint: '提示：常用於描寫環保特訓後、或大掃除後的環境改觀。',
  },

  // === 【E組：名校呈分試魔鬼高分詞（拉開分差專用）】 ===
  {
    id: 'voc_025',
    word: '不合時宜',
    questionText: '這項提議在今天看來有些「不合時宜」，這裡的「不合時宜」是指：',
    options: [
      '不符合目前的時代需要或當前的情況',
      '時鐘和手錶壞了，顯示的時間不夠準確',
      '形容一個人性格急躁，不願意耐心等待',
      '指在不對的時間做對的事，非常值得讚賞',
    ],
    correctAnswerIndex: 0,
    hint: '提示：常見於高年級思辨類文章，考驗學生的批判性思考。',
  },
  {
    id: 'voc_026',
    word: '司空見慣',
    questionText: '這種現象在都市裡早已「司空見慣」，這代表該現象：',
    options: [
      '非常罕見，屬於百年一遇的奇觀',
      '指某種事情天天見到，已經習以為常，不足為奇',
      '形容官職非常高，受到市民的尊敬',
      '比喻作風非常保守，墨守成規',
    ],
    correctAnswerIndex: 1,
    hint: '提示：說明文或論說文開頭引出常見社會問題（如低頭族、浪費食物）的必備詞。',
  },
  {
    id: 'voc_027',
    word: '耳濡目染',
    questionText: '在父母的「耳濡目染」下，主角也愛上了閱讀。這句話形容：',
    options: [
      '耳朵和眼睛都受到了嚴重的感染，需要求醫',
      '指學習環境非常嘈雜，無法集中注意力',
      '形容經常聽到、看到，無形中受到深刻的影響',
      '比喻盲目模仿別人的外在行為',
    ],
    correctAnswerIndex: 2,
    hint: '提示：常用於家庭教育或校園風氣對主角性格形成正面影響的描寫。',
  },
  {
    id: 'voc_028',
    word: '根深蒂固',
    questionText: '這種舊觀念在人們心中已經「根深蒂固」，意指該觀念：',
    options: [
      '像植物的根一樣非常淺，很容易被拔除',
      '基礎牢固，根基深厚，極其不容易動搖或改變',
      '非常健康、正向，值得大力推廣',
      '形容結構非常混亂，讓人無法理解',
    ],
    correctAnswerIndex: 1,
    hint: '提示：多用於論說文中，形容偏見、壞習慣或傳統思想極難扭轉。',
  },
  {
    id: 'voc_029',
    word: '層出不窮',
    questionText: '新騙局「層出不窮」，學生應提高警惕。「層出不窮」的意思是：',
    options: [
      '形容生活非常貧困，世世代代都無法翻身',
      '接連不斷地出現，沒有窮盡',
      '事情只發生了一次，之後就再也沒有出現過',
      '形容結構層次分明，非常有條理',
    ],
    correctAnswerIndex: 1,
    hint: '提示：常用於說明文，強調某種社會現象、科技產品或問題更新極快。',
  },
  {
    id: 'voc_030',
    word: '集思廣益',
    questionText: '唯有「集思廣益」，我們才能設計出完美的畢業聯歡會方案：',
    options: [
      '形容一個人獨斷獨行，不願意聽取別人的意見',
      '集中群眾的智慧，廣泛吸收有益的意見，從而擴大效果',
      '指將大家的財產聚集在一起，進行合理的分配',
      '比喻心思過度分散，無法專注於眼前的學習',
    ],
    correctAnswerIndex: 1,
    hint: '提示：常用於校園記敘文，描寫班會或小組討論共同解決難題的黃金詞。',
  },
];

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function stripHintPrefix(hint) {
  return String(hint ?? '').replace(/^提示：/, '').trim();
}

/**
 * 轉為單元測驗（quiz）引擎格式
 * · options[].detail 不含語意解析，避免選項本身洩漏答案
 * · explanation 僅供答錯後反饋使用
 */
function buildIdiomPoolMeta(item) {
  return {
    isCommunityShared: Boolean(item.isCommunityShared),
    contributorLabel: item.contributorLabel,
    sharedPoolId: item.sharedPoolId ?? (item.word ? `idiom:${item.word}` : undefined),
    source: item.source ?? 'idiom_exam_pool',
  };
}

export function idiomExamPoolToQuizPool(pool = IDIOM_EXAM_POOL) {
  return pool.filter(isPlayableVocabExamItem).map((item) => {
    const correctIdx = Number(item.correctAnswerIndex ?? 0);
    const correctText = item.options[correctIdx] ?? '';
    const correctKey = OPTION_KEYS[correctIdx] ?? 'A';

    return {
      id: item.id,
      text: item.questionText,
      hint: stripHintPrefix(item.hint),
      word: item.word,
      subType: '核心詞彙語意',
      category: 'idiom_meaning',
      isIdiomExam: true,
      options: item.options.map((word, i) => ({
        key: OPTION_KEYS[i] ?? String.fromCharCode(65 + i),
        word,
        /** 選項按鈕不附解析；正確項僅標記答對 */
        detail: i === correctIdx ? '答對了！' : '',
      })),
      correctKey,
      explanation: `「${item.word}」的正確語意：${correctText}`,
      ...buildIdiomPoolMeta(item),
    };
  });
}

/** 轉為 ADVANCED_QUESTION_POOL / Admin 編輯器標準格式 */
export function idiomExamPoolToAdvancedPool(pool = IDIOM_EXAM_POOL) {
  return pool.map((item) => ({
    id: item.id,
    category: 'vocab_inference',
    subType: '核心詞彙語意',
    questionText: item.questionText,
    options: [...(item.options ?? [])],
    correctAnswerIndex: Number(item.correctAnswerIndex ?? 0),
    hint: item.hint ?? '',
    trapProfile: 'vocab',
    word: item.word,
    source: 'idiom_exam_pool',
  }));
}

/** 轉為呈分試模擬（sspa）引擎格式 */
export function idiomExamPoolToSspaPool(pool = IDIOM_EXAM_POOL) {
  return pool.filter(isPlayableVocabExamItem).map((item, index) => {
    const correctIdx = Number(item.correctAnswerIndex ?? 0);
    const correctText = item.options[correctIdx] ?? '';

    return {
      id: item.id ?? `sspa_voc_${index}`,
      text: item.questionText,
      hint: stripHintPrefix(item.hint),
      word: item.word,
      subType: '核心詞彙語意',
      category: 'vocab_inference',
      isIdiomExam: true,
      options: [...(item.options ?? [])],
      correctIndex: correctIdx,
      explanation: `「${item.word}」的正確語意：${correctText}`,
      ...buildIdiomPoolMeta(item),
      source: item.source ?? 'starship_global_idioms',
    };
  });
}
