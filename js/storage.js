/**
 * storage.js - LocalStorage 管理および耐えた時間計算モジュール
 */

const STORAGE_KEY = 'tsuwarin_settings_v1';

// インメモリフォールバック（プライベートブラウズモード等でlocalStorageが無効な場合）
let memoryStorage = null;

/**
 * LocalStorageから設定を読み出す
 * @returns {object|null} 保存されている設定オブジェクト、未設定時は null
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryStorage;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.baseWeeks === 'number' && typeof parsed.baseDays === 'number') {
      return parsed;
    }
  } catch (err) {
    console.warn('[tsuwarin] LocalStorage読み込み失敗、インメモリを使用します:', err);
    return memoryStorage;
  }
  return null;
}

/**
 * 設定をLocalStorageに保存する
 * @param {object} settings - 設定オブジェクト
 */
export function saveSettings(settings) {
  const payload = {
    version: 1,
    baseDateStr: settings.baseDateStr,
    baseWeeks: Number(settings.baseWeeks),
    baseDays: Number(settings.baseDays),
    targetWeeks: Number(settings.targetWeeks) || 12,
    lastAccessTimestamp: settings.lastAccessTimestamp || Date.now(),
    updatedAt: Date.now()
  };

  memoryStorage = payload;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[tsuwarin] LocalStorage保存失敗:', err);
  }
  return payload;
}

/**
 * 最終アクセス時刻を更新する
 * @param {number} [timestamp=Date.now()]
 */
export function updateLastAccess(timestamp = Date.now()) {
  const current = loadSettings();
  if (current) {
    current.lastAccessTimestamp = timestamp;
    saveSettings(current);
  }
}

/**
 * 前回アクセスからの経過時間（耐えた時間）を計算し、バッジ表示用データを返す
 * @param {number} lastAccessTimestamp - 前回のアクセスUNIXタイムスタンプ
 * @param {number} [currentTimestamp=Date.now()] - 現在のUNIXタイムスタンプ
 * @returns {object|null} バッジ表示データ { text, deltaHours }、または非表示の場合 null
 */
export function getElapsedEndurance(lastAccessTimestamp, currentTimestamp = Date.now()) {
  if (!lastAccessTimestamp || typeof lastAccessTimestamp !== 'number') {
    return null;
  }

  const deltaMs = currentTimestamp - lastAccessTimestamp;

  // 30分（1800秒）未満のリロードや連続操作時はバッジ非表示
  const thirtyMinutesMs = 30 * 60 * 1000;
  if (deltaMs < thirtyMinutesMs) {
    return null;
  }

  const deltaHours = Math.floor(deltaMs / (1000 * 60 * 60));

  // 24時間以上経過している場合
  if (deltaHours >= 24) {
    const days = Math.floor(deltaHours / 24);
    const remHours = deltaHours % 24;
    const timeText = remHours > 0 ? `${days}日${remHours}時間` : `${days}日`;
    return {
      text: `前回から +${timeText} 耐えましたね💐`,
      deltaHours
    };
  }

  // 1時間〜23時間経過している場合
  if (deltaHours >= 1) {
    return {
      text: `前回から +${deltaHours}時間 耐えましたね🌱`,
      deltaHours
    };
  }

  // 30分〜59分経過している場合
  return {
    text: `前回から +30分以上 耐えましたね🌱`,
    deltaHours: 0.5
  };
}

/**
 * 設定を初期化・削除する（リセット機能用）
 */
export function clearSettings() {
  memoryStorage = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[tsuwarin] LocalStorageクリア失敗:', err);
  }
}
