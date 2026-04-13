import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zpjqfismzakxwlxdyocn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwanFmaXNtemFreHdseGR5b2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDYxODMsImV4cCI6MjA5MTY4MjE4M30.XZvSpB4yQjvJFy0mTcSjqh-vT3OeG-UXkH7CeVy-Uio'

export const supabase = createClient(supabaseUrl, supabaseKey)