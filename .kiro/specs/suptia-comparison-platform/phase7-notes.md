# Phase 7 検証メモ

## Lighthouse (手動)

- 実施日時: 未実施
- メモ: ローカルで `npm run lint` / `npm run test` 成功。Lighthouse 実測は pending。

## JSON-LD 検証

- ツール: Google Rich Results Test (手動想定)
- ステータス: ローカルで product / itemList / breadcrumb の JSON-LD 出力を確認。

## URL復元テスト

- 内容: 検索ページで価格/カテゴリ/目的/ページ番号を設定し、URLからの再読み込みで状態復元を確認。
- 結果: ✅ ローカルテスト済み。

## ソート安定性テスト

- メモ: Playwright E2E（search-flow）で主要シナリオ確認。
- 詳細な順序再現テストは手動で pending。

## CSP enforce 移行

- 現状: middleware.ts で strict CSP + nonce 設定済み。report-only → enforce 切替完了。

## 手動QA の残タスク

- [ ] Lighthouse 実測（モバイル/デスクトップ）
- [ ] JSON-LD を Rich Results Test で実機確認
- [ ] ソート安定性（複数リロードで順序を確認）
- [ ] 必要に応じてエラードリルダウンのスクリーンショット取得

（最終QAの前に上記 pending 項目の実測/スクリーンショットを追記予定）
