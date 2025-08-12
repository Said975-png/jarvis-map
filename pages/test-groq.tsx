import { useState } from 'react'

export default function TestGroq() {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState('')

  const testGroq = async () => {
    setLoading(true)
    setError('')
    setResponse('')

    try {
      setLogs('Отправляем запрос к API...\n')

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Привет! Проверяем работу GROQ API' }]
        }),
      })

      setLogs(prev => prev + `Статус о��вета: ${res.status}\n`)
      setLogs(prev => prev + `Заголовки: ${JSON.stringify(Object.fromEntries(res.headers))}\n`)

      const data = await res.json()

      setLogs(prev => prev + `Данные ответа: ${JSON.stringify(data, null, 2)}\n`)

      if (data.error) {
        setError(data.error)
      } else {
        setResponse(data.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Тест GROQ API</h1>
      
      <button 
        onClick={testGroq} 
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Тестируем...' : 'Протестировать GROQ API'}
      </button>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#c33'
        }}>
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      {logs && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#333'
        }}>
          <strong>Логи:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px', fontSize: '12px' }}>{logs}</pre>
        </div>
      )}

      {response && (
        <div style={{
          padding: '10px',
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#060'
        }}>
          <strong>Ответ:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>{response}</pre>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>Эта страница тестирует подключение к GROQ API.</p>
        <p>Если видите ответ - значит все работает правильно!</p>
      </div>
    </div>
  )
}
