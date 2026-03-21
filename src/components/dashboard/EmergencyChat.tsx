import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Shield } from 'lucide-react';

type Message = { role: 'assistant' | 'user'; content: string };

const initialMessages: Message[] = [
  {
    role: 'assistant',
    content: `🔥 **FireWatch AI Assistant — Online**\n\nI'm here to help with emergency guidance. I can assist with:\n\n- 🏥 **First aid procedures** for burn injuries\n- 🚪 **Evacuation routes** and emergency exits\n- 🧯 **Fire suppression** techniques before firefighters arrive\n- 🧘 **Mental health support** to stay calm during emergencies\n- 📋 **Safety checklists** for different scenarios\n\nHow can I help you right now?`,
  },
];

const responses: Record<string, string> = {
  burn: `🩹 **First Aid for Burns:**\n\n1. **Cool the burn** under cool running water for at least 10 minutes\n2. **Remove** jewelry or clothing near the burn (unless stuck)\n3. **Cover** with a clean, non-fluffy material — cling film works well\n4. **Do NOT** apply ice, butter, toothpaste or adhesive bandages\n5. **Do NOT** break blisters\n6. For severe burns, **call emergency services immediately**\n\n⚠️ Seek medical help if the burn is larger than your hand, on the face/joints, or appears white/charred.`,
  exit: `🚪 **Emergency Exits — Current Building:**\n\n**Ground Floor:**\n- Main entrance (North side)\n- Service exit (East wing)\n- Fire escape stairwell A\n\n**1st-3rd Floor:**\n- Stairwell A (North)\n- Stairwell B (South)\n- Fire escape ladder (West — 1st floor only)\n\n**Roof access** available from 3rd floor stairwell A.\n\n⚠️ **DO NOT use elevators.** Follow illuminated exit signs. Stay low if smoke is present.`,
  fire: `🧯 **Fire Suppression Before Firefighters Arrive:**\n\n1. **Small fires only** — do NOT attempt large fires\n2. If available, use a fire extinguisher: **P.A.S.S. method**\n   - **P**ull the pin\n   - **A**im at the base of fire\n   - **S**queeze the handle\n   - **S**weep side to side\n3. **Smother** small fires with a heavy blanket\n4. **Close doors** to contain the fire\n5. **Turn off** gas and electricity if safely accessible\n\n🚫 Never use water on electrical or grease fires!`,
  calm: `🧘 **Staying Calm in Emergency:**\n\nIt's completely natural to feel scared right now. Here's what will help:\n\n1. **Breathe slowly**: In for 4 counts, hold for 4, out for 4\n2. **You are not alone** — emergency services are on their way\n3. **Focus on one thing at a time** — what's the next safe step?\n4. **Ground yourself**: Name 5 things you can see right now\n\nRemember: **Panic is the enemy, not the fire.** You're doing the right thing by seeking help.\n\n💚 I'm here with you. What do you need help with next?`,
  default: `I understand your concern. Let me help you with the most important steps right now:\n\n1. **Ensure your safety first** — move away from danger\n2. **Alert others** around you about the emergency\n3. **Follow evacuation routes** to the nearest exit\n4. **Stay low** if there's smoke\n\nWould you like specific guidance on:\n- First aid for injuries?\n- Finding emergency exits?\n- Fire suppression techniques?\n- Calming techniques?`,
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('burn') || lower.includes('first aid') || lower.includes('injury')) return responses.burn;
  if (lower.includes('exit') || lower.includes('escape') || lower.includes('evacuate') || lower.includes('way out')) return responses.exit;
  if (lower.includes('fire') || lower.includes('extinguish') || lower.includes('suppress') || lower.includes('stop')) return responses.fire;
  if (lower.includes('calm') || lower.includes('scared') || lower.includes('panic') || lower.includes('help') || lower.includes('afraid') || lower.includes('stress') || lower.includes('mental')) return responses.calm;
  return responses.default;
}

export function EmergencyChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: getResponse(userMsg.content) }]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight">AI EMERGENCY ASSISTANT</h2>
          <p className="text-[10px] text-success font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success" /> OFFLINE MODE — READY
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-secondary text-secondary-foreground rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-info/20 flex items-center justify-center mt-0.5">
                  <User className="w-3.5 h-3.5 text-info" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-secondary rounded-xl px-4 py-3 rounded-bl-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Describe your emergency or ask for help..."
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-30 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {['First aid for burns', 'Find emergency exits', 'How to stay calm', 'Suppress small fire'].map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="px-2.5 py-1 text-[10px] bg-secondary border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
