# 摂食嚥下 正文化穴抜き614 — 新規独立PWA版

このフォルダは、既存のPWAを上書きせずに新規アプリとして公開するための独立版です。

## 独立させている項目

- 公開フォルダ名: `swallow-cloze-614/`
- PWA manifest ID: `./swallow-cloze-614-independent-pwa`
- PWA scope: `./`
- Service Worker cache prefix: `swallow-cloze-614-independent-`
- 学習履歴 localStorage key: `swallow_cloze_614_independent_pwa_v1`

Service Workerは、このアプリ自身の旧キャッシュだけを削除します。他アプリのキャッシュは削除しません。
