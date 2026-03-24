import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, Target, CheckCircle, Clock, Coins } from 'lucide-react';
import { User, GameEvent, Match } from '../types';
import { SharpButton } from './ui/SharpButton';
import { supabase } from '../lib/supabase';

interface EventPageProps {
  user: User;
  onClose: () => void;
}

export const EventPage: React.FC<EventPageProps> = ({ user, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();

    // Real-time subscription for matches
    const channel = supabase
      .channel('matches-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        (payload) => {
          const updatedMatch = payload.new as any;
          setMatches(prev => prev.map(m => m.id === updatedMatch.id ? { ...m, status: updatedMatch.status } : m));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'challenges' },
        (payload) => {
          const updatedChallenge = payload.new as any;
          setMatches(prev => prev.map(m => ({
            ...m,
            challenges: m.challenges.map(c => c.id === updatedChallenge.id ? { ...c, correctAnswer: updatedChallenge.correct_answer } : c)
          })));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserPredictions = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id);

      if (data) {
        const preds: Record<string, string> = {};
        data.forEach(p => {
          preds[p.challenge_id] = p.predicted_option;
        });
        setPredictions(preds);
      }
    } catch (err) {
      console.error('Failed to fetch user predictions:', err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const formattedEvents: GameEvent[] = data.map(e => ({
          id: e.id,
          name: e.name,
          sportType: e.sport_type,
          bannerUrl: e.banner_url,
          status: e.is_active ? 'active' : 'completed'
        }));
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (eventId: string) => {
    setLoading(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*, challenges(*)')
        .eq('event_id', eventId);

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
            correctAnswer: c.correct_answer,
            reward: c.reward
          }))
        }));
        setMatches(formattedMatches);
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: GameEvent) => {
    setSelectedEvent(event);
    fetchMatches(event.id);
    fetchUserPredictions(event.id);
  };

  const handlePredictionChange = (challengeId: string, option: string) => {
    setPredictions(prev => ({ ...prev, [challengeId]: option }));
  };

  const handleSubmitPredictions = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    // Check if any predictions were made for this match
    const matchChallenges = match.challenges.map(c => c.id);
    const matchPredictions = matchChallenges.filter(id => predictions[id]);
    
    if (matchPredictions.length === 0) {
      alert('Please make at least one prediction before submitting.');
      return;
    }

    setSubmitting(matchId);
    try {
      const predictionsToSave = matchChallenges
        .filter(id => predictions[id])
        .map(id => ({
          user_id: user.id,
          match_id: matchId,
          challenge_id: id,
          predicted_option: predictions[id]
        }));

      // Use a simpler upsert if possible, or delete and re-insert
      const { error } = await supabase
        .from('predictions')
        .upsert(predictionsToSave, { 
          onConflict: 'user_id,challenge_id' 
        });

      if (error) throw error;

      alert('Predictions saved successfully!');
    } catch (err) {
      console.error('Error saving predictions:', err);
      alert('Failed to save predictions. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="absolute inset-0 z-50 bg-ludo-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-ludo-red border-t-transparent rounded-full animate-spin" />
      </div>
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
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
              {selectedEvent ? selectedEvent.name : 'All Events'}
            </h1>
            <p className="text-white/50 text-xs font-mono">
              {selectedEvent ? `${selectedEvent.sportType} Event` : 'Select an event to participate'}
            </p>
          </div>
        </div>
        <SharpButton 
          variant="secondary" 
          onClick={selectedEvent ? () => { setSelectedEvent(null); setMatches([]); } : onClose} 
          icon={<ArrowLeft size={16} />}
        >
          {selectedEvent ? 'Back to Events' : 'Close'}
        </SharpButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          
          {!selectedEvent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <Calendar size={64} className="text-white/10 mb-4" />
                  <h3 className="text-xl font-black text-white/30 uppercase">No Events Available</h3>
                </div>
              ) : (
                events.map(event => (
                  <motion.div
                    key={event.id}
                    whileHover={{ y: -5 }}
                    onClick={() => handleSelectEvent(event)}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer group"
                  >
                    <div className="h-32 relative">
                      <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-3 left-4">
                        <div className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase mb-1 ${
                          event.status === 'active' ? 'bg-ludo-green text-white' : 'bg-white/20 text-white/60'
                        }`}>
                          {event.status}
                        </div>
                        <h3 className="text-lg font-black text-white uppercase leading-none">{event.name}</h3>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{event.sportType}</span>
                      <span className="text-ludo-red text-[10px] font-black uppercase flex items-center gap-1">
                        View Matches <ArrowLeft size={10} className="rotate-180" />
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Banner */}
              <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl">
                <img src={selectedEvent.bannerUrl} alt={selectedEvent.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                  <div>
                    <div className={`inline-block px-3 py-1 text-white text-[10px] font-black uppercase tracking-widest mb-2 ${
                      selectedEvent.status === 'active' ? 'bg-ludo-red' : 'bg-white/20'
                    }`}>
                      {selectedEvent.status === 'active' ? 'Live Now' : 'Completed'}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">{selectedEvent.name}</h2>
                  </div>
                </div>
              </div>

              {/* Matches & Challenges */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-white uppercase flex items-center gap-2">
                  <Target className="text-ludo-blue" /> Matches & Predictions
                </h3>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-ludo-red border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl text-white/40">
                    No matches scheduled for this event yet.
                  </div>
                ) : (
                  matches.map(match => (
                    <div key={match.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      <div className="p-4 md:p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
                        <div>
                          <div className={`text-xs font-bold uppercase mb-1 flex items-center gap-1 ${
                            match.status === 'settled' ? 'text-ludo-green' : 
                            match.status === 'completed' ? 'text-ludo-blue' : 'text-ludo-yellow'
                          }`}>
                            {match.status === 'settled' ? <Trophy size={12} /> : <Clock size={12} />}
                            {match.status}
                          </div>
                          <div className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                            {match.teamA} <span className="text-white/30 text-sm mx-2">VS</span> {match.teamB}
                          </div>
                        </div>
                        {match.status === 'settled' && (
                          <div className="px-3 py-1 bg-ludo-green/20 text-ludo-green text-[10px] font-black uppercase rounded border border-ludo-green/30">
                            Results Out
                          </div>
                        )}
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
                                const isCorrect = challenge.correctAnswer === opt;
                                const isWrongSelection = isSelected && challenge.correctAnswer && !isCorrect;
                                
                                return (
                                  <button
                                    key={i}
                                    onClick={() => handlePredictionChange(challenge.id, opt)}
                                    disabled={match.status !== 'upcoming'}
                                    className={`p-3 rounded-xl border text-left text-sm font-bold transition-all relative ${
                                      isSelected 
                                        ? isCorrect 
                                          ? 'bg-ludo-green/20 border-ludo-green text-white'
                                          : isWrongSelection
                                            ? 'bg-ludo-red/20 border-ludo-red text-white'
                                            : 'bg-ludo-blue/20 border-ludo-blue text-white' 
                                        : isCorrect && match.status !== 'upcoming'
                                          ? 'bg-ludo-green/10 border-ludo-green/30 text-ludo-green'
                                          : 'bg-black/20 border-white/5 text-white/60 hover:bg-white/5 hover:text-white'
                                    } ${match.status !== 'upcoming' ? 'cursor-default' : ''}`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span>{opt}</span>
                                      {isSelected && !isCorrect && !isWrongSelection && <CheckCircle size={14} className="text-ludo-blue" />}
                                      {isCorrect && match.status !== 'upcoming' && <CheckCircle size={14} className="text-ludo-green" />}
                                      {isWrongSelection && <Target size={14} className="text-ludo-red" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {match.status !== 'upcoming' && challenge.correctAnswer && (
                              <div className="mt-3 p-2 bg-ludo-green/10 border border-ludo-green/20 rounded-lg flex items-center justify-between">
                                <div className="text-[10px] font-bold uppercase flex items-center gap-2">
                                  <span className="text-white/40">Correct Answer:</span>
                                  <span className="text-ludo-green">{challenge.correctAnswer}</span>
                                </div>
                                {predictions[challenge.id] === challenge.correctAnswer && (
                                  <div className="text-[10px] font-black text-ludo-green uppercase flex items-center gap-1">
                                    <Coins size={10} /> +{challenge.reward || 100} Won
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}

                        {match.status === 'upcoming' && (
                          <div className="pt-4 border-t border-white/5">
                            <SharpButton 
                              onClick={() => handleSubmitPredictions(match.id)} 
                              className="w-full" 
                              variant="primary"
                              loading={submitting === match.id}
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
          )}
        </div>
      </div>
    </motion.div>
  );
};
