"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function RunImagesMigrationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const runMigration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/run-images-migration")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: "Failed to run migration" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <Card className="max-w-md mx-auto shadow-xl border-primary/20 bg-background/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Fix Character Images</CardTitle>
          <CardDescription>Fix character image columns and generated images metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            This will add the <code className="bg-muted px-1.5 py-0.5 rounded text-primary">images</code> (array) and
            <code className="bg-muted px-1.5 py-0.5 rounded text-primary">video_url</code> columns to your characters table,
            and the <code className="bg-muted px-1.5 py-0.5 rounded text-primary">metadata</code> column to your generated_images table.
            This fixes saving errors and "406 Not Acceptable" errors.
          </p>

          {result && (
            <div className="space-y-4 mb-6">
              <Alert
                className={
                  result.success
                    ? "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300"
                    : "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300"
                }
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  )}
                  <div>
                    <AlertTitle className="font-bold">{result.success ? "Migration Successful" : "Migration Failed"}</AlertTitle>
                    <AlertDescription className="text-sm opacity-90">
                      {result.success ? result.message : result.error}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              {!result.success && result.error?.includes("function") && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Manual Installation Required
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Your Supabase project is missing the utility function to run SQL scripts through the API.
                  </p>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Option 1: Execute Migration Directly</p>
                    <div className="bg-black/40 p-3 rounded border border-white/5 font-mono text-[10px] text-zinc-300 overflow-x-auto whitespace-pre">
                      {`ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS character_id UUID,
ADD COLUMN IF NOT EXISTS collection_id UUID,
ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE generated_images DROP CONSTRAINT IF EXISTS generated_images_user_id_fkey;`}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Option 2: Install SQL Helper (Enables Automatic Fix)</p>
                    <div className="bg-black/40 p-3 rounded border border-white/5 font-mono text-[10px] text-zinc-300 overflow-x-auto whitespace-pre">
                      {`CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground italic">
                    Paste either script into your Supabase SQL Editor and click "Run".
                  </p>
                </div>
              )}
            </div>
          )}

          {!result && (
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl mb-6">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-blue-400">
                <AlertCircle className="h-4 w-4" />
                Requirement
              </h4>
              <p className="text-xs text-muted-foreground">
                Ensure your Supabase Service Role Key is correctly set in your environment variables.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={runMigration}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12"
          >
            {isLoading ? "Running Migration..." : "Run Fix Migration"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
