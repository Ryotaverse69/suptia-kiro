/**
 * 品質ダッシュボード
 * 
 * リアルタイム品質状況の表示、品質アラートの管理、
 * 品質改善の進捗追跡、品質目標の設定と監視を提供します。
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { QualityAssuranceController, QualityCheckResult, QualityIssue } from './quality-assurance-controller';
import { QualityReportGenerator, QualityReport, QualityMetrics } from './quality-report-generator';

/**
 * 品質アラート
 */
export interface QualityAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  createdAt: Date;
  resolvedAt?: Date;
  isActive: boolean;
  severity: 'high' | 'medium' | 'low';
  category: string;
  actionRequired: boolean;
  relatedIssues: string[];
  metadata?: Record<string, any>;
}

/**
 * 品質目標
 */
export interface QualityTarget {
  id: string;
  name: string;
  description: string;
  category: 'overall' | 'reliability' | 'performance' | 'maintainability' | 'security';
  targetValue: number;
  currentValue: number;
  unit: string;
  threshold: {
    critical: number;
    warning: number;
    good: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
}

/**
 * 品質改善タスク
 */
export interface QualityImprovementTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  estimatedEffort: number; // 時間（時）
  actualEffort?: number;
  relatedIssues: string[];
  progress: number; // 0-100%
  blockers: string[];
  dependencies: string[];
}

/**
 * ダッシュボード設定
 */
export interface DashboardConfig {
  refreshInterval: number; // 秒
  alertRetentionDays: number;
  enableRealTimeUpdates: boolean;
  displayMetrics: string[];
  alertThresholds: {
    criticalScore: number;
    warningScore: number;
    performanceThreshold: number;
  };
  notifications: {
    email: boolean;
    slack: boolean;
    webhook?: string;
  };
}

/**
 * ダッシュボードデータ
 */
export interface DashboardData {
  timestamp: Date;
  summary: {
    overallScore: number;
    trend: 'improving' | 'stable' | 'declining';
    activeAlerts: number;
    criticalIssues: number;
    completedTasks: number;
    totalTasks: number;
  };
  metrics: QualityMetrics;
  alerts: QualityAlert[];
  targets: QualityTarget[];
  tasks: QualityImprovementTask[];
  recentActivity: ActivityEntry[];
  charts: {
    scoreHistory: ChartData;
    alertTrends: ChartData;
    taskProgress: ChartData;
    categoryBreakdown: ChartData;
  };
}

/**
 * アクティビティエントリ
 */
export interface ActivityEntry {
  id: string;
  timestamp: Date;
  type: 'issue_detected' | 'issue_resolved' | 'alert_created' | 'task_completed' | 'target_updated';
  title: string;
  description: string;
  severity?: 'high' | 'medium' | 'low';
  category: string;
  metadata?: Record<string, any>;
}

/**
 * チャートデータ
 */
export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'gauge';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
  options?: Record<string, any>;
}

/**
 * 品質ダッシュボード
 */
export class QualityDashboard {
  private qaController: QualityAssuranceController;
  private reportGenerator: QualityReportGenerator;
  private dashboardPath: string;
  private config: DashboardConfig;
  private alerts: QualityAlert[] = [];
  private targets: QualityTarget[] = [];
  private tasks: QualityImprovementTask[] = [];
  private activityLog: ActivityEntry[] = [];
  private initialized: boolean = false;

  constructor() {
    this.qaController = new QualityAssuranceController();
    this.reportGenerator = new QualityReportGenerator();
    this.dashboardPath = '.kiro/reports/quality/dashboard';
    
    // デフォルト設定
    this.config = {
      refreshInterval: 300, // 5分
      alertRetentionDays: 30,
      enableRealTimeUpdates: true,
      displayMetrics: ['overallScore', 'reliability', 'performance', 'maintainability', 'security'],
      alertThresholds: {
        criticalScore: 50,
        warningScore: 70,
        performanceThreshold: 100
      },
      notifications: {
        email: false,
        slack: false
      }
    };
  }

  /**
   * ダッシュボードの初期化
   */
  async initialize(): Promise<void> {
    try {
      console.log('📊 品質ダッシュボードを初期化中...');

      // 依存コンポーネントの初期化
      await this.qaController.initialize();
      await this.reportGenerator.initialize();

      // ダッシュボードディレクトリの作成
      await fs.mkdir(this.dashboardPath, { recursive: true });
      await fs.mkdir(join(this.dashboardPath, 'alerts'), { recursive: true });
      await fs.mkdir(join(this.dashboardPath, 'targets'), { recursive: true });
      await fs.mkdir(join(this.dashboardPath, 'tasks'), { recursive: true });

      // 設定とデータの読み込み
      await this.loadConfig();
      await this.loadAlerts();
      await this.loadTargets();
      await this.loadTasks();
      await this.loadActivityLog();

      // デフォルト目標の設定
      await this.setupDefaultTargets();

      this.initialized = true;
      console.log('✅ 品質ダッシュボードの初期化が完了しました');
    } catch (error) {
      console.error('❌ 品質ダッシュボードの初期化に失敗:', error);
      throw error;
    }
  }

  /**
   * ダッシュボードデータの取得
   */
  async getDashboardData(): Promise<DashboardData> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('📊 ダッシュボードデータを取得中...');

    // 最新の品質チェックを実行
    const qualityResult = await this.qaController.performQualityCheck();
    
    // 品質レポートを生成
    const report = await this.reportGenerator.generateComprehensiveReport(qualityResult, {
      includeTrends: true,
      includeCharts: true,
      includeRecommendations: true,
      periodDays: 7
    });

    // アラートの更新
    await this.updateAlerts(qualityResult);

    // 目標の更新
    await this.updateTargets(report.metrics);

    // サマリーの計算
    const summary = {
      overallScore: report.metrics.overallScore,
      trend: report.summary.trend,
      activeAlerts: this.alerts.filter(a => a.isActive).length,
      criticalIssues: qualityResult.summary.critical,
      completedTasks: this.tasks.filter(t => t.status === 'completed').length,
      totalTasks: this.tasks.length
    };

    // チャートデータの生成
    const charts = await this.generateDashboardCharts(report, qualityResult);

    const dashboardData: DashboardData = {
      timestamp: new Date(),
      summary,
      metrics: report.metrics,
      alerts: this.alerts.filter(a => a.isActive).slice(0, 10), // 最新10件のアクティブアラート
      targets: this.targets.filter(t => t.isActive),
      tasks: this.tasks.filter(t => t.status !== 'cancelled').slice(0, 20), // 最新20件のタスク
      recentActivity: this.activityLog.slice(-20), // 最新20件のアクティビティ
      charts
    };

    // ダッシュボードデータの保存
    await this.saveDashboardData(dashboardData);

    console.log('✅ ダッシュボードデータの取得が完了しました');
    return dashboardData;
  }

  /**
   * アラートの更新
   */
  private async updateAlerts(qualityResult: QualityCheckResult): Promise<void> {
    const newAlerts: QualityAlert[] = [];

    // 重大な問題に対するアラート
    const criticalIssues = qualityResult.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      newAlerts.push({
        id: `critical-issues-${Date.now()}`,
        type: 'critical',
        title: '重大な問題が検出されました',
        message: `${criticalIssues.length}件の重大な問題が検出されています。即座の対応が必要です。`,
        createdAt: new Date(),
        isActive: true,
        severity: 'high',
        category: 'reliability',
        actionRequired: true,
        relatedIssues: criticalIssues.map(i => i.id)
      });
    }

    // パフォーマンス問題に対するアラート
    const performanceIssues = qualityResult.issues.filter(i => i.type === 'PERFORMANCE_DEGRADATION');
    if (performanceIssues.length > 0) {
      newAlerts.push({
        id: `performance-issues-${Date.now()}`,
        type: 'warning',
        title: 'パフォーマンス問題が検出されました',
        message: `${performanceIssues.length}件のパフォーマンス問題が検出されています。`,
        createdAt: new Date(),
        isActive: true,
        severity: 'medium',
        category: 'performance',
        actionRequired: true,
        relatedIssues: performanceIssues.map(i => i.id)
      });
    }

    // 品質スコアに基づくアラート
    const overallScore = await this.calculateOverallScore(qualityResult);
    if (overallScore < this.config.alertThresholds.criticalScore) {
      newAlerts.push({
        id: `low-quality-score-${Date.now()}`,
        type: 'critical',
        title: '品質スコアが危険レベルです',
        message: `品質スコアが${overallScore}点と危険レベル（${this.config.alertThresholds.criticalScore}点未満）に達しています。`,
        createdAt: new Date(),
        isActive: true,
        severity: 'high',
        category: 'overall',
        actionRequired: true,
        relatedIssues: [],
        metadata: { score: overallScore, threshold: this.config.alertThresholds.criticalScore }
      });
    } else if (overallScore < this.config.alertThresholds.warningScore) {
      newAlerts.push({
        id: `warning-quality-score-${Date.now()}`,
        type: 'warning',
        title: '品質スコアが警告レベルです',
        message: `品質スコアが${overallScore}点と警告レベル（${this.config.alertThresholds.warningScore}点未満）に達しています。`,
        createdAt: new Date(),
        isActive: true,
        severity: 'medium',
        category: 'overall',
        actionRequired: false,
        relatedIssues: [],
        metadata: { score: overallScore, threshold: this.config.alertThresholds.warningScore }
      });
    }

    // 新しいアラートを追加
    for (const alert of newAlerts) {
      // 重複チェック
      const existingAlert = this.alerts.find(a => 
        a.type === alert.type && 
        a.category === alert.category && 
        a.isActive
      );

      if (!existingAlert) {
        this.alerts.push(alert);
        await this.logActivity({
          id: `activity-${Date.now()}`,
          timestamp: new Date(),
          type: 'alert_created',
          title: `アラート作成: ${alert.title}`,
          description: alert.message,
          severity: alert.severity,
          category: alert.category,
          metadata: { alertId: alert.id }
        });
      }
    }

    // 古いアラートの解決
    await this.resolveOldAlerts();

    // アラートの保存
    await this.saveAlerts();
  }

  /**
   * 目標の更新
   */
  private async updateTargets(metrics: QualityMetrics): Promise<void> {
    for (const target of this.targets) {
      if (!target.isActive) continue;

      let currentValue = 0;
      switch (target.category) {
        case 'overall':
          currentValue = metrics.overallScore;
          break;
        case 'reliability':
          currentValue = metrics.categories.reliability;
          break;
        case 'performance':
          currentValue = metrics.categories.performance;
          break;
        case 'maintainability':
          currentValue = metrics.categories.maintainability;
          break;
        case 'security':
          currentValue = metrics.categories.security;
          break;
      }

      const previousValue = target.currentValue;
      target.currentValue = currentValue;
      target.updatedAt = new Date();

      // 目標達成のチェック
      if (previousValue < target.targetValue && currentValue >= target.targetValue) {
        await this.logActivity({
          id: `activity-${Date.now()}`,
          timestamp: new Date(),
          type: 'target_updated',
          title: `目標達成: ${target.name}`,
          description: `${target.name}が目標値${target.targetValue}${target.unit}に達しました（現在値: ${currentValue}${target.unit}）`,
          severity: 'low',
          category: target.category,
          metadata: { targetId: target.id, previousValue, currentValue }
        });
      }
    }

    await this.saveTargets();
  }

  /**
   * ダッシュボード用チャートデータの生成
   */
  private async generateDashboardCharts(
    report: QualityReport,
    qualityResult: QualityCheckResult
  ): Promise<DashboardData['charts']> {
    // スコア履歴チャート
    const scoreHistory: ChartData = {
      type: 'line',
      title: '品質スコア履歴（7日間）',
      labels: report.trends.map(t => t.date),
      datasets: [{
        label: '品質スコア',
        data: report.trends.map(t => t.score),
        borderColor: '#4CAF50',
        borderWidth: 2
      }],
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    };

    // アラート傾向チャート
    const alertTrends: ChartData = {
      type: 'bar',
      title: 'アラート発生傾向',
      labels: ['重大', '警告', '情報'],
      datasets: [{
        label: 'アラート数',
        data: [
          this.alerts.filter(a => a.type === 'critical' && a.isActive).length,
          this.alerts.filter(a => a.type === 'warning' && a.isActive).length,
          this.alerts.filter(a => a.type === 'info' && a.isActive).length
        ],
        backgroundColor: ['#F44336', '#FF9800', '#2196F3']
      }]
    };

    // タスク進捗チャート
    const taskProgress: ChartData = {
      type: 'doughnut',
      title: 'タスク進捗状況',
      labels: ['完了', '進行中', '待機中'],
      datasets: [{
        label: 'タスク数',
        data: [
          this.tasks.filter(t => t.status === 'completed').length,
          this.tasks.filter(t => t.status === 'in_progress').length,
          this.tasks.filter(t => t.status === 'pending').length
        ],
        backgroundColor: ['#4CAF50', '#FF9800', '#9E9E9E']
      }]
    };

    // カテゴリ別内訳チャート
    const categoryBreakdown: ChartData = {
      type: 'bar',
      title: 'カテゴリ別品質スコア',
      labels: ['信頼性', 'パフォーマンス', '保守性', 'セキュリティ'],
      datasets: [{
        label: 'スコア',
        data: [
          report.metrics.categories.reliability,
          report.metrics.categories.performance,
          report.metrics.categories.maintainability,
          report.metrics.categories.security
        ],
        backgroundColor: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0']
      }],
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    };

    return {
      scoreHistory,
      alertTrends,
      taskProgress,
      categoryBreakdown
    };
  }

  /**
   * アラートの作成
   */
  async createAlert(alert: Omit<QualityAlert, 'id' | 'createdAt' | 'isActive'>): Promise<QualityAlert> {
    const newAlert: QualityAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      createdAt: new Date(),
      isActive: true
    };

    this.alerts.push(newAlert);
    await this.saveAlerts();

    await this.logActivity({
      id: `activity-${Date.now()}`,
      timestamp: new Date(),
      type: 'alert_created',
      title: `アラート作成: ${newAlert.title}`,
      description: newAlert.message,
      severity: newAlert.severity,
      category: newAlert.category,
      metadata: { alertId: newAlert.id }
    });

    return newAlert;
  }

  /**
   * アラートの解決
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert || !alert.isActive) {
      return false;
    }

    alert.isActive = false;
    alert.resolvedAt = new Date();
    await this.saveAlerts();

    await this.logActivity({
      id: `activity-${Date.now()}`,
      timestamp: new Date(),
      type: 'alert_created', // 解決もalert_createdとして記録
      title: `アラート解決: ${alert.title}`,
      description: `アラートが解決されました: ${alert.message}`,
      severity: 'low',
      category: alert.category,
      metadata: { alertId: alert.id }
    });

    return true;
  }

  /**
   * 品質目標の作成
   */
  async createTarget(target: Omit<QualityTarget, 'id' | 'createdAt' | 'updatedAt' | 'currentValue'>): Promise<QualityTarget> {
    const newTarget: QualityTarget = {
      ...target,
      id: `target-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentValue: 0
    };

    this.targets.push(newTarget);
    await this.saveTargets();

    return newTarget;
  }

  /**
   * 品質目標の更新
   */
  async updateTarget(targetId: string, updates: Partial<QualityTarget>): Promise<boolean> {
    const target = this.targets.find(t => t.id === targetId);
    if (!target) {
      return false;
    }

    Object.assign(target, updates, { updatedAt: new Date() });
    await this.saveTargets();

    await this.logActivity({
      id: `activity-${Date.now()}`,
      timestamp: new Date(),
      type: 'target_updated',
      title: `目標更新: ${target.name}`,
      description: `品質目標が更新されました`,
      severity: 'low',
      category: target.category,
      metadata: { targetId: target.id }
    });

    return true;
  }

  /**
   * 改善タスクの作成
   */
  async createTask(task: Omit<QualityImprovementTask, 'id' | 'createdAt' | 'updatedAt' | 'progress'>): Promise<QualityImprovementTask> {
    const newTask: QualityImprovementTask = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0
    };

    this.tasks.push(newTask);
    await this.saveTasks();

    return newTask;
  }

  /**
   * 改善タスクの更新
   */
  async updateTask(taskId: string, updates: Partial<QualityImprovementTask>): Promise<boolean> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      return false;
    }

    const previousStatus = task.status;
    Object.assign(task, updates, { updatedAt: new Date() });

    // 完了時の処理
    if (previousStatus !== 'completed' && task.status === 'completed') {
      task.completedAt = new Date();
      task.progress = 100;

      await this.logActivity({
        id: `activity-${Date.now()}`,
        timestamp: new Date(),
        type: 'task_completed',
        title: `タスク完了: ${task.title}`,
        description: `改善タスクが完了しました`,
        severity: 'low',
        category: task.category,
        metadata: { taskId: task.id }
      });
    }

    await this.saveTasks();
    return true;
  }

  /**
   * ダッシュボード設定の更新
   */
  async updateConfig(updates: Partial<DashboardConfig>): Promise<void> {
    Object.assign(this.config, updates);
    await this.saveConfig();
  }

  /**
   * HTMLダッシュボードの生成
   */
  async generateHtmlDashboard(): Promise<string> {
    const data = await this.getDashboardData();
    
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>品質ダッシュボード</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .dashboard { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { color: #333; margin-bottom: 10px; }
        .last-updated { color: #666; font-size: 14px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .summary-value { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
        .summary-label { color: #666; font-size: 14px; }
        .score-excellent { color: #4CAF50; }
        .score-good { color: #8BC34A; }
        .score-warning { color: #FF9800; }
        .score-critical { color: #F44336; }
        .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .main-content { display: flex; flex-direction: column; gap: 20px; }
        .sidebar { display: flex; flex-direction: column; gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h2 { color: #333; margin-bottom: 15px; font-size: 18px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .metric-item { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 6px; }
        .metric-value { font-size: 1.8em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 12px; }
        .alert { padding: 12px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid; }
        .alert-critical { background: #ffebee; border-color: #f44336; }
        .alert-warning { background: #fff3e0; border-color: #ff9800; }
        .alert-info { background: #e3f2fd; border-color: #2196f3; }
        .alert-title { font-weight: bold; margin-bottom: 5px; }
        .alert-message { font-size: 14px; color: #666; }
        .target { padding: 12px; margin-bottom: 10px; background: #f8f9fa; border-radius: 6px; }
        .target-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .target-name { font-weight: bold; }
        .target-value { font-size: 14px; color: #666; }
        .progress-bar { width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: #4CAF50; transition: width 0.3s ease; }
        .task { padding: 12px; margin-bottom: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #2196f3; }
        .task-header { display: flex; justify-content: between; align-items: center; margin-bottom: 5px; }
        .task-title { font-weight: bold; flex: 1; }
        .task-status { padding: 2px 8px; border-radius: 12px; font-size: 12px; color: white; }
        .status-completed { background: #4CAF50; }
        .status-in_progress { background: #FF9800; }
        .status-pending { background: #9E9E9E; }
        .activity { padding: 8px 0; border-bottom: 1px solid #eee; }
        .activity:last-child { border-bottom: none; }
        .activity-time { font-size: 12px; color: #999; }
        .activity-title { font-weight: bold; margin: 2px 0; }
        .activity-desc { font-size: 14px; color: #666; }
        .refresh-btn { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .refresh-btn:hover { background: #45a049; }
        @media (max-width: 768px) {
            .content-grid { grid-template-columns: 1fr; }
            .summary-grid { grid-template-columns: repeat(2, 1fr); }
            .metrics-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🏆 品質ダッシュボード</h1>
            <div class="last-updated">最終更新: ${data.timestamp.toLocaleString('ja-JP')}</div>
            <button class="refresh-btn" onclick="location.reload()">🔄 更新</button>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value ${this.getScoreClass(data.summary.overallScore)}">${data.summary.overallScore}</div>
                <div class="summary-label">全体スコア</div>
            </div>
            <div class="summary-card">
                <div class="summary-value ${data.summary.activeAlerts > 0 ? 'score-critical' : 'score-excellent'}">${data.summary.activeAlerts}</div>
                <div class="summary-label">アクティブアラート</div>
            </div>
            <div class="summary-card">
                <div class="summary-value ${data.summary.criticalIssues > 0 ? 'score-critical' : 'score-excellent'}">${data.summary.criticalIssues}</div>
                <div class="summary-label">重大な問題</div>
            </div>
            <div class="summary-card">
                <div class="summary-value score-excellent">${data.summary.completedTasks}/${data.summary.totalTasks}</div>
                <div class="summary-label">完了タスク</div>
            </div>
        </div>

        <div class="content-grid">
            <div class="main-content">
                <div class="card">
                    <h2>📊 品質メトリクス</h2>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <div class="metric-value ${this.getScoreClass(data.metrics.categories.reliability)}">${data.metrics.categories.reliability}</div>
                            <div class="metric-label">信頼性</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value ${this.getScoreClass(data.metrics.categories.performance)}">${data.metrics.categories.performance}</div>
                            <div class="metric-label">パフォーマンス</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value ${this.getScoreClass(data.metrics.categories.maintainability)}">${data.metrics.categories.maintainability}</div>
                            <div class="metric-label">保守性</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value ${this.getScoreClass(data.metrics.categories.security)}">${data.metrics.categories.security}</div>
                            <div class="metric-label">セキュリティ</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h2>🎯 品質目標</h2>
                    ${data.targets.map(target => `
                        <div class="target">
                            <div class="target-header">
                                <span class="target-name">${target.name}</span>
                                <span class="target-value">${target.currentValue}/${target.targetValue} ${target.unit}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(100, (target.currentValue / target.targetValue) * 100)}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="card">
                    <h2>📋 改善タスク</h2>
                    ${data.tasks.slice(0, 10).map(task => `
                        <div class="task">
                            <div class="task-header">
                                <span class="task-title">${task.title}</span>
                                <span class="task-status status-${task.status}">${this.getStatusText(task.status)}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${task.progress}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="sidebar">
                <div class="card">
                    <h2>🚨 アクティブアラート</h2>
                    ${data.alerts.length > 0 ? data.alerts.map(alert => `
                        <div class="alert alert-${alert.type}">
                            <div class="alert-title">${alert.title}</div>
                            <div class="alert-message">${alert.message}</div>
                        </div>
                    `).join('') : '<p style="color: #666; text-align: center;">アクティブなアラートはありません</p>'}
                </div>

                <div class="card">
                    <h2>📈 最近のアクティビティ</h2>
                    ${data.recentActivity.slice(0, 10).map(activity => `
                        <div class="activity">
                            <div class="activity-time">${activity.timestamp.toLocaleString('ja-JP')}</div>
                            <div class="activity-title">${activity.title}</div>
                            <div class="activity-desc">${activity.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>

    <script>
        // 自動更新（設定された間隔で）
        setTimeout(() => {
            location.reload();
        }, ${this.config.refreshInterval * 1000});
    </script>
</body>
</html>`;

    // HTMLファイルとして保存
    const htmlPath = join(this.dashboardPath, 'dashboard.html');
    await fs.writeFile(htmlPath, html);
    console.log(`📄 HTMLダッシュボードを保存: ${htmlPath}`);

    return html;
  }

  /**
   * スコアに基づくCSSクラスの取得
   */
  private getScoreClass(score: number): string {
    if (score >= 90) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-warning';
    return 'score-critical';
  }

  /**
   * ステータステキストの取得
   */
  private getStatusText(status: string): string {
    switch (status) {
      case 'completed': return '完了';
      case 'in_progress': return '進行中';
      case 'pending': return '待機中';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  }

  /**
   * デフォルト目標の設定
   */
  private async setupDefaultTargets(): Promise<void> {
    const defaultTargets = [
      {
        name: '全体品質スコア',
        description: 'システム全体の品質スコアを90点以上に維持',
        category: 'overall' as const,
        targetValue: 90,
        unit: '点',
        threshold: { critical: 50, warning: 70, good: 90 },
        isActive: true
      },
      {
        name: 'システム信頼性',
        description: 'システムの信頼性スコアを85点以上に維持',
        category: 'reliability' as const,
        targetValue: 85,
        unit: '点',
        threshold: { critical: 60, warning: 75, good: 85 },
        isActive: true
      },
      {
        name: 'パフォーマンス',
        description: 'パフォーマンススコアを80点以上に維持',
        category: 'performance' as const,
        targetValue: 80,
        unit: '点',
        threshold: { critical: 50, warning: 65, good: 80 },
        isActive: true
      }
    ];

    for (const targetData of defaultTargets) {
      const existingTarget = this.targets.find(t => t.name === targetData.name);
      if (!existingTarget) {
        await this.createTarget(targetData);
      }
    }
  }

  /**
   * 全体スコアの計算
   */
  private async calculateOverallScore(qualityResult: QualityCheckResult): Promise<number> {
    let score = 100;
    score -= qualityResult.summary.critical * 20;
    score -= qualityResult.summary.high * 10;
    score -= qualityResult.summary.medium * 5;
    score -= qualityResult.summary.low * 2;
    return Math.max(0, score);
  }

  /**
   * 古いアラートの解決
   */
  private async resolveOldAlerts(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.alertRetentionDays);

    for (const alert of this.alerts) {
      if (alert.isActive && alert.createdAt < cutoffDate) {
        alert.isActive = false;
        alert.resolvedAt = new Date();
      }
    }
  }

  /**
   * アクティビティログの記録
   */
  private async logActivity(activity: ActivityEntry): Promise<void> {
    this.activityLog.push(activity);
    
    // ログサイズの制限（最新1000件まで）
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-1000);
    }

    await this.saveActivityLog();
  }

  /**
   * 設定の読み込み
   */
  private async loadConfig(): Promise<void> {
    try {
      const configPath = join(this.dashboardPath, 'config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const savedConfig = JSON.parse(content);
      this.config = { ...this.config, ...savedConfig };
    } catch (error) {
      // 設定ファイルが存在しない場合はデフォルト設定を使用
      await this.saveConfig();
    }
  }

  /**
   * 設定の保存
   */
  private async saveConfig(): Promise<void> {
    const configPath = join(this.dashboardPath, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
  }

  /**
   * アラートの読み込み
   */
  private async loadAlerts(): Promise<void> {
    try {
      const alertsPath = join(this.dashboardPath, 'alerts', 'alerts.json');
      const content = await fs.readFile(alertsPath, 'utf-8');
      this.alerts = JSON.parse(content);
    } catch (error) {
      this.alerts = [];
    }
  }

  /**
   * アラートの保存
   */
  private async saveAlerts(): Promise<void> {
    const alertsPath = join(this.dashboardPath, 'alerts', 'alerts.json');
    await fs.writeFile(alertsPath, JSON.stringify(this.alerts, null, 2));
  }

  /**
   * 目標の読み込み
   */
  private async loadTargets(): Promise<void> {
    try {
      const targetsPath = join(this.dashboardPath, 'targets', 'targets.json');
      const content = await fs.readFile(targetsPath, 'utf-8');
      this.targets = JSON.parse(content);
    } catch (error) {
      this.targets = [];
    }
  }

  /**
   * 目標の保存
   */
  private async saveTargets(): Promise<void> {
    const targetsPath = join(this.dashboardPath, 'targets', 'targets.json');
    await fs.writeFile(targetsPath, JSON.stringify(this.targets, null, 2));
  }

  /**
   * タスクの読み込み
   */
  private async loadTasks(): Promise<void> {
    try {
      const tasksPath = join(this.dashboardPath, 'tasks', 'tasks.json');
      const content = await fs.readFile(tasksPath, 'utf-8');
      this.tasks = JSON.parse(content);
    } catch (error) {
      this.tasks = [];
    }
  }

  /**
   * タスクの保存
   */
  private async saveTasks(): Promise<void> {
    const tasksPath = join(this.dashboardPath, 'tasks', 'tasks.json');
    await fs.writeFile(tasksPath, JSON.stringify(this.tasks, null, 2));
  }

  /**
   * アクティビティログの読み込み
   */
  private async loadActivityLog(): Promise<void> {
    try {
      const activityPath = join(this.dashboardPath, 'activity.json');
      const content = await fs.readFile(activityPath, 'utf-8');
      this.activityLog = JSON.parse(content);
    } catch (error) {
      this.activityLog = [];
    }
  }

  /**
   * アクティビティログの保存
   */
  private async saveActivityLog(): Promise<void> {
    const activityPath = join(this.dashboardPath, 'activity.json');
    await fs.writeFile(activityPath, JSON.stringify(this.activityLog, null, 2));
  }

  /**
   * ダッシュボードデータの保存
   */
  private async saveDashboardData(data: DashboardData): Promise<void> {
    const dataPath = join(this.dashboardPath, 'latest-data.json');
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
  }
}