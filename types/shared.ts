// Shared types between Deno (edge functions) and Node.js (server)
export interface Question {
  id: string
  text: string
  votes: number
  createdAt: string
  votedBy: string[]
  authorId: string
}
