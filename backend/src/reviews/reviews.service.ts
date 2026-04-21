import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleBusinessService } from '../integrations/google/google-business.service';
import { AiService } from '../ai/ai.service';

/**
 * Módulo 10: Gestão de Avaliações (Reviews).
 *  - Lista reviews armazenadas (origem Google/Outro)
 *  - Sincroniza do Google Business Profile
 *  - Gera rascunho de resposta com IA
 *  - Publica resposta (se GMB configurado)
 */
@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gmb: GoogleBusinessService,
    private readonly ai: AiService,
  ) {}

  list(clinicId: string) {
    return this.prisma.review.findMany({
      where: { clinicId },
      orderBy: { postedAt: 'desc' },
      take: 200,
    });
  }

  stats(clinicId: string) {
    return this.prisma.review.aggregate({
      where: { clinicId },
      _avg: { rating: true },
      _count: true,
    });
  }

  syncFromGoogle(clinicId: string) {
    return this.gmb.syncReviews(clinicId);
  }

  async generateReplyDraft(reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review não encontrada');
    const tone =
      review.rating >= 4
        ? 'agradecimento caloroso e convite para retornar'
        : review.rating === 3
          ? 'empatia, pedido de desculpas leve e convite para falar pelo WhatsApp'
          : 'empatia profunda, responsabilidade sem expor dados clínicos, convite para resolver pelo WhatsApp';

    const prompt = `Você é gerente de reputação de uma clínica médica.
Escreva UMA resposta curta (até 350 caracteres), em português do Brasil, tom ${tone},
sem nomear procedimentos clínicos nem expor dados sensíveis, assinando como "Equipe da clínica".
Avaliação (${review.rating} estrelas) de ${review.authorName ?? 'paciente'}:
"""${review.comment ?? ''}"""`;

    const draft = await this.ai.complete(prompt);
    await this.prisma.review.update({
      where: { id: reviewId },
      data: { replyDraft: draft },
    });
    return { draft };
  }

  async postReply(reviewId: string, text: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review não encontrada');
    await this.gmb.replyToReview(review.externalId ?? review.id, text);
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { reply: text, repliedAt: new Date() },
    });
  }
}
