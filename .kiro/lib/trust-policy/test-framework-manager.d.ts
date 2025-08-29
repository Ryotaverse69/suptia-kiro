/**
 * テストフレームワーク管理機能
 *
 * テスト実行環境の管理、不足メソッドの自動追加、
 * テスト依存関係の解決、テスト実行の統括を行います。
 */
/**
 * テストタイプ
 */
export declare enum TestType {
    UNIT = "unit",
    INTEGRATION = "integration",
    ACCEPTANCE = "acceptance",
    PERFORMANCE = "performance",
    END_TO_END = "e2e"
}
/**
 * テスト結果
 */
export interface TestResult {
    testType: TestType;
    status: 'pass' | 'fail' | 'skip';
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
    startTime: Date;
    endTime: Date;
    errors: TestError[];
    coverage?: CoverageReport;
    metadata?: Record<string, any>;
}
/**
 * テストエラー
 */
export interface TestError {
    testName: string;
    testFile: string;
    error: string;
    stackTrace: string;
    suggestion: string;
    fixable: boolean;
}
/**
 * カバレッジレポート
 */
export interface CoverageReport {
    lines: {
        total: number;
        covered: number;
        percentage: number;
    };
    functions: {
        total: number;
        covered: number;
        percentage: number;
    };
    branches: {
        total: number;
        covered: number;
        percentage: number;
    };
    statements: {
        total: number;
        covered: number;
        percentage: number;
    };
}
/**
 * 依存関係情報
 */
export interface DependencyInfo {
    name: string;
    version: string;
    required: boolean;
    installed: boolean;
    compatible: boolean;
    issues: string[];
    installedVersion?: string;
    conflictsWith?: string[];
    autoInstallable: boolean;
    installCommand?: string;
}
/**
 * 依存関係競合情報
 */
export interface DependencyConflict {
    package1: string;
    package2: string;
    conflictType: 'version' | 'peer' | 'duplicate';
    description: string;
    resolution: string;
    severity: 'critical' | 'major' | 'minor';
}
/**
 * 依存関係解決結果
 */
export interface DependencyResolutionResult {
    resolved: DependencyInfo[];
    conflicts: DependencyConflict[];
    installed: string[];
    updated: string[];
    failed: string[];
    recommendations: string[];
}
/**
 * テスト環境設定
 */
export interface TestEnvironmentConfig {
    nodeVersion: string;
    testRunner: 'jest' | 'vitest' | 'mocha';
    timeout: number;
    maxConcurrency: number;
    setupFiles: string[];
    teardownFiles: string[];
    environmentVariables: Record<string, string>;
}
/**
 * 不足メソッド情報
 */
export interface MissingMethod {
    className: string;
    methodName: string;
    expectedSignature: string;
    filePath: string;
    lineNumber?: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    autoFixable: boolean;
}
/**
 * テストフレームワーク管理クラス
 */
export declare class TestFrameworkManager {
    private policyManager;
    private auditLogger;
    private metricsCollector;
    private errorHandler;
    private testEnvironmentConfig;
    private detectedMissingMethods;
    private resolvedDependencies;
    private initialized;
    constructor();
    /**
     * テストフレームワーク管理機能の初期化
     */
    initialize(): Promise<void>;
    /**
     * テスト環境の初期化管理
     */
    initializeTestEnvironment(): Promise<void>;
    /**
     * 不足しているメソッドの自動追加
     */
    addMissingMethods(): Promise<void>;
    /**
     * テスト依存関係の解決
     */
    resolveDependencies(): Promise<DependencyResolutionResult>;
    /**
     * テストの実行
     */
    runTests(testType: TestType, options?: {
        pattern?: string;
        timeout?: number;
        maxConcurrency?: number;
        coverage?: boolean;
    }): Promise<TestResult>;
    /**
     * デフォルトテスト設定の取得
     */
    private getDefaultTestConfig;
    /**
     * テスト環境の検証
     */
    private validateTestEnvironment;
    /**
     * テストディレクトリの作成
     */
    private createTestDirectories;
    /**
     * 不足メソッドの検出
     */
    private detectMissingMethods;
    /**
     * コンポーネントメソッドの分析
     */
    private analyzeComponentMethods;
    /**
     * 依存関係の確認
     */
    private checkDependencies;
    /**
     * バージョン互換性の確認
     */
    private isVersionCompatible;
    /**
     * バージョン文字列の解析
     */
    private parseVersion;
    /**
     * 不足している依存関係の検出
     */
    private detectMissingDependencies;
    /**
     * 非互換な依存関係の検出
     */
    private detectIncompatibleDependencies;
    /**
     * 依存関係の競合を検出
     */
    private detectDependencyConflicts;
    /**
     * ロックファイルの検索
     */
    private findLockFile;
    /**
     * 重複パッケージの検出
     */
    private detectDuplicatePackages;
    /**
     * ピア依存関係の競合検出
     */
    private detectPeerDependencyConflicts;
    /**
     * 依存関係競合の解決
     */
    private resolveDependencyConflicts;
    /**
     * 重複パッケージ競合の解決
     */
    private resolveDuplicatePackageConflict;
    /**
     * ピア依存関係競合の解決
     */
    private resolvePeerDependencyConflict;
    /**
     * バージョン競合の解決
     */
    private resolveVersionConflict;
    /**
     * ピア依存関係の確認
     */
    private checkPeerDependencies;
    /**
     * パッケージ競合の確認
     */
    private checkPackageConflicts;
    /**
     * 依存関係推奨事項の生成
     */
    private generateDependencyRecommendations;
    /**
     * 不足メソッドの追加
     */
    private addMissingMethod;
    /**
     * メソッド実装の生成
     */
    private generateMethodImplementation;
    /**
     * 追加されたメソッドの検証
     */
    private validateAddedMethods;
    /**
     * 依存関係のインストール
     */
    private installDependency;
    /**
     * 依存関係の更新
     */
    private updateDependency;
    /**
     * テスト設定ファイルの確認・作成
     */
    private ensureTestConfigFiles;
    /**
     * テストデータの準備
     */
    private prepareTestData;
    /**
     * モックファイルの作成
     */
    private createMockFiles;
    /**
     * テスト用一時ディレクトリの作成
     */
    private createTemporaryTestDirectories;
    /**
     * テスト環境変数の設定
     */
    private setupTestEnvironmentVariables;
    /**
     * テスト実行前の準備
     */
    private prepareTestExecution;
    /**
     * テストファイルの検索
     */
    private findTestFiles;
    /**
     * テストの実行
     */
    private executeTests;
    /**
     * テスト結果の記録
     */
    private recordTestResult;
    /**
     * 検出された不足メソッドの取得
     */
    getMissingMethods(): MissingMethod[];
    /**
     * 依存関係情報の取得
     */
    getDependencies(): DependencyInfo[];
    /**
     * テスト環境設定の取得
     */
    getTestEnvironmentConfig(): TestEnvironmentConfig;
    /**
     * 初期化状態の確認
     */
    isInitialized(): boolean;
    /**
     * 全テストの実行
     */
    runAllTests(): Promise<{
        acceptance?: {
            totalTests: number;
            passedTests: number;
            failedTests: number;
        };
        unit?: {
            totalTests: number;
            passedTests: number;
            failedTests: number;
        };
        integration?: {
            totalTests: number;
            passedTests: number;
            failedTests: number;
        };
        coverage?: {
            percentage: number;
        };
    }>;
    /**
     * 重要機能のテスト実行
     */
    runCriticalFunctionalityTests(): Promise<{
        success: boolean;
        failures: string[];
    }>;
    /**
     * 監査ログのテスト実行
     */
    runAuditLogTests(): Promise<{
        success: boolean;
        failures: string[];
    }>;
    /**
     * 受け入れテストの実行
     */
    private runAcceptanceTests;
    /**
     * ユニットテストの実行
     */
    private runUnitTests;
    /**
     * 統合テストの実行
     */
    private runIntegrationTests;
    /**
     * カバレッジ情報の取得
     */
    private getCoverageInfo;
}
