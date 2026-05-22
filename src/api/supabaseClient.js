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