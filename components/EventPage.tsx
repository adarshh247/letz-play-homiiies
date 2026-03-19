import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, Target, CheckCircle, Clock } from 'lucide-react';
import { User, GameEvent, Match } from '../types';
import { SharpButton } from './ui/SharpButton';
import { supabase } from '../lib/supabase';

interface EventPageProps {
  user: User;
  onClose: () => void;
}

export const EventPage: React.FC<EventPageProps> = ({ user, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    setLoading(true);
    try {
      // Fetch active event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (eventData) {
        const event: GameEvent = {
          id: eventData.id,
          name: eventData.name,
          sportType: eventData.sport_type,
          bannerUrl: eventData.banner_url,
          status: eventData.is_active ? 'active' : 'completed'
        };
        setActiveEvent(event);

        // Fetch matches for this event
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*, challenges(*)')
          .eq('event_id', event.id);

        if (matchesData) {
          const formattedMatches: Match[] = matchesData.map(m => ({
            id: m.id,
            eventId: m.event_id,
            teamA: m.team_a,
            teamB: m.team_b,
            status: m.status,
            challenges: m.challenges.map((c: any) => ({
              id: c.id,
              question: c.question,
              options: c.options,
              correctAnswer: c.correct_answer
            }))
          }));
          setMatches(formattedMatches);
        }
      }
    } catch (err) {
      console.error('Failed to fetch event data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionChange = (challengeId: string, option: string) => {
    setPredictions(prev => ({ ...prev, [challengeId]: option }));
  };

  const handleSubmitPredictions = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    // Check if all challenges for this match have predictions
    const allPredicted = match.challenges.every(c => predictions[c.id]);
    if (!allPredicted) {
      alert('Please make predictions for all challenges in this match.');
      return;
    }

    try {
      const predictionsToSave = match.challenges.map(c => ({
        user_id: user.id,
        match_id: matchId,
        challenge_id: c.id,
        predicted_option: predictions[c.id]
      }));

      const { error } = await supabase.from('predictions').upsert(predictionsToSave, { onConflict: 'user_id, challenge_id' });
      if (error) throw error;

      alert('Predictions saved successfully!');
    } catch (err) {
      console.error('Error saving predictions:', err);
      alert('Failed to save predictions. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 z-50 bg-ludo-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-ludo-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute inset-0 z-50 bg-ludo-dark flex flex-col"
      >
        <div className="flex-none p-4 md:p-6 flex justify-between items-center bg-black/20 border-b border-white/10">
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Events</h1>
          <SharpButton variant="secondary" onClick={onClose} icon={<ArrowLeft size={16} />}>Back</SharpButton>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Calendar size={64} className="text-white/20 mb-6" />
          <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Stay Tuned!</h2>
          <p className="text-white/50 font-mono">New Event Coming Soon</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 z-50 bg-ludo-dark flex flex-col"
    >
      {/* Header */}
      <div className="flex-none p-4 md:p-6 flex justify-between items-center bg-black/20 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ludo-yellow/20 rounded-xl flex items-center justify-center border border-ludo-yellow/30">
            <Trophy className="text-ludo-yellow" size={20} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">{activeEvent.name}</h1>
            <p className="text-white/50 text-xs font-mono">{activeEvent.sportType} Event</p>
          </div>
        </div>
        <SharpButton variant="secondary" onClick={onClose} icon={<ArrowLeft size={16} />}>Back</SharpButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Banner */}
          <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl">
            <img src={activeEvent.bannerUrl} alt={activeEvent.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
              <div>
                <div className="inline-block px-3 py-1 bg-ludo-red text-white text-[10px] font-black uppercase tracking-widest mb-2">
                  Live Now
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">{activeEvent.name}</h2>
              </div>
            </div>
          </div>

          {/* Matches & Challenges */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-white uppercase flex items-center gap-2">
              <Target className="text-ludo-blue" /> Matches & Predictions
            </h3>

            {matches.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl text-white/40">
                No matches scheduled yet.
              </div>
            ) : (
              matches.map(match => (
                <div key={match.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="p-4 md:p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-ludo-yellow font-bold uppercase mb-1 flex items-center gap-1">
                        <Clock size={12} /> {match.status}
                      </div>
                      <div className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                        {match.teamA} <span className="text-white/30 text-sm mx-2">VS</span> {match.teamB}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 md:p-6 space-y-6">
                    {match.challenges.map((challenge, idx) => (
                      <div key={challenge.id} className="space-y-3">
                        <div className="text-sm font-bold text-white/80 uppercase">
                          <span className="text-ludo-blue mr-2">Q{idx + 1}.</span>
                          {challenge.question}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {challenge.options.map((opt, i) => {
                            const isSelected = predictions[challenge.id] === opt;
                            return (
                              <button
                                key={i}
                                onClick={() => handlePredictionChange(challenge.id, opt)}
                                disabled={match.status !== 'upcoming'}
                                className={`p-3 rounded-xl border text-left text-sm font-bold transition-all ${
                                  isSelected 
                                    ? 'bg-ludo-blue/20 border-ludo-blue text-white' 
                                    : 'bg-black/20 border-white/5 text-white/60 hover:bg-white/5 hover:text-white'
                                } ${match.status !== 'upcoming' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {opt}
                                {isSelected && <CheckCircle size={14} className="inline-block ml-2 text-ludo-blue" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {match.status === 'upcoming' && (
                      <div className="pt-4 border-t border-white/5">
                        <SharpButton 
                          onClick={() => handleSubmitPredictions(match.id)} 
                          className="w-full" 
                          variant="primary"
                        >
                          Submit Predictions
                        </SharpButton>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
};
