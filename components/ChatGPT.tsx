import { useState, useRef, useEffect } from 'react'
import { ChatHistoryManager, ChatSession, Message } from '../lib/chatHistory'
import { useTheme } from '../contexts/ThemeContext'
import MessageFeedback from './MessageFeedback'

interface ChatGPTProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChatGPT({ isOpen, onClose }: ChatGPTProps) {
  const { isDarkTheme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я ДЖАРВИС, ваш AI-помощник. Чем могу помочь?\n\n💡 Нова�� функция: Загрузите фото человека и одежды, скажите "одень эту вещь на меня" для виртуальной примерки! 👔✨',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [interactionIds, setInteractionIds] = useState<{[messageId: string]: string}>({})
  const [uploadedImages, setUploadedImages] = useState<{[messageId: string]: string}>({})
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  // Функция ��ля сохранения взаимодействия в базе знаний
  const saveInteractionToLearning = async (userMessage: string, botResponse: string, userMessageId: string) => {
    try {
      const response = await fetch('/api/learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_interaction',
          userMessage,
          botResponse,
          sessionId: sessionId.current,
          context: messages.slice(-3).map(m => m.text), // Последние 3 сообщения как контекст
          tags: extractTags(userMessage + ' ' + botResponse)
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Сохраняем ID взаимодействия для связи с сообщением
        setInteractionIds(prev => ({
          ...prev,
          [userMessageId]: data.data.interactionId
        }))
        console.log('Interaction saved for learning:', data.data.interactionId)
      }
    } catch (error) {
      console.error('Error saving interaction for learning:', error)
    }
  }

  // Извл��чение тегов из текста
  const extractTags = (text: string): string[] => {
    const commonTags = [
      'веб-разработка', 'дизайн', 'программирование', 'ai', 'технологии',
      'фронтенд', 'бэкенд', 'react', 'javascript', 'typescript', 'css',
      'html', 'api', 'база данных', 'сеть', 'безопасность', 'ui', 'ux'
    ]

    const lowerText = text.toLowerCase()
    return commonTags.filter(tag => lowerText.includes(tag))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [inputText])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'

      // Предотвращение зума на мобильных устройствах
      const viewport = document.querySelector('meta[name=viewport]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      }

      // Дополнительная защита от зума
      document.documentElement.style.webkitTextSizeAdjust = '100%'
      document.documentElement.style.textSizeAdjust = '100%'
      document.body.style.webkitTextSizeAdjust = '100%'
      document.body.style.textSizeAdjust = '100%'

    } else {
      document.body.style.overflow = 'unset'

      // Восстанавливаем оригинальные настройки
      document.documentElement.style.webkitTextSizeAdjust = ''
      document.documentElement.style.textSizeAdjust = ''
      document.body.style.webkitTextSizeAdjust = ''
      document.body.style.textSizeAdjust = ''
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.documentElement.style.webkitTextSizeAdjust = ''
      document.documentElement.style.textSizeAdjust = ''
      document.body.style.webkitTextSizeAdjust = ''
      document.body.style.textSizeAdjust = ''
    }
  }, [isOpen])

  const generateJarvisResponse = async (userMessage: string, conversationHistory: Message[], messageId?: string): Promise<string> => {
    try {
      // Проверяем, если это запрос на примерку одежды
      const isTryOnRequest = userMessage.toLowerCase().includes('одень') ||
                            userMessage.toLowerCase().includes('примерь') ||
                            userMessage.toLowerCase().includes('надень')

      if (isTryOnRequest && messageId && uploadedImages[messageId]) {
        // Отправляем запрос на виртуальную примерку
        const response = await fetch('/api/virtual-tryon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: uploadedImages[messageId].split(','),
            prompt: userMessage
          }),
        })

        const data = await response.json()
        if (data.success) {
          return `✨ Виртуальная примерка готова!\n\n![Результат примерки](${data.resultImage})\n\n🎯 Как вам результат? Могу обработать другие варианты о��ежды!`
        } else {
          return '😔 Извините, произошла ошибка при обработке примерки. Попробуйте:\n• Загрузить изображения заново\n• Использовать более четкие фотографи��\n• Убедиться, что одно фото - человек, другое - одежда'
        }
      }

      const apiMessages = conversationHistory
        .filter(msg => msg.text !== 'При��ет! Я ДЖАРВИС, ваш AI-помощник. Чем могу п����очь?')
        .map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text
        }))

      apiMessages.push({
        role: 'user',
        content: userMessage
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      return data.message
    } catch (error) {
      console.error('Error calling AI API:', error)
      return 'Я готов помочь! Попробуйте ещё раз, задав ваш вопрос. ��сли проблема повторится - задавайте вопросы прямо зд��сь в чате! 🚀'
    }
  }

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Пожалуйста, выберите изображения',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    setIsUploadingFile(true)

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()
        return { file: file.name, url: data.url }
      })

      const uploadResults = await Promise.all(uploadPromises)

      // Добавляем изображения в превью (не отправляем сразу в чат)
      setPreviewImages(uploadResults.map(r => r.url))

    } catch (error) {
      console.error('Image upload error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Ошибка при загрузке изображений: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsUploadingFile(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Пожалуйста, выберите PDF файл',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Размер файла не должен превы��ать 10MB',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    setIsUploadingFile(true)

    // Добавляем сообщение о загрузке файла
    const uploadMessage: Message = {
      id: Date.now().toString(),
      text: `📎 Загружаю файл: ${file.name}`,
      isUser: true,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, uploadMessage])

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      const analysisMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || 'Файл проан��лизирован',
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, analysisMessage])
    } catch (error) {
      console.error('File upload error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Ошибка при загрузке ��айла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsUploadingFile(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
    // Очищаем input для возможности повторной загруз��и того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleImageUpload(files)
    }
    // Очищаем input для возможности повторной загрузки
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    if (!isTyping && !isUploadingFile && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const openImageDialog = () => {
    if (!isTyping && !isUploadingFile && imageInputRef.current) {
      imageInputRef.current.click()
    }
  }

  const removePreviewImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllPreviews = () => {
    setPreviewImages([])
  }


  const handleSendMessage = async () => {
    if (!inputText.trim() && previewImages.length === 0) return

    let messageText = inputText

    // Если есть превью изображения, добавляем их в сообщение
    if (previewImages.length > 0) {
      const imageInfo = `🖼️ Изображения (${previewImages.length}): ${previewImages.map((_, i) => `Фото ${i + 1}`).join(', ')}\n\n`
      messageText = imageInfo + (inputText || 'Обработайте эти изображения')
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    }

    // Сохраняем изображения для этого со��бщения
    if (previewImages.length > 0) {
      setUploadedImages(prev => ({
        ...prev,
        [userMessage.id]: previewImages.join(',')
      }))
    }

    const currentInput = inputText || 'Обработайте эти изображения'
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputText('')
    setPreviewImages([]) // Очищаем превью после отправки
    setIsTyping(true)

    try {
      const aiText = await generateJarvisResponse(currentInput, updatedMessages, userMessage.id)

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date()
      }

      const finalMessages = [...updatedMessages, aiResponse]
      setMessages(finalMessages)

      // Сохраняем взаимодействие для обучения
      await saveInteractionToLearning(currentInput, aiText, aiResponse.id)
    } catch (error) {
      console.error('Error generating AI response:', error)
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Извините, произошла ошибка. Попр��буйте еще раз.',
        isUser: false,
        timestamp: new Date()
      }
      
      const finalMessages = [...updatedMessages, errorResponse]
      setMessages(finalMessages)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="jarvis-chat-overlay">
      <div className="jarvis-chat-container">
        {/* Header */}
        <div className="jarvis-chat-header">
          <div className="jarvis-chat-title">
            <div className="jarvis-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <div>
              <h3>ДЖАРВИС</h3>
              <div className="status-indicator">
                В сети
              </div>
            </div>
          </div>
          <button className="jarvis-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="jarvis-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
            >
              {!message.isUser && (
                <div className="message-avatar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
              )}
              <div className="message-content">
                <div className="message-bubble">
                  {message.text.split('\n').map((line, index) => {
                    // Проверяем, если строка содержит markdown изображение
                    const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/)
                    if (imageMatch) {
                      return (
                        <div key={index} className="message-image">
                          <img src={imageMatch[2]} alt={imageMatch[1]} className="chat-result-image" />
                        </div>
                      )
                    }
                    return (
                      <div key={index}>
                        {line}
                        {index < message.text.split('\n').length - 1 && <br />}
                      </div>
                    )
                  })}
                </div>
                {!message.isUser && interactionIds[message.id] && (
                  <MessageFeedback
                    interactionId={interactionIds[message.id]}
                    onFeedbackSent={(rating) => {
                      console.log(`Feedback sent for message ${message.id}: ${rating}`)
                    }}
                  />
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message ai-message">
              <div className="message-avatar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div className="message-content">
                <div className="message-bubble typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Previews */}
        {previewImages.length > 0 && (
          <div className="image-preview-container">
            <div className="preview-header">
              <span className="preview-title">
                📸 Загружено изображений: {previewImages.length}
              </span>
              <button
                className="clear-previews-btn"
                onClick={clearAllPreviews}
                title="Удалить все изображения"
              >
                ✕
              </button>
            </div>
            <div className="preview-images">
              {previewImages.map((url, index) => (
                <div key={index} className="preview-image-item">
                  <img src={url} alt={`Preview ${index + 1}`} className="preview-image" />
                  <button
                    className="remove-image-btn"
                    onClick={() => removePreviewImage(index)}
                    title="Удалить изображение"
                  >
                    ✕
                  </button>
                  <span className="image-label">
                    {index === 0 ? 'Человек' : index === 1 ? 'Одежда' : `Фото ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
            {previewImages.length === 2 && (
              <div className="tryon-hint">
                💡 Напишите "одень эту вещь на меня" для виртуальной примерки!
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="jarvis-input-area">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageInputChange}
            style={{ display: 'none' }}
          />
          <div className="jarvis-input-container">
            <button
              onClick={openImageDialog}
              disabled={isTyping || isUploadingFile}
              className="jarvis-image-btn"
              title="Загрузить изображения для примерки"
            >
              {isUploadingFile ? (
                <div className="attachment-loading">
                  <div className="loading-spinner-small"></div>
                </div>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <button
              onClick={openFileDialog}
              disabled={isTyping || isUploadingFile}
              className="jarvis-attachment-btn"
              title="Прикрепить PDF файл"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21.44 11.05L12.25 20.24C11.1137 21.3568 9.59034 21.9749 8.005 21.9749C6.41966 21.9749 4.8963 21.3568 3.76 20.24C2.64317 19.1037 2.02508 17.5803 2.02508 15.995C2.02508 14.4097 2.64317 12.8863 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7186 1.38755 15.78 1.38755C16.8414 1.38755 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7825 4.32859 19.7825 5.39C19.7825 6.45141 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03494 17.7851 8.52656 17.9972 8 17.9972C7.47344 17.9972 6.96506 17.7851 6.59 17.41C6.21494 17.0349 6.00281 16.5266 6.00281 16C6.00281 15.4734 6.21494 14.9651 6.59 14.59L15.07 6.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={previewImages.length > 0 ? "Опишите что хотите сделать с изображениями..." : "Сообщение ДЖАРВИСУ..."}
              className="jarvis-textarea"
              rows={1}
              disabled={isTyping || isUploadingFile}
            />
            <button
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && previewImages.length === 0) || isTyping || isUploadingFile}
              className="jarvis-send-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7 11L12 6L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
