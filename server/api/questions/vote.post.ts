import { findQuestion, updateQuestion, type Question } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { questionId, userId } = body

  if (!questionId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Question ID and User ID are required'
    })
  }

  try {
    // Legacy endpoint - use default eventId for backward compatibility
    const eventId = 'default'
    const question = await findQuestion(eventId, questionId)
    
    if (!question) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Question not found'
      })
    }

    const hasVoted = question.votedBy.includes(userId)
    let updatedQuestion: Question | null

    if (hasVoted) {
      // Remove vote
      const newVotedBy = question.votedBy.filter((id: string) => id !== userId)
      updatedQuestion = await updateQuestion(eventId, questionId, {
        votedBy: newVotedBy,
        votes: Math.max(0, question.votes - 1)
      })
    } else {
      // Add vote
      const newVotedBy = [...question.votedBy, userId]
      updatedQuestion = await updateQuestion(eventId, questionId, {
        votedBy: newVotedBy,
        votes: question.votes + 1
      })
    }

    if (!updatedQuestion) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update question'
      })
    }

    return {
      success: true,
      question: updatedQuestion,
      voted: !hasVoted,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('Error voting on question:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process vote'
    })
  }
})
