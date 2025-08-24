# GitHub設定ガイド

## 概要

このプロジェクトのGitHub設定について説明します。master/dev 2ブランチ体制に最適化された設定を行います。

## ブランチ保護設定

### masterブランチの保護

GitHub リポジトリの Settings > Branches で以下を設定：

#### Branch protection rules for `master`

```yaml
Branch name pattern: master

Protect matching branches:
  ✅ Require a pull request before merging
    ✅ Require approvals: 1
    ✅ Dismiss stale PR approvals when new commits are pushed
    ✅ Require review from code owners
  
  ✅ Require status checks to pass before merging
    ✅ Require branches to be up to date before merging
    Required status checks:
      - format:check
      - lint
      - test
      - typecheck
      - build
      - headers
      - jsonld
      - pr-dod-check
  
  ✅ Require conversation resolution before merging
  ✅ Require signed commits
  ✅ Require linear history
  ✅ Include administrators
  ✅ Allow force pushes: ❌ Disabled
  ✅ Allow deletions: ❌ Disabled
```

### devブランチの設定

#### Branch protection rules for `dev`

```yaml
Branch name pattern: dev

Protect matching branches:
  ✅ Require a pull request before merging: ❌ Disabled
    # devブランチは直接pushを許可
  
  ✅ Require status checks to pass before merging: ❌ Disabled
    # CI/CDは実行されるが、必須ではない
  
  ✅ Include administrators
  ✅ Allow force pushes: ✅ Enabled (開発用)
  ✅ Allow deletions: ❌ Disabled (常設ブランチのため)
```

## リポジトリ設定

### General Settings

```yaml
Repository name: suptia-kiro
Description: Suptia platform with Kiro AI development workflow

Features:
  ✅ Issues
  ✅ Projects
  ✅ Wiki: ❌ Disabled
  ✅ Discussions: ❌ Disabled

Pull Requests:
  ✅ Allow merge commits
  ✅ Allow squash merging
  ✅ Allow rebase merging
  ✅ Always suggest updating pull request branches
  ✅ Automatically delete head branches
  ✅ Allow auto-merge

Pushes:
  ✅ Limit pushes that create files larger than 100 MB
```

### Security Settings

```yaml
Security:
  ✅ Private vulnerability reporting
  ✅ Dependency graph
  ✅ Dependabot alerts
  ✅ Dependabot security updates
  ✅ Dependabot version updates

Code scanning:
  ✅ CodeQL analysis
  ✅ Secret scanning
  ✅ Push protection for secrets
```

## Actions設定

### Workflow permissions

```yaml
Actions permissions:
  ✅ Allow all actions and reusable workflows

Workflow permissions:
  ✅ Read and write permissions
  ✅ Allow GitHub Actions to create and approve pull requests
```

### Required workflows

以下のワークフローが必須チェックとして設定されています：

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - format:check
   - lint
   - test
   - typecheck
   - build
   - headers
   - jsonld
   - pr-dod-check

## ラベル設定

### 標準ラベル

```yaml
# Priority
- name: "priority: high"
  color: "d73a4a"
  description: "High priority issue or PR"

- name: "priority: medium"
  color: "fbca04"
  description: "Medium priority issue or PR"

- name: "priority: low"
  color: "0e8a16"
  description: "Low priority issue or PR"

# Type
- name: "type: bug"
  color: "d73a4a"
  description: "Something isn't working"

- name: "type: feature"
  color: "a2eeef"
  description: "New feature or request"

- name: "type: enhancement"
  color: "84b6eb"
  description: "Enhancement to existing feature"

- name: "type: documentation"
  color: "0075ca"
  description: "Improvements or additions to documentation"

- name: "type: refactor"
  color: "d4c5f9"
  description: "Code refactoring"

# Status
- name: "status: ready"
  color: "0e8a16"
  description: "Ready for development"

- name: "status: in progress"
  color: "fbca04"
  description: "Currently being worked on"

- name: "status: blocked"
  color: "d73a4a"
  description: "Blocked by external dependency"

- name: "status: needs review"
  color: "0052cc"
  description: "Needs code review"

# Automation
- name: "automerge"
  color: "7057ff"
  description: "Automatically merge when checks pass"

- name: "dependencies"
  color: "0366d6"
  description: "Pull requests that update a dependency file"
```

## Issue Templates

### Bug Report Template

```yaml
# .github/ISSUE_TEMPLATE/bug_report.yml
name: Bug Report
description: File a bug report
title: "[Bug]: "
labels: ["type: bug"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!
  
  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Also tell us, what did you expect to happen?
      placeholder: Tell us what you see!
    validations:
      required: true
  
  - type: dropdown
    id: browsers
    attributes:
      label: What browsers are you seeing the problem on?
      multiple: true
      options:
        - Firefox
        - Chrome
        - Safari
        - Microsoft Edge
  
  - type: textarea
    id: logs
    attributes:
      label: Relevant log output
      description: Please copy and paste any relevant log output.
      render: shell
```

### Feature Request Template

```yaml
# .github/ISSUE_TEMPLATE/feature_request.yml
name: Feature Request
description: Suggest an idea for this project
title: "[Feature]: "
labels: ["type: feature"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for suggesting a new feature!
  
  - type: textarea
    id: problem
    attributes:
      label: Is your feature request related to a problem?
      description: A clear and concise description of what the problem is.
      placeholder: I'm always frustrated when...
    validations:
      required: true
  
  - type: textarea
    id: solution
    attributes:
      label: Describe the solution you'd like
      description: A clear and concise description of what you want to happen.
    validations:
      required: true
  
  - type: textarea
    id: alternatives
    attributes:
      label: Describe alternatives you've considered
      description: A clear and concise description of any alternative solutions.
```

## Pull Request Template

```markdown
# .github/pull_request_template.md

## 概要
<!-- このPRの目的と変更内容を簡潔に説明してください -->

## 変更内容
<!-- 具体的な変更内容をリストアップしてください -->
- [ ] 
- [ ] 
- [ ] 

## テスト
<!-- テスト方法と結果を記載してください -->
- [ ] ローカルでテストが通過することを確認
- [ ] Preview環境で動作確認済み
- [ ] 必要に応じてE2Eテストを追加

## チェックリスト
- [ ] コードレビューの準備ができている
- [ ] ドキュメントを更新している（必要な場合）
- [ ] 破壊的変更がある場合は、マイグレーションガイドを作成
- [ ] セキュリティに関する変更がある場合は、セキュリティレビューを実施

## 関連Issue
<!-- 関連するIssueがあれば記載してください -->
Closes #

## スクリーンショット
<!-- UIに変更がある場合は、Before/Afterのスクリーンショットを添付してください -->

## 追加情報
<!-- その他、レビュアーに伝えたい情報があれば記載してください -->
```

## Webhooks設定

### Vercel連携

```yaml
Payload URL: https://api.vercel.com/v1/integrations/deploy/...
Content type: application/json
Secret: [Vercel Integration Secret]

Events:
  ✅ Push
  ✅ Pull request
```

### Slack通知（オプション）

```yaml
Payload URL: https://hooks.slack.com/services/...
Content type: application/json

Events:
  ✅ Push
  ✅ Pull request
  ✅ Issues
  ✅ Deployment status
```

## 自動化設定

### Dependabot設定

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/apps/web"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "automerge"
```

### Auto-merge設定

```yaml
# PRに "automerge" ラベルが付いている場合
# すべてのチェックが通過したら自動マージ

Conditions:
  - All required status checks pass
  - At least 1 approval
  - No requested changes
  - Label "automerge" is present
```

## 参考リンク

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)