/**
 * app.js - メインコントローラー & UIバインディング
 * DESIGN.md（ベッドサイド・サンクチュアリ）完全準拠
 */

import { calcDayZeroMidnight, calcProgress } from './calculator.js';
import { loadSettings, saveSettings, recordSessionEnd, getElapsedEndurance, clearSettings } from './storage.js';

// 時間帯連動の寄り添い・ポジティブメッセージ（夫から奥様へ）
const TIME_BASED_MESSAGES = {
  // 朝（5:00〜10:59）: つわりの朝を迎えられたことを肯定し、心身をいたわる言葉
  morning: [
    '朝起きられただけで百点満点だよ🌱<br>無理せず横になっててね。',
    '朝の体調はどうかな？<br>休むのが今の一番のお仕事だよ🌱',
    '今日も赤ちゃんとお腹の中で、<br>新しい1日を迎えたね✨',
    'しんどい時は深呼吸。<br>焦らず今日ものんびりいこうね🌱'
  ],
  // 昼（11:00〜16:59）: 食べられない不安を和らげ、前進をポジティブに伝える言葉
  daytime: [
    '食べられる時に、食べられるものだけで大丈夫。<br>ゼリーでも氷でも◎',
    '1分1秒、確実にゴールに近づいているよ。<br>お昼もゆっくり休んでね🌱',
    '赤ちゃんもママのお腹の中で、<br>一歩ずつすくすく大きくなっているよ✨',
    '今日ここまで過ごせた自分を、<br>たくさん褒めてあげてね💐'
  ],
  // 夕方・夜（17:00〜21:59）: 今日1日を耐え抜いたことへのねぎらいと前進の実感
  evening: [
    '今日も1日耐えてえらい！<br>本当によく頑張ったね、お疲れ様💐',
    '今日を乗り切った分、<br>出口にまた一歩確実に近づいたよ✨',
    'いつでも頼ってね。<br>一緒に一歩ずつ乗り越えようね🌱',
    '身体が一生懸命に赤ちゃんを守っている証拠だよ。<br>えらいよ。'
  ],
  // 深夜・早朝（22:00〜4:59）: 暗い部屋で目が覚めた時の不安や孤独を包み込む言葉
  night: [
    '夜中に目が覚めちゃったかな。<br>ゆっくり深呼吸して横になっててね🌙',
    '眠れなくても目を閉じているだけで、<br>身体はちゃんと休まっているよ🌱',
    '静かな夜も時間は進んでいるよ。<br>大丈夫、味方だよ。',
    '赤ちゃんもママと一緒に、<br>お腹の中でスヤスヤ休んでいるよ✨'
  ]
};

let currentMessage = '';
let currentSlot = '';

/**
 * 現在の時間帯とメッセージを取得する
 */
function getRandomMessageForCurrentTime() {
  const hour = new Date().getHours();
  let slot = 'night';
  if (hour >= 5 && hour < 11) {
    slot = 'morning';
  } else if (hour >= 11 && hour < 17) {
    slot = 'daytime';
  } else if (hour >= 17 && hour < 22) {
    slot = 'evening';
  }

  const list = TIME_BASED_MESSAGES[slot];
  // 前と同じメッセージが連続しないように抽選
  const available = list.filter(m => m !== currentMessage);
  const nextMsg = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : list[0];

  currentSlot = slot;
  currentMessage = nextMsg;
  return nextMsg;
}

// DOM要素の参照
const stateWelcome = document.getElementById('state-welcome');
const stateCountdown = document.getElementById('state-countdown');
const stateMaturity = document.getElementById('state-maturity');

// ヘッダー・明るさ切り替え・設定
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');
const btnOpenSettings = document.getElementById('btn-open-settings');
const metaThemeColor = document.getElementById('meta-theme-color');

// オンボーディングフォーム
const formOnboarding = document.getElementById('form-onboarding');
const selectOnboardingWeeks = document.getElementById('onboarding-weeks');
const selectOnboardingDays = document.getElementById('onboarding-days');

// 設定モーダル
const modalSettings = document.getElementById('modal-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const formSettings = document.getElementById('form-settings');
const selectSettingsWeeks = document.getElementById('settings-weeks');
const selectSettingsDays = document.getElementById('settings-days');
const btnResetData = document.getElementById('btn-reset-data');
const btnMaturityReconfigure = document.getElementById('btn-maturity-reconfigure');

// カウントダウン画面要素（全画面キャンバス）
const displayCurrentWeeks = document.getElementById('display-current-weeks');
const badgeEndurance = document.getElementById('badge-endurance');
const countdownTargetLabel = document.getElementById('countdown-target-label');
const displayHours = document.getElementById('display-hours');
const displayDays = document.getElementById('display-days');
const celebrationArea = document.getElementById('celebration-area');
const celebrationMessage = document.getElementById('celebration-message');
const btnSwitchTo15 = document.getElementById('btn-switch-to-15');
// アプリケーションバージョン（version.jsonと連動）
const CURRENT_APP_VERSION = '1.0.2';
const TOAST_STORAGE_KEY = 'tsuwarin_just_updated';

const encouragementMessage = document.getElementById('encouragement-message');
const maturityWeeksDisplay = document.getElementById('maturity-weeks-display');
const toastUpdate = document.getElementById('toast-update');

// アプリケーション状態
let currentSettings = null;
let dayZeroMidnight = null;
let timerId = null;
let enduranceFadeTimeoutId = null;
let lastVersionCheckTime = 0;
let isUpdating = false;

// セッション管理状態（Session Lifecycle State: 決定論的セッション管理）
let currentSession = {
  active: false,
  sessionStartTime: 0,
  enduranceBadgeText: null
};

/**
 * セッション開始または復帰判定を行い、耐えた時間を評価する
 * - 前回のセッション終了（離脱）から30分以上経過している場合、新セッションとして耐えた時間を算出
 * - 30分未満の短期復帰や同一セッション中のOS/ブラウザイベントでは、既存のバッジ状態を保護・維持
 */
function evaluateSessionAndEndurance() {
  if (!currentSettings || !currentSettings.lastSessionEndTimestamp) {
    currentSession.enduranceBadgeText = null;
    renderEnduranceBadge();
    return;
  }

  const now = Date.now();
  const lastEnd = currentSettings.lastSessionEndTimestamp;
  const endurance = getElapsedEndurance(lastEnd, now);

  if (endurance && endurance.text) {
    // 30分以上経過: 新しいセッションの開始（前回の離脱からの耐えた時間を確定）
    currentSession.active = true;
    currentSession.sessionStartTime = now;
    currentSession.enduranceBadgeText = endurance.text;
  } else if (!currentSession.active) {
    // 初回起動時または30分未満でセッション未開始の場合
    currentSession.active = true;
    currentSession.sessionStartTime = now;
    currentSession.enduranceBadgeText = null;
  }
  // ※すでに currentSession.active === true かつ 30分未満の場合は
  // 同一セッション継続とみなし、既存の currentSession.enduranceBadgeText を不変維持

  renderEnduranceBadge();
}

/**
 * 耐えた時間バッジをセッション状態（State）に基づいてレンダリングする
 * DOM直接操作ではなく、currentSession.enduranceBadgeText に一元従属
 */
function renderEnduranceBadge() {
  if (!badgeEndurance) return;

  if (currentSession.enduranceBadgeText) {
    if (enduranceFadeTimeoutId) {
      clearTimeout(enduranceFadeTimeoutId);
      enduranceFadeTimeoutId = null;
    }
    badgeEndurance.textContent = currentSession.enduranceBadgeText;
    badgeEndurance.style.opacity = '1';
    badgeEndurance.classList.remove('hidden');

    // 6秒後に静かにオパシティを落ち着かせる（ベッドサイドでの眩しさを防止）
    enduranceFadeTimeoutId = setTimeout(() => {
      badgeEndurance.style.opacity = '0.75';
    }, 6000);
  } else {
    if (enduranceFadeTimeoutId) {
      clearTimeout(enduranceFadeTimeoutId);
      enduranceFadeTimeoutId = null;
    }
    badgeEndurance.classList.add('hidden');
  }
}

/**
 * テーマ管理（Day ☀️ / Night 🌙）
 */
const THEME_STORAGE_KEY = 'tsuwarin_theme';

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme);
  } else {
    // OS設定を参照
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  if (theme === 'dark') {
    themeIcon.textContent = '☀️';
    themeText.textContent = '昼';
    btnThemeToggle.setAttribute('aria-label', '昼モードに切り替える');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#16181D');
  } else {
    themeIcon.textContent = '🌙';
    themeText.textContent = '夜';
    btnThemeToggle.setAttribute('aria-label', '夜モード（暗い画面）に切り替える');
    if (metaThemeColor) metaThemeColor.setAttribute('content', '#FAF7F2');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/**
 * 今日のカレンダー日付を YYYY-MM-DD 形式で取得する
 * @returns {string}
 */
function getTodayDateStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 0〜40週の選択肢をセレクトボックスに注入する
 * @param {HTMLSelectElement} selectEl
 * @param {number} defaultVal
 */
function populateWeeksSelect(selectEl, defaultVal = 9) {
  selectEl.innerHTML = '';
  for (let w = 0; w <= 40; w++) {
    const opt = document.createElement('option');
    opt.value = w;
    opt.textContent = `${w}週`;
    if (w === defaultVal) opt.selected = true;
    selectEl.appendChild(opt);
  }
}

/**
 * 画面ステート（welcome / countdown / maturity）を切り替える
 * @param {'welcome'|'countdown'|'maturity'} stateName
 */
function showState(stateName) {
  stateWelcome.classList.toggle('hidden', stateName !== 'welcome');
  stateCountdown.classList.toggle('hidden', stateName !== 'countdown');
  stateMaturity.classList.toggle('hidden', stateName !== 'maturity');

  // 設定ボタンは初回ウェルカム画面では非表示
  if (btnOpenSettings) {
    btnOpenSettings.classList.toggle('hidden', stateName === 'welcome');
  }
}

/**
 * UIの描画と最新の計算結果の反映
 */
function render() {
  if (!currentSettings) {
    showState('welcome');
    return;
  }

  // 起点日（0週0日 0:00）の計算
  if (!dayZeroMidnight) {
    dayZeroMidnight = calcDayZeroMidnight(
      currentSettings.baseDateStr,
      currentSettings.baseWeeks,
      currentSettings.baseDays
    );
  }

  const now = new Date();
  const result = calcProgress(dayZeroMidnight, now, currentSettings.targetWeeks);

  // 15週を超過している場合（ステート3）
  if (result.isPost15Weeks) {
    showState('maturity');
    maturityWeeksDisplay.textContent = `現在 ${result.currentWeeks}週${result.currentDays}日`;
    return;
  }

  // 通常カウントダウン画面（ステート2）
  showState('countdown');

  // 現在週数表示
  displayCurrentWeeks.textContent = `${result.currentWeeks}週${result.currentDays}日`;

  // 目標達成判定
  if (result.isTargetReached) {
    displayHours.parentElement.classList.add('hidden');
    displayDays.classList.add('hidden');
    countdownTargetLabel.textContent = `${result.targetWeeks}週目を迎えました💐`;
    celebrationArea.classList.remove('hidden');

    if (result.targetWeeks === 12) {
      celebrationMessage.textContent = '12週目を迎えました！本当にお疲れ様でした💐体調はいかがですか？';
      btnSwitchTo15.classList.remove('hidden');
    } else {
      celebrationMessage.textContent = '15週目を迎えました！本当にお疲れ様でした💐体調はいかがですか？';
      btnSwitchTo15.classList.add('hidden');
    }
  } else {
    displayHours.parentElement.classList.remove('hidden');
    displayDays.classList.remove('hidden');
    celebrationArea.classList.add('hidden');

    countdownTargetLabel.textContent = `${result.targetWeeks}週目まで あと`;
    displayHours.textContent = result.remainingHours.toLocaleString('ja-JP');
    displayDays.textContent = `(約 ${result.remainingDays}日)`;
  }

  // 励ましメッセージ（時間帯連動・ポジティブメッセージ）
  const hour = now.getHours();
  let currentSlotCheck = 'night';
  if (hour >= 5 && hour < 11) currentSlotCheck = 'morning';
  else if (hour >= 11 && hour < 17) currentSlotCheck = 'daytime';
  else if (hour >= 17 && hour < 22) currentSlotCheck = 'evening';

  // 初回、または時間帯が変わった場合に更新
  if (!currentMessage || currentSlot !== currentSlotCheck) {
    encouragementMessage.innerHTML = getRandomMessageForCurrentTime();
  }
}

/**
 * アップデート直後のリロード後に控えめなトーストを表示する
 */
function showUpdateToastIfJustUpdated() {
  try {
    if (sessionStorage.getItem(TOAST_STORAGE_KEY)) {
      sessionStorage.removeItem(TOAST_STORAGE_KEY);
      if (!toastUpdate) return;
      toastUpdate.classList.remove('hidden');
      toastUpdate.classList.remove('fading');

      // 5秒間穏やかに表示したのち、フェードアウト
      setTimeout(() => {
        toastUpdate.classList.add('fading');
        setTimeout(() => {
          toastUpdate.classList.add('hidden');
        }, 800);
      }, 5000);
    }
  } catch (err) {
    // sessionStorageが無効なプライベートモード等でも静かに無視
  }
}

/**
 * サーバー上の version.json を確認し、新バージョンがあれば自動リロードする
 */
async function checkForAppUpdate() {
  if (isUpdating) return;
  const now = Date.now();
  // 前回のチェックから2分以内はスキップ（連続リクエスト抑制）
  if (now - lastVersionCheckTime < 2 * 60 * 1000) return;
  lastVersionCheckTime = now;

  try {
    const res = await fetch(`./version.json?_t=${now}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.version && data.version !== CURRENT_APP_VERSION) {
      isUpdating = true;
      // リロード後に「最新バージョンに更新しました」を表示するためのフラグ
      try {
        sessionStorage.setItem(TOAST_STORAGE_KEY, 'true');
      } catch (e) {}

      // キャッシュをバイパスして最新版を自動リロード
      window.location.reload();
    }
  } catch (err) {
    // オフライン時等は静かに無視
  }
}

/**
 * アプリケーションの復帰（Resume）ハンドラ
 * 画面スリープ解除、タブ切り替え、別アプリからの復帰時に正確に同期する
 */
function handleAppResume() {
  // 最新の設定を再読み込み
  currentSettings = loadSettings();
  if (!currentSettings) return;

  // 1. セッション状態の評価（30分以上離脱していれば新セッションとして再計算、未満なら既存状態維持）
  evaluateSessionAndEndurance();

  // 2. 時間帯メッセージのリセット（新しい時間帯への更新）
  currentMessage = '';

  // 3. UIの再描画（残り時間、週数など）
  render();

  // 4. 最新バージョンの有無をバックグラウンド確認
  checkForAppUpdate();
}

/**
 * アプリケーションの離脱ハンドラ
 * 画面を閉じた・非表示になった瞬間に正確な離脱時刻（lastSessionEndTimestamp）を保存
 */
function handleAppLeave() {
  const now = Date.now();
  recordSessionEnd(now);
  if (currentSettings) {
    currentSettings.lastSessionEndTimestamp = now;
    currentSettings.lastAccessTimestamp = now;
  }
}

/**
 * アプリケーションの初期化
 */
function init() {
  // テーマ初期化
  initTheme();

  // アップデート直後のリロード時、控えめな完了通知を表示
  showUpdateToastIfJustUpdated();

  // セレクトボックスの選択肢初期化
  populateWeeksSelect(selectOnboardingWeeks, 9);
  populateWeeksSelect(selectSettingsWeeks, 9);

  // LocalStorageから設定読み出し
  currentSettings = loadSettings();

  if (currentSettings) {
    render();
    evaluateSessionAndEndurance();
  } else {
    showState('welcome');
  }

  // 定期タイマー（毎分更新 & 定期的なバージョン確認 & 継続利用生存時刻の記録）
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    // バックグラウンド非表示時は余計な処理・タイムスタンプ更新を行わない
    if (document.visibilityState === 'hidden') return;
    render();
    recordSessionEnd();
    checkForAppUpdate();
  }, 60000);

  // 起動時の最新バージョン確認
  checkForAppUpdate();

  // 画面復帰・離脱イベント（Page Lifecycle API: iOS Safari / Android Chrome 完全対応）
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleAppResume();
    } else if (document.visibilityState === 'hidden') {
      handleAppLeave();
    }
  });

  // iOS Safari / bfcache 復帰時のイベント（persisted true の場合のみ復帰処理）
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      handleAppResume();
    }
  });

  // ウィンドウフォーカス復帰時のイベント（フォアグラウンド表示時のみ）
  window.addEventListener('focus', () => {
    if (document.visibilityState === 'visible') {
      handleAppResume();
    }
  });

  // ページアンロード・タブ離脱時の正確な離脱時刻保存
  window.addEventListener('pagehide', () => {
    handleAppLeave();
  });

  setupEventListeners();
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // 明るさ切り替えボタン
  btnThemeToggle.addEventListener('click', toggleTheme);

  // オンボーディングフォーム送信
  formOnboarding.addEventListener('submit', (e) => {
    e.preventDefault();
    const weeks = parseInt(selectOnboardingWeeks.value, 10);
    const days = parseInt(selectOnboardingDays.value, 10);
    const targetEl = formOnboarding.querySelector('input[name="targetChoice"]:checked');
    const targetWeeks = targetEl ? parseInt(targetEl.value, 10) : 12;

    const now = Date.now();
    currentSettings = saveSettings({
      baseDateStr: getTodayDateStr(),
      baseWeeks: weeks,
      baseDays: days,
      targetWeeks: targetWeeks,
      lastSessionEndTimestamp: now
    });

    currentSession.active = true;
    currentSession.sessionStartTime = now;
    currentSession.enduranceBadgeText = null;
    renderEnduranceBadge();

    dayZeroMidnight = null;
    render();
  });

  // 目標切り替え関数
  function switchTarget(target) {
    if (!currentSettings || currentSettings.targetWeeks === target) return;
    currentSettings.targetWeeks = target;
    saveSettings(currentSettings);
    render();
  }

  // 12週達成時の15週切り替えボタン
  btnSwitchTo15.addEventListener('click', () => switchTarget(15));

  // 設定モーダル開閉
  btnOpenSettings.addEventListener('click', openSettingsModal);
  btnMaturityReconfigure.addEventListener('click', openSettingsModal);
  btnCloseSettings.addEventListener('click', closeSettingsModal);

  modalSettings.addEventListener('click', (e) => {
    if (e.target === modalSettings) closeSettingsModal();
  });

  function openSettingsModal() {
    if (currentSettings) {
      // 起点日が未計算の場合は算出
      if (!dayZeroMidnight) {
        dayZeroMidnight = calcDayZeroMidnight(
          currentSettings.baseDateStr,
          currentSettings.baseWeeks,
          currentSettings.baseDays
        );
      }
      // 本日現在の最新の週数・日数を算出して初期選択値にする
      const progress = calcProgress(dayZeroMidnight, new Date(), currentSettings.targetWeeks);
      selectSettingsWeeks.value = String(progress.currentWeeks);
      selectSettingsDays.value = String(progress.currentDays);

      const radio = formSettings.querySelector(`input[name="settingsTarget"][value="${currentSettings.targetWeeks}"]`);
      if (radio) radio.checked = true;
    }
    modalSettings.classList.add('open');
  }

  function closeSettingsModal() {
    modalSettings.classList.remove('open');
  }

  // 設定変更フォーム送信
  formSettings.addEventListener('submit', (e) => {
    e.preventDefault();
    const weeks = parseInt(selectSettingsWeeks.value, 10);
    const days = parseInt(selectSettingsDays.value, 10);
    const targetEl = formSettings.querySelector('input[name="settingsTarget"]:checked');
    const targetWeeks = targetEl ? parseInt(targetEl.value, 10) : 12;

    currentSettings = saveSettings({
      baseDateStr: getTodayDateStr(),
      baseWeeks: weeks,
      baseDays: days,
      targetWeeks: targetWeeks,
      lastSessionEndTimestamp: currentSettings ? currentSettings.lastSessionEndTimestamp : Date.now()
    });

    dayZeroMidnight = null;
    closeSettingsModal();
    render();
  });

  // リセットボタン
  btnResetData.addEventListener('click', () => {
    if (confirm('設定をリセットして初期画面に戻しますか？')) {
      clearSettings();
      currentSettings = null;
      dayZeroMidnight = null;
      currentSession.active = false;
      currentSession.sessionStartTime = 0;
      currentSession.enduranceBadgeText = null;
      renderEnduranceBadge();
      closeSettingsModal();
      showState('welcome');
    }
  });
}

// アプリケーション起動
window.addEventListener('DOMContentLoaded', init);
