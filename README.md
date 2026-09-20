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
1. 上記QRコードまたはURL（[https://tomotomo.github.io/tsuwarin/](https://tomotomo.github.io/tsuwarin/)）にアクセス
2. 画面下部の中央にある **「共有」アイコン（四角から矢印）** をタップ
3. メニューから **「ホーム画面に追加」** を選択

### Android (Chrome)
1. 公開URLにアクセス
2. 右上の **「︙（メニュー）」** をタップ
3. **「ホーム画面に追加」** または **「アプリをインストール」** を選択

---

## 🛠 技術スタック & アーキテクチャ原則

外部ツールへの依存を排した **「ゼロビルド・ピュアWebスタック」** で構築されています。

- **Markup**: セマンティック HTML5（アクセシビリティ `WCAG 2.1 AA` 配慮）
- **Styling**: Vanilla CSS3（CSSカスタムプロパティ、`rem` 基準タイポグラフィ、流体レイアウト `clamp()`）
- **Logic**: Vanilla JavaScript（ES Modules、純粋関数設計）
- **Typography**: Google Fonts（`Zen Maru Gothic`）
- **Hosting**: GitHub Pages（`main` ブランチのルート即時配信）

### ディレクトリ構成
```text
tsuwarin/
├── index.html         # アプリケーション構造・マークアップ
├── css/
│   └── style.css      # スタイル定義・カラーシステム・デザイントークン
├── js/
│   ├── app.js         # メインコントローラー・DOM操作・テーマ管理
│   ├── calculator.js  # 時間計算純粋関数（0:00カレンダー基準）
│   └── storage.js     # LocalStorage永続化・経過時間計算
├── AGENTS.md          # 普遍的開発規約・環境・検証手順
├── PRD.md             # プロダクト要求仕様書
├── DESIGN.md          # ビジュアルデザイン・情報設計書
└── README.md          # プロジェクト概要（本ファイル）
```

---

## 💻 ローカル開発 & 動作検証

ビルドツール（Node.js, npm, Vite 等）は不要です。標準の静的Webサーバーですぐに動作確認できます。

```bash
# プロジェクトルートでPythonサーバーを起動
python3 -m http.server 8000
```

起動後、ブラウザで `http://localhost:8000` にアクセスしてください。

---

## 📜 ドキュメント一覧

- **[PRD.md](./PRD.md)**: プロダクト要求仕様書（機能要件、カレンダー基準時間計算仕様）
- **[DESIGN.md](./DESIGN.md)**: ビジュアルデザイン仕様書（ベッドサイド・サンクチュアリ情報設計、カラーコード、タイプスケール）
- **[AGENTS.md](./AGENTS.md)**: 開発・実装ガイドライン（ゼロビルド原則、検証チェックリスト）

---

## 📄 ライセンス

[MIT License](LICENSE)
