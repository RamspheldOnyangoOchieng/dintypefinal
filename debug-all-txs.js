const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllTransactions() {
  console.log('--- ALL PAYMENT TRANSACTIONS ---');
  const { data, error } = await supabase.from('payment_transactions').select('*').limit(10);
  if (error) console.error(error);
  else console.log(data);

  console.log('--- ALL REVENUE ---');
  const { data: rev } = await supabase.from('revenue_transactions').select('*').limit(5);
  console.log(rev);
}

checkAllTransactions();
