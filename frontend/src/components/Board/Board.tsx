'use client';

import { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { Card as CardType, Cluster as ClusterType } from '../../types';
import Column from './Column';

interface BoardProps {
  canVote?: boolean;
  canDrag?: boolean;
  showBlurred?: boolean;
}

export default function Board({ canVote = false, canDrag = false, showBlurred = false }: BoardProps) {
  const { session, cards, clusters, mergeCards, updateCard, updateCluster } = useSession();
  const [draggedItem, setDraggedItem] = useState<{
    item: CardType | ClusterType;
    type: 'card' | 'cluster';
  } | null>(null);

  if (!session) return null;

  const handleDragStart = (item: CardType | ClusterType, type: 'card' | 'cluster') => {
    console.log('🚀 Drag started:', { itemId: item.id, type });
    setDraggedItem({ item, type });
  };

  const handleColumnDrop = (columnName: string) => {
    console.log('📦 Column drop:', { columnName, draggedItem });

    if (!draggedItem) {
      console.warn('⚠️ No dragged item!');
      return;
    }

    const { item, type } = draggedItem;

    if (type === 'card') {
      const card = item as CardType;
      console.log('🎯 Moving card to column:', { cardId: card.id, from: card.column, to: columnName });
      updateCard(card.id, { column: columnName });
    } else if (type === 'cluster') {
      const cluster = item as ClusterType;
      console.log('🎯 Moving cluster to column:', { clusterId: cluster.id, from: cluster.column, to: columnName });
      updateCluster(cluster.id, { column: columnName });

      // Also update all cards in the cluster
      cluster.cardIds.forEach(cardId => {
        updateCard(cardId, { column: columnName });
      });
    }

    setDraggedItem(null);
  };

  const handleDrop = (target: CardType | ClusterType, targetType: 'card' | 'cluster') => {
    console.log('📍 Drop event:', { targetId: target.id, targetType, draggedItem });

    if (!draggedItem) {
      console.warn('⚠️ No dragged item!');
      return;
    }

    const source = draggedItem.item;
    const sourceType = draggedItem.type;

    console.log('🔄 Attempting merge:', {
      sourceId: source.id,
      sourceType,
      targetId: target.id,
      targetType
    });

    // Don't merge with itself
    if (source.id === target.id) {
      console.log('❌ Same item, skipping');
      setDraggedItem(null);
      return;
    }

    // Support all merge scenarios
    if (sourceType === 'card' && targetType === 'card') {
      // Card + Card -> Create new cluster or add to existing
      const sourceCard = source as CardType;
      const targetCard = target as CardType;

      console.log('🎯 Card + Card merge:', {
        sourceColumn: sourceCard.column,
        targetColumn: targetCard.column
      });

      console.log('✅ Merging cards!');
      mergeCards(sourceCard.id, targetCard.id);
    } else if (sourceType === 'card' && targetType === 'cluster') {
      // Card + Cluster -> Add card to cluster
      const sourceCard = source as CardType;
      const targetCluster = target as ClusterType;

      // Get any card from the cluster to use as merge target
      const targetCardId = targetCluster.cardIds[0];

      console.log('🎯 Card + Cluster merge:', {
        cardId: sourceCard.id,
        clusterId: targetCluster.id,
        targetCardId
      });

      console.log('✅ Adding card to cluster!');
      mergeCards(sourceCard.id, targetCardId);
    } else if (sourceType === 'cluster' && targetType === 'card') {
      // Cluster + Card -> Add card to cluster
      const sourceCluster = source as ClusterType;
      const targetCard = target as CardType;

      // Get any card from the cluster to use as merge source
      const sourceCardId = sourceCluster.cardIds[0];

      console.log('🎯 Cluster + Card merge:', {
        clusterId: sourceCluster.id,
        cardId: targetCard.id,
        sourceCardId
      });

      console.log('✅ Adding card to cluster!');
      mergeCards(sourceCardId, targetCard.id);
    } else if (sourceType === 'cluster' && targetType === 'cluster') {
      // Cluster + Cluster -> Merge clusters
      const sourceCluster = source as ClusterType;
      const targetCluster = target as ClusterType;

      // Get representative cards from each cluster
      const sourceCardId = sourceCluster.cardIds[0];
      const targetCardId = targetCluster.cardIds[0];

      console.log('🎯 Cluster + Cluster merge:', {
        sourceClusterId: sourceCluster.id,
        targetClusterId: targetCluster.id
      });

      console.log('✅ Merging clusters!');
      mergeCards(sourceCardId, targetCardId);
    } else {
      console.log('❌ Unexpected merge type, skipping');
    }

    setDraggedItem(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {session.settings.columns.map(column => {
        const columnCards = cards.filter(c => c.column === column);
        const columnClusters = clusters.filter(cl => cl.column === column);

        return (
          <Column
            key={column}
            title={column}
            cards={columnCards}
            clusters={columnClusters}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onColumnDrop={handleColumnDrop}
            canVote={canVote}
            canDrag={canDrag}
            showBlurred={showBlurred}
          />
        );
      })}
    </div>
  );
}
