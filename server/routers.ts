import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import { invokeLLM, type Message } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { nanoid } from "nanoid";
import {
  createPrediction,
  getPredictions,
  getPredictionById,
  createComment,
  getCommentsByPredictionId,
  toggleUpvote,
  hasUserUpvoted,
  createNotification,
  getNotificationsByUserId,
  markNotificationAsRead,
  getUnreadNotificationCount,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  predictions: router({
    submit: protectedProcedure
      .input(
        z.object({
          imageData: z.string(), // base64 encoded image
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Upload image to S3
        const imageBuffer = Buffer.from(input.imageData.split(',')[1] || input.imageData, 'base64');
        const fileKey = `predictions/${ctx.user.id}-${nanoid()}.${input.mimeType.split('/')[1]}`;
        const { url: imageUrl } = await storagePut(fileKey, imageBuffer, input.mimeType);

        // Use AI to classify the image
        const messages: Message[] = [
          {
            role: "system",
            content: "You are an expert at identifying hot dogs in images. Respond with a JSON object containing 'isHotDog' (boolean) and 'confidence' (0-100 integer).",
          },
          {
            role: "user",
            content: [
              {
                type: "text" as const,
                text: "Is this a hot dog? Provide your answer as JSON with isHotDog (boolean) and confidence (0-100).",
              },
              {
                type: "image_url" as const,
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ];
        
        const llmResponse = await invokeLLM({
          messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "hot_dog_classification",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  isHotDog: { type: "boolean" },
                  confidence: { type: "integer", minimum: 0, maximum: 100 },
                },
                required: ["isHotDog", "confidence"],
                additionalProperties: false,
              },
            },
          },
        });

        const messageContent = llmResponse.choices[0].message.content;
        const classification = JSON.parse(typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent));

        // Save to database
        const result = await createPrediction({
          userId: ctx.user.id,
          imageUrl,
          imageKey: fileKey,
          isHotDog: classification.isHotDog,
          confidence: classification.confidence,
        });

        // Create notifications for all users about new prediction
        const allPredictions = await getPredictions();
        const uniqueUserIds = Array.from(new Set(allPredictions.map(p => p.prediction.userId)));
        
        const predictionId = Number((result as any).insertId);
        
        for (const userId of uniqueUserIds) {
          if (userId !== ctx.user.id) {
            await createNotification({
              userId,
              type: 'new_prediction',
              predictionId,
              actorId: ctx.user.id,
              content: `${ctx.user.name || 'Someone'} uploaded a new ${classification.isHotDog ? 'hot dog' : 'not hot dog'} image!`,
            });
          }
        }

        return {
          id: predictionId,
          isHotDog: classification.isHotDog,
          confidence: classification.confidence,
          imageUrl,
        };
      }),

    list: publicProcedure
      .input(
        z.object({
          filter: z.enum(['all', 'hotdog', 'not-hotdog']).optional(),
        })
      )
      .query(async ({ input }) => {
        const filter = input.filter === 'hotdog' ? 'hotdog' : input.filter === 'not-hotdog' ? 'not-hotdog' : undefined;
        return await getPredictions(filter);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getPredictionById(input.id);
      }),

    hasUpvoted: protectedProcedure
      .input(z.object({ predictionId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await hasUserUpvoted(input.predictionId, ctx.user.id);
      }),
  }),

  comments: router({
    add: protectedProcedure
      .input(
        z.object({
          predictionId: z.number(),
          content: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createComment({
          predictionId: input.predictionId,
          userId: ctx.user.id,
          content: input.content,
        });

        // Get prediction owner to notify
        const prediction = await getPredictionById(input.predictionId);
        if (prediction && prediction.prediction.userId !== ctx.user.id) {
          await createNotification({
            userId: prediction.prediction.userId,
            type: 'comment',
            predictionId: input.predictionId,
            actorId: ctx.user.id,
            content: `${ctx.user.name || 'Someone'} commented on your prediction`,
          });
        }

        return { id: Number((result as any).insertId) };
      }),

    list: publicProcedure
      .input(z.object({ predictionId: z.number() }))
      .query(async ({ input }) => {
        return await getCommentsByPredictionId(input.predictionId);
      }),
  }),

  upvotes: router({
    toggle: protectedProcedure
      .input(z.object({ predictionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await toggleUpvote(input.predictionId, ctx.user.id);

        // Notify prediction owner if upvote was added
        if (result.action === 'added') {
          const prediction = await getPredictionById(input.predictionId);
          if (prediction && prediction.prediction.userId !== ctx.user.id) {
            await createNotification({
              userId: prediction.prediction.userId,
              type: 'upvote',
              predictionId: input.predictionId,
              actorId: ctx.user.id,
              content: `${ctx.user.name || 'Someone'} upvoted your prediction`,
            });
          }
        }

        return result;
      }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getNotificationsByUserId(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationAsRead(input.notificationId);
        return { success: true };
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await getUnreadNotificationCount(ctx.user.id);
    }),
  }),

  ai: router({
    generateHotDog: protectedProcedure
      .input(
        z.object({
          prompt: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const result = await generateImage({
          prompt: `A delicious hot dog, ${input.prompt}. High quality food photography.`,
        });

        return { imageUrl: result.url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
