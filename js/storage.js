/**
 * storage.js - LocalStorage 管理および耐えた時間計算モジュール
 * セッションライフサイクル（離脱時刻と耐えた時間の厳密管理）完全対応
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
      // 後方互換マイグレーション: 旧lastAccessTimestampを新lastSessionEndTimestampへ自動引き継ぎ
      if (!parsed.lastSessionEndTimestamp && parsed.lastAccessTimestamp) {
        parsed.lastSessionEndTimestamp = parsed.lastAccessTimestamp;
      }
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
  const sessionEnd = settings.lastSessionEndTimestamp ?? settings.lastAccessTimestamp ?? Date.now();
  const payload = {
    version: 1,
    baseDateStr: settings.baseDateStr,
    baseWeeks: Number(settings.baseWeeks),
    baseDays: Number(settings.baseDays),
    targetWeeks: Number(settings.targetWeeks) || 12,
    lastSessionEndTimestamp: sessionEnd,
    // 旧バージョンとの互換性のためlastAccessTimestampも同期保持
    lastAccessTimestamp: sessionEnd,
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
 * アプリ離脱時（セッション終了時）または継続利用中の最新時刻を記録する
 * @param {number} [timestamp=Date.now()]
 */
export function recordSessionEnd(timestamp = Date.now()) {
  const current = loadSettings();
  if (current) {
    current.lastSessionEndTimestamp = timestamp;
    current.lastAccessTimestamp = timestamp;
    saveSettings(current);
  }
}

/**
 * 互換用エイリアス
 */
export const updateLastAccess = recordSessionEnd;

/**
 * 前回セッション終了からの経過時間（耐えた時間）を計算し、バッジ表示用データを返す
 * @param {number} lastSessionEndTimestamp - 前回の離脱UNIXタイムスタンプ
 * @param {number} [currentTimestamp=Date.now()] - 現在のUNIXタイムスタンプ
 * @returns {object|null} バッジ表示データ { text, deltaHours }、または非表示の場合 null
 */
export function getElapsedEndurance(lastSessionEndTimestamp, currentTimestamp = Date.now()) {
  if (!lastSessionEndTimestamp || typeof lastSessionEndTimestamp !== 'number') {
    return null;
  }

  const deltaMs = currentTimestamp - lastSessionEndTimestamp;

  // 負の値（時計のズレや逆転）または30分（1800秒）未満のリロードや連続操作時はバッジ非表示
  const thirtyMinutesMs = 30 * 60 * 1000;
  if (deltaMs < thirtyMinutesMs || isNaN(deltaMs)) {
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

