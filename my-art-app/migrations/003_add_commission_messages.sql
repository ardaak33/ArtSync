-- Add commission messages table for separated commission chats
CREATE TABLE IF NOT EXISTS commission_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_messages_commission_id ON commission_messages(commission_id);
CREATE INDEX IF NOT EXISTS idx_commission_messages_sender_id ON commission_messages(sender_id);
