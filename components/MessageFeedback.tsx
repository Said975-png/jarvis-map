import { useState } from 'react'

interface MessageFeedbackProps {
  interactionId: string
  onFeedbackSent?: (rating: 'positive' | 'negative') => void
}

export default function MessageFeedback({ interactionId, onFeedbackSent }: MessageFeedbackProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleRating = async (newRating: 'positive' | 'negative') => {
    if (submitted) return

    setRating(newRating)
    
    if (newRating === 'negative') {
      setShowComment(true)
      return
    }

    await submitFeedback(newRating)
  }

  const submitFeedback = async (finalRating: 'positive' | 'negative', finalComment?: string) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_feedback',
          interactionId,
          rating: finalRating,
          comment: finalComment || comment
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        onFeedbackSent?.(finalRating)
        console.log('Feedback sent successfully')
      } else {
        console.error('Failed to send feedback:', data.error)
      }
    } catch (error) {
      console.error('Error sending feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentSubmit = async () => {
    if (rating) {
      await submitFeedback(rating, comment)
      setShowComment(false)
    }
  }

  const handleCommentCancel = () => {
    setShowComment(false)
    setComment('')
    setRating(null)
  }

  if (submitted) {
    return (
      <div className="message-feedback submitted">
        <span className="feedback-thanks">
          Спасибо за обратную связь!
        </span>
      </div>
    )
  }

  return (
    <div className="message-feedback">
      {!showComment ? (
        <div className="feedback-buttons">
          <div className="rating-buttons">
            <button
              onClick={() => handleRating('positive')}
              disabled={isSubmitting}
              className={`feedback-btn like-btn positive ${rating === 'positive' ? 'selected' : ''}`}
              title="Нравится"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z" fill="currentColor"/>
              </svg>
            </button>
            <button
              onClick={() => handleRating('negative')}
              disabled={isSubmitting}
              className={`feedback-btn dislike-btn negative ${rating === 'negative' ? 'selected' : ''}`}
              title="Не нравится"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218C7.74 15.724 7.366 15 6.748 15H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.023c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c-.445 0-.72.498-.523.898.591 1.2.924 2.55.924 3.977a8.958 8.958 0 01-1.302 4.666c-.245.403.028.959.5.959h1.053c.832 0 1.612-.453 1.918-1.227z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="feedback-comment">
          <div className="comment-header">
            <span>Помогите ДЖАРВИС стать лучше:</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Что можно улучшить в этом ответе?"
            className="comment-textarea"
            rows={3}
          />
          <div className="comment-actions">
            <button
              onClick={handleCommentSubmit}
              disabled={isSubmitting}
              className="comment-submit"
            >
              {isSubmitting ? 'От��равка...' : 'Отправить'}
            </button>
            <button
              onClick={handleCommentCancel}
              disabled={isSubmitting}
              className="comment-cancel"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
