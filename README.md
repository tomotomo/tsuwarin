# tsuwarin 🌱 つわりカウントダウン

> **薄暗い寝室で横たわる奥様へ、出口までの安心と静寂を届けるWebアプリケーション**

[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-blue?style=flat-square&logo=github)](https://tomotomo.github.io/tsuwarin/)
[![Zero Build](https://img.shields.io/badge/Build-Zero%20Build%20(Pure%20Web)-brightgreen?style=flat-square)](./AGENTS.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 📖 コンセプト: 「ベッドサイド・サンクチュアリ」

妊娠初期のつわりに苦しむ妊婦さんが、**「薄暗い寝室やベッドで横たわりながらスマホを開く瞬間」** の体験を原点として作られたカウントダウンアプリです。

強い吐き気や倦怠感の中では、過剰な枠線、眩しい光、硬いフォント、そして「つわり」という直接的な病名テキストすらも心身への強い刺激になります。  
`tsuwarin` はそれらのノイズを極限まで削ぎ落とし、ただ静かに寄り添いながら「1分1秒、確実にゴールに近づいている安心感」を届けます。

---

## ✨ 主な特徴

### 1. 🌙 画面の明るさ切り替え（Day ☀️ / Night 🌙）を特等席へ
ベッドでの片手操作でも迷わないよう、ヘッダー右上に明るさ切り替えトグルを配置。  
暗い寝室で開いた瞬間でも、ワンタップで発光感を極限まで抑えた **「Night Sanctuary（低刺激ディープスレート）」** に切り替えられます。

### 2. 🌿 文字ノイズ・病名表記の排除
ヘッダー左のアプリ名をあえて非表示にしています。また、画面内から「つわり」「悪阻」といった直接的な言葉を排し、見るだけで気分が悪くなる心理的トリガーを防止しています。

### 3. 🌸 角のない優しいタイポグラフィ（Zen Maru Gothic 全面採用）
冷たく機械的な印象を与える幾何学フォントを廃止し、数字も含めてすべての文字に角が丸く柔らかい **`Zen Maru Gothic`**（等幅数字 `tabular-nums`）を採用しています。

### 4. 🔒 完全プライベート（ローカル完結）
入力した妊娠週数やアクセス日時は、端末の `localStorage` にのみ保存されます。外部サーバーへの通信やトラッキング、広告は一切ありません。

---

## 📱 スマートフォンでの推奨利用方法（ホーム画面追加）

本アプリは、ブラウザからホーム画面に追加してネイティブアプリのように利用するのが最もおすすめです。

<p align="center">
  <img src="./images/qr-githubpages.png" width="160" alt="tsuwarin 公式URL QRコード"><br>
  <a href="https://tomotomo.github.io/tsuwarin/">👉 https://tomotomo.github.io/tsuwarin/</a>
</p>

### iPhone (Safari)
1. 上記QRコードまたはURL（<https://tomotomo.github.io/tsuwarin/>）にアクセス
2. 画面下部の中央にある **「共有」アイコン（四角から矢印）** をタップ
3. メニューから **「ホーム画面に追加」** を選択

### Android (Chrome)
1. 上記QRコードまたはURL（<https://tomotomo.github.io/tsuwarin/>）にアクセス
2. 右上の **「︙（メニュー）」** をタップ
3. **「ホーム画面に追加」** または **「アプリをインストール」** を選択

---

## 🛠 開発・設計ドキュメント体系 (Documentation)

本プロジェクトは、AIエージェントおよび開発者が迷わず一貫した品質で開発・保守を行えるよう、**Single Source of Truth (SSOT / 信頼できる唯一の情報源) 原則** に基づきドキュメントの責務を分離しています。

| ドキュメント | 存在意義・対象読者 | 主な責務 (SSOT) |
| :--- | :--- | :--- |
| **[AGENTS.md](./AGENTS.md)** | **開発ガイドライン (AIエージェント / 開発者)** | 技術スタック、ディレクトリ構成、コーディング規約、ローカル起動・テスト検証手順、実装チェックリスト |
| **[PRD.md](./PRD.md)** | **プロダクト要求仕様書 (PdM / 開発者)** | 機能要件、週数計算仕様、セッション・目標定義、画面遷移 |
| **[DESIGN.md](./DESIGN.md)** | **ビジュアルデザイン仕様書 (デザイナー / 開発者)** | ベッドサイド・サンクチュアリ設計、デザイントークン、カラー、タイポグラフィ、a11y |
| **[README.md](./README.md)** | **プロジェクト概要 (一般ユーザー / 外部開発者)** | アプリのコンセプト、主な特徴、スマホでの使い方、ライセンス |

> 💡 **開発者・AIエージェント向け情報**  
> 開発サーバーの起動方法や自動検証テスト（`node tests/verify_session_lifecycle.mjs`）の実行手順、コーディング規約については **[AGENTS.md](./AGENTS.md)** をご覧ください。

---

## 📄 ライセンス

[MIT License](LICENSE)
