import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ranqsfwmoexghudpvpob.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbnFzZndtb2V4Z2h1ZHB2cG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyNTE3MTAsImV4cCI6MjA0NDgyNzcxMH0._CIjpR6eHwUv5HWxXcWYqPQ_15Qw7oHZkd7q4IRfHLw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)






