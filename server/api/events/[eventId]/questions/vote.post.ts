import { findQuestion, updateQuestion } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId')
    const body = await readBody(event)
    const { questionId, userId, action } = body

    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    if (!questionId || !userId || !action) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Question ID, user ID, and action are required'
      })
    }

    if (action !== 'vote' && action !== 'unvote') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Action must be "vote" or "unvote"'
      })
    }

    const question = await findQuestion(eventId, questionId)
    if (!question) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Question not found'
      })
    }

    const hasVoted = question.votedBy.includes(userId)

    let updatedQuestion
    if (action === 'vote' && !hasVoted) {
      updatedQuestion = await updateQuestion(eventId, questionId, {
        votes: question.votes + 1,
        votedBy: [...question.votedBy, userId]
      })
    } else if (action === 'unvote' && hasVoted) {
      updatedQuestion = await updateQuestion(eventId, questionId, {
        votes: question.votes - 1,
        votedBy: question.votedBy.filter(id => id !== userId)
      })
    } else {
      // No change needed
      updatedQuestion = question
    }

    return {
      success: true,
      question: updatedQuestion
    }
  } catch (error: any) {
    console.error('Error voting on question:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to vote on question'
    })
  }
})
