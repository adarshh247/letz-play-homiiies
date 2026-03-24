import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Plus, Trash2, Trophy, Calendar, 
  Target, CheckCircle, Clock, Save, Settings, 
  ShieldAlert, Users, Coins
} from 'lucide-react';
import { User, GameEvent, Match, Challenge } from '../types';
import { SharpButton } from './ui/SharpButton';
import { supabase } from '../lib/supabase';

interface ControlRoomProps {
  user: User;
  onClose: () => void;
}

export const ControlRoom: React.FC<ControlRoomProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'matches' | 'rewards'>('events');
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  // Event Creator State
  const [eventName, setEventName] = useState('');
  const [sportType, setSportType] = useState('Cricket');
  const [bannerUrl, setBannerUrl] = useState('https://picsum.photos/seed/cricket/1200/600');
  
  // Match Creator State
  const [selectedEventId, setSelectedEventId] = useState('');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [challenges, setChallenges] = useState<{id: string, question: string, options: string[], reward: number}[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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

  // Section A: Event Management
  const handleCreateEvent = async () => {
    if (!eventName) return alert('Event name required');
    try {
      const { data, error } = await supabase.from('events').insert({
        name: eventName,
        sport_type: sportType,
        banner_url: bannerUrl,
        is_active: true
      }).select().single();

      if (error) throw error;
      if (data) {
        setEvents([...events, {
          id: data.id,
          name: data.name,
          sportType: data.sport_type,
          bannerUrl: data.banner_url,
          status: 'active'
        }]);
        setEventName('');
        alert('Event created successfully!');
      }
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  // Section B: Match & Challenges
  const handleAddChallenge = () => {
    setChallenges([...challenges, { id: Math.random().toString(36).substr(2, 9), question: '', options: ['', ''], reward: 100 }]);
  };

  const handleUpdateChallenge = (id: string, field: 'question' | 'options' | 'reward', value: any) => {
    setChallenges(challenges.map(c => c.id === id ? { ...c, [field]: value } : c));
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
  const handleUpdateMatchStatus = async (matchId: string, newStatus: 'upcoming' | 'completed' | 'settled') => {
    try {
      const { error } = await supabase.from('matches').update({ status: newStatus }).eq('id', matchId);
      if (error) throw error;
      setMatches(matches.map(m => m.id === matchId ? { ...m, status: newStatus } : m));
    } catch (err) {
      console.error('Error updating match status:', err);
    }
  };

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

  const handleSetCorrectAnswer = async (challengeId: string, option: string) => {
    try {
      const { error } = await supabase.from('challenges').update({ correct_answer: option }).eq('id', challengeId);
      if (error) throw error;
      
      setMatches(matches.map(m => ({
        ...m,
        challenges: m.challenges.map(c => c.id === challengeId ? { ...c, correctAnswer: option } : c)
      })));
    } catch (err) {
      console.error('Error setting correct answer:', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-[100] bg-ludo-dark flex flex-col"
    >
      {/* Admin Header */}
      <div className="flex-none p-4 md:p-6 flex justify-between items-center bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ludo-red/20 rounded-xl flex items-center justify-center border border-ludo-red/30">
            <ShieldAlert className="text-ludo-red" size={20} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Control Room</h1>
            <p className="text-white/30 text-[10px] font-mono uppercase tracking-[0.3em]">System Administrator</p>
          </div>
        </div>
        <SharpButton variant="secondary" onClick={onClose} icon={<ArrowLeft size={16} />}>Exit Panel</SharpButton>
      </div>

      {/* Admin Tabs */}
      <div className="flex-none bg-black/20 px-4 md:px-6 border-b border-white/5 flex gap-4 md:gap-8">
        {[
          { id: 'events', label: 'A: Event Creator', icon: <Calendar size={14} /> },
          { id: 'matches', label: 'B: Match & Challenges', icon: <Target size={14} /> },
          { id: 'rewards', label: 'C: Rewards Settlement', icon: <Trophy size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'text-ludo-red border-ludo-red' 
                : 'text-white/30 border-transparent hover:text-white/60'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          
          {activeTab === 'events' && (
            <div className="space-y-8">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h2 className="text-lg font-black text-white uppercase mb-6 flex items-center gap-2">
                  <Plus className="text-ludo-red" /> Create New Season
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5">Event Name</label>
                      <input 
                        type="text" 
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="e.g., IPL 2024" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-ludo-red transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5">Sport Type</label>
                      <select 
                        value={sportType}
                        onChange={(e) => setSportType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-ludo-red"
                      >
                        <option value="Cricket">Cricket</option>
                        <option value="Football">Football</option>
                        <option value="Esports">Esports</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5">Banner URL</label>
                    <input 
                      type="text" 
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none mb-4"
                    />
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-white/10">
                      <img src={bannerUrl} alt="Preview" className="w-full h-full object-cover opacity-50" />
                    </div>
                  </div>
                </div>
                <SharpButton onClick={handleCreateEvent} className="w-full mt-8" variant="accent">Launch Event</SharpButton>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">Active Events</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map(event => (
                    <div key={event.id} className="bg-black/40 border border-white/10 p-4 rounded-xl flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                          <img src={event.bannerUrl} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-white font-bold uppercase text-sm">{event.name}</div>
                          <div className="text-white/30 text-[10px] uppercase">{event.sportType}</div>
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-ludo-green/20 text-ludo-green text-[8px] font-black uppercase rounded border border-ludo-green/30">
                        {event.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="space-y-8">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h2 className="text-lg font-black text-white uppercase mb-6 flex items-center gap-2">
                  <Target className="text-ludo-blue" /> Add Match & Challenges
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5">Select Event</label>
                    <select 
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-ludo-blue"
                    >
                      <option value="" className="bg-ludo-dark text-white">Choose an event...</option>
                      {events.map(e => (
                        <option key={e.id} value={e.id} className="bg-ludo-dark text-white">
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5">Team A</label>
                      <input 
                        type="text" 
                        value={teamA}
                        onChange={(e) => setTeamA(e.target.value)}
                        placeholder="e.g., RCB" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-ludo-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5">Team B</label>
                      <input 
                        type="text" 
                        value={teamB}
                        onChange={(e) => setTeamB(e.target.value)}
                        placeholder="e.g., CSK" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-ludo-blue"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-black text-white uppercase">Prediction Challenges</h3>
                      <button 
                        onClick={handleAddChallenge}
                        className="text-[10px] font-black text-ludo-blue uppercase hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Add Challenge
                      </button>
                    </div>

                    <div className="space-y-4">
                      {challenges.map((challenge, index) => (
                        <div key={challenge.id} className="bg-black/40 border border-white/10 p-4 rounded-xl relative group">
                          <button 
                            onClick={() => setChallenges(challenges.filter(c => c.id !== challenge.id))}
                            className="absolute top-4 right-4 text-white/20 hover:text-ludo-red transition-colors"
                          >
                            <Trash2 size={14} />
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
                              <input 
                                key={optIdx}
                                type="text" 
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...challenge.options];
                                  newOpts[optIdx] = e.target.value;
                                  handleUpdateChallenge(challenge.id, 'options', newOpts);
                                }}
                                placeholder={`Option ${optIdx + 1}`}
                                className="w-full bg-white/5 border border-white/5 rounded px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/20"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <SharpButton onClick={handleCreateMatch} className="w-full mt-8" variant="primary">Create Match</SharpButton>
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Match Settlement Queue</h2>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-ludo-yellow/10 border border-ludo-yellow/20 rounded text-[8px] font-black text-ludo-yellow uppercase">
                    <Clock size={10} /> Upcoming
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-ludo-blue/10 border border-ludo-blue/20 rounded text-[8px] font-black text-ludo-blue uppercase">
                    <CheckCircle size={10} /> Completed
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {matches.filter(m => m.status !== 'settled').length === 0 ? (
                  <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                    <CheckCircle size={32} className="text-ludo-green mx-auto mb-3 opacity-20" />
                    <p className="text-white/30 text-xs font-bold uppercase">All matches settled</p>
                  </div>
                ) : (
                  matches.filter(m => m.status !== 'settled').map(match => (
                    <div key={match.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all">
                      <div className="p-4 md:p-6 bg-black/40 border-b border-white/10 flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">
                            {match.teamA} <span className="text-white/20 mx-2">VS</span> {match.teamB}
                          </h3>
                          <p className="text-[10px] text-white/30 uppercase font-mono">Match ID: {match.id}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {match.status === 'upcoming' && (
                            <button 
                              onClick={() => handleUpdateMatchStatus(match.id, 'completed')}
                              className="px-3 py-1 bg-ludo-blue/20 text-ludo-blue text-[10px] font-black uppercase rounded border border-ludo-blue/30 hover:bg-ludo-blue/40 transition-colors"
                            >
                              Close Predictions
                            </button>
                          )}
                          <div className={`px-3 py-1 text-[10px] font-black uppercase rounded border ${
                            match.status === 'completed' ? 'bg-ludo-blue/20 text-ludo-blue border-ludo-blue/30' :
                            'bg-ludo-yellow/20 text-ludo-yellow border-ludo-yellow/30'
                          }`}>
                            {match.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-8">
                        {match.challenges.map((challenge, idx) => (
                          <div key={challenge.id} className="space-y-4">
                            <div className="text-sm font-bold text-white flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-ludo-blue/20 text-ludo-blue rounded flex items-center justify-center text-xs">Q{idx + 1}</span>
                                {challenge.question}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {challenge.options.map((opt, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleSetCorrectAnswer(challenge.id, opt)}
                                  className={`p-3 rounded-xl border text-left text-sm font-bold transition-all flex justify-between items-center ${
                                    challenge.correctAnswer === opt 
                                      ? 'bg-ludo-green/20 border-ludo-green text-ludo-green' 
                                      : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5'
                                  }`}
                                >
                                  {opt}
                                  {challenge.correctAnswer === opt && <CheckCircle size={14} />}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        
                        <div className="pt-6 border-t border-white/5">
                          <SharpButton 
                            onClick={() => handleSettleMatch(match.id)} 
                            className="w-full" 
                            variant="accent"
                          >
                            Settle Match & Distribute Rewards
                          </SharpButton>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Settled History Section */}
              {matches.some(m => m.status === 'settled') && (
                <div className="mt-12 pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                      <Trophy size={14} /> Settled History
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {matches.filter(m => m.status === 'settled').map(match => (
                      <div key={match.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex justify-between items-center opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                        <div>
                          <div className="text-white font-bold uppercase text-sm">
                            {match.teamA} VS {match.teamB}
                          </div>
                          <div className="text-white/20 text-[8px] font-mono uppercase">Settled Match • {match.id}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 bg-ludo-green/10 text-ludo-green text-[8px] font-black uppercase rounded border border-ludo-green/20">
                            Settled
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matches.length === 0 && (
                <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                  <Calendar size={48} className="text-white/10 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white/40 uppercase">No Matches Found</h3>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
};
