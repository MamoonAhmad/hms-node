import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, User } from 'lucide-react';

// Static data
const messages = [
  {
    id: 1,
    sender: 'Dr. Sarah Smith',
    senderType: 'Doctor',
    message: 'Patient follow-up required. Please schedule next appointment in 3 months.',
    timestamp: '2025-01-20T10:30:00',
  },
  {
    id: 2,
    sender: 'Nurse Jane',
    senderType: 'Staff',
    message: 'Lab results received. All values within normal range.',
    timestamp: '2025-01-20T09:15:00',
  },
  {
    id: 3,
    sender: 'Dr. John Williams',
    senderType: 'Doctor',
    message: 'Patient reported improvement in symptoms. Continue current treatment plan.',
    timestamp: '2025-01-18T14:20:00',
  },
  {
    id: 4,
    sender: 'Patient',
    senderType: 'Patient',
    message: 'Thank you for the care. I will follow the medication schedule.',
    timestamp: '2025-01-17T16:45:00',
  },
];

export function MessagesTab({ patient }) {
  const [messageThread, setMessageThread] = useState(messages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: 'Current User',
        senderType: 'Staff',
        message: newMessage,
        timestamp: new Date().toISOString(),
      };
      setMessageThread([message, ...messageThread]);
      setNewMessage('');
    }
  };

  const getSenderBadge = (senderType) => {
    const variants = {
      Doctor: 'default',
      Staff: 'secondary',
      Patient: 'outline',
    };
    return variants[senderType] || 'secondary';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Messages / Communication</h2>

      <Card>
        <CardContent className="p-6">
          {/* Message Thread */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messageThread.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.senderType === 'Patient' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className={`flex-1 ${msg.senderType === 'Patient' ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{msg.sender}</span>
                    <Badge variant={getSenderBadge(msg.senderType)} className="text-xs">
                      {msg.senderType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      msg.senderType === 'Patient'
                        ? 'bg-primary/10 ml-auto'
                        : 'bg-muted'
                    }`}
                    style={{ maxWidth: '80%', marginLeft: msg.senderType === 'Patient' ? 'auto' : '0' }}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
