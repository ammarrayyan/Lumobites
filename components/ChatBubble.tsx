export default function ChatBubble({ role, content }: { role: 'user' | 'assistant', content: string }) {
  const isUser = role === 'user';
  
  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
      <div 
        style={{
          maxWidth: '85%',
          padding: '14px 20px',
          fontSize: '16px',
          lineHeight: '1.5',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          backgroundColor: isUser ? '#8B5E3C' : '#F5EDE4',
          color: isUser ? '#FFFFFF' : '#1A1A1A',
          borderRadius: '18px',
          borderTopRightRadius: isUser ? '4px' : '18px',
          borderTopLeftRadius: isUser ? '18px' : '4px'
        }}
      >
        {content}
      </div>
    </div>
  );
}
