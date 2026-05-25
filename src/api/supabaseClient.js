import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('VITE_SUPABASE_URL is not configured. Check your .env file.');
}
if (!supabaseKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('VITE_SUPABASE_ANON_KEY is not configured. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const makeEntity = (tableName) => ({
  list: async (orderBy, limit) => {
    let query = supabase.from(tableName).select('*');
    if (orderBy) {
      const desc = orderBy.startsWith('-');
      query = query.order(orderBy.replace('-', ''), { ascending: !desc });
    }
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  filter: async (filters) => {
    let query = supabase.from(tableName).select('*');
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  create: async (payload) => {
    const { data, error } = await supabase.from(tableName).insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id, payload) => {
    const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
  },
});

export const gameAPI = {
  createRoom: async (assignmentId, hostEmail, hostName) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({ code, assignment_id: assignmentId, host_email: hostEmail, host_name: hostName, status: 'waiting' })
      .select().single();
    if (error) throw error;
    return data;
  },
  getRoom: async (code) => {
    const { data, error } = await supabase
      .from('game_rooms').select('*').eq('code', code.toUpperCase()).single();
    if (error) throw error;
    return data;
  },
  updateRoom: async (code, payload) => {
    const { error } = await supabase
      .from('game_rooms').update(payload).eq('code', code);
    if (error) throw error;
  },
  joinRoom: async (code, playerEmail, playerName, isHost = false) => {
    const { data, error } = await supabase
      .from('game_players')
      .upsert({ room_code: code.toUpperCase(), player_email: playerEmail, player_name: playerName, is_host: isHost, score: 0, streak: 0, answers: [] }, { onConflict: 'room_code,player_email' })
      .select().single();
    if (error) throw error;
    return data;
  },
  getPlayers: async (code) => {
    const { data, error } = await supabase
      .from('game_players').select('*').eq('room_code', code.toUpperCase()).order('score', { ascending: false });
    if (error) throw error;
    return data;
  },
  updatePlayer: async (code, playerEmail, payload) => {
    const { error } = await supabase
      .from('game_players').update(payload).eq('room_code', code).eq('player_email', playerEmail);
    if (error) throw error;
  },
  deleteRoom: async (code) => {
    await supabase.from('game_players').delete().eq('room_code', code);
    await supabase.from('game_rooms').delete().eq('code', code);
  },
  subscribeRoom: (code, onRoom, onPlayers) => {
    const channel = supabase.channel(`room:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `code=eq.${code}` }, payload => onRoom(payload.new))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: `room_code=eq.${code}` }, () => {
        supabase.from('game_players').select('*').eq('room_code', code).order('score', { ascending: false })
          .then(({ data }) => onPlayers(data || []));
      })
      .subscribe();
    return channel;
  },
};

export const entities = {
  // Course punya method tambahan findByClassCode untuk murid join kelas
  Course: {
    ...makeEntity('Course'),
    findByClassCode: async (code) => {
      const { data, error } = await supabase
        .from('Course')
        .select('*')
        .eq('class_code', code.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data; // null kalau tidak ditemukan
    },
  },
  CourseEnrollment: makeEntity('CourseEnrollment'),
  Assignment: makeEntity('Assignment'),
  Submission: makeEntity('Submission'),
  User: makeEntity('User'),
};