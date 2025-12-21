import { v4 as uuidv4 } from 'uuid';
import { Cluster, Card } from '../../../shared/types';
import { ClusterModel } from '../models/Cluster';
import { CardModel } from '../models/Card';
import { ClusterNameGenerator } from './ClusterNameGenerator';

export interface MergeResult {
  cluster: Cluster;
  deletedClusterIds: string[];
  updatedCardIds: string[];
}

export class ClusterService {
  /**
   * Merge two cards by creating or updating clusters
   */
  static mergeCards(sourceCardId: string, targetCardId: string): MergeResult {
    const sourceCard = CardModel.findById(sourceCardId);
    const targetCard = CardModel.findById(targetCardId);

    console.log('🔄 ClusterService.mergeCards called:', {
      sourceCardId,
      targetCardId,
      sourceClusterId: sourceCard?.clusterId,
      targetClusterId: targetCard?.clusterId
    });

    if (!sourceCard || !targetCard) {
      throw new Error('One or both cards not found');
    }

    if (sourceCard.sessionId !== targetCard.sessionId) {
      throw new Error('Cards must be from the same session');
    }

    // Update source card's column to match target if they're different
    if (sourceCard.column !== targetCard.column) {
      CardModel.update(sourceCardId, { column: targetCard.column });
      // Refresh the source card data
      const updatedSourceCard = CardModel.findById(sourceCardId);
      if (updatedSourceCard) {
        Object.assign(sourceCard, updatedSourceCard);
      }
    }

    const sourceClusterId = sourceCard.clusterId;
    const targetClusterId = targetCard.clusterId;

    // Case 1: Neither card is clustered -> Create new cluster
    if (!sourceClusterId && !targetClusterId) {
      console.log('📦 Case 1: Creating new cluster (neither card clustered)');
      // Use the most recent card's createdAt to maintain position in list
      const inheritedCreatedAt = Math.max(sourceCard.createdAt, targetCard.createdAt);
      const cluster = this.createNewCluster(
        sourceCard.sessionId,
        [sourceCardId, targetCardId],
        sourceCard.column,
        targetCard.position,  // Use target card's position
        inheritedCreatedAt    // Inherit timestamp from most recent card
      );
      return {
        cluster,
        deletedClusterIds: [],
        updatedCardIds: [sourceCardId, targetCardId]
      };
    }

    // Case 2: Source is clustered, target is not -> Add target to source cluster
    if (sourceClusterId && !targetClusterId) {
      console.log('📦 Case 2: Adding target to source cluster', sourceClusterId);
      const cluster = this.addCardToCluster(sourceClusterId, targetCardId, targetCard.position);
      console.log('📊 Cluster after adding card:', { id: cluster.id, cardIds: cluster.cardIds, column: cluster.column });
      // Return all cards that were updated (all cards in the cluster)
      return {
        cluster,
        deletedClusterIds: [],
        updatedCardIds: cluster.cardIds
      };
    }

    // Case 3: Target is clustered, source is not -> Add source to target cluster
    if (!sourceClusterId && targetClusterId) {
      console.log('📦 Case 3: Adding source to target cluster', targetClusterId);
      const cluster = this.addCardToCluster(targetClusterId, sourceCardId, targetCard.position);
      // Return all cards that were updated (all cards in the cluster)
      return {
        cluster,
        deletedClusterIds: [],
        updatedCardIds: cluster.cardIds
      };
    }

    // Case 4: Both clustered in same cluster -> No-op
    if (sourceClusterId && sourceClusterId === targetClusterId) {
      const cluster = ClusterModel.findById(sourceClusterId)!;
      return {
        cluster,
        deletedClusterIds: [],
        updatedCardIds: []
      };
    }

    // Case 5: Both clustered in different clusters -> Merge clusters
    if (sourceClusterId && targetClusterId) {
      const targetCluster = ClusterModel.findById(targetClusterId);
      const result = this.mergeClusters(sourceClusterId, targetClusterId, targetCluster?.position);
      return {
        cluster: result.cluster,
        deletedClusterIds: [result.deletedClusterId],
        updatedCardIds: result.cluster.cardIds
      };
    }

    throw new Error('Unexpected clustering state');
  }

  /**
   * Create a new cluster from cards
   */
  private static createNewCluster(
    sessionId: string,
    cardIds: string[],
    column: string,
    position: { x: number; y: number },
    createdAt?: number
  ): Cluster {
    // Get cards to generate name
    const cards = cardIds.map(id => CardModel.findById(id)).filter(Boolean) as Card[];
    const generatedName = ClusterNameGenerator.generateName(cards);

    const cluster: Cluster = {
      id: uuidv4(),
      sessionId,
      name: generatedName,
      cardIds,
      column,
      position,
      createdAt: createdAt || Date.now(),  // Use inherited or current timestamp
      updatedAt: Date.now()
    };

    ClusterModel.create(cluster);

    // Update cards to reference cluster
    cardIds.forEach(cardId => {
      CardModel.update(cardId, { clusterId: cluster.id });
    });

    return cluster;
  }

  /**
   * Add a card to an existing cluster
   */
  private static addCardToCluster(clusterId: string, cardId: string, newPosition?: { x: number; y: number }): Cluster {
    const cluster = ClusterModel.findById(clusterId);
    if (!cluster) throw new Error('Cluster not found');

    const card = CardModel.findById(cardId);
    if (!card) throw new Error('Card not found');

    // Prepare update object
    const updates: Partial<Cluster> = {};

    // If card is in a different column, move cluster and all its cards to card's column
    if (cluster.column !== card.column) {
      console.log(`📍 Moving cluster ${clusterId} from ${cluster.column} to ${card.column}`);
      updates.column = card.column;

      // Update all existing cards in cluster to the new column
      cluster.cardIds.forEach(existingCardId => {
        CardModel.update(existingCardId, { column: card.column });
      });
    }

    const updatedCardIds = [...cluster.cardIds, cardId];

    // Regenerate cluster name with new card
    const allCards = updatedCardIds.map(id => CardModel.findById(id)).filter(Boolean) as Card[];
    const newName = ClusterNameGenerator.generateName(allCards);

    // Update cluster with new cards, name, and optionally position
    updates.cardIds = updatedCardIds;
    updates.name = newName;
    if (newPosition) {
      updates.position = newPosition;
    }

    ClusterModel.update(clusterId, updates);
    CardModel.update(cardId, { clusterId });

    return ClusterModel.findById(clusterId)!;
  }

  /**
   * Merge two clusters into one
   */
  private static mergeClusters(cluster1Id: string, cluster2Id: string, newPosition?: { x: number; y: number }): { cluster: Cluster; deletedClusterId: string } {
    const cluster1 = ClusterModel.findById(cluster1Id);
    const cluster2 = ClusterModel.findById(cluster2Id);

    if (!cluster1 || !cluster2) {
      throw new Error('One or both clusters not found');
    }

    // If clusters are in different columns, move cluster2's cards to cluster1's column
    if (cluster1.column !== cluster2.column) {
      console.log(`📍 Merging clusters: moving cards from ${cluster2.column} to ${cluster1.column}`);
      cluster2.cardIds.forEach(cardId => {
        CardModel.update(cardId, { column: cluster1.column });
      });
    }

    // Merge into cluster1, delete cluster2
    const mergedCardIds = [...cluster1.cardIds, ...cluster2.cardIds];

    // Regenerate cluster name with all merged cards
    const allCards = mergedCardIds.map(id => CardModel.findById(id)).filter(Boolean) as Card[];
    const newName = ClusterNameGenerator.generateName(allCards);

    // Prepare update object
    const updates: Partial<Cluster> = {
      cardIds: mergedCardIds,
      name: newName
    };

    // Update position if provided (use target cluster's position)
    if (newPosition) {
      updates.position = newPosition;
    }

    ClusterModel.update(cluster1Id, updates);

    // Update all cards from cluster2
    cluster2.cardIds.forEach(cardId => {
      CardModel.update(cardId, { clusterId: cluster1Id });
    });

    // Delete cluster2
    ClusterModel.delete(cluster2Id);

    return {
      cluster: ClusterModel.findById(cluster1Id)!,
      deletedClusterId: cluster2Id
    };
  }

  /**
   * Ungroup a cluster back into individual cards
   */
  static ungroupCluster(clusterId: string): void {
    const cluster = ClusterModel.findById(clusterId);
    if (!cluster) throw new Error('Cluster not found');

    // Remove cluster reference from all cards
    cluster.cardIds.forEach(cardId => {
      CardModel.update(cardId, { clusterId: null });
    });

    // Delete cluster
    ClusterModel.delete(clusterId);
  }

  /**
   * Calculate cluster position as centroid of card positions
   */
  private static calculateClusterPosition(cards: Card[]): { x: number; y: number } {
    const avgX = cards.reduce((sum, card) => sum + card.position.x, 0) / cards.length;
    const avgY = cards.reduce((sum, card) => sum + card.position.y, 0) / cards.length;
    return { x: Math.round(avgX), y: Math.round(avgY) };
  }
}
