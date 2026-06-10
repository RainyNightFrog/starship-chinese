import { useEffect, useRef, useState } from 'react';
import { getContributorBadgeForItem, recordSharedItemStudy } from './globalSharedPool';

/**
 * 共享題貢獻者榮譽徽章 — 首次瀏覽時累計溫習人次
 * @param {object|null} item — 當前題目物件
 */
export function useContributorBadge(item) {
  const studiedRef = useRef(new Set());
  const [badge, setBadge] = useState(null);

  useEffect(() => {
    const base = getContributorBadgeForItem(item);
    if (!base) {
      setBadge(null);
      return;
    }

    const poolId = base.sharedPoolId;
    if (poolId && !studiedRef.current.has(poolId)) {
      studiedRef.current.add(poolId);
      const helpedCount = recordSharedItemStudy(poolId);
      setBadge({ ...base, helpedCount });
      return;
    }

    setBadge(base);
  }, [item?.id, item?.sharedPoolId, item?.contributorLabel, item?.isCommunityShared]);

  return badge;
}
