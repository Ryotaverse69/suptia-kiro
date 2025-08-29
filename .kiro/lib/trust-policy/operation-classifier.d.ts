import { Operation, ClassificationResult } from './types.js';
/**
 * 操作分類器 - 操作を安全・危険に分類し、適切なカテゴリに振り分ける
 *
 * 要件2.1-2.4, 3.1-3.3に基づいて実装：
 * - Git操作、ファイル操作、CLI操作、スクリプト実行の分類ロジック
 * - 自動承認対象操作のパターンマッチング機能
 * - 手動承認対象操作（削除系・強制系・本番影響系）の検出機能
 */
export declare class OperationClassifier {
    private readonly AUTO_APPROVE_GIT_OPERATIONS;
    private readonly AUTO_APPROVE_FILE_OPERATIONS;
    private readonly AUTO_APPROVE_VERCEL_OPERATIONS;
    private readonly AUTO_APPROVE_SCRIPT_EXTENSIONS;
    private readonly AUTO_APPROVE_SCRIPT_PATHS;
    private readonly DELETION_PATTERNS;
    private readonly FORCE_PATTERNS;
    private readonly PRODUCTION_IMPACT_PATTERNS;
    /**
     * 操作を分類し、自動承認・手動承認の判定を行う
     */
    classifyOperation(operation: Operation): ClassificationResult;
    /**
     * 操作タイプを判定する
     * 要件2.1-2.4に基づいて操作を分類
     */
    private determineOperationType;
    /**
     * ファイル操作かどうかを判定（要件2.2）
     */
    private isFileOperation;
    /**
     * CLI操作かどうかを判定（要件2.3）
     */
    private isCliOperation;
    /**
     * スクリプト実行かどうかを判定（要件2.4）
     * 強化されたスクリプト検出ロジック
     */
    private isScriptExecution;
    /**
     * MCP操作かどうかを判定
     */
    private isMcpOperation;
    /**
     * リスクレベルを評価する
     */
    private assessRiskLevel;
    /**
     * 削除系操作かどうかを判定（要件3.1）
     * 強化された削除操作検出ロジック
     */
    private isDeletionOperation;
    /**
     * 強制系操作かどうかを判定（要件3.2）
     * 強化された強制操作検出ロジック
     */
    private isForceOperation;
    /**
     * 本番環境影響操作かどうかを判定（要件3.3）
     * 強化された本番環境影響操作検出ロジック
     */
    private isProductionImpactOperation;
    /**
     * 破壊的なファイル操作かどうかを判定
     */
    private isDestructiveFileOperation;
    /**
     * MCP書き込み操作かどうかを判定
     */
    private isMcpWriteOperation;
    /**
     * 書き込み操作かどうかを判定
     */
    private isWriteOperation;
    /**
     * 手動承認が必要かどうかを判定
     */
    private requiresManualApproval;
    /**
     * 判定理由を生成
     */
    private generateReason;
    /**
     * マッチしたパターンを取得
     */
    private getMatchedPatterns;
    /**
     * 自動承認パターンかどうかを判定
     * 要件2.1-2.4に基づいて自動承認対象操作を判定
     * 強化された自動承認パターン検出ロジック
     */
    private isAutoApprovePattern;
    /**
     * 読み取り専用のファイル操作かどうかを判定
     */
    private isReadOnlyFileOperation;
    /**
     * パターンマッチング機能
     * 文字列が指定されたパターンにマッチするかを判定
     *
     * 強化されたパターンマッチング：
     * - 完全一致
     * - 部分一致（順序を考慮）
     * - フラグベースマッチング
     * - 正規表現サポート
     */
    private matchesPattern;
    /**
     * 高度なパターンマッチング機能
     * 複雑な操作パターンの検出に使用
     */
    private matchesAdvancedPattern;
}
