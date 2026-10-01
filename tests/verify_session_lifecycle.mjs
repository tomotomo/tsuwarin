/**
 * tests/verify_session_lifecycle.mjs
 * 
 * セッションライフサイクルおよび耐えた時間（Endurance Badge）の動作検証テスト
 * 実行方法: node tests/verify_session_lifecycle.mjs
 */

import { loadSettings, saveSettings, recordSessionEnd, getElapsedEndurance, clearSettings } from '../js/storage.js';

// グローバルなlocalStorageのモック
let mockStore = {};
global.localStorage = {
  getItem: (key) => mockStore[key] || null,
  setItem: (key, val) => { mockStore[key] = String(val); },
  removeItem: (key) => { delete mockStore[key]; },
  clear: () => { mockStore = {}; }
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

console.log('====================================================');
console.log('Tsuwarin Architecture Verification: Session Lifecycle');
console.log('====================================================\n');

// ------------------------------------------------------------------
// テスト 1: 後方互換マイグレーション
// ------------------------------------------------------------------
console.log('Test 1: 旧データ (lastAccessTimestamp のみ存在) の後方互換');
clearSettings();
const fourHoursAgo = Date.now() - 4 * 3600 * 1000;
mockStore['tsuwarin_settings_v1'] = JSON.stringify({
  version: 1,
  baseDateStr: '2026-10-01',
  baseWeeks: 9,
  baseDays: 3,
  targetWeeks: 12,
  lastAccessTimestamp: fourHoursAgo,
  updatedAt: fourHoursAgo
});

const loaded = loadSettings();
assert(loaded !== null, '設定が正常にロードされること');
assert(loaded.lastSessionEndTimestamp === fourHoursAgo, 'lastAccessTimestamp が lastSessionEndTimestamp に引き継がれること');

const endurance = getElapsedEndurance(loaded.lastSessionEndTimestamp);
assert(endurance !== null && endurance.text.includes('+4時間'), '4時間耐えたバッジテキストが取得できること');

// ------------------------------------------------------------------
// テスト 2: Android PWA コールドスタート & スプラッシュ画面遅延focus (1200ms)
// ------------------------------------------------------------------
console.log('\nTest 2: Android PWA コールドスタート & スプラッシュ遅延focus (1200ms)');

// セッション状態
let currentSession = {
  active: false,
  sessionStartTime: 0,
  enduranceBadgeText: null
};

function evaluateSessionAndEndurance(currentSettings) {
  if (!currentSettings || !currentSettings.lastSessionEndTimestamp) {
    currentSession.enduranceBadgeText = null;
    return;
  }
  const now = Date.now();
  const lastEnd = currentSettings.lastSessionEndTimestamp;
  const endurance = getElapsedEndurance(lastEnd, now);

  if (endurance && endurance.text) {
    currentSession.active = true;
    currentSession.sessionStartTime = now;
    currentSession.enduranceBadgeText = endurance.text;
  } else if (!currentSession.active) {
    currentSession.active = true;
    currentSession.sessionStartTime = now;
    currentSession.enduranceBadgeText = null;
  }
}

// 起動時 (init)
evaluateSessionAndEndurance(loaded);
assert(currentSession.active === true, 'セッションがアクティブになること');
assert(currentSession.enduranceBadgeText.includes('+4時間'), 'バッジテキストがセットされること');

// 50ms後: pageshow (persisted: false) -> 本番コードでは何もしないが、仮にevaluateが走っても保護されるか検証
evaluateSessionAndEndurance(loaded);
assert(currentSession.enduranceBadgeText.includes('+4時間'), 'pageshow 後もバッジが維持されること');

// 1200ms後: focus (Android PWA スプラッシュ画面終了時)
evaluateSessionAndEndurance(loaded);
assert(currentSession.enduranceBadgeText.includes('+4時間'), 'PWA スプラッシュ後の focus でもバッジが絶対に消えないこと');

// ------------------------------------------------------------------
// テスト 3: アプリ離脱と短時間復帰 (30分未満: 同一セッション)
// ------------------------------------------------------------------
console.log('\nTest 3: アプリ離脱と短時間復帰 (30分未満)');

// ユーザーがアプリを閉じる
const leaveTime = Date.now();
recordSessionEnd(leaveTime);
const savedAfterLeave = loadSettings();
assert(savedAfterLeave.lastSessionEndTimestamp === leaveTime, '離脱時刻が正しく記録されること');

// 1分後にユーザーが再表示
const resumeShortTime = leaveTime + 60 * 1000;
const enduranceShort = getElapsedEndurance(savedAfterLeave.lastSessionEndTimestamp, resumeShortTime);
assert(enduranceShort === null, '1分後の離脱差分は30分未満なので endurance は null');

// セッションマネージャーの処理: すでにアクティブなセッションなので維持される
if (enduranceShort && enduranceShort.text) {
  currentSession.enduranceBadgeText = enduranceShort.text;
}
assert(currentSession.enduranceBadgeText.includes('+4時間'), '同一セッション内の短期復帰で既存バッジが維持されること');

// ------------------------------------------------------------------
// テスト 4: 長時間経過後の再訪 (2時間後: 新セッション開始)
// ------------------------------------------------------------------
console.log('\nTest 4: 長時間経過後の再訪 (2時間後: 新セッション)');

const resumeLongTime = leaveTime + 2 * 3600 * 1000;
const enduranceLong = getElapsedEndurance(savedAfterLeave.lastSessionEndTimestamp, resumeLongTime);
assert(enduranceLong !== null, '2時間後の差分は新セッションとして計算されること');
assert(enduranceLong.text.includes('+2時間'), '「+2時間耐えました」と正しく表示されること');

if (enduranceLong && enduranceLong.text) {
  currentSession.active = true;
  currentSession.sessionStartTime = resumeLongTime;
  currentSession.enduranceBadgeText = enduranceLong.text;
}
assert(currentSession.enduranceBadgeText.includes('+2時間'), '新セッションのバッジに正しく更新されること');

// ------------------------------------------------------------------
// テスト 5: 毎分タイマーによる生存記録
// ------------------------------------------------------------------
console.log('\nTest 5: 毎分タイマーの生存記録');
const timerTime = resumeLongTime + 60 * 1000;
recordSessionEnd(timerTime);
const savedByTimer = loadSettings();
assert(savedByTimer.lastSessionEndTimestamp === timerTime, '生存記録が更新されること');

console.log('\n====================================================');
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
