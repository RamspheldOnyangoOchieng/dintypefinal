
import { createAdminClient } from "./lib/supabase-admin";

async function checkSchema() {
    const supabase = await createAdminClient();
    if (!supabase) {
        console.error("No admin client");
        return;
    }

    // Check columns of generated_images
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'generated_images'"
    });

    if (error) {
        console.error("Error checking columns:", error);
        // Fallback try a direct query if rpc exec_sql is missing
        const { data: data2, error: error2 } = await supabase.from('generated_images').select('*').limit(1);
        if (error2) {
            console.error("Error fetching one row:", error2);
        } else if (data2 && data2.length > 0) {
            console.log("Columns found in a row:", Object.keys(data2[0]));
        } else {
            console.log("Table empty, cannot detect columns via select *");
        }
    } else {
        console.log("Table columns:");
        console.log(JSON.stringify(data, null, 2));
    }
}

checkSchema();
