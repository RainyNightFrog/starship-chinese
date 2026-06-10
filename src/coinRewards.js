/** 答對一題的標準金幣獎勵（與 aiEngine.COIN_REWARD 同步） */
export const COIN_REWARD_AMOUNT = 10;

/** 金幣獲得方式 */
export const COIN_EARN_METHODS = [
  {
    icon: '✅',
    label: '答對測驗／呈分試題',
    labelEn: 'Correct quiz / SSPA answer',
    amount: COIN_REWARD_AMOUNT,
  },
  {
    icon: '🧩',
    label: '完成句子重組',
    labelEn: 'Complete sentence unscramble',
    amount: COIN_REWARD_AMOUNT,
  },
  {
    icon: '✍️',
    label: '完成默書詞語',
    labelEn: 'Finish a dictation word',
    amount: Math.max(5, Math.floor(COIN_REWARD_AMOUNT / 2)),
  },
];

/** 金幣可兌換獎勵（Demo） */
export const COIN_REWARDS = [
  {
    id: 'hint',
    icon: '💡',
    name: '字義提示券',
    nameEn: 'Meaning Hint Voucher',
    cost: 30,
    desc: '默書或測驗時多一次 AI 字義提示',
    descEn: 'One extra AI meaning hint in dictation or quiz',
  },
  {
    id: 'badge',
    icon: '🌟',
    name: '星光徽章',
    nameEn: 'Star Badge',
    cost: 50,
    desc: '個人檔案顯示學習成就徽章',
    descEn: 'Show an achievement badge on your profile',
  },
  {
    id: 'gift',
    icon: '🎁',
    name: '家長神秘禮',
    nameEn: 'Parent Mystery Gift',
    cost: 100,
    desc: '通知家長兌換實物小獎勵（由家長確認）',
    descEn: 'Notify parent to redeem a real reward (parent confirms)',
  },
];
