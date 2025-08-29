import { OperationType, RiskLevel } from './types.js';
/**
 * 操作分類器 - 操作を安全・危険に分類し、適切なカテゴリに振り分ける
 *
 * 要件2.1-2.4, 3.1-3.3に基づいて実装：
 * - Git操作、ファイル操作、CLI操作、スクリプト実行の分類ロジック
 * - 自動承認対象操作のパターンマッチング機能
 * - 手動承認対象操作（削除系・強制系・本番影響系）の検出機能
 */
export class OperationClassifier {
    // 自動承認対象のGit操作パターン（要件2.1）
    AUTO_APPROVE_GIT_OPERATIONS = [
        'status', 'commit', 'push', 'pull', 'merge', 'log',
        'diff', 'show', 'branch', 'checkout', 'switch', 'fetch',
        'add', 'restore', 'stash', 'tag'
    ];
    // 自動承認対象のファイル操作パターン（要件2.2）
    AUTO_APPROVE_FILE_OPERATIONS = [
        'touch', 'mkdir', 'cp', 'mv', 'cat', 'less', 'more',
        'head', 'tail', 'find', 'grep', 'sed', 'awk', 'chmod',
        'chown', 'ln', 'ls', 'pwd', 'which', 'file'
    ];
    // 自動承認対象のVercel CLI操作パターン（要件2.3）
    AUTO_APPROVE_VERCEL_OPERATIONS = [
        'env ls', 'domains ls', 'deployments ls', 'status',
        'whoami', 'teams ls', 'projects ls', 'logs'
    ];
    // 自動承認対象のスクリプト拡張子（要件2.4）
    AUTO_APPROVE_SCRIPT_EXTENSIONS = ['.mjs', '.js'];
    // 自動承認対象のスクリプトパス（要件2.4）
    AUTO_APPROVE_SCRIPT_PATHS = [
        'scripts/',
        '.kiro/scripts/',
        'tools/',
        'bin/'
    ];
    // 削除系操作パターン（要件3.1）
    DELETION_PATTERNS = [
        // Git削除操作
        { command: 'git', patterns: ['branch -D', 'branch --delete', 'push --delete', 'tag -d', 'tag --delete'] },
        // ファイル削除操作
        { command: 'rm', patterns: ['*'] },
        { command: 'rmdir', patterns: ['*'] },
        // Vercel削除操作
        { command: 'vercel', patterns: ['env rm', 'domain rm', 'remove'] }
    ];
    // 強制系操作パターン（要件3.2）
    FORCE_PATTERNS = [
        // Git強制操作
        { command: 'git', patterns: ['reset --hard', 'push --force', 'push -f', 'clean -fd'] },
        // ファイル強制操作
        { command: 'rm', patterns: ['-rf', '--force', '-f'] }
    ];
    // 本番環境影響操作パターン（要件3.3）
    PRODUCTION_IMPACT_PATTERNS = [
        // MCP書き込み系操作
        { mcpServer: 'github', writeOperations: ['create', 'update', 'delete', 'push', 'merge', 'commit'] },
        { mcpServer: 'sanity-dev', writeOperations: ['create', 'update', 'delete', 'publish', 'deploy'] },
        // Vercel本番操作
        { command: 'vercel', patterns: ['env add', 'env set', 'domain add', 'deploy --prod'] }
    ];
    /**
     * 操作を分類し、自動承認・手動承認の判定を行う
     */
    classifyOperation(operation) {
        const operationType = this.determineOperationType(operation);
        const riskLevel = this.assessRiskLevel(operation, operationType);
        const requiresManualApproval = this.requiresManualApproval(operation, operationType, riskLevel);
        const reason = this.generateReason(operation, operationType, riskLevel, requiresManualApproval);
        const category = requiresManualApproval ? 'manual' : 'auto';
        return {
            operationType,
            riskLevel,
            requiresManualApproval,
            reason,
            patterns: this.getMatchedPatterns(operation),
            category
        };
    }
    /**
     * 操作タイプを判定する
     * 要件2.1-2.4に基づいて操作を分類
     */
    determineOperationType(operation) {
        const command = operation.command.toLowerCase().trim();
        const args = operation.args.map(arg => arg.toLowerCase().trim());
        try {
            // MCP操作の判定（最優先）
            if (this.isMcpOperation(operation)) {
                return OperationType.MCP;
            }
            // Git操作の判定
            if (command === 'git' || command.startsWith('git ')) {
                return OperationType.GIT;
            }
            // スクリプト実行の判定（ファイル操作より優先）
            if (this.isScriptExecution(command, args)) {
                return OperationType.SCRIPT;
            }
            // ファイル操作の判定
            if (this.isFileOperation(command, args)) {
                return OperationType.FILE;
            }
            // CLI操作の判定
            if (this.isCliOperation(command, args)) {
                return OperationType.CLI;
            }
            return OperationType.UNKNOWN;
        }
        catch (error) {
            console.warn('操作タイプの判定中にエラーが発生しました:', error);
            return OperationType.UNKNOWN;
        }
    }
    /**
     * ファイル操作かどうかを判定（要件2.2）
     */
    isFileOperation(command, args) {
        // 明示的なファイル操作コマンド
        if (this.AUTO_APPROVE_FILE_OPERATIONS.includes(command)) {
            return true;
        }
        // 削除系ファイル操作
        if (['rm', 'rmdir'].includes(command)) {
            return true;
        }
        // ファイル関連のコマンド
        if (command.includes('file') || command.includes('dir')) {
            return true;
        }
        // 引数にファイルパスが含まれる場合
        const hasFilePath = args.some(arg => {
            return arg.includes('/') ||
                arg.includes('.') && !arg.startsWith('-') ||
                arg.match(/\.(txt|md|json|js|ts|mjs|css|html|xml|yml|yaml)$/);
        });
        return hasFilePath;
    }
    /**
     * CLI操作かどうかを判定（要件2.3）
     */
    isCliOperation(command, args) {
        const cliTools = [
            'vercel', 'npm', 'yarn', 'pnpm', 'node',
            'curl', 'wget', 'ssh', 'scp', 'rsync',
            'docker', 'kubectl', 'terraform', 'aws',
            'gcloud', 'az', 'heroku', 'netlify'
        ];
        return cliTools.includes(command);
    }
    /**
     * スクリプト実行かどうかを判定（要件2.4）
     * 強化されたスクリプト検出ロジック
     */
    isScriptExecution(command, args) {
        try {
            // 自動承認対象のスクリプト拡張子
            const hasAutoApproveScript = args.some(arg => this.AUTO_APPROVE_SCRIPT_EXTENSIONS.some(ext => arg.endsWith(ext)));
            if (hasAutoApproveScript) {
                return true;
            }
            // 自動承認対象のスクリプトパス
            const hasAutoApproveScriptPath = args.some(arg => this.AUTO_APPROVE_SCRIPT_PATHS.some(path => arg.startsWith(path)));
            if (hasAutoApproveScriptPath) {
                return true;
            }
            // npm/yarn/pnpm run スクリプト
            if (['npm', 'yarn', 'pnpm'].includes(command) && args.includes('run')) {
                return true;
            }
            // 直接スクリプト実行
            if (this.AUTO_APPROVE_SCRIPT_EXTENSIONS.some(ext => command.endsWith(ext))) {
                return true;
            }
            // シェルスクリプト実行
            if (command.endsWith('.sh') || command.endsWith('.bash') || command.endsWith('.zsh')) {
                return true;
            }
            // node コマンドでのスクリプト実行
            if (command === 'node' && args.length > 0) {
                // 引数がスクリプトファイルかどうかを確認
                const scriptArg = args[0];
                return this.AUTO_APPROVE_SCRIPT_EXTENSIONS.some(ext => scriptArg.endsWith(ext)) ||
                    this.AUTO_APPROVE_SCRIPT_PATHS.some(path => scriptArg.startsWith(path));
            }
            // Python/Ruby/その他のスクリプト実行
            const scriptCommands = ['python', 'python3', 'ruby', 'perl', 'php'];
            if (scriptCommands.includes(command) && args.length > 0) {
                const scriptArg = args[0];
                return this.AUTO_APPROVE_SCRIPT_PATHS.some(path => scriptArg.startsWith(path));
            }
            return false;
        }
        catch (error) {
            console.warn('スクリプト実行の判定中にエラーが発生しました:', error);
            return false;
        }
    }
    /**
     * MCP操作かどうかを判定
     */
    isMcpOperation(operation) {
        return operation.context?.mcpServer !== undefined ||
            operation.context?.mcpTool !== undefined;
    }
    /**
     * リスクレベルを評価する
     */
    assessRiskLevel(operation, operationType) {
        // 削除系操作は高リスク
        if (this.isDeletionOperation(operation)) {
            return RiskLevel.HIGH;
        }
        // 強制系操作は高リスク
        if (this.isForceOperation(operation)) {
            return RiskLevel.HIGH;
        }
        // 本番環境影響操作は高リスク
        if (this.isProductionImpactOperation(operation)) {
            return RiskLevel.HIGH;
        }
        // Git操作は基本的に中リスク（破壊的操作は既に高リスクに設定済み）
        if (operationType === OperationType.GIT) {
            return RiskLevel.MEDIUM;
        }
        // ファイル操作は低〜中リスク
        if (operationType === OperationType.FILE) {
            return this.isDestructiveFileOperation(operation) ? RiskLevel.HIGH : RiskLevel.LOW;
        }
        // スクリプト実行は中リスク
        if (operationType === OperationType.SCRIPT) {
            return RiskLevel.MEDIUM;
        }
        // CLI操作は中リスク
        if (operationType === OperationType.CLI) {
            return RiskLevel.MEDIUM;
        }
        // MCP操作は高リスク（書き込み系）
        if (operationType === OperationType.MCP) {
            return this.isMcpWriteOperation(operation) ? RiskLevel.HIGH : RiskLevel.LOW;
        }
        return RiskLevel.LOW;
    }
    /**
     * 削除系操作かどうかを判定（要件3.1）
     * 強化された削除操作検出ロジック
     */
    isDeletionOperation(operation) {
        const command = operation.command.toLowerCase();
        const args = operation.args.map(arg => arg.toLowerCase());
        const originalArgs = operation.args; // 大文字小文字を保持
        const argsString = args.join(' ');
        try {
            // Git削除操作の直接チェック（大文字小文字を考慮）
            if (command === 'git') {
                // branch -D または branch --delete
                if (originalArgs.includes('branch') &&
                    (originalArgs.includes('-D') || originalArgs.includes('-d') || originalArgs.includes('--delete'))) {
                    return true;
                }
                // push --delete
                if (originalArgs.includes('push') && originalArgs.includes('--delete')) {
                    return true;
                }
                // tag -d または tag --delete
                if (originalArgs.includes('tag') &&
                    (originalArgs.includes('-d') || originalArgs.includes('--delete'))) {
                    return true;
                }
                // remote remove
                if (originalArgs.includes('remote') &&
                    (originalArgs.includes('remove') || originalArgs.includes('rm'))) {
                    return true;
                }
            }
            // ファイルシステム削除操作
            if (['rm', 'rmdir', 'del', 'erase'].includes(command)) {
                return true;
            }
            // パターンベースの削除操作検出
            for (const pattern of this.DELETION_PATTERNS) {
                if (pattern.command && command === pattern.command) {
                    // 特定コマンドのパターンマッチング
                    if (pattern.patterns.includes('*')) {
                        return true; // rm, rmdir は全て削除操作
                    }
                    if (this.matchesAdvancedPattern(operation, pattern.patterns)) {
                        return true;
                    }
                }
            }
            // CLI削除操作の検出
            const deletionKeywords = ['delete', 'remove', 'rm', 'del', 'destroy', 'drop', 'purge', 'clean'];
            const hasDeleteKeyword = args.some(arg => deletionKeywords.some(keyword => arg.includes(keyword)));
            if (hasDeleteKeyword) {
                return true;
            }
            // MCP削除操作の判定
            if (operation.context?.mcpTool) {
                const tool = operation.context.mcpTool.toLowerCase();
                const mcpDeletionKeywords = ['delete', 'remove', 'discard', 'destroy', 'drop', 'purge'];
                return mcpDeletionKeywords.some(keyword => tool.includes(keyword));
            }
            return false;
        }
        catch (error) {
            console.warn('削除操作の判定中にエラーが発生しました:', error);
            return false; // エラー時は安全側に倒す
        }
    }
    /**
     * 強制系操作かどうかを判定（要件3.2）
     * 強化された強制操作検出ロジック
     */
    isForceOperation(operation) {
        const command = operation.command.toLowerCase();
        const args = operation.args.map(arg => arg.toLowerCase());
        const originalArgs = operation.args; // 大文字小文字を保持
        try {
            // Git強制操作の直接チェック
            if (command === 'git') {
                // --force または -f フラグ
                if (originalArgs.includes('--force') || originalArgs.includes('-f')) {
                    return true;
                }
                // reset --hard
                if (originalArgs.includes('reset') && originalArgs.includes('--hard')) {
                    return true;
                }
                // clean -fd (強制的なクリーンアップ)
                if (originalArgs.includes('clean') &&
                    (originalArgs.includes('-fd') || originalArgs.includes('-f'))) {
                    return true;
                }
                // rebase --force-rebase
                if (originalArgs.includes('rebase') && originalArgs.includes('--force-rebase')) {
                    return true;
                }
            }
            // ファイル強制操作
            if (['rm', 'rmdir'].includes(command)) {
                const forceFlags = ['-rf', '-f', '--force', '--recursive'];
                if (forceFlags.some(flag => originalArgs.includes(flag))) {
                    return true;
                }
            }
            // パターンベースの強制操作検出
            for (const pattern of this.FORCE_PATTERNS) {
                if (pattern.command && command === pattern.command) {
                    if (this.matchesAdvancedPattern(operation, pattern.patterns)) {
                        return true;
                    }
                }
            }
            // 一般的な強制フラグの検出
            const forceKeywords = ['--force', '-f', '--hard', '--overwrite', '--yes', '-y'];
            const hasForceFlag = originalArgs.some(arg => forceKeywords.some(keyword => arg === keyword || arg.includes(keyword)));
            if (hasForceFlag) {
                return true;
            }
            // CLI強制操作の検出
            const forceCommands = ['kill', 'killall', 'pkill'];
            if (forceCommands.includes(command)) {
                return true;
            }
            return false;
        }
        catch (error) {
            console.warn('強制操作の判定中にエラーが発生しました:', error);
            return false; // エラー時は安全側に倒す
        }
    }
    /**
     * 本番環境影響操作かどうかを判定（要件3.3）
     * 強化された本番環境影響操作検出ロジック
     */
    isProductionImpactOperation(operation) {
        const command = operation.command.toLowerCase();
        const args = operation.args.map(arg => arg.toLowerCase());
        try {
            // MCP書き込み系操作の判定
            if (operation.context?.mcpServer && operation.context?.mcpTool) {
                const server = operation.context.mcpServer.toLowerCase();
                const tool = operation.context.mcpTool.toLowerCase();
                // パターンベースのMCP本番影響操作検出
                for (const pattern of this.PRODUCTION_IMPACT_PATTERNS) {
                    if (pattern.mcpServer && pattern.mcpServer === server) {
                        const hasWriteOperation = pattern.writeOperations?.some(op => tool.includes(op));
                        if (hasWriteOperation) {
                            return true;
                        }
                    }
                }
                // 追加のMCP本番影響操作
                const productionMcpServers = ['github', 'sanity-dev', 'vercel-mcp'];
                if (productionMcpServers.includes(server) && this.isWriteOperation(tool)) {
                    return true;
                }
            }
            // CLI本番操作の判定
            for (const pattern of this.PRODUCTION_IMPACT_PATTERNS) {
                if (pattern.command && command === pattern.command && pattern.patterns) {
                    if (this.matchesAdvancedPattern(operation, pattern.patterns)) {
                        return true;
                    }
                }
            }
            // Vercel本番環境影響操作
            if (command === 'vercel') {
                const productionPatterns = [
                    'deploy --prod', 'env set', 'env add', 'domain add',
                    'alias set', 'secrets add', 'certs add', 'dns add',
                    'scale', 'promote'
                ];
                if (this.matchesAdvancedPattern(operation, productionPatterns)) {
                    return true;
                }
                // 本番環境を示すフラグの検出
                const productionFlags = ['--prod', '--production', '--target production'];
                const hasProductionFlag = args.some(arg => productionFlags.some(flag => arg.includes(flag)));
                if (hasProductionFlag) {
                    return true;
                }
            }
            // Docker本番操作
            if (command === 'docker') {
                const dockerProductionPatterns = [
                    'push', 'deploy', 'service update', 'stack deploy'
                ];
                if (this.matchesAdvancedPattern(operation, dockerProductionPatterns)) {
                    return true;
                }
            }
            // Kubernetes本番操作
            if (command === 'kubectl') {
                const k8sProductionPatterns = [
                    'apply', 'create', 'delete', 'patch', 'replace',
                    'scale', 'rollout', 'expose'
                ];
                if (this.matchesAdvancedPattern(operation, k8sProductionPatterns)) {
                    return true;
                }
            }
            // AWS CLI本番操作
            if (command === 'aws') {
                const awsProductionKeywords = [
                    'deploy', 'create-stack', 'update-stack', 'delete-stack',
                    'put-', 'create-', 'delete-', 'update-'
                ];
                const hasAwsProductionOperation = args.some(arg => awsProductionKeywords.some(keyword => arg.includes(keyword)));
                if (hasAwsProductionOperation) {
                    return true;
                }
            }
            // 環境変数による本番環境の検出
            if (operation.context?.environment === 'production' ||
                operation.context?.environment === 'prod') {
                return true;
            }
            return false;
        }
        catch (error) {
            console.warn('本番環境影響操作の判定中にエラーが発生しました:', error);
            return false; // エラー時は安全側に倒す
        }
    }
    /**
     * 破壊的なファイル操作かどうかを判定
     */
    isDestructiveFileOperation(operation) {
        const command = operation.command.toLowerCase();
        return ['rm', 'rmdir'].includes(command);
    }
    /**
     * MCP書き込み操作かどうかを判定
     */
    isMcpWriteOperation(operation) {
        const tool = operation.context?.mcpTool?.toLowerCase() || '';
        return this.isWriteOperation(tool);
    }
    /**
     * 書き込み操作かどうかを判定
     */
    isWriteOperation(tool) {
        const writePatterns = [
            'create', 'update', 'delete', 'write', 'set', 'add', 'remove',
            'commit', 'push', 'merge', 'publish', 'deploy'
        ];
        return writePatterns.some(pattern => tool.includes(pattern));
    }
    /**
     * 手動承認が必要かどうかを判定
     */
    requiresManualApproval(operation, operationType, riskLevel) {
        // 高リスク操作は手動承認必須
        if (riskLevel === RiskLevel.HIGH) {
            return true;
        }
        // 削除系・強制系・本番影響系は手動承認必須
        if (this.isDeletionOperation(operation) ||
            this.isForceOperation(operation) ||
            this.isProductionImpactOperation(operation)) {
            return true;
        }
        // その他は自動承認
        return false;
    }
    /**
     * 判定理由を生成
     */
    generateReason(operation, operationType, riskLevel, requiresManualApproval) {
        if (requiresManualApproval) {
            if (this.isDeletionOperation(operation)) {
                return '削除系操作のため手動承認が必要です';
            }
            if (this.isForceOperation(operation)) {
                return '強制系操作のため手動承認が必要です';
            }
            if (this.isProductionImpactOperation(operation)) {
                return '本番環境に影響する操作のため手動承認が必要です';
            }
            if (riskLevel === RiskLevel.HIGH) {
                return '高リスク操作のため手動承認が必要です';
            }
        }
        return `${operationType}操作として自動承認されました`;
    }
    /**
     * マッチしたパターンを取得
     */
    getMatchedPatterns(operation) {
        const patterns = [];
        // 自動承認パターン
        if (this.isAutoApprovePattern(operation)) {
            patterns.push('auto-approve');
        }
        // 手動承認パターン
        if (this.isDeletionOperation(operation)) {
            patterns.push('deletion');
        }
        if (this.isForceOperation(operation)) {
            patterns.push('force');
        }
        if (this.isProductionImpactOperation(operation)) {
            patterns.push('production-impact');
        }
        // 操作タイプパターン
        patterns.push(this.determineOperationType(operation).toLowerCase());
        return patterns;
    }
    /**
     * 自動承認パターンかどうかを判定
     * 要件2.1-2.4に基づいて自動承認対象操作を判定
     * 強化された自動承認パターン検出ロジック
     */
    isAutoApprovePattern(operation) {
        const command = operation.command.toLowerCase();
        const args = operation.args.map(arg => arg.toLowerCase());
        const argsString = args.join(' ');
        try {
            // 危険操作は自動承認対象外
            if (this.isDeletionOperation(operation) ||
                this.isForceOperation(operation) ||
                this.isProductionImpactOperation(operation)) {
                return false;
            }
            // Git通常操作の判定（要件2.1）
            if (command === 'git') {
                // 削除・強制・本番影響操作は除外済みなので、通常操作のみチェック
                const hasAutoApproveGitOp = this.AUTO_APPROVE_GIT_OPERATIONS.some(op => args.includes(op) || argsString.includes(op));
                if (hasAutoApproveGitOp) {
                    return true;
                }
                // 追加の安全なGit操作
                const additionalSafeOps = ['config', 'help', 'version', 'remote -v', 'ls-files'];
                return additionalSafeOps.some(op => this.matchesPattern(argsString, op));
            }
            // ローカルファイル操作の判定（要件2.2）
            if (this.isFileOperation(command, args) && !this.isDestructiveFileOperation(operation)) {
                // レポート生成やログ分析など、安全なファイル操作
                const safeFilePatterns = [
                    '.kiro/reports/', '.kiro/logs/', 'logs/', 'reports/',
                    'temp/', 'tmp/', 'cache/', '.cache/'
                ];
                const isSafeFileOperation = args.some(arg => safeFilePatterns.some(pattern => arg.includes(pattern)));
                return isSafeFileOperation || this.isReadOnlyFileOperation(command);
            }
            // Vercel CLI読み取り系操作の判定（要件2.3）
            if (command === 'vercel') {
                const hasAutoApproveVercelOp = this.AUTO_APPROVE_VERCEL_OPERATIONS.some(op => this.matchesPattern(argsString, op));
                if (hasAutoApproveVercelOp) {
                    return true;
                }
                // 追加の安全なVercel操作
                const additionalSafeVercelOps = ['help', 'version', 'list', 'ls'];
                return additionalSafeVercelOps.some(op => args.includes(op));
            }
            // スクリプト実行の判定（要件2.4）
            if (this.isScriptExecution(command, args)) {
                // .mjsファイルの実行
                const hasMjsScript = args.some(arg => this.AUTO_APPROVE_SCRIPT_EXTENSIONS.some(ext => arg.endsWith(ext)));
                // 安全なスクリプトパスの実行
                const hasSafeScriptPath = args.some(arg => this.AUTO_APPROVE_SCRIPT_PATHS.some(path => arg.startsWith(path)));
                // npm run スクリプト
                const isNpmRun = ['npm', 'yarn', 'pnpm'].includes(command) && args.includes('run');
                // 安全なnpmスクリプトの判定
                if (isNpmRun) {
                    const safeNpmScripts = [
                        'test', 'build', 'dev', 'start', 'lint', 'format',
                        'check', 'analyze', 'report', 'metrics'
                    ];
                    const hasSafeScript = args.some(arg => safeNpmScripts.includes(arg));
                    return hasSafeScript;
                }
                return hasMjsScript || hasSafeScriptPath;
            }
            // MCP読み取り系操作
            if (operation.context?.mcpServer && operation.context?.mcpTool) {
                const server = operation.context.mcpServer.toLowerCase();
                const tool = operation.context.mcpTool.toLowerCase();
                // 読み取り専用MCPサーバー
                const readOnlyMcpServers = ['fetch', 'brave-search', 'filesystem'];
                if (readOnlyMcpServers.includes(server)) {
                    return true;
                }
                // 読み取り系操作
                return !this.isWriteOperation(tool);
            }
            // その他の安全な操作
            const safeCommands = [
                'echo', 'cat', 'less', 'more', 'head', 'tail',
                'grep', 'find', 'which', 'whereis', 'type',
                'ps', 'top', 'htop', 'df', 'du', 'free',
                'date', 'uptime', 'whoami', 'id', 'pwd'
            ];
            return safeCommands.includes(command);
        }
        catch (error) {
            console.warn('自動承認パターンの判定中にエラーが発生しました:', error);
            return false; // エラー時は安全側に倒す
        }
    }
    /**
     * 読み取り専用のファイル操作かどうかを判定
     */
    isReadOnlyFileOperation(command) {
        const readOnlyCommands = [
            'cat', 'less', 'more', 'head', 'tail', 'grep',
            'find', 'ls', 'file', 'stat', 'wc', 'sort',
            'uniq', 'cut', 'awk', 'sed'
        ];
        return readOnlyCommands.includes(command);
    }
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
    matchesPattern(text, pattern) {
        try {
            // 完全一致
            if (text === pattern) {
                return true;
            }
            // 部分一致（スペース区切りで各要素が含まれているか）
            const patternParts = pattern.split(' ').filter(part => part.length > 0);
            const textParts = text.split(' ').filter(part => part.length > 0);
            // すべてのパターン要素がテキストに含まれているかチェック
            const basicMatch = patternParts.every(patternPart => textParts.some(textPart => textPart.includes(patternPart)));
            if (basicMatch) {
                return true;
            }
            // 順序を考慮した部分一致（連続する要素の順序が保たれているか）
            let textIndex = 0;
            for (const patternPart of patternParts) {
                let found = false;
                for (let i = textIndex; i < textParts.length; i++) {
                    if (textParts[i].includes(patternPart)) {
                        textIndex = i + 1;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            console.warn('パターンマッチング中にエラーが発生しました:', error);
            return false;
        }
    }
    /**
     * 高度なパターンマッチング機能
     * 複雑な操作パターンの検出に使用
     */
    matchesAdvancedPattern(operation, patterns) {
        const command = operation.command.toLowerCase();
        const args = operation.args.map(arg => arg.toLowerCase());
        const argsString = args.join(' ');
        const fullCommand = `${command} ${argsString}`.trim();
        return patterns.some(pattern => {
            // ワイルドカードパターン（*）
            if (pattern === '*') {
                return true;
            }
            // 正規表現パターン（/pattern/flags形式）
            if (pattern.startsWith('/') && pattern.includes('/')) {
                try {
                    const lastSlash = pattern.lastIndexOf('/');
                    const regexPattern = pattern.slice(1, lastSlash);
                    const flags = pattern.slice(lastSlash + 1);
                    const regex = new RegExp(regexPattern, flags);
                    return regex.test(fullCommand);
                }
                catch (error) {
                    console.warn('正規表現パターンの処理中にエラーが発生しました:', error);
                    return false;
                }
            }
            // 基本パターンマッチング
            return this.matchesPattern(fullCommand, pattern);
        });
    }
}
