const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUser() {
    const userId = 'f8943889-426e-445c-8cc7-69971c10900a';
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    console.log(`Fixing user ${userId}...`);

    // 1. Grant Premium
    const { error: pError } = await supabase
        .from('premium_profiles')
        .upsert({
            user_id: userId,
            expires_at: expiresAt.toISOString(),
            plan_id: 'premium_monthly',
            updated_at: new Date().toISOString()
        });

    if (pError) console.error('Premium error:', pError);
    else console.log('✅ Premium granted.');

    // 2. Grant Credits
    const { error: cError } = await supabase
        .from('user_credits')
        .upsert({
            user_id: userId,
            balance: 110,
            updated_at: new Date().toISOString()
        });

    if (cError) console.error('Credits error:', cError);
    else console.log('✅ Credits granted.');

    // 3. Mark in profiles
    const { error: profError } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', userId);

    if (profError) console.error('Profile error:', profError);
    else console.log('✅ Profile updated.');
}

fixUser();
