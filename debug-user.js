const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
    const userId = 'f8943889-426e-445c-8cc7-69971c10900a';

    console.log('--- USER PROFILE ---');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    console.log(profile);

    console.log('--- PREMIUM PROFILES ---');
    const { data: premium } = await supabase.from('premium_profiles').select('*').eq('user_id', userId).maybeSingle();
    console.log(premium);

    console.log('--- USER CREDITS ---');
    const { data: credits } = await supabase.from('user_credits').select('*').eq('user_id', userId).maybeSingle();
    console.log(credits);

    console.log('--- USER TOKENS ---');
    const { data: tokens } = await supabase.from('user_tokens').select('*').eq('user_id', userId).maybeSingle();
    console.log(tokens);

    console.log('--- RECENT TRANSACTIONS ---');
    const { data: txs } = await supabase.from('payment_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
    console.log(txs);
}

checkUser();
