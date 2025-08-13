import { useState } from 'react'

export default function TestChat() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const testChat = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }]
        })
      })
      const data = await res.json()
      setResponse(data.message)
    } catch (error) {
      setResponse('Ошибка: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Тест OpenRouter API - ДЖАРВИС</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <textarea 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Введите сообщение для ДЖАРВИС..."
          style={{ width: '100%', height: '100px', padding: '10px', fontSize: '16px' }}
        />
      </div>
      
      <button 
        onClick={testChat}
        disabled={loading || !message.trim()}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Отправляю...' : 'Отправить'}
      </button>
      
      {response && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '5px',
          whiteSpace: 'pre-wrap'
        }}>
          <h3>Ответ ДЖАРВИС:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  )
}
