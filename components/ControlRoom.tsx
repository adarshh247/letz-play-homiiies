import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Save, CheckCircle, Trophy, Calendar, Target, ShieldAlert } from 'lucide-react';
import { User, GameEvent, Match, Challenge } from '../types';
import { SharpButton } from './ui/SharpButton';
import { supabase } from '../lib/supabase';

interface ControlRoomProps {
  user: User;
  onClose: () => void;
}

export const ControlRoom: React.FC<ControlRoomProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'MATCHES' | 'REWARDS'>('EVENTS');
  
  // Section A State
  const [eventName, setEventName] = useState('');
  const [sportType, setSportType] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [events, setEvents] = useState<GameEvent[]>([]);

  // Section B State
  const [selectedEventId, setSelectedEventId] = useState('');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Load data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: eventsData } = await supabase.from('events').select('*');
        if (eventsData) {
          setEvents(eventsData.map(e => ({
            id: e.id,
            name: e.name,
            sportType: e.sport_type,
            bannerUrl: e.banner_url,
            status: e.is_active ? 'active' : 'completed'
          })));
        }

        const { data: matchesData } = await supabase.from('matches').select('*, challenges(*)');
        if (matchesData) {
          setMatches(matchesData.map(m => ({
            id: m.id,
            eventId: m.event_id,
            teamA: m.team_a,
            teamB: m.team_b,
            status: m.status,
            challenges: m.challenges ? m.challenges.map((c: any) => ({
              id: c.id,
              question: c.question,
              options: c.options,
              correctAnswer: c.correct_answer,
              reward: c.reward || 100
            })) : []
          })));
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
      }
    };
    fetchData();
  }, []);

  // Section A: Create Event
  const handleCreateEvent = async () => {
    if (!eventName || !sportType) return alert('Please fill required fields');
    
    const newEventData = {
      name: eventName,
      sport_type: sportType,
      banner_url: bannerUrl || `https://picsum.photos/seed/${eventName}/800/400`,
      is_active: true
    };

    try {
      const { data, error } = await supabase.from('events').insert(newEventData).select().single();
      if (error) throw error;
      
      if (data) {
        const newEvent: GameEvent = {
          id: data.id,
          name: data.name,
          sportType: data.sport_type,
          bannerUrl: data.banner_url,
          status: data.is_active ? 'active' : 'completed'
        };
        setEvents([...events, newEvent]);
        setEventName('');
        setSportType('');
        setBannerUrl('');
        alert('Event created successfully!');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to create event. Check console for details.');
    }
  };

  // Section B: Add Match & Challenges
  const handleAddChallenge = () => {
    setChallenges([...challenges, { id: Math.random().toString(36).substr(2, 9), question: '', options: ['', ''] }]);
  };

  const handleUpdateChallenge = (id: string, field: 'question' | 'options' | 'reward', value: any) => {
    setChallenges(challenges.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleUpdateOption = (challengeId: string, optionIndex: number, value: string) => {
    setChallenges(challenges.map(c => {
      if (c.id === challengeId) {
        const newOptions = [...c.options];
        newOptions[optionIndex] = value;
        return { ...c, options: newOptions };
      }
      return c;
    }));
  };

  const handleAddOption = (challengeId: string) => {
    setChallenges(challenges.map(c => {
      if (c.id === challengeId) {
        return { ...c, options: [...c.options, ''] };
      }
      return c;
    }));
  };

  const handleRemoveChallenge = (id: string) => {
    setChallenges(challenges.filter(c => c.id !== id));
  };

  const handleCreateMatch = async () => {
    if (!selectedEventId || !teamA || !teamB) return alert('Please fill required fields');
    
    try {
      const newMatchData = {
        event_id: selectedEventId,
        team_a: teamA,
        team_b: teamB,
        status: 'upcoming'
      };

      const { data: matchData, error: matchError } = await supabase.from('matches').insert(newMatchData).select().single();
      if (matchError) throw matchError;

      if (matchData) {
        let savedChallenges: Challenge[] = [];
        
        if (challenges.length > 0) {
          const challengesData = challenges.map(c => ({
            match_id: matchData.id,
            question: c.question,
            options: c.options,
            reward: c.reward || 100 // Default reward if not set
          }));
          
          const { data: insertedChallenges, error: challengesError } = await supabase.from('challenges').insert(challengesData).select();
          if (challengesError) throw challengesError;
          
          if (insertedChallenges) {
            savedChallenges = insertedChallenges.map(c => ({
              id: c.id,
              question: c.question,
              options: c.options,
              correctAnswer: c.correct_answer,
              reward: c.reward
            }));
          }
        }

        const newMatch: Match = {
          id: matchData.id,
          eventId: matchData.event_id,
          teamA: matchData.team_a,
          teamB: matchData.team_b,
          status: matchData.status,
          challenges: savedChallenges
        };

        setMatches([...matches, newMatch]);
        setTeamA('');
        setTeamB('');
        setChallenges([]);
        alert('Match and Challenges added successfully!');
      }
    } catch (err) {
      console.error('Error creating match:', err);
      alert('Failed to create match. Check console for details.');
    }
  };

  // Section C: Rewards Settlement
  const handleSettleMatch = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    // Check if all challenges have a correct answer selected
    const allAnswered = match.challenges.every(c => c.correctAnswer);
    if (!allAnswered) return alert('Please select correct answers for all challenges before settling.');

    try {
      // 1. Fetch all predictions for this match
      const { data: predictionsData, error: predictionsError } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId);

      if (predictionsError) throw predictionsError;

      // 2. Calculate rewards for each user
      const userRewards: Record<string, number> = {};
      
      if (predictionsData && predictionsData.length > 0) {
        predictionsData.forEach(pred => {
          const challenge = match.challenges.find(c => c.id === pred.challenge_id);
          if (challenge && challenge.correctAnswer === pred.predicted_option) {
            userRewards[pred.user_id] = (userRewards[pred.user_id] || 0) + (challenge.reward || 100);
          }
        });
      }

      // 3. Update user profiles in DB
      const userIds = Object.keys(userRewards);
      if (userIds.length > 0) {
        for (const uid of userIds) {
          const rewardAmount = userRewards[uid];
          // We use a RPC or a sequence of updates. 
          // Since we don't have a custom RPC, we'll fetch and update.
          const { data: profile } = await supabase.from('profiles').select('coins').eq('id', uid).single();
          if (profile) {
            await supabase.from('profiles').update({ coins: profile.coins + rewardAmount }).eq('id', uid);
          }
        }
      }

      // 4. Update match status
      const { error } = await supabase.from('matches').update({ status: 'settled' }).eq('id', matchId);
      if (error) throw error;
      
      setMatches(matches.map(m => m.id === matchId ? { ...m, status: 'settled' } : m));
      alert(`Rewards distributed successfully! ${userIds.length} users rewarded.`);
    } catch (err) {
      console.error('Error settling match:', err);
      alert('Failed to settle match. Check console for details.');
    }
  };

  const handleSetCorrectAnswer = async (matchId: string, challengeId: string, answer: string) => {
    try {
      const { error } = await supabase.from('challenges').update({ correct_answer: answer }).eq('id', challengeId);
      if (error) throw error;
      
      setMatches(matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            challenges: m.challenges.map(c => c.id === challengeId ? { ...c, correctAnswer: answer } : c)
          };
        }
        return m;
      }));
    } catch (err) {
      console.error('Error setting correct answer:', err);
      alert('Failed to save correct answer.');
    }
  };

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
          <div className="w-10 h-10 bg-ludo-red/20 rounded-xl flex items-center justify-center border border-ludo-red/30">
            <ShieldAlert className="text-ludo-red" size={20} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Control Room</h1>
            <p className="text-white/50 text-xs font-mono">Admin Dashboard</p>
          </div>
        </div>
        <SharpButton variant="secondary" onClick={onClose} icon={<X size={16} />}>Close</SharpButton>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2 overflow-x-auto border-b border-white/5 bg-black/10">
        <TabButton active={activeTab === 'EVENTS'} onClick={() => setActiveTab('EVENTS')} icon={<Calendar size={16} />} label="A: Event Creator" />
        <TabButton active={activeTab === 'MATCHES'} onClick={() => setActiveTab('MATCHES')} icon={<Target size={16} />} label="B: Match & Challenges" />
        <TabButton active={activeTab === 'REWARDS'} onClick={() => setActiveTab('REWARDS')} icon={<Trophy size={16} />} label="C: Rewards Settlement" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* SECTION A: EVENT CREATOR */}
          {activeTab === 'EVENTS' && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="text-ludo-yellow" size={20} /> Start New Season/Event
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase mb-1">Event Name</label>
                    <input 
                      type="text" 
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g., IPL 2026" 
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-ludo-yellow transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase mb-1">Sport Type</label>
                    <input 
                      type="text" 
                      value={sportType}
                      onChange={(e) => setSportType(e.target.value)}
                      placeholder="e.g., Cricket, Football" 
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-ludo-yellow transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase mb-1">Banner Image URL (Optional)</label>
                    <input 
                      type="text" 
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://..." 
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-ludo-yellow transition-colors"
                    />
                  </div>
                  <SharpButton onClick={handleCreateEvent} className="w-full mt-2" icon={<Plus size={18} />}>
                    Create Event
                  </SharpButton>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-white/70 uppercase mb-4">Active Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map(event => (
                    <div key={event.id} className="bg-black/20 border border-white/5 rounded-xl p-4 flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{event.name}</div>
                        <div className="text-xs text-white/50">{event.sportType}</div>
                        <div className="text-[10px] uppercase font-bold text-ludo-green mt-1 px-2 py-0.5 bg-ludo-green/10 rounded-full inline-block">
                          {event.status}
                        </div>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && <div className="text-white/30 text-sm italic">No active events.</div>}
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: MATCH & CHALLENGE ADDER */}
          {activeTab === 'MATCHES' && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="text-ludo-blue" size={20} /> Add Match & Challenges
                </h2>
                
                <div className="space-y-6">
                  {/* Select Event */}
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase mb-1">Select Event</label>
                    <select 
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-ludo-blue transition-colors appearance-none"
                    >
                      <option value="">-- Select an Event --</option>
                      {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>

                  {/* Match Details */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-white/50 uppercase mb-1">Team A</label>
                      <input 
                        type="text" 
                        value={teamA}
                        onChange={(e) => setTeamA(e.target.value)}
                        placeholder="e.g., India" 
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-ludo-blue transition-colors"
                      />
                    </div>
                    <div className="font-black text-white/30 mt-4">VS</div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-white/50 uppercase mb-1">Team B</label>
                      <input 
                        type="text" 
                        value={teamB}
                        onChange={(e) => setTeamB(e.target.value)}
                        placeholder="e.g., Australia" 
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-ludo-blue transition-colors"
                      />
                    </div>
                  </div>

                  {/* Challenges */}
                  <div className="border-t border-white/10 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-white/70 uppercase">Predictions / Challenges</h3>
                      <button onClick={handleAddChallenge} className="text-xs font-bold text-ludo-blue bg-ludo-blue/10 px-3 py-1.5 rounded-lg hover:bg-ludo-blue/20 transition-colors flex items-center gap-1">
                        <Plus size={14} /> Add Challenge
                      </button>
                    </div>

                    <div className="space-y-4">
                      {challenges.map((challenge, index) => (
                        <div key={challenge.id} className="bg-black/30 border border-white/5 rounded-xl p-4 relative">
                          <button onClick={() => handleRemoveChallenge(challenge.id)} className="absolute top-4 right-4 text-white/20 hover:text-ludo-red transition-colors">
                            <Trash2 size={16} />
                          </button>
                          
                          <div className="mb-3 pr-8">
                            <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Prediction {index + 1}</label>
                            <input 
                              type="text" 
                              value={challenge.question}
                              onChange={(e) => handleUpdateChallenge(challenge.id, 'question', e.target.value)}
                              placeholder="e.g., Who will win the toss?" 
                              className="w-full bg-transparent border-b border-white/10 px-0 py-2 text-white outline-none focus:border-ludo-blue transition-colors text-sm"
                            />
                          </div>

                          <div className="mb-3">
                            <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Reward Coins</label>
                            <input 
                              type="number" 
                              value={challenge.reward || 100}
                              onChange={(e) => handleUpdateChallenge(challenge.id, 'reward', parseInt(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-ludo-blue"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-white/40 uppercase">Options</label>
                            {challenge.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[8px] text-white/40">{optIdx + 1}</div>
                                <input 
                                  type="text" 
                                  value={opt}
                                  onChange={(e) => handleUpdateOption(challenge.id, optIdx, e.target.value)}
                                  placeholder={`Option ${optIdx + 1}`} 
                                  className="flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-white/20"
                                />
                              </div>
                            ))}
                            <button onClick={() => handleAddOption(challenge.id)} className="text-[10px] text-white/40 hover:text-white mt-1 ml-6">
                              + Add Option
                            </button>
                          </div>
                        </div>
                      ))}
                      {challenges.length === 0 && (
                        <div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-white/30 text-sm">
                          No challenges added yet. Click "Add Challenge" to start.
                        </div>
                      )}
                    </div>
                  </div>

                  <SharpButton onClick={handleCreateMatch} className="w-full" variant="primary" icon={<Save size={18} />}>
                    Save Match & Challenges
                  </SharpButton>
                </div>
              </div>
            </div>
          )}

          {/* SECTION C: REWARDS SETTLEMENT */}
          {activeTab === 'REWARDS' && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="text-ludo-green" size={20} /> Rewards Settlement
                </h2>
                <p className="text-sm text-white/50 mb-6">Select correct answers for completed matches and distribute rewards to winners.</p>

                <div className="space-y-4">
                  {matches.filter(m => m.status === 'completed').map(match => {
                    const event = events.find(e => e.id === match.eventId);
                    return (
                      <div key={match.id} className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                          <div>
                            <div className="text-xs text-ludo-yellow font-bold uppercase">{event?.name}</div>
                            <div className="text-lg font-black text-white">{match.teamA} vs {match.teamB}</div>
                          </div>
                          <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold text-white/70">
                            Needs Settlement
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-4">
                          {match.challenges.map((challenge, idx) => (
                            <div key={challenge.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                              <div className="text-sm text-white mb-2 font-medium">Q{idx + 1}: {challenge.question}</div>
                              <select 
                                value={challenge.correctAnswer || ''}
                                onChange={(e) => handleSetCorrectAnswer(match.id, challenge.id, e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-ludo-green"
                              >
                                <option value="">-- Select Correct Answer --</option>
                                {challenge.options.filter(o => o.trim() !== '').map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                          
                          <SharpButton 
                            onClick={() => handleSettleMatch(match.id)} 
                            className="w-full mt-2" 
                            variant="primary"
                            icon={<CheckCircle size={18} />}
                          >
                            Distribute Rewards
                          </SharpButton>
                        </div>
                      </div>
                    );
                  })}

                  {matches.filter(m => m.status === 'completed').length === 0 && (
                    <div className="text-center p-8 border border-dashed border-white/10 rounded-xl text-white/40">
                      No completed matches waiting for settlement.
                    </div>
                  )}
                </div>
              </div>

              {/* Settled Matches History */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-white/70 uppercase mb-4">Settled Matches</h3>
                <div className="space-y-2">
                  {matches.filter(m => m.status === 'settled').map(match => (
                    <div key={match.id} className="bg-black/20 border border-white/5 rounded-xl p-3 flex justify-between items-center opacity-70">
                      <div>
                        <div className="font-bold text-white text-sm">{match.teamA} vs {match.teamB}</div>
                        <div className="text-xs text-white/40">{match.challenges.length} challenges settled</div>
                      </div>
                      <div className="text-ludo-green flex items-center gap-1 text-xs font-bold">
                        <CheckCircle size={14} /> Settled
                      </div>
                    </div>
                  ))}
                  {matches.filter(m => m.status === 'settled').length === 0 && (
                    <div className="text-white/30 text-sm italic">No matches settled yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
      active 
        ? 'bg-white/10 text-white border border-white/20 shadow-lg' 
        : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
    }`}
  >
    {icon} {label}
  </button>
);
