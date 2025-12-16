import { SessionModel } from '../models/Session';
import { CardModel } from '../models/Card';
import { ClusterModel } from '../models/Cluster';
import { VoteModel } from '../models/Vote';
import { ActionItemModel } from '../models/ActionItem';
import { UserModel } from '../models/User';
import { TEMPLATES } from '../../../shared/types';

export class ExportService {
  static exportSessionAsMarkdown(sessionId: string): string {
    const session = SessionModel.findById(sessionId);
    if (!session) throw new Error('Session not found');

    const cards = CardModel.findBySessionId(sessionId);
    const clusters = ClusterModel.findBySessionId(sessionId);
    const votes = VoteModel.findBySessionId(sessionId);
    const actionItems = ActionItemModel.findBySessionId(sessionId);
    const users = UserModel.findBySessionId(sessionId);

    const template = TEMPLATES[session.settings.template];
    const date = new Date(session.createdAt).toLocaleDateString();

    let markdown = `# Sprint Retrospective - ${template.name}\n\n`;
    markdown += `**Date:** ${date}\n`;
    markdown += `**Participants:** ${users.map(u => u.displayName).join(', ')}\n\n`;
    markdown += `---\n\n`;

    // Group cards by column
    session.settings.columns.forEach(column => {
      markdown += `## ${column}\n\n`;

      const columnCards = cards.filter(c => c.column === column && !c.clusterId);
      const columnClusters = clusters.filter(cl => cl.column === column);

      // Individual cards
      columnCards.forEach(card => {
        const voteCount = votes.filter(v => v.targetId === card.id).length;
        const voteText = voteCount > 0 ? ` 👍 ${voteCount}` : '';
        markdown += `- ${card.content}${voteText}\n`;
      });

      // Clusters
      columnClusters.forEach(cluster => {
        const clusterVotes = votes.filter(v => v.targetId === cluster.id).length;
        const clusterCards = cards.filter(c => cluster.cardIds.includes(c.id));
        const totalVotes = clusterVotes + clusterCards.reduce((sum, card) => {
          return sum + votes.filter(v => v.targetId === card.id).length;
        }, 0);

        markdown += `\n**Cluster** 👍 ${totalVotes}\n`;
        clusterCards.forEach(card => {
          markdown += `  - ${card.content}\n`;
        });
      });

      markdown += `\n`;
    });

    // Action Items
    if (actionItems.length > 0) {
      markdown += `## Action Items\n\n`;
      actionItems.forEach((item, index) => {
        markdown += `${index + 1}. **${item.owner}**: ${item.task}\n`;
      });
      markdown += `\n`;
    }

    markdown += `---\n\n`;
    markdown += `*Generated on ${new Date().toLocaleString()}*\n`;

    return markdown;
  }
}
