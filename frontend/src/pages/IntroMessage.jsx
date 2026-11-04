import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { matchesService, connectionsService, chatService } from '../services/api';
import { Mail, ArrowLeft, Send, Users, Clock } from 'lucide-react';

export default function IntroMessage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [match, setMatch] = useState(null);

  useEffect(() => {
    matchesService.intro(Number(id)).then(({ message: m }) => {
      setMessage(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [Number(id)]);

  const handleSend = async () => {
    setSending(true);
    try {
      await connectionsService.send(Number(id));
      await chatService.start(Number(id));
      await chatService.send((await chatService.conversations()).conversations[0]?.id || 0, message);
      navigate('/dashboard');
    } catch (err) {
      // Try to start chat anyway
      try {
        const conv = await chatService.start(Number(id));
        await chatService.send(conv.conversation.id, message);
        navigate('/dashboard');
      } catch (e) {
        alert('Could not send message. Please connect first.');
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
      <div className="spinner" style={{ display: 'inline-block' }}></div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 0 4rem', maxWidth: '600px' }}>
      <Link to="/matches" className="btn btn-ghost btn-sm mb-block" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
        <ArrowLeft size={18} style={{ marginRight: '0.4rem' }} /> Back to matches
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Introduction Message</h1>
      <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>Personalize your message before sending it to your match.</p>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <textarea
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your introduction..."
          style={{ width: '100%', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: '1.6' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary btn-block" onClick={handleSend} disabled={sending}>
          {sending ? 'Sending...' : <><Send size={20} style={{ marginLeft: '0.4rem' }} /> Send Message</>}
        </button>
        <Link to="/matches" className="btn btn-outline btn-block">Cancel</Link>
      </div>
    </div>
  );
}
