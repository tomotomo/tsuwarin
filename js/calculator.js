/**
 * calculator.js - 週数・時間差分・進捗率計算専用モジュール（純粋関数）
 * 
 * 仕様原則:
 * 1. カレンダー日付（深夜 0:00）基準で「何週何日」が自動繰り上がる
 * 2. 目標期日の 00:00:00 までのミリ秒差分から、リアルタイムな残り時間（h）と残り日数（d）を算出
 * 3. 15週0日（105日目）以降は isPost15Weeks フラグを true とし、週数単体表示に切り替える
 */

/**
 * 妊娠0週0日の午前0時（起点日）の日時オブジェクトを算出する
 * @param {string} baseDateStr - 設定時のカレンダー日付 (例: "2026-09-20")
 * @param {number} baseWeeks - 設定時の週数 (0〜40)
 * @param {number} baseDays - 設定時の日数 (0〜6)
 * @returns {Date} 妊娠0週0日のローカル午前0時
 */
export function calcDayZeroMidnight(baseDateStr, baseWeeks, baseDays) {
  // YYYY-MM-DD 文字列からローカルタイムゾーンの日時を正確に生成
  const parts = baseDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  const baseMidnight = new Date(year, month, day, 0, 0, 0, 0);
  const totalBaseDays = (baseWeeks * 7) + baseDays;

  // 起点日 = 基準日 0:00 から totalBaseDays 日前の 0:00
  const dayZero = new Date(baseMidnight.getTime() - (totalBaseDays * 24 * 60 * 60 * 1000));
  return new Date(dayZero.getFullYear(), dayZero.getMonth(), dayZero.getDate(), 0, 0, 0, 0);
}

/**
 * 現在時刻と目標週数に基づき、進捗・残り時間・表示ステートを算出する
 * @param {Date} dayZeroMidnight - 妊娠0週0日の午前0時
 * @param {Date} [nowDate=new Date()] - 現在日時
 * @param {number} [targetWeeks=12] - 目標週数 (12 または 15)
 * @returns {object} 計算結果オブジェクト
 */
export function calcProgress(dayZeroMidnight, nowDate = new Date(), targetWeeks = 12) {
  // 今日のカレンダー日付の午前0時
  const todayMidnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0, 0);

  // 起点日からのカレンダー経過日数
  const msPerDay = 24 * 60 * 60 * 1000;
  const calendarDaysElapsed = Math.max(0, Math.floor((todayMidnight.getTime() - dayZeroMidnight.getTime()) / msPerDay));

  // 現在の妊娠週数・日数
  const currentWeeks = Math.floor(calendarDaysElapsed / 7);
  const currentDays = calendarDaysElapsed % 7;

  // 目標期日（targetWeeks週0日の午前0時）
  const targetDays = targetWeeks * 7;
  const targetMidnight = new Date(dayZeroMidnight.getTime() + (targetDays * msPerDay));

  // 目標までの残り時間（ミリ秒）
  const remainingMs = Math.max(0, targetMidnight.getTime() - nowDate.getTime());
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  
  // 残り日数（d）: あと何日乗り切ればよいか（残り時間から算出）
  const remainingDays = Math.ceil(remainingHours / 24);

  // 目標までの進捗パーセント (0週0日 〜 目標期日0:00)
  const totalTargetMs = targetDays * msPerDay;
  const elapsedExactMs = Math.max(0, nowDate.getTime() - dayZeroMidnight.getTime());
  const progressPercent = Math.min(100, Math.max(0, (elapsedExactMs / totalTargetMs) * 100));

  // 15週達成判定: 15週0日（105日）に達しているか
  const isPost15Weeks = calendarDaysElapsed >= (15 * 7);

  // 現在の目標週に到達したか
  const isTargetReached = remainingMs <= 0;

  // PRD指定フォーマット: 「W週D日 {目標週}週目まであとh時間(d日)」
  const formattedText = `${currentWeeks}週${currentDays}日 ${targetWeeks}週目まであと${remainingHours}時間(${remainingDays}日)`;

  return {
    calendarDaysElapsed,
    currentWeeks,
    currentDays,
    targetWeeks,
    remainingMs,
    remainingHours,
    remainingDays,
    progressPercent: Math.round(progressPercent * 10) / 10, // 小数点第1位まで
    isPost15Weeks,
    isTargetReached,
    formattedText
  };
}
