import type { LangfuseSpan } from '@langfuse/tracing'
import { propagateAttributes, startActiveObservation } from '@langfuse/tracing'
import type { StreamTextOnErrorCallback } from 'ai'
import { consumeStream, convertToModelMessages, smoothStream } from 'ai'

import { researcher } from '@/lib/agents/researcher'
import { getObjectBytes } from '@/lib/storage/r2-client'
import {
  createPublicErrorResponse,
  serializePublicError
} from '@/lib/errors/public-error'
import {
  isToolFailureError,
  serializeToolFailure
} from '@/lib/errors/tool-error'
import { isTracingEnabled } from '@/lib/utils/telemetry'

import { loadChatUncached } from '../actions/chat'
import { generateChatTitle } from '../agents/title-generator'
import {
  getMaxAllowedTokens,
  shouldTruncateMessages,
  truncateMessages
} from '../utils/context-window'
import { getTextFromParts } from '../utils/message-utils'
import { perfLog, perfTime } from '../utils/perf-logging'
import { isUsageLogging, logUsage } from '../utils/usage-logging'

import { resolveAttachmentSizes } from './helpers/attachment-sizes'
import { buildAttachmentTokenEstimates } from './helpers/attachment-token-estimates'
import { capHistoricalAttachments } from './helpers/cap-historical-attachments'
import { compactHistoricalMessages } from './helpers/compact-historical-messages'
import { convertDataPart } from './helpers/convert-data-part'
import { assignDataPartNonces } from './helpers/data-part-nonce'
import { dedupeAttachments } from './helpers/dedupe-attachments'
import { describeTurnInput } from './helpers/describe-turn-input'
import {
  EMPTY_RESPONSE_STATUS_MESSAGE,
  isEmptyResponse
} from './helpers/is-empty-response'
import { logAPICallErrorDiagnostics } from './helpers/log-api-call-error'
import { persistStreamResults } from './helpers/persist-stream-results'
import { prepareMessages } from './helpers/prepare-messages'
import {
  buildStreamErrorSpanUpdate,
  type StreamErrorPhase,
  type StreamErrorStage
} from './helpers/stream-error-diagnostics'
import { stripSpecFromMessages } from './helpers/strip-spec-from-messages'
import { summarizeCarriedContext } from './helpers/summarize-carried-context'
import type { StreamContext } from './helpers/types'
import { BaseStreamConfig } from './types'

import { langfuseSpanProcessor } from '@/instrumentation'

// Constants
const DEFAULT_CHAT_TITLE = 'Untitled'

function getModelFileUrl(data: unknown): string | undefined {
  if (typeof data === 'string') return data
  if (data instanceof URL) return data.href

  // Defensive support for the normalized AI SDK representation.
  if (!data || typeof data !== 'object') return undefined
  const normalized = data as { type?: unknown; url?: unknown }
  if (normalized.type !== 'url') return undefined
  if (normalized.url instanceof URL) return normalized.url.href
  return typeof normalized.url === 'string' ? normalized.url : undefined
}

/**
 * April Engine keeps uploaded files private in object storage. The UI/history
 * uses short-lived signed URLs, but PDF model input is converted to inline
 * bytes before generation so OpenAI does not receive a remote PDF URL.
 */
async function inlineStoredPdfAttachments(
  uiMessages: any[],
  modelMessages: any[]
) {
  const keyByUrl = new Map<string, string>()

  for (const message of uiMessages) {
    for (const part of message?.parts ?? []) {
      if (
        part?.type === 'file' &&
        part?.mediaType === 'application/pdf' &&
        typeof part?.key === 'string' &&
        part.key.length > 0 &&
        typeof part?.url === 'string' &&
        part.url.length > 0
      ) {
        keyByUrl.set(part.url, part.key)
      }
    }
  }

  if (keyByUrl.size === 0) return modelMessages

  const bytesByUrl = new Map<string, Uint8Array>()
  await Promise.all(
    Array.from(keyByUrl.entries()).map(async ([url, key]) => {
      bytesByUrl.set(url, await getObjectBytes(key))
    })
  )

  return modelMessages.map(message => {
    if (!Array.isArray(message?.content)) return message

    return {
      ...message,
      content: message.content.map((part: any) => {
        if (part?.type !== 'file' || part?.mediaType !== 'application/pdf') {
          return part
        }

        const url = getModelFileUrl(part.data)
        if (!url) return part

        const bytes = bytesByUrl.get(url)
        if (!bytes) return part

        // ModelMessage file data accepts inline binary data directly.
        return {
          ...part,
          data: bytes
        }
      })
    }
  })
}

export async function createChatStreamResponse(
  config: BaseStreamConfig
): Promise<Response> {
  const {
    message,
    model,
    chatId,
    userId,
    trigger,
    messageId,
    abortSignal,
    isNewChat,
    searchMode
  } = config

  // Verify that chatId is provided
  if (!chatId) {
    return new Response('Chat ID is required', {
      status: 400,
      statusText: 'Bad Request'
    })
  }

  // Skip loading chat for new chats optimization
  let initialChat = null
  if (!isNewChat) {
    try {
      const loadChatStart = performance.now()
      // Read uncached: the prompt must not be built from a snapshot that
      // predates the previous turn's answer
      initialChat = await loadChatUncached(chatId, userId)
      perfTime('loadChat completed', loadChatStart)
    } catch (error) {
      logAPICallErrorDiagnostics(error)
      console.error('Initial chat load error:', error)
      return createPublicErrorResponse(error, {
        status: 500,
        statusText: 'Internal Server Error'
      })
    }

    // Authorization check: if chat exists, it must belong to the user
    if (initialChat && initialChat.userId !== userId) {
      return new Response('You are not allowed to access this chat', {
        status: 403,
        statusText: 'Forbidden'
      })
    }
  } else {
    perfLog('loadChat skipped for new chat')
  }

  const executeStream = async (rootSpan?: LangfuseSpan): Promise<Response> => {
    // Real OTel trace ID, stored in message metadata so feedback scores can
    // be attached to this trace later
    const parentTraceId = rootSpan?.traceId
    let hasStreamError = false
    let hasEmptyResponse = false
    let streamError: unknown
    // The agent stream call is preparation until its first generation starts.
    let streamErrorPhase: StreamErrorPhase = 'preparation'
    let streamErrorStage: StreamErrorStage = 'prepare-messages'
    // Sampled where the failure happens: the client can disconnect before the
    // span is closed, and by then the signal no longer says whether the user
    // cancelled this turn or the failure was the model's own.
    let streamErrorWasCancelled = false
    // Overall IO of the trace lives on the root observation. A regenerate turn
    // carries no incoming message, so its input comes from the prepared history.
    let rootInput = describeTurnInput(message?.parts)
    let rootOutput: string | undefined
    let carriedContext: Record<string, number> | undefined
    let contextWindowTruncated = false

    const endTracing = async () => {
      if (rootSpan) {
        const failureUpdate = hasStreamError
          ? buildStreamErrorSpanUpdate(streamError, {
              requestWasCancelled: streamErrorWasCancelled,
              phase: streamErrorPhase,
              stage: streamErrorStage
            })
          : hasEmptyResponse
            ? {
                level: 'ERROR' as const,
                statusMessage: EMPTY_RESPONSE_STATUS_MESSAGE
              }
            : null
        // A turn that failed mid-answer or produced no answer text still has
        // whatever was streamed before it. That is not the turn's answer, so
        // it is not recorded as one.
        const hasAnswer = !hasStreamError && !hasEmptyResponse
        // A failure update carries its own metadata (#945), so the two are
        // merged rather than spread as siblings: whichever came last would
        // otherwise drop the other one entirely.
        const failureMetadata =
          failureUpdate && 'metadata' in failureUpdate
            ? failureUpdate.metadata
            : undefined
        const metadata = {
          ...(carriedContext !== undefined && { carriedContext }),
          ...(contextWindowTruncated && { contextWindowTruncated }),
          ...failureMetadata
        }
        const update = {
          ...(rootInput !== undefined && { input: rootInput }),
          ...(hasAnswer && rootOutput !== undefined && { output: rootOutput }),
          ...failureUpdate,
          ...(Object.keys(metadata).length > 0 && { metadata })
        }
        if (Object.keys(update).length > 0) rootSpan.update(update)
        rootSpan.end()
        await langfuseSpanProcessor.forceFlush()
      }
    }

    // Create stream context with trace ID
    const context: StreamContext = {
      chatId,
      userId,
      modelId: `${model.providerId}:${model.id}`,
      messageId,
      trigger,
      initialChat,
      abortSignal,
      parentTraceId,
      isNewChat
    }

    // Declare titlePromise in outer scope for onFinish access
    let titlePromise: Promise<string> | undefined

    try {
      // Prepare messages for the model
      const prepareStart = performance.now()
      perfLog(
        `prepareMessages - Invoked: trigger=${trigger}, isNewChat=${isNewChat}`
      )
      const messagesToModel = await prepareMessages(context, message)
      perfTime('prepareMessages completed (stream)', prepareStart)

      if (rootInput === undefined) {
        rootInput = describeTurnInput(
          messagesToModel.findLast(m => m.role === 'user')?.parts
        )
      }

      // Get the researcher agent with search mode
      streamErrorStage = 'build-agent'
      const researchAgent = researcher({
        model: context.modelId,
        modelConfig: model,
        chatId,
        searchMode
      })

      streamErrorStage = 'transform-messages'
      const messagesWithNonces = assignDataPartNonces(messagesToModel)
      const messagesWithoutSpec = stripSpecFromMessages(messagesWithNonces)
      const messagesWithAttachmentSizes = await resolveAttachmentSizes(
        messagesWithoutSpec,
        userId
      )
      const messagesToConvert = dedupeAttachments(
        capHistoricalAttachments(
          compactHistoricalMessages(messagesWithAttachmentSizes)
        )
      )
      carriedContext = summarizeCarriedContext(messagesToConvert)
      const attachmentTokenEstimates =
        buildAttachmentTokenEstimates(messagesToConvert)

      // Convert to model messages and apply context window management
      streamErrorStage = 'convert-messages'
      let modelMessages = await convertToModelMessages(messagesToConvert, {
        convertDataPart
      })

      streamErrorStage = 'inline-pdf-attachments'
      modelMessages = await inlineStoredPdfAttachments(
        messagesToConvert,
        modelMessages
      )

      streamErrorStage = 'truncate-messages'
      if (
        shouldTruncateMessages(modelMessages, model, attachmentTokenEstimates)
      ) {
        const maxTokens = getMaxAllowedTokens(model)
        const originalCount = modelMessages.length
        modelMessages = truncateMessages(
          modelMessages,
          maxTokens,
          model.id,
          attachmentTokenEstimates
        )
        contextWindowTruncated = true

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `Context window limit reached. Truncating from ${originalCount} to ${modelMessages.length} messages`
          )
        }
      }

      // Start title generation in parallel if it's a new chat
      streamErrorStage = 'start-title-generation'
      if (!initialChat && message) {
        const userContent = getTextFromParts(message.parts)
        titlePromise = generateChatTitle({
          userMessageContent: userContent,
          modelId: context.modelId,
          abortSignal
        }).catch(error => {
          console.error('Error generating title:', error)
          return DEFAULT_CHAT_TITLE
        })
      }

      const llmStart = performance.now()
      perfLog(
        `researchAgent.stream - Start: model=${context.modelId}, searchMode=${searchMode}`
      )
      streamErrorStage = 'start-stream'
      // AgentStreamParameters omits onError, but it reaches streamText where only
      // stream errors, not recoverable tool errors, invoke it.
      const result = await researchAgent.stream({
        messages: modelMessages,
        abortSignal,
        onError: ({ error }) => {
          hasStreamError = true
          streamError = error
          streamErrorWasCancelled = abortSignal?.aborted ?? false
          streamErrorPhase = 'generation'

          // Preserve April Engine's safe public error while exposing the
          // original provider error only in server logs for diagnosis.
          logAPICallErrorDiagnostics(error)
          console.error('[Researcher stream provider error]', error)
        },
        experimental_transform: smoothStream({ chunking: 'word' }),
        ...(isUsageLogging() && {
          onStepEnd: step => {
            logUsage(
              { scope: 'step', modelId: context.modelId },
              step.usage,
              step.providerMetadata
            )
          }
        })
      } as Parameters<typeof researchAgent.stream>[0] & {
        onError: StreamTextOnErrorCallback
      })
      result.consumeStream()

      // Log the session-total usage once the stream settles (does not block the
      // response; consumeStream above already drives it to completion).
      if (isUsageLogging()) {
        Promise.resolve(result.usage)
          .then(usage =>
            logUsage({ scope: 'total', modelId: context.modelId }, usage)
          )
          .catch(() => {})
      }

      return result.toUIMessageStreamResponse({
        messageMetadata: ({ part }) => {
          if (part.type === 'start') {
            return {
              traceId: parentTraceId,
              searchMode,
              modelId: context.modelId
            }
          }
        },
        onEnd: async ({ responseMessage, isAborted }) => {
          try {
            perfTime('researchAgent.stream completed', llmStart)
            if (isAborted || !responseMessage) return

            rootOutput = getTextFromParts(responseMessage.parts) || undefined
            hasEmptyResponse = isEmptyResponse(responseMessage)

            // Persist stream results to database
            await persistStreamResults(
              responseMessage,
              chatId,
              userId,
              titlePromise,
              parentTraceId,
              searchMode,
              context.modelId,
              context.pendingInitialSave,
              context.pendingInitialUserMessage
            )
          } finally {
            await endTracing()
          }
        },
        onError: (error: unknown) => {
          if (isToolFailureError(error)) {
            console.error('Tool failure:', error)
            return serializeToolFailure(error)
          }

          logAPICallErrorDiagnostics(error)
          console.error('Stream response error:', error)
          return serializePublicError(error)
        },
        consumeSseStream: consumeStream
      })
    } catch (error) {
      hasStreamError = true
      streamError = error
      streamErrorWasCancelled = abortSignal?.aborted ?? false
      await endTracing()
      logAPICallErrorDiagnostics(error)
      console.error('Stream execution error:', error)
      return createPublicErrorResponse(error, {
        status: 500,
        statusText: 'Internal Server Error'
      })
    }
  }

  if (!isTracingEnabled()) {
    return executeStream()
  }

  // Wrap execution in a root Langfuse observation so the researcher and
  // title-generation spans share a single trace
  return propagateAttributes(
    {
      traceName: 'research',
      userId,
      sessionId: chatId,
      metadata: {
        chatId,
        userId,
        modelId: `${model.providerId}:${model.id}`,
        ...(trigger && { trigger })
      }
    },
    () =>
      startActiveObservation('research', span => executeStream(span), {
        endOnExit: false
      })
  )
}
