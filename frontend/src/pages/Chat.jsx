import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { chatService, connectionsService, usersService } from '../services/api';
import { Send, ArrowLeft, User, Clock, Phone, Video } from 'lucide-react';

export default function Chat() {
  const { otherUserId } = useParams();
  const navigate = useNavigate();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const startRes = await chatService.start(Number(otherUserId));
        setConv(startRes.conversation);
        const { messages: msgs, conversation } = await chatService.messages(startRes.conversation.id);
        setMessages(msgs);
        setConv(conversation);
        const uid = startRes.conversation.user1_id === Number(otherUserId) ? startRes.conversation.user2_id : startRes.conversation.user1_id;
        const { user: u } = await usersService.get(uid);
        setOtherUser(u);
      } catch (e) {
        alert('Unable to open chat. You may need to connect first.');
        navigate('/connections');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [Number(otherUserId)]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await chatService.send(conv.id, input);
      setInput('');
    } catch (err) {
      alert('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div className="spinner" style={{ display: 'inline-block' }}></div>
      </div>
    );
  }

  if (!conv) return null;

  return (
    <div className="chat-layout">
      <div className="chat-sidebar">
        <div className="chat-header">
          <Link to="/connections" className="chat-back"><ArrowLeft size={20} /></Link>
          <div className="chat-user-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>{otherUser?.full_name || otherUser?.username || 'User'}</div>
              <span className={`chat-status-indicator ${otherUser?.is_online ? '' : 'chat-offline'}`}></span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Online • SkillSwap</p>
          </div>
        </div>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" style={{ flex: 1 }}><Phone size={16} style={{ marginRight: '0.4rem' }} /> Call</button>
            <button className="btn btn-outline btn-sm" style={{ flex: 1 }}><Video size={16} style={{ marginRight: '0.4rem' }} /> Video</button>
          </div>
        </div>
        <div style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Recent Messages</h3>
          {messages.slice(-5).map((m) => (
            <div key={m.id} style={{ padding: '0.5rem 0', fontSize: '0.85rem', color: 'var(--dark-soft)', borderBottom: '1px solid var(--light)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{m.sender_id === conv.user1_id ? 'You' : 'Them'}</span>: {m.content.length > 60 ? m.content.slice(0, 60) + '...' : m.content}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-messages">
          {messages.map((m) => (
            <div key={m.id} className={`message ${m.sender_id === conv.user1_id ? 'me' : ''}`}>
              <div className="message-avatar">{m.sender_id === conv.user1_id ? 'Y' : 'T'}</div>
              <div className="message-content">
                {m.ai_generated && <span className="ai-tag">AI generated</span>}
                {m.content}
                <span className="message-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(e)}
            />
            <button className="btn btn-primary" onClick={sendMessage}><Send size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
