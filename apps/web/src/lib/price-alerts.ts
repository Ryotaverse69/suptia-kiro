/**
 * 価格アラート管理ライブラリ
 * ローカルストレージを使用して価格アラートを管理
 */

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  productBrand?: string;
  currentPrice: number;
  targetPrice: number;
  currency: string;
  alertType: 'below' | 'above' | 'change';
  changePercentage?: number; // alertType が 'change' の場合の変動率
  isActive: boolean;
  createdAt: string;
  lastChecked?: string;
  lastTriggered?: string;
  notificationMethod: 'browser' | 'email' | 'both';
  notes?: string;
}

export interface PriceAlertHistory {
  id: string;
  alertId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  triggeredAt: string;
  alertType: PriceAlert['alertType'];
  targetPrice: number;
}

const PRICE_ALERTS_KEY = 'suptia-price-alerts';
const PRICE_ALERT_HISTORY_KEY = 'suptia-price-alert-history';

/**
 * 価格アラート一覧を取得
 */
export function getPriceAlerts(): PriceAlert[] {
  try {
    const alerts = localStorage.getItem(PRICE_ALERTS_KEY);
    return alerts ? JSON.parse(alerts) : [];
  } catch (error) {
    console.error('価格アラートの取得に失敗しました:', error);
    return [];
  }
}

/**
 * 特定の価格アラートを取得
 */
export function getPriceAlertById(id: string): PriceAlert | null {
  const alerts = getPriceAlerts();
  return alerts.find(alert => alert.id === id) || null;
}

/**
 * 商品の価格アラートを取得
 */
export function getPriceAlertsByProduct(productId: string): PriceAlert[] {
  const alerts = getPriceAlerts();
  return alerts.filter(alert => alert.productId === productId);
}

/**
 * アクティブな価格アラートを取得
 */
export function getActivePriceAlerts(): PriceAlert[] {
  const alerts = getPriceAlerts();
  return alerts.filter(alert => alert.isActive);
}

/**
 * 価格アラートを作成
 */
export function createPriceAlert(
  productId: string,
  productName: string,
  currentPrice: number,
  targetPrice: number,
  alertType: PriceAlert['alertType'],
  options: {
    productBrand?: string;
    currency?: string;
    changePercentage?: number;
    notificationMethod?: PriceAlert['notificationMethod'];
    notes?: string;
  } = {}
): PriceAlert {
  try {
    const alerts = getPriceAlerts();
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      productName,
      productBrand: options.productBrand,
      currentPrice,
      targetPrice,
      currency: options.currency || 'JPY',
      alertType,
      changePercentage: options.changePercentage,
      isActive: true,
      createdAt: new Date().toISOString(),
      notificationMethod: options.notificationMethod || 'browser',
      notes: options.notes,
    };

    const updatedAlerts = [...alerts, newAlert];
    localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(updatedAlerts));
    
    return newAlert;
  } catch (error) {
    console.error('価格アラートの作成に失敗しました:', error);
    throw error;
  }
}

/**
 * 価格アラートを更新
 */
export function updatePriceAlert(
  id: string,
  updates: Partial<Omit<PriceAlert, 'id' | 'createdAt'>>
): void {
  try {
    const alerts = getPriceAlerts();
    const updatedAlerts = alerts.map(alert =>
      alert.id === id ? { ...alert, ...updates } : alert
    );
    localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(updatedAlerts));
  } catch (error) {
    console.error('価格アラートの更新に失敗しました:', error);
    throw error;
  }
}

/**
 * 価格アラートを削除
 */
export function deletePriceAlert(id: string): void {
  try {
    const alerts = getPriceAlerts();
    const updatedAlerts = alerts.filter(alert => alert.id !== id);
    localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(updatedAlerts));
  } catch (error) {
    console.error('価格アラートの削除に失敗しました:', error);
    throw error;
  }
}

/**
 * 複数の価格アラートを削除
 */
export function deletePriceAlertsBatch(ids: string[]): void {
  try {
    const alerts = getPriceAlerts();
    const updatedAlerts = alerts.filter(alert => !ids.includes(alert.id));
    localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(updatedAlerts));
  } catch (error) {
    console.error('価格アラートの一括削除に失敗しました:', error);
    throw error;
  }
}

/**
 * 価格アラートのアクティブ状態を切り替え
 */
export function togglePriceAlert(id: string): void {
  try {
    const alerts = getPriceAlerts();
    const updatedAlerts = alerts.map(alert =>
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    );
    localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(updatedAlerts));
  } catch (error) {
    console.error('価格アラートの状態切り替えに失敗しました:', error);
    throw error;
  }
}

/**
 * 価格をチェックしてアラートを判定
 */
export function checkPriceAlerts(priceUpdates: Array<{
  productId: string;
  newPrice: number;
}>): PriceAlert[] {
  try {
    const alerts = getActivePriceAlerts();
    const triggeredAlerts: PriceAlert[] = [];
    const updatedAlerts = getPriceAlerts();

    priceUpdates.forEach(({ productId, newPrice }) => {
      const productAlerts = alerts.filter(alert => alert.productId === productId);
      
      productAlerts.forEach(alert => {
        let shouldTrigger = false;
        
        switch (alert.alertType) {
          case 'below':
            shouldTrigger = newPrice <= alert.targetPrice;
            break;
          case 'above':
            shouldTrigger = newPrice >= alert.targetPrice;
            break;
          case 'change':
            if (alert.changePercentage) {
              const changePercent = Math.abs((newPrice - alert.currentPrice) / alert.currentPrice) * 100;
              shouldTrigger = changePercent >= alert.changePercentage;
            }
            break;
        }

        if (shouldTrigger) {
          triggeredAlerts.push(alert);
          
          // アラート履歴に記録
          addPriceAlertHistory({
            alertId: alert.id,
            productName: alert.productName,
            oldPrice: alert.currentPrice,
            newPrice,
            alertType: alert.alertType,
            targetPrice: alert.targetPrice,
          });

          // アラートの最終トリガー時刻を更新
          const alertIndex = updatedAlerts.findIndex(a => a.id === alert.id);
          if (alertIndex !== -1) {
            updatedAlerts[alertIndex] = {
              ...updatedAlerts[alertIndex],
              currentPrice: newPrice,
              lastTriggered: new Date().toISOString(),
              lastChecked: new Date().toISOString(),
            };
          }
        } else {
          // 価格をチェックした時刻を更新
          const alertIndex = updatedAlerts.findIndex(a => a.id === alert.id);
          if (alertIndex !== -1) {
            updatedAlerts[alertIndex] = {
              ...updatedAlerts[alertIndex],
              currentPrice: newPrice,
              lastChecked: new Date().toISOString(),
            };
          }
        }
      });
    });

    localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(updatedAlerts));
    return triggeredAlerts;
  } catch (error) {
    console.error('価格アラートのチェックに失敗しました:', error);
    return [];
  }
}

/**
 * 価格アラート履歴を取得
 */
export function getPriceAlertHistory(): PriceAlertHistory[] {
  try {
    const history = localStorage.getItem(PRICE_ALERT_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('価格アラート履歴の取得に失敗しました:', error);
    return [];
  }
}

/**
 * 価格アラート履歴を追加
 */
function addPriceAlertHistory(entry: Omit<PriceAlertHistory, 'id' | 'triggeredAt'>): void {
  try {
    const history = getPriceAlertHistory();
    const newEntry: PriceAlertHistory = {
      ...entry,
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      triggeredAt: new Date().toISOString(),
    };

    const updatedHistory = [newEntry, ...history].slice(0, 100); // 最新100件まで保持
    localStorage.setItem(PRICE_ALERT_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('価格アラート履歴の追加に失敗しました:', error);
  }
}

/**
 * 特定のアラートの履歴を取得
 */
export function getPriceAlertHistoryByAlert(alertId: string): PriceAlertHistory[] {
  const history = getPriceAlertHistory();
  return history.filter(entry => entry.alertId === alertId);
}

/**
 * 価格アラートの統計情報を取得
 */
export function getPriceAlertStatistics(): {
  totalAlerts: number;
  activeAlerts: number;
  triggeredToday: number;
  totalSavings: number;
  mostWatchedProducts: Array<{ productName: string; alertCount: number }>;
} {
  const alerts = getPriceAlerts();
  const history = getPriceAlertHistory();
  const today = new Date().toDateString();

  const triggeredToday = history.filter(entry =>
    new Date(entry.triggeredAt).toDateString() === today
  ).length;

  // 商品別のアラート数を集計
  const productAlertCount: Record<string, number> = {};
  alerts.forEach(alert => {
    productAlertCount[alert.productName] = (productAlertCount[alert.productName] || 0) + 1;
  });

  const mostWatchedProducts = Object.entries(productAlertCount)
    .map(([productName, alertCount]) => ({ productName, alertCount }))
    .sort((a, b) => b.alertCount - a.alertCount)
    .slice(0, 5);

  // 節約額の計算（簡易版）
  const totalSavings = history.reduce((total, entry) => {
    if (entry.alertType === 'below' && entry.newPrice < entry.oldPrice) {
      return total + (entry.oldPrice - entry.newPrice);
    }
    return total;
  }, 0);

  return {
    totalAlerts: alerts.length,
    activeAlerts: alerts.filter(alert => alert.isActive).length,
    triggeredToday,
    totalSavings,
    mostWatchedProducts,
  };
}

/**
 * ブラウザ通知を送信
 */
export function sendBrowserNotification(alert: PriceAlert, newPrice: number): void {
  if (!('Notification' in window)) {
    console.warn('このブラウザは通知をサポートしていません');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(`価格アラート: ${alert.productName}`, {
      body: `価格が${alert.currency === 'USD' ? '$' : '¥'}${newPrice}になりました`,
      icon: '/favicon.ico',
      tag: `price-alert-${alert.id}`,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = `/products/${alert.productId}`;
      notification.close();
    };
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        sendBrowserNotification(alert, newPrice);
      }
    });
  }
}

/**
 * 通知権限をリクエスト
 */
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied');
  }

  return Notification.requestPermission();
}

/**
 * 価格アラートデータをクリア（開発・テスト用）
 */
export function clearPriceAlerts(): void {
  try {
    localStorage.removeItem(PRICE_ALERTS_KEY);
    localStorage.removeItem(PRICE_ALERT_HISTORY_KEY);
  } catch (error) {
    console.error('価格アラートデータのクリアに失敗しました:', error);
    throw error;
  }
}

/**
 * 価格アラートをエクスポート（JSON形式）
 */
export function exportPriceAlerts(): string {
  const alerts = getPriceAlerts();
  const history = getPriceAlertHistory();
  return JSON.stringify({ alerts, history }, null, 2);
}

/**
 * 価格アラートをインポート（JSON形式）
 */
export function importPriceAlerts(jsonData: string): void {
  try {
    const importedData = JSON.parse(jsonData);
    
    if (importedData.alerts && Array.isArray(importedData.alerts)) {
      const existingAlerts = getPriceAlerts();
      const mergedAlerts = [...importedData.alerts, ...existingAlerts];
      
      // 重複を除去（IDベース）
      const uniqueAlerts = mergedAlerts.filter((alert, index, array) =>
        array.findIndex(other => other.id === alert.id) === index
      );
      
      localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(uniqueAlerts));
    }

    if (importedData.history && Array.isArray(importedData.history)) {
      const existingHistory = getPriceAlertHistory();
      const mergedHistory = [...importedData.history, ...existingHistory];
      
      // 重複を除去（IDベース）
      const uniqueHistory = mergedHistory.filter((entry, index, array) =>
        array.findIndex(other => other.id === entry.id) === index
      );
      
      localStorage.setItem(PRICE_ALERT_HISTORY_KEY, JSON.stringify(uniqueHistory));
    }
  } catch (error) {
    console.error('価格アラートのインポートに失敗しました:', error);
    throw error;
  }
}