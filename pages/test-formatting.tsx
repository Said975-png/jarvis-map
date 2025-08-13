import { useState } from 'react'

export default function TestFormatting() {
  const [response, setResponse] = useState('')

  const testFormatting = async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Напиши короткий ответ про веб-разработку' }]
        })
      })
      const data = await res.json()
      setResponse(data.message)
    } catch (error) {
      setResponse('Ошибка: ' + error.message)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Тест форматирования ДЖАРВИС</h1>
      
      <button 
        onClick={testFormatting}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px'
        }}
      >
        Тест ответа
      </button>
      
      {response && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '5px',
          border: '1px solid #ddd'
        }}>
          <h3>Ответ ДЖАРВИС:</h3>
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            fontFamily: 'monospace',
            backgroundColor: 'white',
            padding: '10px',
            border: '1px solid #ccc'
          }}>
            "{response}"
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Проверьте: нет ли лишних пробелов в начале или конце
          </p>
        </div>
      )}
    </div>
  )
}
